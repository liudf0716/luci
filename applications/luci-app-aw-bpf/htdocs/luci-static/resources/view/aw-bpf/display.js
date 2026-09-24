'use strict';
'require view';
'require fs';
'require ui';
'require poll';
'require rpc';
'require dom';
'require uci';

// Global variables from original display.js
var chartRegistry = {};
var hostNames = {}; // mac => hostname
var hostInfo = {}; // ip => mac
var hostNameMacSectionId = "";
var isPaused = false;
var lastUpdated = null;

// Line chart variables (from l7.js)
var downloadLineChart = {}, uploadLineChart = {};
var lineCategories = { ipv4: [], ipv6: [], mac: [] };
var downloadSeriesData = { ipv4: {}, ipv6: {}, mac: {} };
var uploadSeriesData = { ipv4: {}, ipv6: {}, mac: {} };

// Color palette for chart series
var colorPalette = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'];

var resizeListenerAdded = false;

// Pre-fill with 60 empty points for a smooth start
['ipv4', 'ipv6', 'mac'].forEach(function(type) {
	for (var i = 0; i < 60; i++) {
		lineCategories[type].push('');
	}
});

// Helper to convert hex to rgba (from l7.js)
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
	ipv4: { search: '', mode: 'all' },
	ipv6: { search: '', mode: 'all' },
	mac:  { search: '', mode: 'all' }
};

var lastRawData = {
	ipv4: null,
	ipv6: null,
	mac:  null
};

function formatSpeed(bps) {
	bps = +bps || 0;
	if (bps <= 0) return '0 bps';
	if (bps >= 1000000000) return (bps / 1000000000).toFixed(2) + ' Gbps';
	if (bps >= 1000000) return (bps / 1000000).toFixed(2) + ' Mbps';
	if (bps >= 1000) return (bps / 1000).toFixed(1) + ' Kbps';
	return bps + ' bps';
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
	// --- Core Data Logic from display.js ---

	loadHostNames: async function() {
		try {
			await uci.sections('hostnames', "hostname", function (params) {
				hostNameMacSectionId = params['.name'];
				for (var key in params) {
					if (key.startsWith('.')) continue;
					var macAddr = key.split('_').join(':');
					hostNames[macAddr] = params[key];
				}
			});

			const dhcpLeases = await fs.exec_direct('/usr/bin/awk', ['-F', ' ', '{print $2, $3, $4}', '/tmp/dhcp.leases'], 'text');
			dhcpLeases.split('\n').forEach(function(line) {
				if (line === '') return;
				const [mac, ip, hostname] = line.split(' ');
				if (!hostNames.hasOwnProperty(mac)) {
					hostNames[mac] = hostname;
				}
			});

			const arp = await fs.exec_direct('/usr/bin/awk', ['-F', ' ', '{print $1, $4}', '/proc/net/arp'], 'text');
			arp.split('\n').forEach(function(line, i) {
				if (i === 0 || line === '') return;
				const [ip, mac] = line.split(' ');
				hostInfo[ip] = mac;
			});

		} catch (e) {
			console.error('Error getting host names:', e);
		}
	},

	loadHostSpeedData: async function() {
		var self = this;
		try {
			const results = await Promise.all([
				fs.exec_direct('/usr/bin/aw-bpfctl', ['ipv4', 'json'], 'json'),
				fs.exec_direct('/usr/bin/aw-bpfctl', ['ipv6', 'json'], 'json'),
				fs.exec_direct('/usr/bin/aw-bpfctl', ['mac',  'json'], 'json')
			]);

			const defaultData = {status: "success", data: []};
			const ipv4Data = results[0] || defaultData;
			const ipv6Data = results[1] || defaultData;
			const macData  = results[2] || defaultData;
			
			ipv4Data.data.forEach(function(item) {
				const mac = hostInfo[item.ip];
				if (mac) {
					item.mac = mac;
					item.hostname = hostNames[mac];
				}
			});
			macData.data.forEach(function(item) {
				const mac = item.mac;
				if (mac) {
					item.hostname = hostNames[mac];
				}
			});

			self.renderHostSpeed(ipv4Data, "ipv4");
			self.renderHostSpeed(ipv6Data, "ipv6");
			self.renderHostSpeed(macData, "mac");

			lastUpdated = new Date();
			document.querySelectorAll('.display-last-updated').forEach(function(el) {
				el.textContent = _('Last updated: %s').format(lastUpdated.toLocaleTimeString());
			});

		} catch (e) {
			console.error('Error polling data:', e);
		}
	},

	pollData: function() {
		poll.add(L.bind(async function() {
			if (isPaused) return;
			await this.loadHostNames();
			await this.loadHostSpeedData();
		}, this), 5);
	},

	resizeAllCharts: function() {
		['ipv4', 'ipv6', 'mac'].forEach(function(type) {
			if (downloadLineChart[type])
				downloadLineChart[type].resize();
			if (uploadLineChart[type])
				uploadLineChart[type].resize();
		});
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

	// --- UI Rendering and Interaction (New structure based on l7.js) ---

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

	updateStackedLineCharts: function(type, perHostDownload, perHostUpload) {
		var now = new Date().toLocaleTimeString();
		lineCategories[type].push(now);
		lineCategories[type].shift();

		var processChartData = function(seriesData, perHostData) {
			var allHosts = Object.keys(seriesData);
			Object.keys(perHostData).forEach(function(host) {
				if (allHosts.indexOf(host) === -1) {
					allHosts.push(host);
				}
			});

			allHosts.forEach(function(host) {
				if (!seriesData[host]) {
					seriesData[host] = Array(59).fill(0);
				}
				var rate = perHostData[host] || 0;
				seriesData[host].push(rate);
				seriesData[host].shift();
			});

			return Object.keys(seriesData).map(function(host, index) {
				var color = colorPalette[index % colorPalette.length];
				return {
					name: host,
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
					data: seriesData[host]
				};
			});
		};

		var downloadChartSeries = processChartData(downloadSeriesData[type], perHostDownload);
		var uploadChartSeries = processChartData(uploadSeriesData[type], perHostUpload);

		var legendData = downloadChartSeries.map(function(s) { return s.name; });

		var colors = getChartColors();
		if (downloadLineChart[type]) {
			downloadLineChart[type].setOption({
				legend: { data: legendData, type: 'scroll', top: 0, left: 'center', textStyle: { color: colors.text } },
				series: downloadChartSeries,
				xAxis: { data: lineCategories[type] }
			});
		}

		if (uploadLineChart[type]) {
			uploadLineChart[type].setOption({
				legend: { data: legendData, type: 'scroll', top: 0, left: 'center', textStyle: { color: colors.text } },
				series: uploadChartSeries,
				xAxis: { data: lineCategories[type] }
			});
		}
	},

	applyFilter: function(type) {
		if (lastRawData[type]) {
			this.renderHostSpeed(lastRawData[type], type);
		}
	},

	updateFilterPills: function(type) {
		var parent = document.getElementById(type + '-filter-bar');
		if (!parent) return;
		var current = filterState[type].mode;
		parent.querySelectorAll('.filter-pill').forEach(function(pill) {
			if (pill.getAttribute('data-filter') === current) {
				pill.classList.add('active');
			} else {
				pill.classList.remove('active');
			}
		});
	},

	createFilterBar: function(type) {
		var self = this;
		return E('div', { 'class': 'host-filter-bar', 'id': type + '-filter-bar' }, [
			E('div', { 'class': 'search-box' }, [
				E('span', { 'class': 'search-icon' }, '🔍'),
				E('input', {
					'type': 'text',
					'class': 'cbi-input-text search-input',
					'placeholder': _('Search IP, MAC or Hostname...'),
					'value': filterState[type].search,
					'input': function(ev) {
						filterState[type].search = ev.target.value.toLowerCase().trim();
						self.applyFilter(type);
					}
				})
			]),
			E('div', { 'class': 'filter-pills' }, [
				E('button', {
					'type': 'button',
					'class': 'filter-pill' + (filterState[type].mode === 'all' ? ' active' : ''),
					'data-filter': 'all',
					'click': function() {
						filterState[type].mode = 'all';
						self.updateFilterPills(type);
						self.applyFilter(type);
					}
				}, [ _('All'), E('span', { 'id': type + '-count-all', 'class': 'pill-badge' }, '0') ]),
				E('button', {
					'type': 'button',
					'class': 'filter-pill' + (filterState[type].mode === 'active' ? ' active' : ''),
					'data-filter': 'active',
					'click': function() {
						filterState[type].mode = 'active';
						self.updateFilterPills(type);
						self.applyFilter(type);
					}
				}, [ '🟢 ' + _('Active'), E('span', { 'id': type + '-count-active', 'class': 'pill-badge' }, '0') ]),
				E('button', {
					'type': 'button',
					'class': 'filter-pill' + (filterState[type].mode === 'limited' ? ' active' : ''),
					'data-filter': 'limited',
					'click': function() {
						filterState[type].mode = 'limited';
						self.updateFilterPills(type);
						self.applyFilter(type);
					}
				}, [ '⚡ ' + _('Limited'), E('span', { 'id': type + '-count-limited', 'class': 'pill-badge' }, '0') ])
			])
		]);
	},

	renderHostSpeed: function(data, type) {
		if (!data || data.status !== "success" || !Array.isArray(data.data)) return;

		lastRawData[type] = data;

		var allItems = data.data;
		var txRateData = [], rxRateData = [];
		var txVolumeData = [], rxVolumeData = [];
		var tx_rate_total = 0, rx_rate_total = 0;
		var tx_bytes_total = 0, rx_bytes_total = 0;
		var perHostTxRate = {};
		var perHostRxRate = {};
		var activeCount = 0;
		var limitedCount = 0;

		allItems.forEach(item => {
			if (!item || !item.incoming || !item.outgoing) return;

			var host = item.ip || item.mac || '';
			var hostname = item.hostname || hostNames[item.mac] || '';
			var displayName = hostname || host;

			var isActive = item.incoming.rate > 0 || item.outgoing.rate > 0;
			if (isActive) activeCount++;

			var isLimited = (item.incoming && item.incoming.incoming_rate_limit > 0) || (item.outgoing && item.outgoing.outgoing_rate_limit > 0);
			if (isLimited) limitedCount++;

			rx_rate_total += item.outgoing.rate;
			tx_rate_total += item.incoming.rate;
			rx_bytes_total += item.outgoing.total_bytes;
			tx_bytes_total += item.incoming.total_bytes;

			rxRateData.push({ value: item.outgoing.rate, label: displayName });
			txRateData.push({ value: item.incoming.rate, label: displayName });
			rxVolumeData.push({ value: item.outgoing.total_bytes, label: displayName });
			txVolumeData.push({ value: item.incoming.total_bytes, label: displayName });

			perHostTxRate[displayName] = (perHostTxRate[displayName] || 0) + item.incoming.rate;
			perHostRxRate[displayName] = (perHostRxRate[displayName] || 0) + item.outgoing.rate;
		});

		var cAll = document.getElementById(type + '-count-all');
		if (cAll) cAll.textContent = allItems.length;
		var cActive = document.getElementById(type + '-count-active');
		if (cActive) cActive.textContent = activeCount;
		var cLimited = document.getElementById(type + '-count-limited');
		if (cLimited) cLimited.textContent = limitedCount;

		var search = filterState[type].search;
		var mode = filterState[type].mode;

		var filteredItems = allItems.filter(item => {
			if (!item || !item.incoming || !item.outgoing) return false;
			var host = item.ip || item.mac || '';
			var hostname = item.hostname || hostNames[item.mac] || '';

			if (search) {
				if (host.toLowerCase().indexOf(search) === -1 && hostname.toLowerCase().indexOf(search) === -1)
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

		var rows = [];
		filteredItems.forEach(item => {
			var host = item.ip || item.mac || '';
			var hostname = item.hostname || hostNames[item.mac] || '';
			var isActive = item.incoming.rate > 0 || item.outgoing.rate > 0;
			var activityIcon = isActive ? '🟢' : '⚪';

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

			var deviceSub = host + (item.mac && item.mac !== host ? ' · ' + item.mac : '');
			var deviceName = hostname || host;
			var deviceNode = E('div', { 'class': 'device-cell' }, [
				E('div', { 'class': 'device-main' }, [
					E('span', { 'class': 'activity-indicator', 'title': isActive ? _('Active') : _('Inactive') }, activityIcon),
					E('span', { 'class': 'device-name' }, deviceName)
				]),
				E('span', { 'class': 'device-sub' }, deviceSub)
			]);

			var volNode = E('div', { 'class': 'dual-volume-cell' }, [
				E('div', {
					'class': 'vol-row dl',
					'title': _('Download Total: ') + formatBytes(item.incoming.total_bytes) + ' (' + formatPackets(item.incoming.total_packets) + ')'
				}, [
					E('span', { 'class': 'vol-icon' }, '⬇️'),
					E('span', { 'class': 'vol-val' }, formatBytes(item.incoming.total_bytes))
				]),
				E('div', {
					'class': 'vol-row ul',
					'title': _('Upload Total: ') + formatBytes(item.outgoing.total_bytes) + ' (' + formatPackets(item.outgoing.total_packets) + ')'
				}, [
					E('span', { 'class': 'vol-icon' }, '⬆️'),
					E('span', { 'class': 'vol-val' }, formatBytes(item.outgoing.total_bytes))
				])
			]);

			var isBlocked = (item.incoming && item.incoming.incoming_rate_limit === 1 && item.outgoing && item.outgoing.outgoing_rate_limit === 1);

			rows.push([
				[ (deviceName + ' ' + host).toLowerCase(), deviceNode ],
				[ item.incoming.rate, renderRateLimitCell(item.incoming.rate, item.incoming.incoming_rate_limit) ],
				[ item.outgoing.rate, renderRateLimitCell(item.outgoing.rate, item.outgoing.outgoing_rate_limit) ],
				[ (item.incoming.total_bytes || 0) + (item.outgoing.total_bytes || 0), volNode ],
				[ item.time_rule && item.time_rule.enabled ? 1 : 0, E('span', { 'class': 'time-schedule-cell center' }, [
					timeBadge
				]) ],
				[ '', E('div', { 'class': 'button-container' }, [
					E('button', {
						'class': 'btn cbi-button cbi-button-neutral',
						'style': 'margin-right: 5px;',
						'title': _('View active connections & L7 details'),
						'click': ui.createHandlerFn(this, () => this.handleDrilldownHost(host, hostname, type))
					}, [
						E('span', { 'class': 'btn-icon' }, '🔍'),
						E('span', {}, ' ' + _('Detail'))
					]),
					E('button', {
						'class': 'btn cbi-button ' + (isBlocked ? 'cbi-button-positive' : 'cbi-button-action'),
						'style': 'margin-right: 5px;',
						'title': isBlocked ? _('Restore network access') : _('Cut off network access'),
						'click': ui.createHandlerFn(this, () => this.handleToggleBlockHost(host, type, isBlocked))
					}, [
						E('span', { 'class': 'btn-icon' }, isBlocked ? '✅' : '🚫'),
						E('span', {}, ' ' + (isBlocked ? _('Unblock') : _('Block')))
					]),
					E('button', {
						'class': 'btn cbi-button cbi-button-edit',
						'style': 'margin-right: 5px;',
						'click': ui.createHandlerFn(this, () => this.handleEditSpeed(host, item.mac, hostname, type))
					}, [
						E('span', { 'class': 'btn-icon' }, '✏️'),
						E('span', {}, ' ' + _('Edit'))
					]),
					E('button', {
						'class': 'btn cbi-button cbi-button-remove',
						'click': ui.createHandlerFn(this, () => this.handleDeleteHost(host, type))
					}, [
						E('span', { 'class': 'btn-icon' }, '🗑️'),
						E('span', {}, ' ' + _('Delete'))
					])
				]) ]
			]);
		});

		this.updateStackedLineCharts(type, perHostTxRate, perHostRxRate);

		var table = document.getElementById(type + '-speed-data');
		var emptyMsg = (search || mode !== 'all') ? _('No matching hosts found.') : _('No data recorded yet.');
		cbi_update_table(table, rows, E('em', emptyMsg));

		this.pie(type + '-tx-rate-pie', txRateData, (p) => `${p.name}: ${formatSpeed(p.value)} (${p.percent}%)`);
		this.pie(type + '-rx-rate-pie', rxRateData, (p) => `${p.name}: ${formatSpeed(p.value)} (${p.percent}%)`);
		this.pie(type + '-tx-volume-pie', txVolumeData, (p) => `${p.name}: ${formatBytes(p.value)} (${p.percent}%)`);
		this.pie(type + '-rx-volume-pie', rxVolumeData, (p) => `${p.name}: ${formatBytes(p.value)} (${p.percent}%)`);

		var hostEl = document.getElementById(type + '-host-val');
		if (hostEl) hostEl.textContent = allItems.length;

		var txRateEl = document.getElementById(type + '-tx-rate-val');
		if (txRateEl) txRateEl.textContent = formatSpeed(tx_rate_total);

		var rxRateEl = document.getElementById(type + '-rx-rate-val');
		if (rxRateEl) rxRateEl.textContent = formatSpeed(rx_rate_total);

		var txVolEl = document.getElementById(type + '-tx-volume-val');
		if (txVolEl) txVolEl.textContent = formatBytes(tx_bytes_total);

		var rxVolEl = document.getElementById(type + '-rx-volume-val');
		if (rxVolEl) rxVolEl.textContent = formatBytes(rx_bytes_total);

		var mDl = document.getElementById('mini-total-dl');
		if (mDl) mDl.textContent = formatSpeed(tx_rate_total);

		var mUl = document.getElementById('mini-total-ul');
		if (mUl) mUl.textContent = formatSpeed(rx_rate_total);

		var mHosts = document.getElementById('mini-hosts-val');
		if (mHosts) mHosts.textContent = activeCount + ' / ' + allItems.length;

		var mLim = document.getElementById('mini-limited-val');
		if (mLim) mLim.textContent = limitedCount;
	},

	handleDrilldownHost: function(host, hostname, type) {
		fs.exec_direct('/usr/bin/aw-bpfctl', ['fastpath', 'json'], 'json').then(L.bind(res => {
			var sessions = [];
			var totalPackets = 0, totalBytes = 0;
			if (Array.isArray(res)) {
				res.forEach(function(s) {
					var isMatch = false;
					if (type === 'mac') {
						if (s.dmac && s.dmac.toLowerCase() === host.toLowerCase()) isMatch = true;
					} else {
						if ((s.orig_src && s.orig_src.indexOf(host + ':') === 0) ||
						    (s.new_dst && s.new_dst.indexOf(host + ':') === 0) ||
						    (s.new_src && s.new_src.indexOf(host + ':') === 0) ||
						    (s.orig_dst && s.orig_dst.indexOf(host + ':') === 0)) {
							isMatch = true;
						}
					}
					if (isMatch) {
						sessions.push(s);
						totalPackets += (s.packets || 0);
						totalBytes += (s.bytes || 0);
					}
				});
			}

			sessions.sort(function(a, b) { return (b.bytes || 0) - (a.bytes || 0); });

			var sessionRows = sessions.map(function(s) {
				var isOut = (s.orig_src && s.orig_src.indexOf(host + ':') === 0);
				var remoteAddr = isOut ? s.orig_dst : s.orig_src;
				var localPort = isOut ? (s.orig_src.split(':')[1] || '') : (s.new_dst.split(':')[1] || '');
				var remotePort = remoteAddr ? remoteAddr.split(':')[1] : '';
				
				var appName = '';
				if (remotePort === '443') appName = 'HTTPS';
				else if (remotePort === '80') appName = 'HTTP';
				else if (remotePort === '53') appName = 'DNS';
				else if (remotePort === '22') appName = 'SSH';
				else if (remotePort === '3389') appName = 'RDP/MSTSC';

				return E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td' }, [
						E('span', { 'class': 'badge ' + (s.proto === 'TCP' ? 'badge-info' : 'badge-warning') }, s.proto)
					]),
					E('td', { 'class': 'td' }, (isOut ? '⬆️ ' + _('Outbound') : '⬇️ ' + _('Inbound'))),
					E('td', { 'class': 'td' }, localPort || '-'),
					E('td', { 'class': 'td' }, [
						E('span', {}, remoteAddr),
						appName ? E('span', { 'class': 'badge badge-secondary', 'style': 'margin-left: 6px;' }, appName) : null
					]),
					E('td', { 'class': 'td right' }, formatPackets(s.packets || 0)),
					E('td', { 'class': 'td right' }, formatBytes(s.bytes || 0))
				]);
			});

			ui.showModal(_('Host Session & L7 Traffic Details'), [
				E('div', { 'class': 'cbi-section' }, [
					E('div', { 'style': 'margin-bottom: 14px; display: flex; gap: 20px; align-items: center; flex-wrap: wrap;' }, [
						E('div', {}, [ E('strong', {}, _('Host: ')), (hostname || host) + ' (' + host + ')' ]),
						E('div', {}, [ E('strong', {}, _('Active Flows: ')), String(sessions.length) ]),
						E('div', {}, [ E('strong', {}, _('Flow Traffic: ')), formatBytes(totalBytes) ])
					]),
					E('div', { 'style': 'max-height: 400px; overflow-y: auto;' }, [
						E('table', { 'class': 'table' }, [
							E('tr', { 'class': 'tr table-titles' }, [
								E('th', { 'class': 'th' }, _('Protocol')),
								E('th', { 'class': 'th' }, _('Direction')),
								E('th', { 'class': 'th' }, _('Local Port')),
								E('th', { 'class': 'th' }, _('Remote Destination')),
								E('th', { 'class': 'th right' }, _('Packets')),
								E('th', { 'class': 'th right' }, _('Bytes'))
							]),
							sessionRows.length > 0 ? E([], sessionRows) : E('tr', { 'class': 'tr placeholder' }, [
								E('td', { 'class': 'td center', 'colspan': 6 }, E('em', {}, _('No active sessions found for this host.')))
							])
						])
					])
				]),
				E('div', { 'class': 'right', 'style': 'margin-top: 15px;' }, [
					E('button', { 'class': 'btn cbi-button-neutral', 'click': ui.hideModal }, _('Close'))
				])
			], 'cbi-modal');
		}, this)).catch(e => {
			ui.addNotification(null, E('p', _('Error getting session details: ') + e.message));
		});
	},

	handleToggleBlockHost: function(host, type, isCurrentlyBlocked) {
		var confirmMsg = isCurrentlyBlocked
			? _('Are you sure you want to unblock network access for %s?').format(host)
			: _('Are you sure you want to block network access for %s? (Rate limit will be set to 1 bps)').format(host);

		ui.showModal(isCurrentlyBlocked ? _('Unblock Host') : _('Block Host'), [
			E('p', confirmMsg),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'btn', 'click': ui.hideModal }, _('Cancel')),
				E('button', {
					'class': 'btn ' + (isCurrentlyBlocked ? 'cbi-button-positive' : 'cbi-button-negative'),
					'click': ui.createHandlerFn(this, async () => {
						try {
							var down = isCurrentlyBlocked ? '0' : '1';
							var up = isCurrentlyBlocked ? '0' : '1';
							await fs.exec_direct('/usr/bin/aw-bpfctl', [type, 'update', host, 'downrate', down, 'uprate', up, '--notime']);
							this.loadHostSpeedData();
							ui.hideModal();
							ui.addNotification(null, E('p', isCurrentlyBlocked ? _('Host unblocked successfully') : _('Host blocked successfully')));
						} catch (e) {
							ui.addNotification(null, E('p', _('Error: ') + e.message));
							ui.hideModal();
						}
					})
				}, isCurrentlyBlocked ? _('Unblock') : _('Block'))
			])
		]);
	},

	handleDeleteHost: function(host, type) {
		ui.showModal(_('Delete Host'), [
			E('p', _('Are you sure you want to delete this host?')),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'btn', 'click': ui.hideModal }, _('Cancel')),
				E('button', { 'class': 'btn cbi-button-negative', 'click': ui.createHandlerFn(this, async () => {
					try {
						await fs.exec_direct('/usr/bin/aw-bpfctl', [type, 'del', host], 'text');
						this.loadHostSpeedData();
						ui.hideModal();
					} catch (e) {
						ui.addNotification(null, E('p', _('Error: ') + e.message));
						ui.hideModal();
					}
				})}, _('Delete'))
			])
		]);
	},

	handleEditSpeed: function(host, mac, hostname, type) {
		fs.exec_direct('/usr/bin/aw-bpfctl', [type, 'json'], 'json').then(L.bind(res => {
			let rate_limit_dl = 0, rate_limit_ul = 0;
			let time_rule = null;
			if (res && res.status === 'success' && Array.isArray(res.data)) {
				const item = res.data.find(d => (d.ip === host || d.mac === host));
				if (item) {
					rate_limit_dl = (item.incoming.incoming_rate_limit || 0) / 1024 / 1024;
					rate_limit_ul = (item.outgoing.outgoing_rate_limit || 0) / 1024 / 1024;
					time_rule = item.time_rule || null;
				}
			}
			this.displaySpeedLimitDialog(host, mac, hostname, type, rate_limit_dl, rate_limit_ul, time_rule);
		}, this)).catch(e => {
			console.error('Error getting speed limit:', e);
			this.displaySpeedLimitDialog(host, mac, hostname, type, 0, 0, null);
		});
	},
	
	displaySpeedLimitDialog: function(host, mac, hostname, type, dl, ul, time_rule) {
		const inputDom = E('input', {
			type: 'text',
			id: 'host-name',
			class: 'cbi-input-text',
			value: hostname,
			disabled: !mac,
			style: 'width: 240px; max-width: 100%;'
		});

		const isTimeEnabled = !!(time_rule && time_rule.enabled);
		const daysMatch = (time_rule && time_rule.weekdays_match) ? time_rule.weekdays_match : 0x3E;
		const dtStart = (time_rule && time_rule.daytime_start) ? time_rule.daytime_start : '09:30:00';
		const dtStop = (time_rule && time_rule.daytime_stop) ? time_rule.daytime_stop : '18:30:00';
		const dStart = (time_rule && time_rule.date_start) ? time_rule.date_start.split(' ')[0] : '';
		const dStop = (time_rule && time_rule.date_stop) ? time_rule.date_stop.split(' ')[0] : '';

		const weekNames = [
			{ bit: 1, label: _('Mon'), id: 'tc-day-mon' },
			{ bit: 2, label: _('Tue'), id: 'tc-day-tue' },
			{ bit: 3, label: _('Wed'), id: 'tc-day-wed' },
			{ bit: 4, label: _('Thu'), id: 'tc-day-thu' },
			{ bit: 5, label: _('Fri'), id: 'tc-day-fri' },
			{ bit: 6, label: _('Sat'), id: 'tc-day-sat' },
			{ bit: 0, label: _('Sun'), id: 'tc-day-sun' }
		];

		const updatePillActiveState = () => {
			weekNames.forEach(w => {
				const input = document.getElementById(w.id);
				const label = document.getElementById(w.id + '-label');
				if (input && label) {
					if (input.checked) {
						label.classList.add('active');
					} else {
						label.classList.remove('active');
					}
				}
			});
		};

		const weekdayCheckboxes = weekNames.map(w => {
			const checked = (daysMatch & (1 << w.bit)) !== 0;
			return E('label', {
				id: w.id + '-label',
				'class': checked ? 'aw-weekday-pill active' : 'aw-weekday-pill',
				click: (ev) => {
					setTimeout(updatePillActiveState, 10);
				}
			}, [
				E('input', {
					type: 'checkbox',
					id: w.id,
					value: w.bit,
					checked: checked ? 'checked' : null,
					change: () => updatePillActiveState()
				}),
				w.label
			]);
		});

		const tcContainer = E('div', {
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
								click: () => {
									weekNames.forEach(w => {
										const el = document.getElementById(w.id);
										if (el) el.checked = (w.bit >= 1 && w.bit <= 5);
									});
									updatePillActiveState();
								}
							}, _('Workdays (Mon-Fri)')),
							E('button', {
								type: 'button',
								class: 'btn cbi-button cbi-button-neutral',
								style: 'margin-right: 5px; padding: 2px 8px; font-size: 12px;',
								click: () => {
									weekNames.forEach(w => {
										const el = document.getElementById(w.id);
										if (el) el.checked = (w.bit === 0 || w.bit === 6);
									});
									updatePillActiveState();
								}
							}, _('Weekend (Sat-Sun)')),
							E('button', {
								type: 'button',
								class: 'btn cbi-button cbi-button-neutral',
								style: 'padding: 2px 8px; font-size: 12px;',
								click: () => {
									weekNames.forEach(w => {
										const el = document.getElementById(w.id);
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

		const tcEnableCheckbox = E('input', {
			type: 'checkbox',
			id: 'tc-enable',
			checked: isTimeEnabled ? 'checked' : null,
			style: 'margin-right: 6px;',
			change: (ev) => {
				const panel = document.getElementById('tc-panel');
				if (panel) panel.style.display = ev.target.checked ? '' : 'none';
			}
		});

		ui.showModal(_('Edit Speed Limit & Time Schedule'), [
			E('div', { 'class': 'cbi-section' }, [
				E('div', { 'class': 'table aw-modal-table' }, [
					E('div', { 'class': 'tr' }, [
						E('div', { 'class': 'td aw-modal-label' }, _('Host')),
						E('div', { 'class': 'td aw-modal-value', style: 'font-weight: bold;' }, host)
					]),
					E('div', { 'class': 'tr' }, [
						E('div', { 'class': 'td aw-modal-label' }, _('Hostname')),
						E('div', { 'class': 'td aw-modal-value' }, [ inputDom ])
					]),
					E('div', { 'class': 'tr' }, [
						E('div', { 'class': 'td aw-modal-label' }, _('Download Limit')),
						E('div', { 'class': 'td aw-modal-value', style: 'display: flex; align-items: center; gap: 6px;' }, [
							E('input', { type: 'number', id: 'dl-rate', class: 'cbi-input-number', min: '0', value: dl, style: 'width: 120px;' }),
							E('span', {}, " Mbps")
						])
					]),
					E('div', { 'class': 'tr' }, [
						E('div', { 'class': 'td aw-modal-label' }, _('Upload Limit')),
						E('div', { 'class': 'td aw-modal-value', style: 'display: flex; align-items: center; gap: 6px;' }, [
							E('input', { type: 'number', id: 'ul-rate', class: 'cbi-input-number', min: '0', value: ul, style: 'width: 120px;' }),
							E('span', {}, " Mbps")
						])
					]),
					E('div', { 'class': 'tr' }, [
						E('div', { 'class': 'td aw-modal-label' }, _('Quick Presets')),
						E('div', { 'class': 'td aw-modal-value' }, [
							E('div', { style: 'display: flex; flex-wrap: wrap; gap: 6px;' }, [
								E('button', {
									type: 'button',
									class: 'btn cbi-button cbi-button-neutral',
									style: 'padding: 2px 8px; font-size: 11px;',
									click: function() {
										document.getElementById('dl-rate').value = 2;
										document.getElementById('ul-rate').value = 1;
									}
								}, '2M ' + _('(Light)')),
								E('button', {
									type: 'button',
									class: 'btn cbi-button cbi-button-neutral',
									style: 'padding: 2px 8px; font-size: 11px;',
									click: function() {
										document.getElementById('dl-rate').value = 5;
										document.getElementById('ul-rate').value = 2;
									}
								}, '5M ' + _('(Office)')),
								E('button', {
									type: 'button',
									class: 'btn cbi-button cbi-button-neutral',
									style: 'padding: 2px 8px; font-size: 11px;',
									click: function() {
										document.getElementById('dl-rate').value = 10;
										document.getElementById('ul-rate').value = 5;
									}
								}, '10M ' + _('(Standard)')),
								E('button', {
									type: 'button',
									class: 'btn cbi-button cbi-button-neutral',
									style: 'padding: 2px 8px; font-size: 11px;',
									click: function() {
										document.getElementById('dl-rate').value = 20;
										document.getElementById('ul-rate').value = 10;
									}
								}, '20M ' + _('(Fast)')),
								E('button', {
									type: 'button',
									class: 'btn cbi-button cbi-button-neutral',
									style: 'padding: 2px 8px; font-size: 11px;',
									click: function() {
										document.getElementById('dl-rate').value = 0;
										document.getElementById('ul-rate').value = 0;
									}
								}, _('No Limit (0M)'))
							])
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
				E('button', { 'class': 'btn cbi-button cbi-button-positive', 'click': ui.createHandlerFn(this, async ev => {
					const dl_val = document.getElementById('dl-rate').value;
					const ul_val = document.getElementById('ul-rate').value;
					const newName = document.getElementById('host-name').value;
					const tcEnabled = document.getElementById('tc-enable').checked;

					try {
						if (mac && newName !== hostname) {
							hostNames[mac] = newName;
							await uci.set('hostnames', hostNameMacSectionId, mac.split(':').join('_'), newName);
							await uci.save('hostnames');
							await uci.apply('hostnames');
						}

						const cmdArgs = [type, 'update', host, 'downrate', String(Math.round((parseFloat(dl_val) || 0) * 1024 * 1024)), 'uprate', String(Math.round((parseFloat(ul_val) || 0) * 1024 * 1024))];

						if (!tcEnabled) {
							cmdArgs.push('--notime');
						} else {
							const selectedDays = [];
							weekNames.forEach(w => {
								const el = document.getElementById(w.id);
								if (el && el.checked) selectedDays.push(w.bit);
							});
							if (selectedDays.length > 0 && selectedDays.length < 7) {
								cmdArgs.push('--weekdays', selectedDays.join(','));
							} else if (selectedDays.length === 7) {
								cmdArgs.push('--weekdays', 'all');
							}

							const tStart = (document.getElementById('tc-timestart').value || '').trim();
							const tStop = (document.getElementById('tc-timestop').value || '').trim();
							if (tStart && tStop) {
								cmdArgs.push('--timestart', tStart, '--timestop', tStop);
							}

							const dStartVal = (document.getElementById('tc-datestart').value || '').trim();
							const dStopVal = (document.getElementById('tc-datestop').value || '').trim();
							if (dStartVal) {
								cmdArgs.push('--datestart', dStartVal + ' 00:00:00');
							}
							if (dStopVal) {
								cmdArgs.push('--datestop', dStopVal + ' 23:59:59');
							}
						}

						await fs.exec_direct('/usr/bin/aw-bpfctl', cmdArgs);
						this.loadHostSpeedData();
						ui.addNotification(null, E('p', _('Speed limit and time schedule updated')));
						ui.hideModal();
					} catch (e) {
						ui.addNotification(null, E('p', _('Error: ') + e.message));
					}
				})}, _('Save'))
			])
		], 'cbi-modal');
	},

	validateData: function(value, type) {
		if (typeof value !== 'string') return false;
		const ipv4Regex = /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;
		const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^(([0-9a-fA-F]{1,4}:){0,6}::([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4})$/i;
		const macRegex = /^([0-9A-Fa-f]{2}([-:]))([0-9A-Fa-f]{2}\2){4}[0-9A-Fa-f]{2}$|^([0-9A-Fa-f]{12})$/i;
		return (type === 'ipv4') ? ipv4Regex.test(value) : (type === 'ipv6') ? ipv6Regex.test(value) : macRegex.test(value);
	},

	createAddControls: function(type, placeholder) {
		const input = E('input', { 
			type: 'text', 
			class: 'cbi-input-text control-input', 
			style: (type === 'ipv6') ? 'width:320px' : 'width:180px', 
			placeholder: _(placeholder) 
		});
		const addBtn = E('button', { 
			class: 'btn cbi-button cbi-button-add', 
			disabled: true 
		}, [
			E('span', { 'class': 'btn-icon' }, '➕'),
			E('span', {}, ' ' + _('Add'))
		]);
		const refreshBtn = E('button', { 
			class: 'btn cbi-button cbi-button-action', 
			click: () => this.loadHostSpeedData() 
		}, [
			E('span', { 'class': 'btn-icon' }, '🔄'),
			E('span', {}, ' ' + _('Refresh'))
		]);

		input.addEventListener('input', () => { addBtn.disabled = (input.value.trim() === ''); });
		addBtn.addEventListener('click', ui.createHandlerFn(this, async () => {
			const value = input.value.trim();
			if (!this.validateData(value, type)) {
				return ui.addNotification(null, E('p', _('Data format error')));
			}
			try {
				await fs.exec_direct('/usr/bin/aw-bpfctl', [type, 'add', value]);
				this.loadHostSpeedData();
				ui.addNotification(null, E('p',_('Updated successfully!')));
				input.value = '';
				addBtn.disabled = true;
			} catch (e) {
				ui.addNotification(null, E('p', _('Error: ') + e.message));
			}
		}));

		return E('div', { 'class': 'display-controls' }, [
			E('div', { 'class': 'control-group' }, [
				E('span', { 'class': 'control-icon' }, '🖥️'),
				E('label', { 'class': 'control-label' }, _('Add Host:')),
				input
			]),
			E('div', { 'class': 'control-buttons' }, [
				addBtn,
				refreshBtn,
				E('div', { 'class': 'control-group status-group' }, [
					E('span', { 'class': 'control-icon' }, '🕐'),
					E('span', { 'id': 'display-last-updated-' + type, 'class': 'last-updated-text display-last-updated' }, _('Ready'))
				])
			])
		]);
	},

	initializeUI: function() {
		applyViewTheme();
		if (window.echarts) {
			var self = this;
			var colors = getChartColors();
			var axisTheme = chartAxisTheme(colors);
			['ipv4', 'ipv6', 'mac'].forEach(function(type) {
				var dlChartEl = document.getElementById(type + '-download-speed-line-chart');
				var ulChartEl = document.getElementById(type + '-upload-speed-line-chart');
				if (!dlChartEl || !ulChartEl) return;

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
									tooltipContent += item.marker + ' ' + item.seriesName + ': ' + formatSpeed(item.value) + '<br/>';
								}
							});
							return tooltipContent;
						}
					}, axisTheme.tooltip),
					grid: { left: '3%', right: '4%', bottom: '10%', top: '50px', containLabel: true },
					xAxis: {
						type: 'category',
						boundaryGap: false,
						data: lineCategories[type],
						axisLine: axisTheme.xAxis.axisLine,
						axisLabel: axisTheme.xAxis.axisLabel,
						splitLine: axisTheme.xAxis.splitLine
					},
					yAxis: {
						type: 'value',
						axisLine: axisTheme.yAxis.axisLine,
						splitLine: axisTheme.yAxis.splitLine,
						axisLabel: { formatter: function(val) { return formatSpeed(val); }, color: colors.muted }
					},
					series: []
				};

				downloadLineChart[type] = echarts.init(dlChartEl);
				downloadLineChart[type].setOption(baseChartOption);
				observeChartEl(downloadLineChart[type], dlChartEl);

				uploadLineChart[type] = echarts.init(ulChartEl);
				uploadLineChart[type].setOption(baseChartOption);
				observeChartEl(uploadLineChart[type], ulChartEl);
			});

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

			this.pollData();
		} else {
			setTimeout(this.initializeUI.bind(this), 50);
		}
	},

	// --- Main Render Function (New) ---

	render: function() {
		var self = this;

		const createTab = (type, title, placeholder) => {
			var innerTabs = E('div', { 'class': 'aw-inner-tabs' }, [
				E('div', { 'class': 'cbi-section', 'data-tab': type + '-hosts', 'data-tab-title': _('Host List'), 'data-tab-active': 'true' }, [
					self.createFilterBar(type),
					E('table', { 'class': 'table', 'id': type + '-speed-data' }, [
						E('tr', { 'class': 'tr table-titles' }, [
							E('th', { 'class': 'th left' }, [ E('span', { 'class': 'th-icon' }, '🖥️'), ' ', _('Device & Host') ]),
							E('th', { 'class': 'th right' }, [ E('span', { 'class': 'th-icon' }, '⬇️'), ' ', _('Download Speed / Limit') ]),
							E('th', { 'class': 'th right' }, [ E('span', { 'class': 'th-icon' }, '⬆️'), ' ', _('Upload Speed / Limit') ]),
							E('th', { 'class': 'th right' }, [ E('span', { 'class': 'th-icon' }, '📊'), ' ', _('Total Traffic (DL / UL)') ]),
							E('th', { 'class': 'th center' }, [ E('span', { 'class': 'th-icon' }, '⏱️'), ' ', _('Time Schedule') ]),
							E('th', { 'class': 'th center cbi-section-actions' }, [ E('span', { 'class': 'th-icon' }, '⚙️'), ' ', _('Actions') ])
						]),
						E('tr', { 'class': 'tr placeholder' }, [ E('td', { 'class': 'td', 'colspan': '6' }, [ E('em', { 'class': 'spinning' }, [ _('Collecting data...') ]) ]) ])
					]),
					self.createAddControls(type, placeholder)
				]),
				E('div', { 'class': 'cbi-section', 'data-tab': type + '-trend', 'data-tab-title': _('Speed Trend') }, [
					E('div', { 'class': 'dashboard-container' }, [
						E('div', { 'class': 'kpi-row' }, [
							E('div', { 'class': 'kpi-card' }, [ E('big', { id: type + '-host-val' }, '0'), E('span', { 'class': 'kpi-card-label' }, _('Hosts')) ]),
							E('div', { 'class': 'kpi-card' }, [ E('big', { id: type + '-tx-rate-val' }, '0'), E('span', { 'class': 'kpi-card-label' }, _('Download Speed')) ]),
							E('div', { 'class': 'kpi-card' }, [ E('big', { id: type + '-rx-rate-val' }, '0'), E('span', { 'class': 'kpi-card-label' }, _('Upload Speed')) ]),
							E('div', { 'class': 'kpi-card' }, [ E('big', { id: type + '-tx-volume-val' }, '0'), E('span', { 'class': 'kpi-card-label' }, _('Download Total')) ]),
							E('div', { 'class': 'kpi-card' }, [ E('big', { id: type + '-rx-volume-val' }, '0'), E('span', { 'class': 'kpi-card-label' }, _('Upload Total')) ])
						]),
						E('div', { 'class': 'line-chart-row' }, [
							E('div', { 'class': 'chart-card' }, [
								E('h4', [_('Real-time Download Speed')]),
								E('div', { id: type + '-download-speed-line-chart', style: 'width: 100%; height: 350px;' })
							]),
							E('div', { 'class': 'chart-card' }, [
								E('h4', [_('Real-time Upload Speed')]),
								E('div', { id: type + '-upload-speed-line-chart', style: 'width: 100%; height: 350px;' })
							])
						])
					])
				]),
				E('div', { 'class': 'cbi-section', 'data-tab': type + '-share', 'data-tab-title': _('Traffic Share') }, [
					E('div', { 'class': 'dashboard-container' }, [
						E('div', { 'class': 'chart-grid' }, [
							E('div', { 'class': 'chart-card' }, [ E('h4', [_('Download Speed / Host')]), E('div', { id: type + '-tx-rate-pie', style: 'width:100%; height:300px;' }) ]),
							E('div', { 'class': 'chart-card' }, [ E('h4', [_('Upload Speed / Host')]), E('div', { id: type + '-rx-rate-pie', style: 'width:100%; height:300px;' }) ]),
							E('div', { 'class': 'chart-card' }, [ E('h4', [_('Download Total')]), E('div', { id: type + '-tx-volume-pie', style: 'width:100%; height:300px;' }) ]),
							E('div', { 'class': 'chart-card' }, [ E('h4', [_('Upload Total')]), E('div', { id: type + '-rx-volume-pie', style: 'width:100%; height:300px;' }) ])
						])
					])
				])
			]);

			var tabProps = { 'class': 'cbi-section', 'data-tab': type, 'data-tab-title': _(title) };
			if (type === 'ipv4')
				tabProps['data-tab-active'] = 'true';
			return E('div', tabProps, [
				innerTabs
			]);
		};

		var tabContainer = E('div', {}, [
			createTab('ipv4', 'IPv4', 'Please enter a valid IPv4 address'),
			createTab('ipv6', 'IPv6', 'Please enter a valid IPv6 address'),
			createTab('mac', 'MAC', 'Please enter a valid MAC address')
		]);

		var miniDashboard = E('div', { 'class': 'aw-mini-dashboard' }, [
			E('div', { 'class': 'mini-kpi-card dl' }, [
				E('div', { 'class': 'mini-kpi-icon' }, '⬇️'),
				E('div', { 'class': 'mini-kpi-content' }, [
					E('div', { 'class': 'mini-kpi-label' }, _('Total Download')),
					E('div', { 'class': 'mini-kpi-val', 'id': 'mini-total-dl' }, '0 bps')
				])
			]),
			E('div', { 'class': 'mini-kpi-card ul' }, [
				E('div', { 'class': 'mini-kpi-icon' }, '⬆️'),
				E('div', { 'class': 'mini-kpi-content' }, [
					E('div', { 'class': 'mini-kpi-label' }, _('Total Upload')),
					E('div', { 'class': 'mini-kpi-val', 'id': 'mini-total-ul' }, '0 bps')
				])
			]),
			E('div', { 'class': 'mini-kpi-card hosts' }, [
				E('div', { 'class': 'mini-kpi-icon' }, '🖥️'),
				E('div', { 'class': 'mini-kpi-content' }, [
					E('div', { 'class': 'mini-kpi-label' }, _('Active / Total Hosts')),
					E('div', { 'class': 'mini-kpi-val', 'id': 'mini-hosts-val' }, '0 / 0')
				])
			]),
			E('div', { 'class': 'mini-kpi-card limited' }, [
				E('div', { 'class': 'mini-kpi-icon' }, '⚡'),
				E('div', { 'class': 'mini-kpi-content' }, [
					E('div', { 'class': 'mini-kpi-label' }, _('Limited Hosts')),
					E('div', { 'class': 'mini-kpi-val', 'id': 'mini-limited-val' }, '0')
				])
			])
		]);

		var node = E([], [
		    E('link', { 'rel': 'stylesheet', 'href': L.resource('view/aw-bpf.css') }),
		    E('script', { 'type': 'text/javascript', 'src': L.resource('echarts.min.js') }),
		    E('div', { 'class': 'display-view-container', 'data-aw-theme': isDarkMode() ? 'dark' : 'light' }, [
		        E('h2', [ _('Host Speed Monitor') ]),
		        miniDashboard,
		        tabContainer
		    ])
		]);

		tabContainer.querySelectorAll('.aw-inner-tabs').forEach(function(inner) {
			ui.tabs.initTabGroup(inner.childNodes);
		});
		ui.tabs.initTabGroup(tabContainer.childNodes);
		this.bindTabChartResize(tabContainer);

		setTimeout(() => this.initializeUI(), 0);

		return node;
	},

	handleSave: null,
	handleSaveApply: null,
	handleReset: null
});
