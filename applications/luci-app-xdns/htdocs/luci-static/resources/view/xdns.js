'use strict';
'require view';
'require dom';
'require ui';
'require form';
'require uci';
'require fs';
'require poll';

function pickStat(text, labels) {
	for (var i = 0; i < labels.length; i++) {
		var m = text.match(new RegExp(labels[i] + '\\s*:\\s*(\\d+)', 'i'));
		if (m)
			return parseInt(m[1], 10);
	}
	return 0;
}

function parseStats(statsText) {
	var res = {
		dnsProxied: 0,
		dnsPassed: 0,
		dnsFailed: 0,
		dnsLearned: 0,
		tcpConns: 0,
		tcpBytes: 0
	};
	if (!statsText) return res;

	res.dnsProxied = pickStat(statsText, ['DNS Queries Proxied']);
	res.dnsPassed = pickStat(statsText, ['DNS Queries Passed']);
	res.dnsFailed = pickStat(statsText, ['DNS Forward Failed']);
	res.dnsLearned = pickStat(statsText, ['DNS A Records Learned', 'DNS Responses Learned']);
	res.tcpConns = pickStat(statsText, ['TCP Connections Steered', 'TCP Connections Proxied']);
	res.tcpBytes = pickStat(statsText, ['TCP Bytes Steered']);
	if (!res.dnsProxied)
		res.dnsProxied = pickStat(statsText, ['DNS Queries Intercepted']);
	return res;
}

function formatBytes(n) {
	n = parseInt(n, 10) || 0;
	if (n < 1024) return n + ' B';
	if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
	if (n < 1073741824) return (n / 1048576).toFixed(1) + ' MB';
	return (n / 1073741824).toFixed(2) + ' GB';
}

function formatRate(bps) {
	var n = parseInt(bps, 10) || 0;
	if (n >= 1000000) return (n / 1000000).toFixed(1) + ' Mbps';
	if (n >= 1000) return (n / 1000).toFixed(1) + ' Kbps';
	return n + ' bps';
}

function isIpv4(s) {
	if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(s || ''))
		return false;
	var parts = s.split('.');
	for (var i = 0; i < 4; i++) {
		var n = parseInt(parts[i], 10);
		if (isNaN(n) || n < 0 || n > 255)
			return false;
	}
	return true;
}

function parseDomains(domainsText) {
	var list = [];
	if (!domainsText) return list;

	var lines = domainsText.split('\n');
	for (var i = 0; i < lines.length; i++) {
		var line = lines[i].trim();
		if (!line || line.indexOf('Domain') === 0 || line.indexOf('----') === 0 || line.indexOf('Total domains') === 0)
			continue;

		var parts = line.split(/\s+/);
		if (parts.length >= 2) {
			list.push({
				domain: parts[0],
				hash: parts[1],
				state: parts[2] || 'Active'
			});
		}
	}
	return list;
}

function parseIps(ipsText) {
	var list = [];
	if (!ipsText) return list;

	var lines = ipsText.split('\n');
	for (var i = 0; i < lines.length; i++) {
		var line = lines[i].trim();
		if (!line || line.indexOf('IP Address') === 0 || line.indexOf('Website') === 0 || line.indexOf('----') === 0 || line.indexOf('Total active') === 0)
			continue;

		var parts = line.split(/\s+/);
		if (isIpv4(parts[1])) {
			list.push({
				domain: parts[0] === '-' ? '' : parts[0],
				ip: parts[1],
				expires: parts[2] || '0s',
				conns: parts[3] || '0',
				bytes: parts[5] || '0'
			});
		} else if (isIpv4(parts[0])) {
			list.push({
				domain: '',
				ip: parts[0],
				expires: parts[1] || '0s',
				conns: '0',
				bytes: '0'
			});
		}
	}
	return list;
}

function parseSessions(sessionsText) {
	var list = [];
	if (!sessionsText) return list;

	var lines = sessionsText.split('\n');
	for (var i = 0; i < lines.length; i++) {
		var line = lines[i].trim();
		if (!line || line.indexOf('Client Endpoint') === 0 || line.indexOf('----') === 0 || line.indexOf('Total active') === 0)
			continue;

		var parts = line.split(/\s+/);
		if (parts.length >= 3 && !isIpv4((parts[0] || '').split(':')[0]) && isIpv4((parts[1] || '').split(':')[0])) {
			list.push({
				site: parts[0] === '-' ? '' : parts[0],
				client: parts[1],
				target: parts[2],
				lastSeen: parts[3] || '',
				bytes: parts[4] || '0',
				rate: parts[5] || '0'
			});
		} else if (parts.length >= 2 && isIpv4((parts[0] || '').split(':')[0])) {
			list.push({
				site: '',
				client: parts[0],
				target: parts[1],
				lastSeen: parts[2] || '',
				bytes: parts[3] || '0',
				rate: parts[4] || '0'
			});
		}
	}
	return list;
}

return view.extend({
	load: function() {
		return Promise.all([
			uci.load('xdns'),
			uci.load('network'),
			L.resolveDefault(fs.exec_direct('/usr/bin/xdns-ctl', ['status']), ''),
			L.resolveDefault(fs.exec_direct('/usr/bin/xdns-ctl', ['stats']), ''),
			L.resolveDefault(fs.exec_direct('/usr/bin/xdns-ctl', ['list-domains']), ''),
			L.resolveDefault(fs.exec_direct('/usr/bin/xdns-ctl', ['list-ips']), ''),
			L.resolveDefault(fs.exec_direct('/usr/bin/xdns-ctl', ['list-sessions']), ''),
			L.resolveDefault(fs.read_direct('/etc/xdns/proxy_domains.txt'), ''),
			L.resolveDefault(fs.read_direct('/etc/xdns/static_ips.txt'), '')
		]);
	},

	renderStatusTab: function(statusText, statsText, ipsText, sessionsText, domainsCount) {
		var self = this;
		var stats = parseStats(statsText);
		var ips = parseIps(ipsText);
		var sessions = parseSessions(sessionsText);

		/* Attached tc programs, not a procd process. xdns exits after loading BPF. */
		var isRunning = false;
		if (/Running\s*:\s*yes/i.test(statusText || '')) {
			isRunning = true;
		} else if (/Running\s*:\s*no/i.test(statusText || '')) {
			isRunning = false;
		} else if (statsText && /xdns-bpf Statistics/i.test(statsText)) {
			/* Fallback: if xdns-ctl status is unavailable, check if BPF map statistics are accessible */
			isRunning = true;
		}

		var svcBadge = E('span', {
			'class': 'label ' + (isRunning ? 'success' : 'neutral'),
			'style': 'padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 90%; color: #fff; background-color: ' + (isRunning ? '#28a745' : '#6c757d') + ';'
		}, isRunning ? _('运行中') : _('未运行'));

		var nameByIp = {};
		var bySite = {};
		ips.forEach(function(item) {
			if (item.ip && item.domain)
				nameByIp[item.ip] = item.domain;
			if (!item.domain && !(parseInt(item.bytes, 10) || 0) && !(parseInt(item.conns, 10) || 0))
				return;
			var key = item.domain || item.ip || '?';
			if (!bySite[key]) {
				bySite[key] = {
					domain: item.domain || '',
					ips: [],
					bytes: 0,
					conns: 0,
					expires: parseInt(item.expires, 10) || 0
				};
			}
			var g = bySite[key];
			if (item.ip && g.ips.indexOf(item.ip) < 0)
				g.ips.push(item.ip);
			g.bytes += parseInt(item.bytes, 10) || 0;
			g.conns += parseInt(item.conns, 10) || 0;
			var exp = parseInt(item.expires, 10) || 0;
			if (exp > g.expires)
				g.expires = exp;
		});
		var sites = Object.keys(bySite).map(function(k) { return bySite[k]; });
		sites.sort(function(a, b) { return b.bytes - a.bytes; });

		function rememberText(sec) {
			if (sec === 'permanent' || sec === -1)
				return _('永久 (静态)');
			var n = parseInt(sec, 10);
			if (isNaN(n) || n > 86400 * 365)
				return _('永久 (静态)');
			if (n <= 0)
				return _('即将重新查询');
			if (n < 60)
				return n + _(' 秒');
			if (n < 3600)
				return Math.round(n / 60) + _(' 分钟');
			return Math.round(n / 3600) + _(' 小时');
		}

		function siteCell(site) {
			var isStatic = (site.domain === '[static]');
			var title = isStatic ? (site.ips && site.ips.length ? site.ips[0] : _('静态重定向')) : (site.domain || (site.ips && site.ips.length ? site.ips[0] : _('还没记到网站名')));
			var extra = '';
			if (isStatic)
				extra = _('静态重定向 IP (免 DNS 劫持)');
			else if (site.domain && site.ips.length > 1)
				extra = site.ips.length + _(' 台服务器');
			else if (!site.domain && site.ips.length > 1)
				extra = site.ips.slice(1).join(', ');
			return E('div', {}, [
				E('div', { 'style': 'font-weight: 650; font-size: 15px;' }, title),
				extra ? E('div', { 'style': 'color: #888; font-size: 12px; margin-top: 2px;' }, extra) : ''
			]);
		}

		// Modern KPI Cards with Responsive Breakpoints
		function createKpiCard(title, icon, value, color, subText, isHero) {
			return E('div', {
				'class': 'xdns-kpi-card' + (isHero ? ' hero' : '')
			}, [
				E('div', { 'class': 'xdns-kpi-header' }, [
					E('span', { 'class': 'xdns-kpi-title' }, title),
					E('span', { 'class': 'xdns-kpi-icon' }, icon)
				]),
				E('div', { 'class': 'xdns-kpi-val', 'style': 'color: ' + color + ';' }, value),
				subText ? E('div', { 'class': 'xdns-kpi-sub' }, subText) : ''
			]);
		}

		var kpiStyle = E('style', {}, [
			'.xdns-kpi-grid {',
			'    display: grid;',
			'    grid-template-columns: repeat(5, minmax(0, 1fr));',
			'    gap: 12px;',
			'    margin: 15px 0 25px 0;',
			'}',
			'.xdns-kpi-card {',
			'    background: var(--cbi-section-bg, #fff);',
			'    border: 1px solid var(--cbi-section-border, rgba(0, 0, 0, 0.08));',
			'    border-radius: 10px;',
			'    padding: 14px 16px;',
			'    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);',
			'    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;',
			'    display: flex;',
			'    flex-direction: column;',
			'    justify-content: space-between;',
			'    min-height: 86px;',
			'    box-sizing: border-box;',
			'}',
			'.xdns-kpi-card:hover {',
			'    transform: translateY(-2px);',
			'    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);',
			'}',
			'.xdns-kpi-header {',
			'    display: flex;',
			'    align-items: center;',
			'    justify-content: space-between;',
			'    font-size: 13px;',
			'    color: var(--cbi-descr-color, #666);',
			'    margin-bottom: 6px;',
			'    white-space: nowrap;',
			'}',
			'.xdns-kpi-title {',
			'    font-weight: 500;',
			'}',
			'.xdns-kpi-icon {',
			'    font-size: 16px;',
			'    line-height: 1;',
			'    opacity: 0.85;',
			'}',
			'.xdns-kpi-val {',
			'    font-size: 24px;',
			'    font-weight: 700;',
			'    line-height: 1.2;',
			'    letter-spacing: -0.3px;',
			'}',
			'.xdns-kpi-sub {',
			'    font-size: 11px;',
			'    color: #999;',
			'    margin-top: 3px;',
			'    white-space: nowrap;',
			'    overflow: hidden;',
			'    text-overflow: ellipsis;',
			'}',
			'@media screen and (max-width: 1080px) {',
			'    .xdns-kpi-grid {',
			'        grid-template-columns: repeat(4, 1fr);',
			'    }',
			'    .xdns-kpi-card.hero {',
			'        grid-column: span 4;',
			'        background: linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%);',
			'        border-color: rgba(6, 182, 212, 0.25);',
			'        padding: 16px 20px;',
			'    }',
			'    .xdns-kpi-card.hero .xdns-kpi-val {',
			'        font-size: 28px;',
			'    }',
			'}',
			'@media screen and (max-width: 720px) {',
			'    .xdns-kpi-grid {',
			'        grid-template-columns: repeat(2, 1fr);',
			'        gap: 10px;',
			'    }',
			'    .xdns-kpi-card.hero {',
			'        grid-column: span 2;',
			'    }',
			'    .xdns-kpi-card {',
			'        padding: 12px;',
			'        min-height: 76px;',
			'    }',
			'    .xdns-kpi-val {',
			'        font-size: 20px;',
			'    }',
			'    .xdns-kpi-header {',
			'        font-size: 12px;',
			'    }',
			'}'
		].join('\n'));

		var kpiRow = E('div', { 'class': 'xdns-kpi-grid' }, [
			createKpiCard(_('加速通道总流量'), '🚀', formatBytes(stats.tcpBytes), '#0891b2', _('eBPF 双向累计吞吐'), true),
			createKpiCard(_('走加速通道查询'), '⚡', String(stats.dnsProxied), '#10b981', _('命中规则定向分流')),
			createKpiCard(_('直接上网查询'), '🌐', String(stats.dnsPassed), '#3b82f6', _('常规本地 DNS 解析')),
			createKpiCard(_('正在加速的网站'), '🎯', String(sites.length), '#f59e0b', _('内核动态劫持中')),
			createKpiCard(_('分流名单中的网站'), '📋', String(domainsCount), '#8b5cf6', _('规则库匹配域名'))
		]);

		function td(content, title) {
			var attrs = {
				'class': 'td left',
				'style': 'text-align:left !important'
			};
			if (title)
				attrs['data-title'] = title;
			return E('td', attrs, content);
		}

		var ipTableRows = [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th left', 'style': 'text-align:left' }, _('网站')),
				E('th', { 'class': 'th left', 'style': 'text-align:left' }, _('加速流量')),
				E('th', { 'class': 'th left', 'style': 'text-align:left' }, _('连接数')),
				E('th', { 'class': 'th left', 'style': 'text-align:left' }, _('还会记住'))
			])
		];

		if (sites.length === 0) {
			ipTableRows.push(E('tr', { 'class': 'tr placeholder' }, [
				E('td', { 'class': 'td left', 'style': 'text-align:left !important', 'colspan': '4' }, E('em', {}, _('还没有网站走加速通道。打开分流名单里的网站后，这里会显示网站名称。')))
			]));
		} else {
			sites.forEach(function(site) {
				ipTableRows.push(E('tr', { 'class': 'tr' }, [
					td(siteCell(site), _('网站')),
					td(formatBytes(site.bytes), _('加速流量')),
					td(String(site.conns || 0), _('连接数')),
					td(rememberText(site.expires), _('还会记住'))
				]));
			});
		}

		var ipSection = E('div', { 'class': 'cbi-section', 'style': 'margin-top: 25px;' }, [
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;' }, [
				E('h3', { 'style': 'margin: 0;' }, [ _('正在走加速通道的网站'), ' (', String(sites.length), ')' ]),
				E('button', {
					'class': 'btn cbi-button cbi-button-remove',
					'click': function(ev) {
						var btn = ev.target.closest('button');
						btn.disabled = true;
						fs.exec_direct('/usr/bin/xdns-ctl', ['clear-ips']).then(function() {
							ui.addTimeLimitedNotification(null, E('p', _('已清除记住的网站，下次访问会重新学习。')), 3000, 'info');
							location.reload();
						}).catch(function(err) {
							btn.disabled = false;
							ui.addNotification(null, E('p', _('清空失败: %s').format(err.message || err)), 'error');
						});
					}
				}, _('清除记住的网站'))
			]),
			E('p', { 'class': 'cbi-section-descr' }, _('这些网站的访问会进入网络加速通道。网站名来自刚才的 DNS 查询，下面的地址是实际连过去的服务器。过期后需要重新访问才会再出现。')),
			E('style', {}, '#xdns-ips-table .th, #xdns-ips-table .td, #xdns-sessions .th, #xdns-sessions .td { text-align: left !important; }'),
			E('table', { 'class': 'table', 'id': 'xdns-ips-table' }, ipTableRows)
		]);

		function hostOf(endpoint) {
			var s = endpoint || '';
			var i = s.lastIndexOf(':');
			if (i > 0 && /^\d+$/.test(s.slice(i + 1)))
				return s.slice(0, i);
			return s;
		}

		function ageSeconds(text) {
			var m = String(text || '').match(/(\d+)\s*s/);
			return m ? parseInt(m[1], 10) : 0;
		}

		var sessionGroups = {};
		sessions.forEach(function(s) {
			var who = hostOf(s.client) || _('未知设备');
			var tip = hostOf(s.target);
			var site = s.site || nameByIp[tip] || '';
			var key = who + '\n' + (site || tip || '-');
			var age = ageSeconds(s.lastSeen);
			if (!sessionGroups[key]) {
				sessionGroups[key] = { who: who, site: site, tip: tip, conns: 0, age: age, lastSeen: s.lastSeen || '', bytes: 0, rate: 0 };
			}
			var g = sessionGroups[key];
			g.conns++;
			g.bytes += parseInt(s.bytes, 10) || 0;
			g.rate += parseInt(s.rate, 10) || 0;
			if (age < g.age) {
				g.age = age;
				g.lastSeen = s.lastSeen || '';
			}
		});
		var sessionRows = Object.keys(sessionGroups).map(function(k) { return sessionGroups[k]; });
		sessionRows.sort(function(a, b) { return a.age - b.age; });
		var sessionLimit = 20;
		var sessionShown = sessionRows.slice(0, sessionLimit);
		var sessionHidden = sessionRows.length - sessionShown.length;

		var sessionTableRows = [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th left', 'style': 'text-align:left' }, _('谁在访问')),
				E('th', { 'class': 'th left', 'style': 'text-align:left' }, _('正在加速的网站')),
				E('th', { 'class': 'th left', 'style': 'text-align:left' }, _('连接数')),
				E('th', { 'class': 'th left', 'style': 'text-align:left' }, _('流量')),
				E('th', { 'class': 'th left', 'style': 'text-align:left' }, _('流速')),
				E('th', { 'class': 'th left', 'style': 'text-align:left' }, _('最近活动'))
			])
		];

		if (sessionRows.length === 0) {
			sessionTableRows.push(E('tr', { 'class': 'tr placeholder' }, [
				E('td', { 'class': 'td left', 'style': 'text-align:left !important', 'colspan': '6' }, E('em', {}, _('当前没有正在加速的连接。网页打开后这里会短暂出现，传输结束就会消失。')))
			]));
		} else {
			sessionShown.forEach(function(g) {
				var siteTitle = g.site || (g.tip ? g.tip : _('还没记到网站名'));
				var siteSub = (!g.site && g.tip) ? E('div', { 'style': 'color: #888; font-size: 12px; margin-top: 2px;' }, _('未关联域名')) : '';
				sessionTableRows.push(E('tr', { 'class': 'tr' }, [
					td(g.who, _('谁在访问')),
					td(E('div', { 'style': 'font-weight:650; font-size:15px; text-align:left !important' }, [
						siteTitle,
						siteSub
					]), _('正在加速的网站')),
					td(String(g.conns), _('连接数')),
					td(formatBytes(g.bytes), _('流量')),
					td(formatRate(g.rate), _('流速')),
					td((g.lastSeen ? (g.lastSeen.indexOf(_('前')) >= 0 ? g.lastSeen : g.lastSeen.replace('ago', '').trim() + ' ' + _('前')) : ''), _('最近活动'))
				]));
			});
			if (sessionHidden > 0) {
				sessionTableRows.push(E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td left', 'style': 'text-align:left !important', 'colspan': '6' },
						_('还有 %s 组连接没有展开，都是更早之前的活动。').format(String(sessionHidden)))
				]));
			}
		}

		var sessionSection = E('div', { 'class': 'cbi-section', 'style': 'margin-top: 25px;' }, [
			E('h3', {}, [ _('此刻正在加速的连接'), ' (', String(sessionRows.length), ')' ]),
			E('p', { 'class': 'cbi-section-descr' }, _('同一台设备访问同一个网站会合并成一行，并显示还有几条连接。连接断开后这一行会消失。')),
			E('table', { 'class': 'table', 'id': 'xdns-sessions' }, sessionTableRows)
		]);

		return E('div', { 'class': 'cbi-section' }, [
			E('div', { 'style': 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 12px;' }, [
					E('h3', { 'style': 'margin: 0;' }, _('服务运行状态')),
					svcBadge
				]),
				E('button', {
					'class': 'btn cbi-button cbi-button-neutral',
					'click': function() { location.reload(); }
				}, [ '🔄 ', _('刷新数据') ])
			]),
			kpiStyle,
			kpiRow,
			sessionSection,
			ipSection
		]);
	},

	renderDomainsTab: function(domainsList, fileContent) {
		var self = this;

		// 1. Quick Add Bar
		var quickAddInput = E('input', {
			'type': 'text',
			'class': 'cbi-input-text',
			'placeholder': _('输入域名，例如 github.com 或 *.huggingface.co'),
			'style': 'width: 340px; margin-right: 8px;'
		});

		var quickAddBtn = E('button', {
			'class': 'btn cbi-button cbi-button-action',
			'click': function(ev) {
				var val = quickAddInput.value.trim();
				if (!val) {
					ui.addNotification(null, E('p', _('请输入有效的域名！')), 'warning');
					return;
				}
				var b = ev.target.closest('button');
				b.disabled = true;
				b.textContent = _('添加中...');

				fs.exec_direct('/usr/bin/xdns-ctl', ['add-domain', val]).then(function() {
					ui.addTimeLimitedNotification(null, E('p', _('域名「%s」已成功加入代理名单并写入内核！').format(val)), 3000, 'info');
					location.reload();
				}).catch(function(err) {
					b.disabled = false;
					b.textContent = _('➕ 添加域名');
					ui.addNotification(null, E('p', _('添加失败: %s').format(err.message || err)), 'error');
				});
			}
		}, [ '➕ ', _('添加域名') ]);

		var searchInput = E('input', {
			'type': 'text',
			'class': 'cbi-input-text',
			'placeholder': _('搜索过滤域名...'),
			'style': 'width: 220px;',
			'input': function(ev) {
				var query = ev.target.value.toLowerCase().trim();
				var table = document.getElementById('xdns-domains-table');
				if (!table) return;
				var trs = table.querySelectorAll('tbody tr.domain-item-row');
				trs.forEach(function(tr) {
					var dName = tr.getAttribute('data-domain') || '';
					if (!query || dName.indexOf(query) !== -1) {
						tr.style.display = '';
					} else {
						tr.style.display = 'none';
					}
				});
			}
		});

		// 2. Domain Table Rows
		var domainTableRows = [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th center', 'style': 'width: 60px;' }, '#'),
				E('th', { 'class': 'th left' }, _('分流代理域名 (Proxy Domain)')),
				E('th', { 'class': 'th left' }, _('FNV1a-64 Hash (内核索引)')),
				E('th', { 'class': 'th center', 'style': 'width: 120px;' }, _('内核状态')),
				E('th', { 'class': 'th center', 'style': 'width: 100px;' }, _('操作'))
			])
		];

		if (domainsList.length === 0) {
			domainTableRows.push(E('tr', { 'class': 'tr placeholder' }, [
				E('td', { 'class': 'td', 'colspan': '5' }, E('em', {}, _('暂无代理域名规则，请在上方的输入框添加或使用批量编辑导入。')))
			]));
		} else {
			domainsList.forEach(function(item, idx) {
				var tr = E('tr', { 'class': 'tr domain-item-row', 'data-domain': item.domain.toLowerCase() }, [
					E('td', { 'class': 'td center' }, String(idx + 1)),
					E('td', { 'class': 'td' }, [
						E('span', { 'style': 'margin-right: 6px;' }, '🌍'),
						E('strong', {}, item.domain)
					]),
					E('td', { 'class': 'td' }, E('code', {}, item.hash)),
					E('td', { 'class': 'td center' }, E('span', {
						'class': 'badge success',
						'style': 'color: #155724; background-color: #d4edda; border: 1px solid #c3e6cb; padding: 2px 8px; border-radius: 3px;'
					}, item.state)),
					E('td', { 'class': 'td center' }, [
						E('button', {
							'class': 'btn cbi-button cbi-button-remove',
							'style': 'padding: 2px 8px; font-size: 85%;',
							'click': function(ev) {
								if (!confirm(_('确定从代理名单中彻底移除域名「%s」？').format(item.domain)))
									return;
								var b = ev.target.closest('button');
								b.disabled = true;
								fs.exec_direct('/usr/bin/xdns-ctl', ['del-domain', item.domain]).then(function() {
									ui.addTimeLimitedNotification(null, E('p', _('域名「%s」已成功从内核与规则文件中删除！').format(item.domain)), 3000, 'info');
									location.reload();
								}).catch(function(err) {
									b.disabled = false;
									ui.addNotification(null, E('p', _('删除失败: %s').format(err.message || err)), 'error');
								});
							}
						}, [ '🗑️ ', _('删除') ])
					])
				]);
				domainTableRows.push(tr);
			});
		}

		// 3. Batch Editor Textarea
		var textarea = E('textarea', {
			'class': 'cbi-input-textarea',
			'rows': 14,
			'style': 'width: 100%; font-family: monospace; font-size: 13px; line-height: 1.5; padding: 8px;'
		}, fileContent || '');

		var batchSaveBtn = E('button', {
			'class': 'btn cbi-button cbi-button-save',
			'style': 'margin-top: 10px; font-weight: bold;',
			'click': function(ev) {
				var content = textarea.value;
				var b = ev.target.closest('button');
				b.disabled = true;
				b.textContent = _('保存并重载中...');

				// 1. Write to /etc/xdns/proxy_domains.txt
				fs.write('/etc/xdns/proxy_domains.txt', content).then(function() {
					// 2. Call xdns-ctl reload-domains to reload kernel map
					return fs.exec_direct('/usr/bin/xdns-ctl', ['reload-domains']);
				}).then(function() {
					ui.addTimeLimitedNotification(null, E('p', _('规则已成功保存并原子重载至内核 eBPF 模块！')), 3000, 'info');
					location.reload();
				}).catch(function(err) {
					b.disabled = false;
					b.textContent = _('💾 保存并重载 eBPF 规则');
					ui.addNotification(null, E('p', _('保存重载失败: %s').format(err.message || err)), 'error');
				});
			}
		}, [ '💾 ', _('保存并重载 eBPF 规则') ]);

		return E('div', {}, [
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, [ _('📋 规则表格化管理'), ' (', String(domainsList.length), ')' ]),
				E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;' }, [
					E('div', { 'style': 'display: flex; align-items: center;' }, [ quickAddInput, quickAddBtn ]),
					E('div', {}, [ searchInput ])
				]),
				E('table', { 'class': 'table', 'id': 'xdns-domains-table' }, domainTableRows)
			]),

			E('div', { 'class': 'cbi-section', 'style': 'margin-top: 30px;' }, [
				E('h3', {}, _('📝 批量文本编辑器 (/etc/xdns/proxy_domains.txt)')),
				E('p', { 'class': 'cbi-section-descr' }, [
					_('在此可直接批量粘贴或编辑分流域名规则。每行输入一个域名，支持泛域名通配（如 *.github.com 会自动处理为顶级域匹配），支持使用 # 注释。保存时将直接覆盖并原子重载至内核态。')
				]),
				textarea,
				E('div', { 'style': 'display: flex; justify-content: flex-end;' }, [ batchSaveBtn ])
			])
		]);
	},

	renderIpsTab: function(ipsList, staticIpsContent) {
		var self = this;

		// 1. Quick Add IP Bar
		var quickAddIpInput = E('input', {
			'type': 'text',
			'class': 'cbi-input-text',
			'placeholder': _('输入 IPv4 地址，例如 8.8.8.8 或 104.21.5.12'),
			'style': 'width: 320px; margin-right: 8px;'
		});

		var quickAddTtlInput = E('input', {
			'type': 'text',
			'class': 'cbi-input-text',
			'placeholder': _('TTL秒数 (留空为永久)'),
			'style': 'width: 160px; margin-right: 8px;'
		});

		var quickAddBtn = E('button', {
			'class': 'btn cbi-button cbi-button-action',
			'click': function(ev) {
				var ipVal = quickAddIpInput.value.trim();
				var ttlVal = quickAddTtlInput.value.trim();
				if (!isIpv4(ipVal)) {
					ui.addNotification(null, E('p', _('请输入有效的 IPv4 地址！')), 'warning');
					return;
				}
				var b = ev.target.closest('button');
				b.disabled = true;
				b.textContent = _('添加中...');

				var args = ['add-ip', ipVal, (ttlVal && /^\d+$/.test(ttlVal)) ? ttlVal : '0', '/etc/xdns/static_ips.txt'];

				fs.exec_direct('/usr/bin/xdns-ctl', args).then(function() {
					ui.addTimeLimitedNotification(null, E('p', _('重定向 IP「%s」已成功加入内核 eBPF 重定向表！').format(ipVal)), 3000, 'info');
					location.reload();
				}).catch(function(err) {
					b.disabled = false;
					b.textContent = _('➕ 添加重定向 IP');
					ui.addNotification(null, E('p', _('添加失败: %s').format(err.message || err)), 'error');
				});
			}
		}, [ '➕ ', _('添加重定向 IP') ]);

		var searchInput = E('input', {
			'type': 'text',
			'class': 'cbi-input-text',
			'placeholder': _('搜索过滤 IP...'),
			'style': 'width: 220px;',
			'input': function(ev) {
				var query = ev.target.value.toLowerCase().trim();
				var table = document.getElementById('xdns-static-ips-table');
				if (!table) return;
				var trs = table.querySelectorAll('tbody tr.ip-item-row');
				trs.forEach(function(tr) {
					var ipName = tr.getAttribute('data-ip') || '';
					if (!query || ipName.indexOf(query) !== -1) {
						tr.style.display = '';
					} else {
						tr.style.display = 'none';
					}
				});
			}
		});

		// Parse static IPs from static_ips.txt and cross-check with ipsList
		var staticIpsList = [];
		var seen = {};
		if (staticIpsContent) {
			var lines = staticIpsContent.split('\n');
			for (var i = 0; i < lines.length; i++) {
				var line = lines[i].trim();
				if (!line || line.indexOf('#') === 0) continue;
				var parts = line.split(/\s+/);
				var ip = parts[0];
				if (isIpv4(ip)) {
					staticIpsList.push({
						ip: ip,
						type: '静态持久化',
						expires: 'permanent',
						conns: '0',
						bytes: '0'
					});
					seen[ip] = true;
				}
			}
		}

		// Also check ipsList for any static IPs in kernel map that might have been added dynamically
		(ipsList || []).forEach(function(item) {
			if (item.domain === '[static]' && !seen[item.ip]) {
				staticIpsList.push({
					ip: item.ip,
					type: '内核临时/动态',
					expires: item.expires || 'permanent',
					conns: item.conns || '0',
					bytes: item.bytes || '0'
				});
				seen[item.ip] = true;
			} else if (seen[item.ip]) {
				for (var j = 0; j < staticIpsList.length; j++) {
					if (staticIpsList[j].ip === item.ip) {
						staticIpsList[j].conns = item.conns || '0';
						staticIpsList[j].bytes = item.bytes || '0';
						if (staticIpsList[j].type !== '静态持久化') {
							staticIpsList[j].expires = item.expires || 'permanent';
						}
						break;
					}
				}
			}
		});

		// 2. IP Table Rows
		var ipTableRows = [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th center', 'style': 'width: 60px;' }, '#'),
				E('th', { 'class': 'th left' }, _('重定向 IPv4 地址')),
				E('th', { 'class': 'th center', 'style': 'width: 140px;' }, _('生效状态')),
				E('th', { 'class': 'th center', 'style': 'width: 120px;' }, _('剩余有效期')),
				E('th', { 'class': 'th left', 'style': 'width: 140px;' }, _('加速流量')),
				E('th', { 'class': 'th center', 'style': 'width: 100px;' }, _('操作'))
			])
		];

		if (staticIpsList.length === 0) {
			ipTableRows.push(E('tr', { 'class': 'tr placeholder' }, [
				E('td', { 'class': 'td', 'colspan': '6' }, E('em', {}, _('暂无静态重定向 IP 规则，可在上方添加特定 IP 或使用批量编辑配置。')))
			]));
		} else {
			staticIpsList.forEach(function(item, idx) {
				var isPermanent = (item.type === '静态持久化');
				var badgeStyle = isPermanent
					? 'color: #155724; background-color: #d4edda; border: 1px solid #c3e6cb; padding: 2px 8px; border-radius: 3px;'
					: 'color: #856404; background-color: #fff3cd; border: 1px solid #ffeeba; padding: 2px 8px; border-radius: 3px;';
				var tr = E('tr', { 'class': 'tr ip-item-row', 'data-ip': item.ip.toLowerCase() }, [
					E('td', { 'class': 'td center' }, String(idx + 1)),
					E('td', { 'class': 'td' }, [
						E('span', { 'style': 'margin-right: 6px;' }, '🎯'),
						E('strong', {}, item.ip)
					]),
					E('td', { 'class': 'td center' }, E('span', {
						'class': 'badge',
						'style': badgeStyle
					}, item.type || _('活跃'))),
					E('td', { 'class': 'td center' }, rememberText(item.expires)),
					E('td', { 'class': 'td' }, formatBytes(item.bytes)),
					E('td', { 'class': 'td center' }, [
						E('button', {
							'class': 'btn cbi-button cbi-button-remove',
							'style': 'padding: 2px 8px; font-size: 85%;',
							'click': function(ev) {
								if (!confirm(_('确定从内核重定向表及规则文件中移除 IP「%s」？').format(item.ip)))
									return;
								var b = ev.target.closest('button');
								b.disabled = true;
								fs.exec_direct('/usr/bin/xdns-ctl', ['del-ip', item.ip, '/etc/xdns/static_ips.txt']).then(function() {
									ui.addTimeLimitedNotification(null, E('p', _('IP「%s」已成功从内核及规则文件中删除！').format(item.ip)), 3000, 'info');
									location.reload();
								}).catch(function(err) {
									b.disabled = false;
									ui.addNotification(null, E('p', _('删除失败: %s').format(err.message || err)), 'error');
								});
							}
						}, [ '🗑️ ', _('删除') ])
					])
				]);
				ipTableRows.push(tr);
			});
		}

		// 3. Batch Editor Textarea
		var textarea = E('textarea', {
			'class': 'cbi-input-textarea',
			'rows': 12,
			'style': 'width: 100%; font-family: monospace; font-size: 13px; line-height: 1.5; padding: 8px;'
		}, staticIpsContent || '');

		var batchSaveBtn = E('button', {
			'class': 'btn cbi-button cbi-button-save',
			'style': 'margin-top: 10px; font-weight: bold;',
			'click': function(ev) {
				var content = textarea.value;
				var b = ev.target.closest('button');
				b.disabled = true;
				b.textContent = _('保存并重载中...');

				// 1. Write to /etc/xdns/static_ips.txt
				fs.write('/etc/xdns/static_ips.txt', content).then(function() {
					// 2. Call xdns-ctl load-ips to load and sync into kernel
					return fs.exec_direct('/usr/bin/xdns-ctl', ['load-ips', '/etc/xdns/static_ips.txt']);
				}).then(function() {
					ui.addTimeLimitedNotification(null, E('p', _('静态 IP 规则已成功保存并同步至内核 eBPF 模块！')), 3000, 'info');
					location.reload();
				}).catch(function(err) {
					b.disabled = false;
					b.textContent = _('💾 保存并加载至内核');
					ui.addNotification(null, E('p', _('保存重载失败: %s').format(err.message || err)), 'error');
				});
			}
		}, [ '💾 ', _('保存并加载至内核') ]);

		return E('div', {}, [
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, [ _('🎯 静态重定向 IP 管理'), ' (', String(staticIpsList.length), ')' ]),
				E('p', { 'class': 'cbi-section-descr' }, [
					_('直接将指定的 IPv4 地址写入内核 eBPF 重定向表 (xdns_ip_set)。访问这些目标 IP 的 TCP SYN 流量将直接通过加速隧道转发，无需等待 DNS 动态解析，适合特定 IP 连通性测试与纯 IP 业务场景。')
				]),
				E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;' }, [
					E('div', { 'style': 'display: flex; align-items: center;' }, [ quickAddIpInput, quickAddTtlInput, quickAddBtn ]),
					E('div', {}, [ searchInput ])
				]),
				E('table', { 'class': 'table', 'id': 'xdns-static-ips-table' }, ipTableRows)
			]),

			E('div', { 'class': 'cbi-section', 'style': 'margin-top: 30px;' }, [
				E('h3', {}, _('📝 静态 IP 规则文件编辑 (/etc/xdns/static_ips.txt)')),
				E('p', { 'class': 'cbi-section-descr' }, [
					_('在此可直接批量粘贴或编辑静态重定向 IPv4 列表。每行输入一个 IP 地址，支持使用 # 注释。保存时将写入配置文件并同步加载至内核。')
				]),
				textarea,
				E('div', { 'style': 'display: flex; justify-content: flex-end;' }, [ batchSaveBtn ])
			])
		]);
	},

	render: function(data) {
		var self = this;
		var statusText = data[2] || '';
		var statsText = data[3] || '';
		var domainsText = data[4] || '';
		var ipsText = data[5] || '';
		var sessionsText = data[6] || '';
		var fileContent = data[7] || '';
		var staticIpsContent = data[8] || '';

		var domainsList = parseDomains(domainsText);
		var ipsList = parseIps(ipsText);

		// Build Settings Form Map
		var m = new form.Map('xdns', _('xDNS 智能分流设置'),
			_('基于 eBPF 的高性能 DNS 截获解析与专属流量透明智能分流系统。'));

		var s = m.section(form.TypedSection, 'xdns', _('基础服务参数配置'));
		s.anonymous = true;
		s.addremove = false;

		var o;

		// Enabled
		o = s.option(form.Flag, 'enabled', _('启用 xDNS 分流服务'));
		o.rmempty = false;
		o.default = '1';

		// Ifname
		o = s.option(form.Value, 'ifname', _('监听网卡接口 (Interface)'),
			_('eBPF 程序加载的内网网络接口，通常为 br-lan'));
		o.default = 'br-lan';
		o.rmempty = false;

		// xkcp_dns
		o = s.option(form.Value, 'xkcp_dns', _('上游加密/防污染 DNS 监听地址'),
			_('命中分流域名的 DNS 查询将被 eBPF 透明重定向至此地址进行安全解析（如 xkcptun 的 UDP 监听端口 192.168.8.1:5353）'));
		o.default = '192.168.8.1:5353';
		o.rmempty = false;

		// xkcp_tcp
		o = s.option(form.Value, 'xkcp_tcp', _('透明代理 TCP 重定向目标地址'),
			_('匹配自学习目标 IP 的业务 TCP 流量将被 eBPF 透明重定向至此地址（如 xkcptun 的 TCP 监听端口 192.168.8.1:12345）'));
		o.default = '192.168.8.1:12345';
		o.rmempty = false;

		// proxy_domains_file
		o = s.option(form.Value, 'proxy_domains_file', _('分流规则文件路径'),
			_('持久化存储分流域名的本地文件路径'));
		o.default = '/etc/xdns/proxy_domains.txt';
		o.rmempty = false;

		// static_ips_file
		o = s.option(form.Value, 'static_ips_file', _('静态 IP 规则文件路径'),
			_('持久化存储静态重定向 IP 的本地文件路径'));
		o.default = '/etc/xdns/static_ips.txt';
		o.rmempty = false;

		// Render Form section container
		var settingsContainer = E('div', {}, []);

		return m.render().then(function(formNode) {
			settingsContainer.appendChild(formNode);

			// Tabs Container
			var tabsContainer = E('div', {}, [
				E('div', { 'class': 'cbi-section', 'data-tab': 'status', 'data-tab-title': _('运行状态与统计'), 'data-tab-active': 'true' }, [
					self.renderStatusTab(statusText, statsText, ipsText, sessionsText, domainsList.length)
				]),
				E('div', { 'class': 'cbi-section', 'data-tab': 'domains', 'data-tab-title': _('分流域名规则管治') }, [
					self.renderDomainsTab(domainsList, fileContent)
				]),
				E('div', { 'class': 'cbi-section', 'data-tab': 'ips', 'data-tab-title': _('静态重定向 IP') }, [
					self.renderIpsTab(ipsList, staticIpsContent)
				]),
				E('div', { 'class': 'cbi-section', 'data-tab': 'settings', 'data-tab-title': _('基础服务设置') }, [
					settingsContainer
				])
			]);

			var root = E('div', { 'class': 'cbi-map' }, [
				E('h2', {}, _('xDNS 智能分流管理中心')),
				E('p', { 'class': 'cbi-map-descr' }, [
					_('基于 eBPF 的高性能网络流量定向分流引擎。支持与 xDPI 深度联动，实现流量精准识别、一键直加、私人定制分流表与内核级零拷贝快转。')
				]),
				tabsContainer
			]);

			ui.tabs.initTabGroup(tabsContainer.childNodes);

			return root;
		});
	},

	handleSaveApply: function(ev, mode) {
		return this.super('handleSaveApply', [ev, mode]).then(function() {
			return fs.exec_direct('/etc/init.d/xdns', ['restart']);
		});
	}
});
