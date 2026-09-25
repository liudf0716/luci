'use strict';
'require view';
'require fs';
'require ui';
'require poll';
'require rpc';
'require dom';

var chartRegistry = {};
var downloadLineChart, uploadLineChart;

// Data structures for stacked line charts
var lineCategories = [];
var downloadSeriesData = {};
var uploadSeriesData = {};

// Color palette for chart series
var colorPalette = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'];

var currentSortInfo = {
	table: null,
	column: null,
	reverse: false
};
var sidLookupTable = {};
var isPaused = false;
var lastUpdated = null;
var pollActive = false;
var lastSIDData = null;
var lastL7ProtoData = null;
var resizeListenerAdded = false;
var resizeTimer = null;

// Pre-fill with 60 empty points for a smooth start
for (var i = 0; i < 60; i++) {
	lineCategories.push('');
}

// Helper to convert hex to rgba
function hexToRgba(hex, opacity) {
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? 
		'rgba(' + parseInt(result[1], 16) + ', ' + parseInt(result[2], 16) + ', ' + parseInt(result[3], 16) + ', ' + opacity + ')' :
		null;
};

function isDarkMode() {
	var attr = document.documentElement.getAttribute('data-darkmode');
	if (attr === 'true')
		return true;
	if (attr === 'false')
		return false;

	var bg = getComputedStyle(document.body).backgroundColor;
	var m = bg && bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
	if (m) {
		var lum = (0.299 * m[1] + 0.587 * m[2] + 0.114 * m[3]) / 255;
		return lum < 0.5;
	}

	return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getChartColors() {
	var dark = isDarkMode();
	return {
		background: 'transparent',
		text: dark ? '#cccccc' : '#333333',
		muted: dark ? '#adb5bd' : '#666666',
		axis: dark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.25)',
		split: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
		pieBorder: dark ? '#252526' : '#ffffff',
		tooltipBg: dark ? 'rgba(32,32,32,0.94)' : 'rgba(255,255,255,0.95)',
		tooltipBorder: dark ? '#555555' : '#cccccc',
		tooltipText: dark ? '#eeeeee' : '#333333'
	};
}

function applyViewTheme() {
	var theme = isDarkMode() ? 'dark' : 'light';
	document.querySelectorAll('.l7-view-container, .display-view-container').forEach(function(el) {
		el.setAttribute('data-aw-theme', theme);
	});
	return theme;
}

function observeChartEl(chart, el) {
	if (!chart || !el || !window.ResizeObserver || el._awRo)
		return;
	el._awRo = new ResizeObserver(function() {
		chart.resize();
	});
	el._awRo.observe(el);
}

function chartAxisTheme(colors) {
	return {
		backgroundColor: colors.background,
		textStyle: { color: colors.text },
		legend: { textStyle: { color: colors.text } },
		tooltip: {
			backgroundColor: colors.tooltipBg,
			borderColor: colors.tooltipBorder,
			textStyle: { color: colors.tooltipText }
		},
		xAxis: {
			axisLine: { lineStyle: { color: colors.axis } },
			axisLabel: { color: colors.muted },
			splitLine: { show: false }
		},
		yAxis: {
			axisLine: { lineStyle: { color: colors.axis } },
			axisLabel: { color: colors.muted },
			splitLine: { lineStyle: { color: colors.split } }
		}
	};
}

var filterState = {
	search: '',
	mode: 'all' // 'all', 'active', 'limited'
};

function formatSpeed(bytes) {
	bytes = +bytes || 0;
	if (bytes === 0) return '0 bps';
	var k = 1000;
	var sizes = ['bps', 'Kbps', 'Mbps', 'Gbps'];
	var i = Math.floor(Math.log(bytes) / Math.log(k));
	if (i < 0) i = 0;
	if (i >= sizes.length) i = sizes.length - 1;
	return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

function formatBytes(bytes) {
	bytes = +bytes || 0;
	if (bytes <= 0) return '0 B';
	var k = 1024;
	var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	var i = Math.floor(Math.log(bytes) / Math.log(k));
	if (i < 0) i = 0;
	if (i >= sizes.length) i = sizes.length - 1;
	return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

function formatPackets(pkts) {
	pkts = +pkts || 0;
	if (pkts >= 1000000) return (pkts / 1000000).toFixed(2) + ' MP';
	if (pkts >= 1000) return (pkts / 1000).toFixed(1) + ' KP';
	return pkts + ' P';
}

function createSpeedtestIcon(dir, size) {
	size = size || 14;
	var span = document.createElement('span');
	span.className = 'speedtest-icon ' + dir;
	var pathD = 'M12.0000033,1.5008 L12.0000028,1.5008 C17.7985528,1.5008 22.4992028,6.20145217 22.4992028,12.0000022 C22.4992028,17.7985522 17.7985528,22.4992022 12.0000028,22.4992022 C6.20145281,22.4992022 1.50080269,17.7985522 1.50080269,12.0000022 L1.50080269,12.0016 C1.50080269,6.203425 6.20022769,1.502575 11.9984027,1.5008 M12,0 L12,0 C5.372575,0 0,5.372575 0,12 C0,18.627425 5.372575,24 12,24 C18.627425,24 24,18.627425 24,12 L24,12 C24,5.37257552 18.627425,0 12,0 L12,0 Z M17.3408005,13.2752 L17.3408005,13.2752 C17.626663,12.9809425 17.619858,12.5106625 17.3256005,12.2248 C17.031343,11.9389375 16.561063,11.9457425 16.2752005,12.24 L13.1248005,15.5104 L13.1248005,7.50080001 L13.1248005,7.50080016 C13.1056689,7.08680766 12.754553,6.76671016 12.3405605,6.78584016 C11.953353,6.80373396 11.6434955,7.11359266 11.6256005,7.50080016 L11.6256005,15.6144002 L8.16000052,12.2560002 L8.16000054,12.2560002 C7.84182304,11.9904452 7.36861554,12.0331047 7.10306054,12.3512819 C6.86792779,12.6330094 6.87103279,13.0434619 7.11040047,13.3215994 L12.3456005,18.4671994 L12.7056005,18.0911994 L13.3808005,17.4159994 L17.3104005,13.3519994 L17.3408005,13.2767994 L17.3408005,13.2752 Z';
	if (dir === 'dl') {
		span.innerHTML = '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="currentColor"><path d="' + pathD + '"/></svg>';
	} else {
		span.innerHTML = '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="currentColor"><g transform="translate(0, 24) scale(1, -1)"><path d="' + pathD + '"/></g></svg>';
	}
	return span;
}

function createButtonIcon(type, size) {
	size = size || 14;
	var span = document.createElement('span');
	span.className = 'btn-icon btn-icon-svg';
	span.style.display = 'inline-flex';
	span.style.alignItems = 'center';
	span.style.justifyContent = 'center';
	span.style.verticalAlign = '-2px';
	span.style.marginRight = '5px';

	if (type === 'add') {
		span.innerHTML = '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">' +
			'<line x1="12" y1="4" x2="12" y2="20"></line>' +
			'<line x1="4" y1="12" x2="20" y2="12"></line>' +
			'</svg>';
	} else if (type === 'refresh') {
		span.innerHTML = '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
			'<polyline points="23 4 23 10 17 10"></polyline>' +
			'<polyline points="1 20 1 14 7 14"></polyline>' +
			'<path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>' +
			'</svg>';
	}
	return span;
}

function renderRateLimitCell(rate, limit) {
	rate = +rate || 0;
	limit = +limit || 0;

	var rateStr = formatSpeed(rate);
	var hasLimit = limit > 0;
	var headerChildren = [
		E('span', { 'class': 'rate-val' }, rateStr)
	];

	var progressNode = null;
	if (hasLimit) {
		var limitStr = formatSpeed(limit);
		var pct = Math.min(100, Math.round((rate / limit) * 100));
		headerChildren.push(E('span', {
			'class': 'limit-val',
			'title': _('Configured Limit: ') + limitStr
		}, ' / ' + limitStr));

		var barColor = '#28a745';
		if (pct >= 90) {
			barColor = '#dc3545';
		} else if (pct >= 70) {
			barColor = '#ffc107';
		}

		progressNode = E('div', { 'class': 'rate-progress-bar', 'title': pct + '%' }, [
			E('div', {
				'class': 'rate-progress-fill',
				'style': 'width: ' + pct + '%; background-color: ' + barColor + ';'
			})
		]);
	} else {
		headerChildren.push(E('span', {
			'class': 'limit-badge unlimited',
			'title': _('No rate limit configured')
		}, '∞'));
	}

	return E('div', { 'class': 'rate-limit-cell' }, [
		E('div', { 'class': 'rate-limit-header' }, headerChildren),
		progressNode
	].filter(Boolean));
}

return view.extend({
	hasXdns: false,
	xdnsDomains: {},

	load: function() {
		return Promise.all([
			this.loadSIDData(),
			this.loadL7ProtoData(),
			this.checkXdnsStatus()
		]);
	},

	checkXdnsStatus: function() {
		var self = this;
		return fs.stat('/usr/bin/xdns-ctl').then(function(stat) {
			if (stat && stat.type === 'file') {
				self.hasXdns = true;
				return fs.read_direct('/etc/xdns/proxy_domains.txt').catch(function() {
					return fs.read_direct('/etc/xdns/whitelist.txt');
				}).then(function(content) {
					var domains = {};
					if (content) {
						content.split('\n').forEach(function(line) {
							line = line.trim();
							if (!line || line.charAt(0) === '#') return;
							if (line.indexOf('*.') === 0) line = line.substring(2);
							if (line.charAt(0) === '.') line = line.substring(1);
							domains[line.toLowerCase()] = true;
						});
					}
					self.xdnsDomains = domains;
					return true;
				}).catch(function() {
					self.xdnsDomains = {};
					return true;
				});
			} else {
				self.hasXdns = false;
				return false;
			}
		}).catch(function() {
			self.hasXdns = false;
			return false;
		});
	},

	isDomainProxied: function(dName) {
		if (!dName || !this.xdnsDomains) return false;
		dName = dName.toLowerCase();
		if (this.xdnsDomains[dName]) return true;
		var parts = dName.split('.');
		for (var i = 1; i < parts.length - 1; i++) {
			var parent = parts.slice(i).join('.');
			if (this.xdnsDomains[parent]) return true;
		}
		return false;
	},

	handleAddXdnsDomain: function(domain, btn) {
		var self = this;
		if (!domain) return;
		btn.disabled = true;
		var origText = btn.textContent;
		btn.textContent = _('添加中...');

		fs.exec_direct('/usr/bin/xdns-ctl', ['add-domain', domain]).then(function() {
			self.xdnsDomains[domain.toLowerCase()] = true;
			if (typeof ui.addTimeLimitedNotification === 'function') {
				ui.addTimeLimitedNotification(null, E('p', _('域名「%s」已成功加入 xdns-bpf 代理名单并即刻生效！').format(domain)), 4000, 'info');
			} else {
				var msg = ui.addNotification(null, E('p', _('域名「%s」已成功加入 xdns-bpf 代理名单并即刻生效！').format(domain)), 'info');
				setTimeout(function() {
					if (msg && msg.parentNode) msg.parentNode.removeChild(msg);
				}, 4000);
			}
			if (lastL7ProtoData) {
				self.renderL7ProtoData(lastL7ProtoData);
			}
		}).catch(function(err) {
			btn.disabled = false;
			btn.textContent = origText;
			if (typeof ui.addTimeLimitedNotification === 'function') {
				ui.addTimeLimitedNotification(null, E('p', _('加入代理名单失败: %s').format(err.message || err)), 6000, 'error');
			} else {
				ui.addNotification(null, E('p', _('加入代理名单失败: %s').format(err.message || err)), 'error');
			}
		});
	},

	showError: function(message) {
		var errorEl = document.getElementById('l7-error-message');
		if (errorEl) {
			errorEl.textContent = message;
			errorEl.style.display = 'block';
		}
	},

	hideError: function() {
		var errorEl = document.getElementById('l7-error-message');
		if (errorEl) {
			errorEl.style.display = 'none';
		}
	},

	loadSIDData: function() {
		var self = this;
		return fs.exec_direct('/usr/bin/aw-bpfctl', ['sid', 'json'], 'json').then(function(result) {
			self.hideError();
			lastSIDData = result;
			return result;
		}).catch(function(error) {
			console.error('Error loading SID data:', error);
			self.showError(_('Error loading SID data: %s').format(error.message));
			return { status: 'error', data: [] };
		});
	},

	createFilterBar: function() {
		var self = this;
		return E('div', { 'class': 'host-filter-bar', 'id': 'sid-filter-bar' }, [
			E('div', { 'class': 'search-box' }, [
				E('span', { 'class': 'search-icon' }, '🔍'),
				E('input', {
					'type': 'text',
					'class': 'cbi-input-text search-input',
					'placeholder': _('Search Domain, Protocol or SID...'),
					'value': filterState.search,
					'input': function(ev) {
						filterState.search = ev.target.value.toLowerCase().trim();
						self.applyFilter();
					}
				})
			]),
			E('div', { 'class': 'filter-pills' }, [
				E('button', {
					'type': 'button',
					'class': 'filter-pill' + (filterState.mode === 'all' ? ' active' : ''),
					'data-filter': 'all',
					'click': function() {
						filterState.mode = 'all';
						self.updateFilterPills();
						self.applyFilter();
					}
				}, [ _('All'), E('span', { 'id': 'sid-count-all', 'class': 'pill-badge' }, '0') ]),
				E('button', {
					'type': 'button',
					'class': 'filter-pill' + (filterState.mode === 'active' ? ' active' : ''),
					'data-filter': 'active',
					'click': function() {
						filterState.mode = 'active';
						self.updateFilterPills();
						self.applyFilter();
					}
				}, [ '🟢 ' + _('Active'), E('span', { 'id': 'sid-count-active', 'class': 'pill-badge' }, '0') ]),
				E('button', {
					'type': 'button',
					'class': 'filter-pill' + (filterState.mode === 'limited' ? ' active' : ''),
					'data-filter': 'limited',
					'click': function() {
						filterState.mode = 'limited';
						self.updateFilterPills();
						self.applyFilter();
					}
				}, [ '⚡ ' + _('Limited'), E('span', { 'id': 'sid-count-limited', 'class': 'pill-badge' }, '0') ])
			])
		]);
	},

	updateFilterPills: function() {
		var bar = document.getElementById('sid-filter-bar');
		if (!bar) return;
		bar.querySelectorAll('.filter-pill').forEach(function(pill) {
			if (pill.getAttribute('data-filter') === filterState.mode) {
				pill.classList.add('active');
			} else {
				pill.classList.remove('active');
			}
		});
	},

	applyFilter: function() {
		if (lastSIDData) {
			this.renderSIDData(lastSIDData);
		}
	},

	handleDrilldownSID: function(sid, domainOrL7Proto, itemStats) {
		var self = this;
		var portForProtocol = {
			8001: 80,   // HTTP
			8002: 443,  // HTTPS
			8004: 22,   // SSH
			8009: 123,  // NTP
			8011: 53    // DNS
		};

		fs.exec_direct('/usr/bin/aw-bpfctl', ['fastpath', 'json'], 'json').then(function(res) {
			var sessions = [];
			var totalPackets = 0, totalBytes = 0;
			if (Array.isArray(res)) {
				res.forEach(function(s) {
					if (Number(s.sid) === Number(sid)) {
						sessions.push(s);
						totalPackets += (s.packets || 0);
						totalBytes += (s.bytes || 0);
					}
				});
			}

			// If FastPath has 0 sessions and this is a well-known service port (e.g. HTTP 80, SSH 22)
			// check /proc/net/nf_conntrack for local or non-offloaded connections
			var targetPort = portForProtocol[Number(sid)];
			var isFallback = false;

			var fallbackPromise = (sessions.length === 0 && targetPort) ? fs.read_direct('/proc/net/nf_conntrack').then(function(content) {
				if (!content) return [];
				var lines = content.split('\n');
				var p1 = 'sport=' + targetPort + ' ';
				var p2 = 'dport=' + targetPort + ' ';
				var conns = [];
				lines.forEach(function(line) {
					line = line.trim();
					if (!line || (line.indexOf(p1) === -1 && line.indexOf(p2) === -1)) return;

					var protoMatch = line.match(/^ipv\d\s+\d+\s+(\S+)/);
					var proto = protoMatch ? protoMatch[1].toUpperCase() : 'TCP';

					var re = /(src|dst|sport|dport|packets|bytes)=([^\s]+)/g;
					var m;
					var orig = {}, reply = {};
					var cur = orig;
					while ((m = re.exec(line)) !== null) {
						if (cur === orig && orig[m[1]] !== undefined) {
							cur = reply;
						}
						cur[m[1]] = m[2];
					}

					if (orig.sport == targetPort || orig.dport == targetPort) {
						var pkts = (parseInt(orig.packets, 10) || 0) + (parseInt(reply.packets, 10) || 0);
						var bts = (parseInt(orig.bytes, 10) || 0) + (parseInt(reply.bytes, 10) || 0);
						var isOut = (orig.dport == targetPort);
						var cIp = isOut ? orig.src : orig.dst;
						var cPort = isOut ? orig.sport : orig.dport;
						var rIp = isOut ? orig.dst : orig.src;
						var rPort = isOut ? orig.dport : orig.sport;

						var rDesc = rIp + ':' + rPort;
						if (rIp === '192.168.8.1' || rIp === window.location.hostname) {
							rDesc += ' ' + _('(Local Router Web / LuCI)');
						}

						conns.push({
							proto: proto,
							orig_src: cIp + ':' + cPort,
							orig_dst: rDesc,
							packets: pkts,
							bytes: bts,
							isLocal: (rIp === '192.168.8.1' || rIp === window.location.hostname)
						});
					}
				});
				return conns;
			}).catch(function() { return []; }) : Promise.resolve([]);

			return fallbackPromise.then(function(fbSessions) {
				if (sessions.length === 0 && fbSessions.length > 0) {
					sessions = fbSessions;
					isFallback = true;
					totalPackets = 0;
					totalBytes = 0;
					sessions.forEach(function(s) {
						totalPackets += (s.packets || 0);
						totalBytes += (s.bytes || 0);
					});
				}

				sessions.sort(function(a, b) { return (b.bytes || 0) - (a.bytes || 0); });

				var sessionRows = sessions.map(function(s) {
					var isOut = true;
					var clientAddr = s.orig_src || '-';
					var remoteAddr = s.orig_dst || '-';

					if (s.new_dst && (s.new_dst.indexOf('192.168.') === 0 || s.new_dst.indexOf('10.') === 0 || s.new_dst.indexOf('172.') === 0)) {
						clientAddr = s.new_dst;
						remoteAddr = s.orig_src;
						isOut = false;
					}

					var proto = (s.proto || 'UDP').toUpperCase();
					var dirBadge = E('span', { 'class': 'aw-direction-badge ' + (isOut ? 'ul' : 'dl') }, [
						createSpeedtestIcon(isOut ? 'ul' : 'dl', 12),
						isOut ? _('Outbound') : _('Inbound')
					]);

					var searchIndex = (proto + ' ' + (isOut ? 'outbound' : 'inbound') + ' ' + clientAddr + ' ' + remoteAddr).toLowerCase();

					return E('tr', { 'class': 'tr flow-row', 'data-search': searchIndex }, [
						E('td', { 'class': 'td' }, [
							E('span', { 'class': 'badge ' + (proto === 'TCP' ? 'badge-info' : 'badge-warning') }, proto)
						]),
						E('td', { 'class': 'td' }, [ dirBadge ]),
						E('td', { 'class': 'td aw-addr-cell' }, clientAddr),
						E('td', { 'class': 'td aw-addr-cell' }, remoteAddr),
						E('td', { 'class': 'td right', 'style': 'font-family: monospace;' }, formatPackets(s.packets || 0)),
						E('td', { 'class': 'td right', 'style': 'font-family: monospace; font-weight: 600;' }, formatBytes(s.bytes || 0))
					]);
				});

				// Top Dashboard KPI Cards
				var currentDl = (itemStats && itemStats.incoming) ? (itemStats.incoming.rate || 0) : 0;
				var currentUl = (itemStats && itemStats.outgoing) ? (itemStats.outgoing.rate || 0) : 0;
				var dlBytes = (itemStats && itemStats.incoming) ? (itemStats.incoming.total_bytes || 0) : 0;
				var ulBytes = (itemStats && itemStats.outgoing) ? (itemStats.outgoing.total_bytes || 0) : 0;

				var kpiCards = [
					E('div', { 'class': 'aw-detail-kpi-card target' }, [
						E('div', { 'class': 'kpi-label' }, [ '🌐 ', _('Application') ]),
						E('div', { 'class': 'kpi-value', 'title': domainOrL7Proto }, domainOrL7Proto),
						E('div', { 'class': 'kpi-sub' }, 'SID ' + sid)
					]),
					E('div', { 'class': 'aw-detail-kpi-card flows' }, [
						E('div', { 'class': 'kpi-label' }, [
							isFallback ? '🔄 ' + _('Active Flows (Conntrack)') : '⚡ ' + _('Active Flows (FastPath)')
						]),
						E('div', { 'class': 'kpi-value' }, String(sessions.length)),
						E('div', { 'class': 'kpi-sub' }, isFallback ? _('Conntrack fallback') : _('eBPF / FastPath'))
					]),
					E('div', { 'class': 'aw-detail-kpi-card dl' }, [
						E('div', { 'class': 'kpi-label' }, [ createSpeedtestIcon('dl', 12), ' ', _('Download Traffic') ]),
						E('div', { 'class': 'kpi-value' }, formatBytes(dlBytes)),
						E('div', { 'class': 'kpi-sub' }, currentDl > 0 ? ('⚡ ' + formatSpeed(currentDl)) : '0 B/s')
					]),
					E('div', { 'class': 'aw-detail-kpi-card ul' }, [
						E('div', { 'class': 'kpi-label' }, [ createSpeedtestIcon('ul', 12), ' ', _('Upload Traffic') ]),
						E('div', { 'class': 'kpi-value' }, formatBytes(ulBytes)),
						E('div', { 'class': 'kpi-sub' }, currentUl > 0 ? ('⚡ ' + formatSpeed(currentUl)) : '0 B/s')
					]),
					E('div', { 'class': 'aw-detail-kpi-card vol' }, [
						E('div', { 'class': 'kpi-label' }, [ '📊 ', _('Flow Session Total') ]),
						E('div', { 'class': 'kpi-value' }, formatBytes(totalBytes)),
						E('div', { 'class': 'kpi-sub' }, formatPackets(totalPackets) + ' ' + _('pkts'))
					])
				];

				// Search & Filter Box
				var searchInput = E('input', {
					'type': 'text',
					'placeholder': _('Filter by IP, port or protocol...'),
					'input': function(ev) {
						var q = ev.target.value.toLowerCase().trim();
						var vis = 0;
						var tBody = document.getElementById('modal-l7-session-tbody');
						if (!tBody) return;
						tBody.querySelectorAll('tr.flow-row').forEach(function(row) {
							var hay = row.getAttribute('data-search') || '';
							if (!q || hay.indexOf(q) !== -1) {
								row.style.display = '';
								vis++;
							} else {
								row.style.display = 'none';
							}
						});
						var cnt = document.getElementById('modal-l7-flow-count');
						if (cnt) cnt.textContent = q ? (vis + ' / ' + sessions.length) : String(sessions.length);
						var emptyRow = document.getElementById('modal-l7-no-match-row');
						if (emptyRow) emptyRow.style.display = (vis === 0 && sessions.length > 0) ? '' : 'none';
					}
				});

				var filterBar = E('div', { 'class': 'aw-detail-filter-bar' }, [
					E('div', { 'class': 'aw-detail-search-box' }, [
						E('span', {}, '🔍'),
						searchInput
					]),
					E('div', { 'class': 'aw-detail-status-pill' }, [
						E('span', {}, _('Flows: ')),
						E('strong', { 'id': 'modal-l7-flow-count' }, String(sessions.length)),
						E('span', { 'class': 'badge ' + (isFallback ? 'badge-warning' : 'badge-positive'), 'style': 'margin-left: 8px;' }, isFallback ? 'Conntrack' : 'FastPath')
					])
				]);

				var tRows = [
					E('tr', { 'class': 'tr table-titles' }, [
						E('th', { 'class': 'th' }, [ E('span', { 'class': 'th-icon' }, '🔌'), ' ', _('Protocol') ]),
						E('th', { 'class': 'th' }, [ E('span', { 'class': 'th-icon' }, '🔄'), ' ', _('Direction') ]),
						E('th', { 'class': 'th' }, [ E('span', { 'class': 'th-icon' }, '🖥️'), ' ', _('Client IP:Port') ]),
						E('th', { 'class': 'th' }, [ E('span', { 'class': 'th-icon' }, '🌐'), ' ', _('Destination IP:Port') ]),
						E('th', { 'class': 'th right' }, [ E('span', { 'class': 'th-icon' }, '📨'), ' ', _('Packets') ]),
						E('th', { 'class': 'th right' }, [ E('span', { 'class': 'th-icon' }, '📊'), ' ', _('Bytes') ])
					])
				];

				if (sessionRows.length > 0) {
					sessionRows.forEach(function(r) { tRows.push(r); });
					tRows.push(E('tr', { 'class': 'tr placeholder', 'id': 'modal-l7-no-match-row', 'style': 'display:none;' }, [
						E('td', { 'class': 'td center', 'colspan': 6 }, E('em', {}, _('No matching connections found for filter.')))
					]));
				} else {
					tRows.push(E('tr', { 'class': 'tr placeholder' }, [
						E('td', { 'class': 'td center', 'colspan': 6 }, E('em', {}, _('No active fastpath connections currently (flows may be idle or closed).')))
					]));
				}

				var modal = ui.showModal(_('Application Connection Details - %s (SID %d)').format(domainOrL7Proto, sid), [
					E('div', { 'class': 'cbi-section aw-detail-modal-body', 'data-theme': isDarkMode() ? 'dark' : 'light' }, [
						E('div', { 'class': 'aw-detail-modal-header' }, kpiCards),
						filterBar,
						E('div', { 'class': 'aw-detail-table-wrap' }, [
							E('table', { 'class': 'table', 'id': 'modal-l7-session-tbody' }, tRows)
						])
					]),
					E('div', { 'class': 'right', 'style': 'margin-top: 15px;' }, [
						E('button', { 'class': 'btn cbi-button-neutral', 'click': ui.hideModal }, _('Close'))
					])
				], 'aw-detail-modal');

				if (modal) {
					modal.setAttribute('data-theme', isDarkMode() ? 'dark' : 'light');
				}
			});
		}).catch(function(e) {
			ui.addNotification(null, E('p', _('Error getting session details: ') + (e.message || e)));
		});
	},

	handleEditSpeed: function(sid, domainOrL7Proto) {
		var self = this;
		fs.exec_direct('/usr/bin/aw-bpfctl', ['sid', 'json'], 'json').then(function(res) {
			var rate_limit_dl = 0, rate_limit_ul = 0;
			var time_rule = null;
			if (res && res.status === 'success' && Array.isArray(res.data)) {
				var item = res.data.find(function(d) { return d.sid === sid; });
				if (item) {
					rate_limit_dl = (item.incoming.incoming_rate_limit || 0) / 1024 / 1024;
					rate_limit_ul = (item.outgoing.outgoing_rate_limit || 0) / 1024 / 1024;
					time_rule = item.time_rule || null;
				}
			}
			self.displaySpeedLimitDialog(sid, domainOrL7Proto, rate_limit_dl, rate_limit_ul, time_rule);
		}).catch(function(e) {
			console.error('Error getting speed limit:', e);
			self.displaySpeedLimitDialog(sid, domainOrL7Proto, 0, 0, null);
		});
	},

	displaySpeedLimitDialog: function(sid, domainOrL7Proto, dl, ul, time_rule) {
		var self = this;
		var isTimeEnabled = !!(time_rule && time_rule.enabled);
		var daysMatch = (time_rule && time_rule.weekdays_match) ? time_rule.weekdays_match : 0x3E;
		var dtStart = (time_rule && time_rule.daytime_start) ? time_rule.daytime_start : '09:30:00';
		var dtStop = (time_rule && time_rule.daytime_stop) ? time_rule.daytime_stop : '18:30:00';
		var dStart = (time_rule && time_rule.date_start) ? time_rule.date_start.split(' ')[0] : '';
		var dStop = (time_rule && time_rule.date_stop) ? time_rule.date_stop.split(' ')[0] : '';

		var weekNames = [
			{ bit: 1, label: _('Mon'), id: 'tc-day-mon' },
			{ bit: 2, label: _('Tue'), id: 'tc-day-tue' },
			{ bit: 3, label: _('Wed'), id: 'tc-day-wed' },
			{ bit: 4, label: _('Thu'), id: 'tc-day-thu' },
			{ bit: 5, label: _('Fri'), id: 'tc-day-fri' },
			{ bit: 6, label: _('Sat'), id: 'tc-day-sat' },
			{ bit: 0, label: _('Sun'), id: 'tc-day-sun' }
		];

		var updatePillActiveState = function() {
			weekNames.forEach(function(w) {
				var input = document.getElementById(w.id);
				var label = document.getElementById(w.id + '-label');
				if (input && label) {
					if (input.checked) {
						label.classList.add('active');
					} else {
						label.classList.remove('active');
					}
				}
			});
		};

		var weekdayCheckboxes = weekNames.map(function(w) {
			var checked = (daysMatch & (1 << w.bit)) !== 0;
			return E('label', {
				id: w.id + '-label',
				'class': checked ? 'aw-weekday-pill active' : 'aw-weekday-pill',
				click: function(ev) {
					setTimeout(updatePillActiveState, 10);
				}
			}, [
				E('input', {
					type: 'checkbox',
					id: w.id,
					value: w.bit,
					checked: checked ? 'checked' : null,
					change: function() { updatePillActiveState(); }
				}),
				w.label
			]);
		});

		var tcContainer = E('div', {
			id: 'tc-panel',
			'class': 'aw-tc-panel',
			style: isTimeEnabled ? 'margin-top: 10px;' : 'display:none; margin-top: 10px;'
		}, [
			E('div', { 'class': 'table aw-modal-table', style: 'margin-bottom: 0;' }, [
				E('div', { 'class': 'tr' }, [
					E('div', { 'class': 'td aw-modal-label' }, _('Weekdays')),
					E('div', { 'class': 'td aw-modal-value' }, [
						E('div', { style: 'margin-bottom: 8px;' }, [
							E('button', {
								type: 'button',
								class: 'btn cbi-button cbi-button-neutral',
								style: 'margin-right: 5px; padding: 2px 8px; font-size: 12px;',
								click: function() {
									weekNames.forEach(function(w) {
										var el = document.getElementById(w.id);
										if (el) el.checked = (w.bit >= 1 && w.bit <= 5);
									});
									updatePillActiveState();
								}
							}, _('Workdays (Mon-Fri)')),
							E('button', {
								type: 'button',
								class: 'btn cbi-button cbi-button-neutral',
								style: 'margin-right: 5px; padding: 2px 8px; font-size: 12px;',
								click: function() {
									weekNames.forEach(function(w) {
										var el = document.getElementById(w.id);
										if (el) el.checked = (w.bit === 0 || w.bit === 6);
									});
									updatePillActiveState();
								}
							}, _('Weekend (Sat-Sun)')),
							E('button', {
								type: 'button',
								class: 'btn cbi-button cbi-button-neutral',
								style: 'padding: 2px 8px; font-size: 12px;',
								click: function() {
									weekNames.forEach(function(w) {
										var el = document.getElementById(w.id);
										if (el) el.checked = true;
									});
									updatePillActiveState();
								}
							}, _('Everyday'))
						]),
						E('div', { style: 'display: flex; flex-wrap: wrap; align-items: center;' }, weekdayCheckboxes)
					])
				]),
				E('div', { 'class': 'tr' }, [
					E('div', { 'class': 'td aw-modal-label' }, _('Daily Time Period')),
					E('div', { 'class': 'td aw-modal-value', style: 'display: flex; align-items: center; gap: 8px;' }, [
						E('input', { type: 'text', id: 'tc-timestart', class: 'cbi-input-text', style: 'width: 120px;', value: dtStart, placeholder: '09:30:00' }),
						E('span', {}, ' ~ '),
						E('input', { type: 'text', id: 'tc-timestop', class: 'cbi-input-text', style: 'width: 120px;', value: dtStop, placeholder: '18:30:00' })
					])
				]),
				E('div', { 'class': 'tr' }, [
					E('div', { 'class': 'td aw-modal-label' }, _('Date Range (Optional)')),
					E('div', { 'class': 'td aw-modal-value' }, [
						E('div', { style: 'display: flex; align-items: center; gap: 8px;' }, [
							E('input', { type: 'date', id: 'tc-datestart', class: 'cbi-input-text', value: dStart }),
							E('span', {}, ' ~ '),
							E('input', { type: 'date', id: 'tc-datestop', class: 'cbi-input-text', value: dStop })
						]),
						E('div', { 'class': 'cbi-value-description', style: 'margin-top: 4px; font-size: 12px;' }, _('Optional: Specific date range for one-time period'))
					])
				])
			])
		]);

		var tcEnableCheckbox = E('input', {
			type: 'checkbox',
			id: 'tc-enable',
			checked: isTimeEnabled ? 'checked' : null,
			style: 'margin-right: 6px;',
			change: function(ev) {
				var panel = document.getElementById('tc-panel');
				if (panel) panel.style.display = ev.target.checked ? '' : 'none';
			}
		});

		ui.showModal(_('Edit Speed Limit & Time Schedule'), [
			E('div', { 'class': 'cbi-section' }, [
				E('div', { 'class': 'table aw-modal-table' }, [
					E('div', { 'class': 'tr' }, [
						E('div', { 'class': 'td aw-modal-label' }, _('SID')),
						E('div', { 'class': 'td aw-modal-value', style: 'font-weight: bold;' }, String(sid))
					]),
					E('div', { 'class': 'tr' }, [
						E('div', { 'class': 'td aw-modal-label' }, _('Domain / L7 Protocol')),
						E('div', { 'class': 'td aw-modal-value' }, domainOrL7Proto)
					]),
					E('div', { 'class': 'tr' }, [
						E('div', { 'class': 'td aw-modal-label' }, [ createSpeedtestIcon('dl', 14), ' ', _('Download Limit') ]),
						E('div', { 'class': 'td aw-modal-value', style: 'display: flex; align-items: center; gap: 6px;' }, [
							E('input', { type: 'number', id: 'dl-rate', class: 'cbi-input-number', min: '0', value: dl, style: 'width: 120px;' }),
							E('span', {}, " Mbps")
						])
					]),
					E('div', { 'class': 'tr' }, [
						E('div', { 'class': 'td aw-modal-label' }, [ createSpeedtestIcon('ul', 14), ' ', _('Upload Limit') ]),
						E('div', { 'class': 'td aw-modal-value', style: 'display: flex; align-items: center; gap: 6px;' }, [
							E('input', { type: 'number', id: 'ul-rate', class: 'cbi-input-number', min: '0', value: ul, style: 'width: 120px;' }),
							E('span', {}, " Mbps")
						])
					]),
					E('div', { 'class': 'tr' }, [
						E('div', { 'class': 'td aw-modal-label' }, _('Enable Time Control')),
						E('div', { 'class': 'td aw-modal-value' }, [
							E('label', { style: 'cursor: pointer; display: inline-flex; align-items: center;' }, [
								tcEnableCheckbox,
								_('Enable Time Control')
							])
						])
					])
				]),
				tcContainer
			]),
			E('div', { 'class': 'right', style: 'margin-top: 15px;' }, [
				E('button', { 'class': 'btn cbi-button cbi-button-neutral', 'click': ui.hideModal }, _('Cancel')),
				E('button', { 'class': 'btn cbi-button cbi-button-positive', 'click': ui.createHandlerFn(this, async function(ev) {
					var dl_val = document.getElementById('dl-rate').value;
					var ul_val = document.getElementById('ul-rate').value;
					var tcEnabled = document.getElementById('tc-enable').checked;

					try {
						var cmdArgs = ['sid', 'update', String(sid), 'downrate', String(Math.round((parseFloat(dl_val) || 0) * 1024 * 1024)), 'uprate', String(Math.round((parseFloat(ul_val) || 0) * 1024 * 1024))];

						if (!tcEnabled) {
							cmdArgs.push('--notime');
						} else {
							var selectedDays = [];
							weekNames.forEach(function(w) {
								var el = document.getElementById(w.id);
								if (el && el.checked) selectedDays.push(w.bit);
							});
							if (selectedDays.length > 0 && selectedDays.length < 7) {
								cmdArgs.push('--weekdays', selectedDays.join(','));
							} else if (selectedDays.length === 7) {
								cmdArgs.push('--weekdays', 'all');
							}

							var tStart = (document.getElementById('tc-timestart').value || '').trim();
							var tStop = (document.getElementById('tc-timestop').value || '').trim();
							if (tStart && tStop) {
								cmdArgs.push('--timestart', tStart, '--timestop', tStop);
							}

							var dStartVal = (document.getElementById('tc-datestart').value || '').trim();
							var dStopVal = (document.getElementById('tc-datestop').value || '').trim();
							if (dStartVal) {
								cmdArgs.push('--datestart', dStartVal + ' 00:00:00');
							}
							if (dStopVal) {
								cmdArgs.push('--datestop', dStopVal + ' 23:59:59');
							}
						}

						await fs.exec_direct('/usr/bin/aw-bpfctl', cmdArgs);
						var sidData = await self.loadSIDData();
						self.renderSIDData(sidData);
						ui.addNotification(null, E('p', _('Speed limit and time schedule updated')));
						ui.hideModal();
					} catch (e) {
						ui.addNotification(null, E('p', _('Error: ') + e.message));
					}
				}) }, _('Save'))
			])
		], 'cbi-modal');
	},

	loadL7ProtoData: function() {
		var self = this;
		return fs.exec_direct('/usr/bin/aw-bpfctl', ['l7', 'json'], 'json').then(function(result) {
			self.hideError();
			return result;
		}).catch(function(error) {
			console.error('Error loading L7 protocol data:', error);
			self.showError(_('Error loading L7 protocol data: %s').format(error.message));
			return { status: 'error', data: [] };
		});
	},

	updateStackedLineCharts: function(perServiceDownload, perServiceUpload) {
		var now = new Date().toLocaleTimeString();
		lineCategories.push(now);
		lineCategories.shift();
	
		var processChartData = function(seriesData, perServiceData) {
			var allServices = Object.keys(seriesData);
			Object.keys(perServiceData).forEach(function(service) {
				if (allServices.indexOf(service) === -1) {
					allServices.push(service);
				}
			});
	
			allServices.forEach(function(service) {
				if (!seriesData[service]) {
					seriesData[service] = Array(59).fill(0);
				}
				var rate = perServiceData[service] || 0;
				seriesData[service].push(rate);
				seriesData[service].shift();
			});
	
			return Object.keys(seriesData).map(function(service, index) {
				var color = colorPalette[index % colorPalette.length];
				return {
					name: service,
					type: 'line',
					stack: 'Total',
					smooth: true,
					lineStyle: { width: 1, color: color },
					showSymbol: false,
					itemStyle: { color: color },
					areaStyle: {
						color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
							{ offset: 0, color: hexToRgba(color, 0.5) },
							{ offset: 1, color: hexToRgba(color, 0) }
						])
					},
					data: seriesData[service]
				};
			});
		};
	
		var downloadChartSeries = processChartData(downloadSeriesData, perServiceDownload);
		var uploadChartSeries = processChartData(uploadSeriesData, perServiceUpload);
	
		var legendData = downloadChartSeries.map(function(s) { return s.name; });
		var colors = getChartColors();

		if (downloadLineChart) {
			downloadLineChart.setOption({
				legend: { data: legendData, type: 'scroll', top: 0, left: 'center', textStyle: { color: colors.text } },
				series: downloadChartSeries,
				xAxis: { data: lineCategories }
			});
		}
	
		if (uploadLineChart) {
			uploadLineChart.setOption({
				legend: { data: legendData, type: 'scroll', top: 0, left: 'center', textStyle: { color: colors.text } },
				series: uploadChartSeries,
				xAxis: { data: lineCategories }
			});
		}
	},

	pie: function(id, data, valueFormatter) {
		var total = data.reduce(function(n, d) { return n + d.value; }, 0);

		data.sort(function(a, b) { return b.value - a.value; });

		if (total === 0) {
			data = [{ value: 1, color: '#cccccc', name: _('no traffic') }];
		}

		data.forEach(function(d, i) {
			if (!d.color) {
				var hue = (i * 137.508) % 360;
				d.color = 'hsl(' + hue + ', 75%, 55%)';
			}
		});

		var colors = getChartColors();
		var option = {
			backgroundColor: colors.background,
			textStyle: { color: colors.text },
			tooltip: {
				trigger: 'item',
				backgroundColor: colors.tooltipBg,
				borderColor: colors.tooltipBorder,
				textStyle: { color: colors.tooltipText },
				formatter: function(params) {
					if (valueFormatter) {
						// 将 ECharts params 对象转换为自定义格式
						return valueFormatter({
							name: params.name,
							value: params.value,
							percent: params.percent.toFixed(2)
						});
					}
					return params.name + ': ' + params.value + ' (' + params.percent.toFixed(2) + '%)';
				}
			},
			series: [{
				type: 'pie',
				radius: ['25%', '80%'],
				avoidLabelOverlap: false,
				padAngle: 10,
				itemStyle: { borderRadius: 10, borderColor: colors.pieBorder, borderWidth: 2 },
				label: { show: false, position: 'center', color: colors.text },
				emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold', color: colors.text } },
				labelLine: { show: false },
				data: data.map(function(d) {
					return { value: d.value, name: d.label || d.name, itemStyle: { color: d.color } };
				})
			}]
		};

		var dom = typeof id === 'string' ? document.getElementById(id) : id;

		if (!chartRegistry[id]) {
			chartRegistry[id] = echarts.init(dom);
			observeChartEl(chartRegistry[id], dom);
		}

		chartRegistry[id].setOption(option, true);

		return chartRegistry[id];
	},

	sortTable: function(table, column) {
		var tbody = table.querySelector('tbody');
		if (!tbody) return;
		var rows = Array.from(tbody.querySelectorAll('tr:not(.table-titles):not(.placeholder)'));
		var reverse = (currentSortInfo.table === table && currentSortInfo.column === column) ? !currentSortInfo.reverse : false;

		table.querySelectorAll('th').forEach(function(th) {
			th.classList.remove('th-sort-asc', 'th-sort-desc');
		});

		var th = table.querySelector('th:nth-child(' + (column + 1) + ')');
		th.classList.add(reverse ? 'th-sort-desc' : 'th-sort-asc');

		rows.sort(function(row1, row2) {
			var a = row1.cells[column].getAttribute('data-value') || row1.cells[column].textContent;
			var b = row2.cells[column].getAttribute('data-value') || row2.cells[column].textContent;

			if (!isNaN(a) && !isNaN(b)) { a = Number(a); b = Number(b); }

			if (a < b) return reverse ? 1 : -1;
			if (a > b) return reverse ? -1 : 1;
			return 0;
		});

		currentSortInfo.table = table;
		currentSortInfo.column = column;
		currentSortInfo.reverse = reverse;

		rows.forEach(function(row) { tbody.removeChild(row); });
		rows.forEach(function(row) { tbody.appendChild(row); });
	},

	formatMbps: function(bits) {
		if (typeof bits !== 'number') return '0.00 Mbps';
		return (bits / 1024 / 1024).toFixed(2) + ' Mbps';
	},

	formatMB: function(bytes) {
		if (typeof bytes !== 'number') return '0.00 MB';
		return (bytes / 1024 / 1024).toFixed(2) + ' MB';
	},

	renderSIDData: function(data) {
		var rows = [];
		var txRateData = [], rxRateData = [];
		var txVolumeData = [], rxVolumeData = [];
		var tx_rate_total = 0, rx_rate_total = 0;
		var tx_bytes_total = 0, rx_bytes_total = 0;
		var perServiceTxRate = {};
		var perServiceRxRate = {};
		var self = this;
		var allItems = [];
		var activeCount = 0;
		var limitedCount = 0;

		if (data && data.status === 'success' && Array.isArray(data.data)) {
			allItems = data.data;

			allItems.forEach(function(item) {
				if (!item || !item.incoming || !item.outgoing) return;

				var domainOrL7Proto = 'unknown';
				var lookupInfo = sidLookupTable[item.sid];
				if (lookupInfo) {
					domainOrL7Proto = lookupInfo.name;
				} else if (item.sid_type === 'Domain' && item.domain && item.domain !== 'unknown') {
					domainOrL7Proto = item.domain;
				} else if (item.sid_type === 'L7' && item.l7_proto_desc && item.l7_proto_desc !== 'unknown') {
					domainOrL7Proto = item.l7_proto_desc;
				}

				var isActive = item.incoming.rate > 0 || item.outgoing.rate > 0;
				if (isActive) activeCount++;

				var isLimited = (item.incoming && item.incoming.incoming_rate_limit > 0) || (item.outgoing && item.outgoing.outgoing_rate_limit > 0);
				if (isLimited) limitedCount++;

				tx_rate_total += item.incoming.rate;
				rx_rate_total += item.outgoing.rate;
				tx_bytes_total += item.incoming.total_bytes;
				rx_bytes_total += item.outgoing.total_bytes;

				txRateData.push({ value: item.incoming.rate, label: domainOrL7Proto });
				rxRateData.push({ value: item.outgoing.rate, label: domainOrL7Proto });
				txVolumeData.push({ value: item.incoming.total_bytes, label: domainOrL7Proto });
				rxVolumeData.push({ value: item.outgoing.total_bytes, label: domainOrL7Proto });

				perServiceTxRate[domainOrL7Proto] = (perServiceTxRate[domainOrL7Proto] || 0) + item.incoming.rate;
				perServiceRxRate[domainOrL7Proto] = (perServiceRxRate[domainOrL7Proto] || 0) + item.outgoing.rate;
			});

			var cAll = document.getElementById('sid-count-all');
			if (cAll) cAll.textContent = allItems.length;
			var cActive = document.getElementById('sid-count-active');
			if (cActive) cActive.textContent = activeCount;
			var cLimited = document.getElementById('sid-count-limited');
			if (cLimited) cLimited.textContent = limitedCount;

			var search = filterState.search;
			var mode = filterState.mode;

			var filteredItems = allItems.filter(function(item) {
				if (!item || !item.incoming || !item.outgoing) return false;

				var domainOrL7Proto = 'unknown';
				var lookupInfo = sidLookupTable[item.sid];
				if (lookupInfo) {
					domainOrL7Proto = lookupInfo.name;
				} else if (item.sid_type === 'Domain' && item.domain && item.domain !== 'unknown') {
					domainOrL7Proto = item.domain;
				} else if (item.sid_type === 'L7' && item.l7_proto_desc && item.l7_proto_desc !== 'unknown') {
					domainOrL7Proto = item.l7_proto_desc;
				}

				if (search) {
					var matchStr = (domainOrL7Proto + ' ' + item.sid + ' ' + (item.sid_type || '')).toLowerCase();
					if (matchStr.indexOf(search) === -1)
						return false;
				}

				if (mode === 'active') {
					if (item.incoming.rate <= 0 && item.outgoing.rate <= 0) return false;
				} else if (mode === 'limited') {
					var hasLimit = (item.incoming && item.incoming.incoming_rate_limit > 0) || (item.outgoing && item.outgoing.outgoing_rate_limit > 0);
					if (!hasLimit) return false;
				}

				return true;
			});

			var activeFiltered = filteredItems.filter(function(item) { return item.incoming.rate > 0 || item.outgoing.rate > 0; });
			var inactiveFiltered = filteredItems.filter(function(item) { return item.incoming.rate === 0 && item.outgoing.rate === 0; });
			activeFiltered.sort(function(a, b) { return (b.incoming.rate + b.outgoing.rate) - (a.incoming.rate + a.outgoing.rate); });
			inactiveFiltered.sort(function(a, b) { return b.incoming.total_bytes - a.incoming.total_bytes; });
			var displayData = activeFiltered.concat(inactiveFiltered);

			var listSizeEl = document.getElementById('sid-size-select');
			var listSize = listSizeEl ? parseInt(listSizeEl.value, 10) : 30;
			if (listSize > 0 && displayData.length > listSize) {
				displayData = displayData.slice(0, listSize);
			}

			displayData.forEach(function(item) {
				var domainOrL7Proto = 'unknown';
				var lookupInfo = sidLookupTable[item.sid];
				if (lookupInfo) {
					domainOrL7Proto = lookupInfo.name;
				} else if (item.sid_type === 'Domain' && item.domain && item.domain !== 'unknown') {
					domainOrL7Proto = item.domain;
				} else if (item.sid_type === 'L7' && item.l7_proto_desc && item.l7_proto_desc !== 'unknown') {
					domainOrL7Proto = item.l7_proto_desc;
				}

				var isActive = item.incoming.rate > 0 || item.outgoing.rate > 0;
				var activityIcon = isActive ? '🟢' : '⚪';

				var serviceNode = E('div', { 'class': 'device-cell' }, [
					E('div', { 'class': 'device-main' }, [
						E('span', { 'class': 'activity-indicator', 'title': isActive ? _('Active') : _('Inactive') }, activityIcon),
						E('span', { 'class': 'device-name' }, domainOrL7Proto)
					]),
					E('span', { 'class': 'device-sub' }, 'SID: ' + item.sid + (item.sid_type ? ' · ' + item.sid_type : ''))
				]);

				var volNode = E('div', { 'class': 'dual-volume-cell' }, [
					E('div', {
						'class': 'vol-row dl',
						'title': _('Download Total: ') + formatBytes(item.incoming.total_bytes) + ' (' + formatPackets(item.incoming.total_packets) + ')'
					}, [
						E('span', { 'class': 'vol-val' }, formatBytes(item.incoming.total_bytes)),
						E('span', { 'class': 'vol-icon' }, [ createSpeedtestIcon('dl', 12) ])
					]),
					E('div', {
						'class': 'vol-row ul',
						'title': _('Upload Total: ') + formatBytes(item.outgoing.total_bytes) + ' (' + formatPackets(item.outgoing.total_packets) + ')'
					}, [
						E('span', { 'class': 'vol-val' }, formatBytes(item.outgoing.total_bytes)),
						E('span', { 'class': 'vol-icon' }, [ createSpeedtestIcon('ul', 12) ])
					])
				]);

				var timeBadge;
				if (item.time_rule && item.time_rule.enabled) {
					timeBadge = E('span', {
						'class': 'badge badge-info',
						'title': item.time_rule.desc || '',
						'style': 'background:#17a2b8;color:#fff;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:500;white-space:nowrap;display:inline-block;'
					}, '⏱️ ' + (item.time_rule.desc || _('Scheduled')));
				} else if ((item.incoming && item.incoming.incoming_rate_limit > 0) || (item.outgoing && item.outgoing.outgoing_rate_limit > 0)) {
					timeBadge = E('span', {
						'class': 'badge badge-secondary',
						'style': 'background:#6c757d;color:#fff;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:500;white-space:nowrap;display:inline-block;'
					}, _('All Time'));
				} else {
					timeBadge = E('span', { 'style': 'color:#888;' }, '-');
				}

				rows.push([
					[ (domainOrL7Proto + ' ' + item.sid).toLowerCase(), serviceNode ],
					[ item.incoming.rate, renderRateLimitCell(item.incoming.rate, item.incoming.incoming_rate_limit) ],
					[ item.outgoing.rate, renderRateLimitCell(item.outgoing.rate, item.outgoing.outgoing_rate_limit) ],
					[ (item.incoming.total_bytes || 0) + (item.outgoing.total_bytes || 0), volNode ],
					[ item.time_rule && item.time_rule.enabled ? 1 : 0, E('span', { 'class': 'time-schedule-cell center' }, [
						timeBadge
					]) ],
					[ '', E('div', { 'class': 'button-container' }, [
						E('button', {
							'class': 'btn cbi-button cbi-button-neutral',
							'title': _('View active connections for this application'),
							'click': ui.createHandlerFn(self, function() {
								self.handleDrilldownSID(item.sid, domainOrL7Proto, item);
							})
						}, [
							E('span', { 'class': 'btn-icon' }, '🔍'),
							E('span', {}, ' ' + _('Detail'))
						]),
						E('button', {
							'class': 'btn cbi-button cbi-button-edit',
							'click': ui.createHandlerFn(self, function() {
								self.handleEditSpeed(item.sid, domainOrL7Proto);
							})
						}, [
							E('span', { 'class': 'btn-icon' }, '✏️'),
							E('span', {}, ' ' + _('Edit'))
						])
					]) ]
				]);
			});
		}

		this.updateStackedLineCharts(perServiceTxRate, perServiceRxRate);

		var table = document.getElementById('sid-data');
		var emptyMsg = (filterState.search || filterState.mode !== 'all') ? _('No matching applications found.') : _('No data recorded yet.');
		cbi_update_table(table, rows, E('em', emptyMsg));

		var headers = table.querySelectorAll('th');
		if (!table.hasAttribute('data-sort-initialized')) {
			headers.forEach(function(header, index) {
				header.style.cursor = 'pointer';
				header.addEventListener('click', function() { self.sortTable(table, index); });
			});
			table.setAttribute('data-sort-initialized', 'true');
		}

		table.querySelectorAll('tr:not(.table-titles):not(.placeholder)').forEach(function(row, rowIndex) {
			if (!rows[rowIndex]) return;
			Array.from(row.cells).forEach(function(cell, cellIndex) {
				if (Array.isArray(rows[rowIndex][cellIndex])) {
					cell.setAttribute('data-value', rows[rowIndex][cellIndex][0]);
				}
			});
		});

		this.pie('sid-tx-rate-pie', txRateData, function(p) { return p.name + ': ' + formatSpeed(p.value) + ' (' + p.percent + '%)'; });
		this.pie('sid-rx-rate-pie', rxRateData, function(p) { return p.name + ': ' + formatSpeed(p.value) + ' (' + p.percent + '%)'; });
		this.pie('sid-tx-volume-pie', txVolumeData, function(p) { return p.name + ': ' + formatBytes(p.value) + ' (' + p.percent + '%)'; });
		this.pie('sid-rx-volume-pie', rxVolumeData, function(p) { return p.name + ': ' + formatBytes(p.value) + ' (' + p.percent + '%)'; });

		var sidTotalEl = document.getElementById('sid-total-val');
		if (sidTotalEl) sidTotalEl.textContent = allItems.length;

		var txRateEl = document.getElementById('sid-tx-rate-val');
		if (txRateEl) txRateEl.textContent = formatSpeed(tx_rate_total);

		var rxRateEl = document.getElementById('sid-rx-rate-val');
		if (rxRateEl) rxRateEl.textContent = formatSpeed(rx_rate_total);

		var txVolEl = document.getElementById('sid-tx-volume-val');
		if (txVolEl) txVolEl.textContent = formatBytes(tx_bytes_total);

		var rxVolEl = document.getElementById('sid-rx-volume-val');
		if (rxVolEl) rxVolEl.textContent = formatBytes(rx_bytes_total);

		lastUpdated = new Date();
		var timestampEl = document.getElementById('last-updated');
		if (timestampEl) {
			timestampEl.textContent = _('Last updated: %s').format(lastUpdated.toLocaleTimeString());
		}
	},

	fillSortableTable: function(tableId, rows) {
		var table = document.getElementById(tableId);
		var self = this;
		if (!table)
			return;

		if (!table.hasAttribute('data-sort-initialized')) {
			table.querySelectorAll('th').forEach(function(header, index) {
				header.style.cursor = 'pointer';
				header.addEventListener('click', function() { self.sortTable(table, index); });
			});
			table.setAttribute('data-sort-initialized', 'true');
		}

		cbi_update_table(table, rows, E('em', _('No data recorded yet.')));

		table.querySelectorAll('tr:not(.table-titles):not(.placeholder)').forEach(function(row, rowIndex) {
			if (!rows[rowIndex])
				return;
			Array.from(row.cells).forEach(function(cell, cellIndex) {
				if (Array.isArray(rows[rowIndex][cellIndex]))
					cell.setAttribute('data-value', rows[rowIndex][cellIndex][0]);
			});
		});
	},

	renderL7ProtoData: function(data) {
		var self = this;
		var protoRows = [];
		var domainRows = [];

		lastL7ProtoData = data;
		sidLookupTable = {};

		if (data && data.status === 'success' && data.data) {
			if (Array.isArray(data.data.protocols)) {
				data.data.protocols.forEach(function(item) {
					sidLookupTable[item.sid] = { type: 'protocol', name: item.protocol };
					protoRows.push([
						[ item.id, E('span', { 'class': 'id-cell' }, item.id) ],
						E('span', { 'class': 'protocol-cell' }, [
							E('span', { 'class': 'protocol-icon l7' }, '🔌'),
							E('span', {}, ' ' + item.protocol)
						]),
						[ item.sid, E('span', { 'class': 'sid-cell' }, item.sid) ]
					]);
				});
			}

			if (Array.isArray(data.data.domains)) {
				var domains = data.data.domains.slice().sort(function(a, b) {
					var ac = (b.access_count || 0) - (a.access_count || 0);
					if (ac !== 0)
						return ac;
					return (b.last_access || 0) - (a.last_access || 0);
				});

				domains.forEach(function(item) {
					sidLookupTable[item.sid] = { type: 'domain', name: item.domain };
					var row = [
						[ item.id, E('span', { 'class': 'id-cell' }, item.id) ],
						E('span', { 'class': 'protocol-cell' }, [
							E('span', { 'class': 'protocol-icon domain' }, '🌍'),
							E('span', {}, ' ' + item.domain)
						]),
						[ item.sid, E('span', { 'class': 'sid-cell' }, item.sid) ],
						[ item.access_count || 0, E('span', { 'class': 'data-value' }, item.access_count || 0) ],
						item.first_seen_str || '-',
						item.last_access_str || '-'
					];

					if (self.hasXdns) {
						var isProxied = self.isDomainProxied(item.domain);
						if (isProxied) {
							row.push(E('span', {
								'class': 'badge success xdns-badge-proxied',
								'style': 'color: #155724; background-color: #d4edda; border: 1px solid #c3e6cb; font-weight: 600; padding: 3px 10px; border-radius: 4px; font-size: 85%; white-space: nowrap;'
							}, [ '✔ ', _('已代理') ]));
						} else {
							row.push(E('button', {
								'class': 'btn cbi-button cbi-button-action',
								'style': 'padding: 2px 8px; font-size: 85%; white-space: nowrap;',
								'click': function(ev) {
									var b = ev.target.closest('button');
									self.handleAddXdnsDomain(item.domain, b);
								}
							}, [ createButtonIcon('add', 12), _('加入代理') ]));
						}
					}

					domainRows.push(row);
				});
			}
		}

		this.fillSortableTable('l7-protocol-data', protoRows);
		this.fillSortableTable('l7-domain-data', domainRows);

		var protoCountEl = document.getElementById('l7-protocol-count');
		if (protoCountEl)
			protoCountEl.textContent = protoRows.length;
		var domainCountEl = document.getElementById('l7-domain-count');
		if (domainCountEl)
			domainCountEl.textContent = domainRows.length;
	},

	pollL7Data: function() {
		if (pollActive) return;

		var self = this;
		pollActive = true;
		
		self.loadL7ProtoData().then(function(l7data) {
			self.renderL7ProtoData(l7data);
			return self.loadSIDData();
		}).then(function(sidData){
			self.renderSIDData(sidData);
		});

		poll.add(function() {
			if (isPaused) return Promise.resolve();
			
			return self.loadL7ProtoData().then(function(data) {
				self.renderL7ProtoData(data);
			}).then(function() {
				return self.loadSIDData().then(function(data) {
					self.renderSIDData(data);
				});
			});
		}, 5);
	},

	initializeUI: function() {
		applyViewTheme();
		if (window.echarts) {
			var self = this;
			var dlChartEl = document.getElementById('download-speed-line-chart');
			var ulChartEl = document.getElementById('upload-speed-line-chart');
			if (!dlChartEl || !ulChartEl) return;

			var colors = getChartColors();
			var axisTheme = chartAxisTheme(colors);
			var baseChartOption = {
				backgroundColor: axisTheme.backgroundColor,
				textStyle: axisTheme.textStyle,
				legend: axisTheme.legend,
				tooltip: Object.assign({
					trigger: 'axis',
					formatter: function (params) {
						if (!params || params.length === 0) {
							return null;
						}
						var tooltipContent = params[0].axisValueLabel + '<br/>';
						params.sort(function(a, b) { return b.value - a.value; });
						params.forEach(function(item) {
							if (item.value > 0) {
								tooltipContent += item.marker + ' ' + item.seriesName + ': ' + '%1024.2mbps'.format(item.value) + '<br/>';
							}
						});
						return tooltipContent;
					}
				}, axisTheme.tooltip),
				grid: { left: '3%', right: '4%', bottom: '10%', top: '50px', containLabel: true },
				xAxis: {
					type: 'category',
					boundaryGap: false,
					data: lineCategories,
					axisLine: axisTheme.xAxis.axisLine,
					axisLabel: axisTheme.xAxis.axisLabel,
					splitLine: axisTheme.xAxis.splitLine
				},
				yAxis: {
					type: 'value',
					axisLine: axisTheme.yAxis.axisLine,
					splitLine: axisTheme.yAxis.splitLine,
					axisLabel: { formatter: function(val) { return '%1024.2mbps'.format(val); }, color: colors.muted }
				},
				series: []
			};


		downloadLineChart = echarts.init(dlChartEl);
		downloadLineChart.setOption(baseChartOption);
		observeChartEl(downloadLineChart, dlChartEl);

		uploadLineChart = echarts.init(ulChartEl);
		uploadLineChart.setOption(baseChartOption);
		observeChartEl(uploadLineChart, ulChartEl);

		// 添加窗口大小变化监听器，使图表能够响应式调整
		if (!resizeListenerAdded) {
			var resizeTimer = null;
			var resizeHandler = function() {
				// 使用防抖，避免频繁触发 resize
				if (resizeTimer) {
					clearTimeout(resizeTimer);
				}
				resizeTimer = setTimeout(function() {
					self.resizeAllCharts();
				}, 200);
			};
			
			window.addEventListener('resize', resizeHandler);
			resizeListenerAdded = true;
		}

		this.pollL7Data();
	} else {
		setTimeout(this.initializeUI.bind(this), 50);
	}
	},

	resizeAllCharts: function() {
		if (downloadLineChart)
			downloadLineChart.resize();
		if (uploadLineChart)
			uploadLineChart.resize();
		Object.keys(chartRegistry).forEach(function(chartId) {
			if (chartRegistry[chartId])
				chartRegistry[chartId].resize();
		});
	},

	bindTabChartResize: function(root) {
		var self = this;
		if (!root)
			return;
		var host = root.parentNode || root;
		if (host._awTabResizeBound)
			return;
		host._awTabResizeBound = true;

		var schedule = function() {
			setTimeout(function() { self.resizeAllCharts(); }, 80);
		};

		host.addEventListener('click', function(ev) {
			if (ev.target.closest && ev.target.closest('ul.cbi-tabmenu'))
				schedule();
		});
		root.querySelectorAll('[data-tab]').forEach(function(pane) {
			pane.addEventListener('cbi-tab-active', schedule);
		});
	},

	render: function() {
		var self = this;

		var controls = E('div', { 'class': 'l7-controls' }, [
			E('div', { 'class': 'l7-controls-left' }, [
				E('div', { 'class': 'control-group' }, [
					E('span', { 'class': 'control-icon' }, '📊'),
					E('label', { 'for': 'sid-size-select', 'class': 'control-label' }, _('Show entries:')),
					E('select', {
						'id': 'sid-size-select',
						'class': 'cbi-input-select',
						'change': ui.createHandlerFn(this, function() {
							if (lastSIDData) {
								self.renderSIDData(lastSIDData);
							}
						})
					}, [
						E('option', { 'value': '15' }, '15'),
						E('option', { 'value': '30', 'selected': 'selected' }, '30'),
						E('option', { 'value': '50' }, '50'),
						E('option', { 'value': '100' }, '100'),
						E('option', { 'value': '0' }, _('All'))
					])
				])
			]),
			E('div', { 'class': 'l7-controls-right' }, [
				E('div', { 'class': 'control-group' }, [
					E('span', { 'class': 'control-icon' }, '🕐'),
					E('span', { 'id': 'last-updated', 'class': 'last-updated-text' }, _('Last updated: never'))
				]),
				E('button', {
					'class': 'cbi-button cbi-button-action',
					'id': 'pause-resume-btn',
					'click': function(ev) {
						isPaused = !isPaused;
						var btn = ev.target;
						if (isPaused) {
							btn.innerHTML = '<span class="btn-icon">▶️</span> ' + _('Resume');
							btn.classList.remove('cbi-button-action');
							btn.classList.add('cbi-button-positive');
						} else {
							btn.innerHTML = '<span class="btn-icon">⏸️</span> ' + _('Pause');
							btn.classList.remove('cbi-button-positive');
							btn.classList.add('cbi-button-action');
						}
					}
				}, [
					E('span', { 'class': 'btn-icon' }, '⏸️'),
					E('span', {}, ' ' + _('Pause'))
				])
			])
		]);

		var sidInnerTabs = E('div', { 'class': 'aw-inner-tabs' }, [
			E('div', { 'class': 'cbi-section', 'data-tab': 'sid-list', 'data-tab-title': _('SID List'), 'data-tab-active': 'true' }, [
				self.createFilterBar(),
				E('table', { 'class': 'table', 'id': 'sid-data' }, [
					E('tr', { 'class': 'tr table-titles' }, [
						E('th', { 'class': 'th left' }, [ E('span', { 'class': 'th-icon' }, '🌐'), ' ', _('Application & SID') ]),
						E('th', { 'class': 'th right' }, [ createSpeedtestIcon('dl', 14), ' ', _('Download Speed / Limit') ]),
						E('th', { 'class': 'th right' }, [ createSpeedtestIcon('ul', 14), ' ', _('Upload Speed / Limit') ]),
						E('th', { 'class': 'th right' }, [ E('span', { 'class': 'th-icon' }, '📊'), ' ', _('Total Traffic (DL / UL)') ]),
						E('th', { 'class': 'th center' }, [ E('span', { 'class': 'th-icon' }, '⏱️'), ' ', _('Time Schedule') ]),
						E('th', { 'class': 'th center cbi-section-actions' }, [ E('span', { 'class': 'th-icon' }, '⚙️'), ' ', _('Actions') ])
					]),
					E('tr', { 'class': 'tr placeholder' }, [
						E('td', { 'class': 'td', 'colspan': '6' }, [
							E('em', { 'class': 'spinning' }, [ _('Collecting data...') ])
						])
					])
				]),
				controls
			]),
			E('div', { 'class': 'cbi-section', 'data-tab': 'sid-trend', 'data-tab-title': _('Speed Trend') }, [
				E('div', { 'class': 'dashboard-container' }, [
					E('div', { 'class': 'kpi-row' }, [
						E('div', { 'class': 'kpi-card' }, [ E('big', { id: 'sid-total-val' }, '0'), E('span', { 'class': 'kpi-card-label' }, _('L7 Protocol Data')) ]),
						E('div', { 'class': 'kpi-card' }, [ E('big', { id: 'sid-tx-rate-val' }, '0'), E('span', { 'class': 'kpi-card-label' }, [ createSpeedtestIcon('dl', 12), ' ', _('Download Speed') ]) ]),
						E('div', { 'class': 'kpi-card' }, [ E('big', { id: 'sid-rx-rate-val' }, '0'), E('span', { 'class': 'kpi-card-label' }, [ createSpeedtestIcon('ul', 12), ' ', _('Upload Speed') ]) ]),
						E('div', { 'class': 'kpi-card' }, [ E('big', { id: 'sid-tx-volume-val' }, '0'), E('span', { 'class': 'kpi-card-label' }, [ createSpeedtestIcon('dl', 12), ' ', _('Download Total') ]) ]),
						E('div', { 'class': 'kpi-card' }, [ E('big', { id: 'sid-rx-volume-val' }, '0'), E('span', { 'class': 'kpi-card-label' }, [ createSpeedtestIcon('ul', 12), ' ', _('Upload Total') ]) ])
					]),
					E('div', { 'class': 'line-chart-row' }, [
						E('div', { 'class': 'chart-card' }, [
							E('h4', [ createSpeedtestIcon('dl', 14), ' ', _('Real-time Download Speed') ]),
							E('div', { id: 'download-speed-line-chart', style: 'width: 100%; height: 350px;' })
						]),
						E('div', { 'class': 'chart-card' }, [
							E('h4', [ createSpeedtestIcon('ul', 14), ' ', _('Real-time Upload Speed') ]),
							E('div', { id: 'upload-speed-line-chart', style: 'width: 100%; height: 350px;' })
						])
					])
				])
			]),
			E('div', { 'class': 'cbi-section', 'data-tab': 'sid-share', 'data-tab-title': _('Traffic Share') }, [
				E('div', { 'class': 'dashboard-container' }, [
					E('div', { 'class': 'chart-grid' }, [
						E('div', { 'class': 'chart-card' }, [
							E('h4', [ createSpeedtestIcon('dl', 14), ' ', _('Download Speed / SID') ]),
							E('div', { id: 'sid-tx-rate-pie', style: 'width: 100%; height: 300px;' })
						]),
						E('div', { 'class': 'chart-card' }, [
							E('h4', [ createSpeedtestIcon('ul', 14), ' ', _('Upload Speed / SID') ]),
							E('div', { id: 'sid-rx-rate-pie', style: 'width: 100%; height: 300px;' })
						]),
						E('div', { 'class': 'chart-card' }, [
							E('h4', [ createSpeedtestIcon('dl', 14), ' ', _('Download Total') ]),
							E('div', { id: 'sid-tx-volume-pie', style: 'width: 100%; height: 300px;' })
						]),
						E('div', { 'class': 'chart-card' }, [
							E('h4', [ createSpeedtestIcon('ul', 14), ' ', _('Upload Total') ]),
							E('div', { id: 'sid-rx-volume-pie', style: 'width: 100%; height: 300px;' })
						])
					])
				])
			])
		]);

		var tabContainer = E('div', {}, [
			E('div', { 'class': 'cbi-section', 'data-tab': 'sid', 'data-tab-title': _('L7 SID Data'), 'data-tab-active': 'true' }, [
				sidInnerTabs
			]),
			E('div', { 'class': 'cbi-section', 'data-tab': 'l7proto', 'data-tab-title': _('L7 Protocol Data') }, [
				E('div', { 'class': 'aw-inner-tabs' }, [
					E('div', { 'class': 'cbi-section', 'data-tab': 'l7-protocols', 'data-tab-title': _('Protocol Library'), 'data-tab-active': 'true' }, [
						E('p', { 'class': 'cbi-section-descr' }, [
							_('Built-in L7 protocol signatures from aw-bpf.'),
							' ',
							_('Entries:'),
							' ',
							E('strong', { 'id': 'l7-protocol-count' }, '0')
						]),
						E('table', { 'class': 'table', 'id': 'l7-protocol-data' }, [
							E('tr', { 'class': 'tr table-titles' }, [
								E('th', { 'class': 'th left' }, [ E('span', { 'class': 'th-icon' }, '#️⃣'), ' ', _('ID') ]),
								E('th', { 'class': 'th left' }, [ E('span', { 'class': 'th-icon' }, '🔌'), ' ', _('Protocol') ]),
								E('th', { 'class': 'th right' }, [ E('span', { 'class': 'th-icon' }, '🔑'), ' ', _('SID') ])
							]),
							E('tr', { 'class': 'tr placeholder' }, [
								E('td', { 'class': 'td', 'colspan': '3' }, [
									E('em', { 'class': 'spinning' }, [ _('Collecting data...') ])
								])
							])
						])
					]),
					E('div', { 'class': 'cbi-section', 'data-tab': 'l7-domains', 'data-tab-title': _('常用域名') }, [
						E('p', { 'class': 'cbi-section-descr' }, [
							_('Frequently accessed domains discovered by xDPI, sorted by access count.'),
							' ',
							_('Entries:'),
							' ',
							E('strong', { 'id': 'l7-domain-count' }, '0')
						]),
						E('table', { 'class': 'table', 'id': 'l7-domain-data' }, [
							E('tr', { 'class': 'tr table-titles' }, [
								E('th', { 'class': 'th left' }, [ E('span', { 'class': 'th-icon' }, '#️⃣'), ' ', _('ID') ]),
								E('th', { 'class': 'th left' }, [ E('span', { 'class': 'th-icon' }, '🌍'), ' ', _('Domain') ]),
								E('th', { 'class': 'th right' }, [ E('span', { 'class': 'th-icon' }, '🔑'), ' ', _('SID') ]),
								E('th', { 'class': 'th right' }, [ E('span', { 'class': 'th-icon' }, '📊'), ' ', _('Access Count') ]),
								E('th', { 'class': 'th left' }, [ E('span', { 'class': 'th-icon' }, '🕒'), ' ', _('First Seen') ]),
								E('th', { 'class': 'th left' }, [ E('span', { 'class': 'th-icon' }, '🕒'), ' ', _('Last Access') ]),
								this.hasXdns ? E('th', { 'class': 'th center' }, [ E('span', { 'class': 'th-icon' }, '⚡'), ' ', _('xdns代理') ]) : null
							].filter(Boolean)),
							E('tr', { 'class': 'tr placeholder' }, [
								E('td', { 'class': 'td', 'colspan': this.hasXdns ? '7' : '6' }, [
									E('em', { 'class': 'spinning' }, [ _('Collecting data...') ])
								])
							])
						])
					])
				])
			])
		]);

		var node = E([], [
		    E('link', { 'rel': 'stylesheet', 'href': L.resource('view/aw-bpf.css') }),
		    E('script', { 'type': 'text/javascript', 'src': L.resource('echarts.min.js') }),

		    E('div', { 'class': 'l7-view-container', 'data-aw-theme': isDarkMode() ? 'dark' : 'light' }, [
		        E('h2', [ _('L7 Data Monitor') ]),
		        E('div', { 'id': 'l7-error-message' }),
		        tabContainer
		    ])
		]);

		tabContainer.querySelectorAll('.aw-inner-tabs').forEach(function(inner) {
			ui.tabs.initTabGroup(inner.childNodes);
		});
		ui.tabs.initTabGroup(tabContainer.childNodes);
		this.bindTabChartResize(tabContainer);

		setTimeout(this.initializeUI.bind(this), 0);

		return node;
	},

	handleSave: null,
	handleSaveApply: null,
	handleReset: null
});