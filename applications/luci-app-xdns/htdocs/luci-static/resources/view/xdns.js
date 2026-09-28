'use strict';
'require view';
'require dom';
'require ui';
'require form';
'require rpc';
'require uci';
'require fs';
'require poll';

var callServiceList = rpc.declare({
	object: 'service',
	method: 'list',
	params: [ 'name' ],
	expect: { '': {} }
});

function parseStats(statsText) {
	var res = {
		dnsIntercepted: 0,
		dnsProxied: 0,
		dnsLearned: 0,
		tcpProxied: 0
	};
	if (!statsText) return res;

	var m1 = statsText.match(/DNS Queries Intercepted\s*:\s*(\d+)/i);
	if (m1) res.dnsIntercepted = parseInt(m1[1], 10);

	var m2 = statsText.match(/DNS Queries Proxied\s*:\s*(\d+)/i);
	if (m2) res.dnsProxied = parseInt(m2[1], 10);

	var m3 = statsText.match(/DNS Responses Learned\s*:\s*(\d+)/i);
	if (m3) res.dnsLearned = parseInt(m3[1], 10);

	var m4 = statsText.match(/TCP Connections Proxied\s*:\s*(\d+)/i);
	if (m4) res.tcpProxied = parseInt(m4[1], 10);

	return res;
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
		if (!line || line.indexOf('IP Address') === 0 || line.indexOf('----') === 0 || line.indexOf('Total active') === 0)
			continue;

		var parts = line.split(/\s+/);
		if (parts.length >= 1 && parts[0].indexOf('.') !== -1) {
			list.push({
				ip: parts[0],
				expires: parts[1] || '0s'
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
		if (parts.length >= 2) {
			list.push({
				client: parts[0],
				target: parts[1],
				lastSeen: parts[2] || '-'
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
			L.resolveDefault(callServiceList('xdns'), {}),
			L.resolveDefault(fs.exec_direct('/usr/bin/xdns-ctl', ['stats']), ''),
			L.resolveDefault(fs.exec_direct('/usr/bin/xdns-ctl', ['list-domains']), ''),
			L.resolveDefault(fs.exec_direct('/usr/bin/xdns-ctl', ['list-ips']), ''),
			L.resolveDefault(fs.exec_direct('/usr/bin/xdns-ctl', ['list-sessions']), ''),
			L.resolveDefault(fs.read_direct('/etc/xdns/proxy_domains.txt'), '')
		]);
	},

	renderStatusTab: function(svcData, statsText, ipsText, sessionsText, domainsCount) {
		var self = this;
		var stats = parseStats(statsText);
		var ips = parseIps(ipsText);
		var sessions = parseSessions(sessionsText);

		var isRunning = false;
		var pid = null;
		try {
			var inst = svcData && svcData.xdns && svcData.xdns.instances;
			if (inst) {
				for (var k in inst) {
					if (inst[k] && inst[k].running) {
						isRunning = true;
						pid = inst[k].pid;
						break;
					}
				}
			}
		} catch(e) {}

		// Service status badge
		var svcBadge = E('span', {
			'class': 'label ' + (isRunning ? 'success' : 'neutral'),
			'style': 'padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 90%; color: #fff; background-color: ' + (isRunning ? '#28a745' : '#6c757d') + ';'
		}, isRunning ? (_('RUNNING') + (pid ? ' (PID ' + pid + ')' : '')) : _('NOT RUNNING'));

		// KPI Cards
		var kpiRow = E('div', {
			'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 15px 0 25px 0;'
		}, [
			E('div', { 'class': 'cbi-value', 'style': 'background: var(--cbi-section-bg, #f8f9fa); border: 1px solid #ddd; border-radius: 8px; padding: 15px; text-align: center;' }, [
				E('div', { 'style': 'font-size: 13px; color: #666; margin-bottom: 5px;' }, _('拦截 DNS 查询')),
				E('div', { 'style': 'font-size: 26px; font-weight: bold; color: #007bff;' }, String(stats.dnsIntercepted))
			]),
			E('div', { 'class': 'cbi-value', 'style': 'background: var(--cbi-section-bg, #f8f9fa); border: 1px solid #ddd; border-radius: 8px; padding: 15px; text-align: center;' }, [
				E('div', { 'style': 'font-size: 13px; color: #666; margin-bottom: 5px;' }, _('命中代理域名')),
				E('div', { 'style': 'font-size: 26px; font-weight: bold; color: #28a745;' }, String(stats.dnsProxied))
			]),
			E('div', { 'class': 'cbi-value', 'style': 'background: var(--cbi-section-bg, #f8f9fa); border: 1px solid #ddd; border-radius: 8px; padding: 15px; text-align: center;' }, [
				E('div', { 'style': 'font-size: 13px; color: #666; margin-bottom: 5px;' }, _('动态学习目标 IP')),
				E('div', { 'style': 'font-size: 26px; font-weight: bold; color: #fd7e14;' }, String(ips.length))
			]),
			E('div', { 'class': 'cbi-value', 'style': 'background: var(--cbi-section-bg, #f8f9fa); border: 1px solid #ddd; border-radius: 8px; padding: 15px; text-align: center;' }, [
				E('div', { 'style': 'font-size: 13px; color: #666; margin-bottom: 5px;' }, _('内核生效域名数')),
				E('div', { 'style': 'font-size: 26px; font-weight: bold; color: #6f42c1;' }, String(domainsCount))
			]),
			E('div', { 'class': 'cbi-value', 'style': 'background: var(--cbi-section-bg, #f8f9fa); border: 1px solid #ddd; border-radius: 8px; padding: 15px; text-align: center;' }, [
				E('div', { 'style': 'font-size: 13px; color: #666; margin-bottom: 5px;' }, _('代理 TCP 连接数')),
				E('div', { 'style': 'font-size: 26px; font-weight: bold; color: #17a2b8;' }, String(stats.tcpProxied))
			])
		]);

		// Dynamic IP Table
		var ipTableRows = [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th left' }, _('目标 IP 地址 (Dynamic IP)')),
				E('th', { 'class': 'th left' }, _('剩余过期时间 (Expires In)'))
			])
		];

		if (ips.length === 0) {
			ipTableRows.push(E('tr', { 'class': 'tr placeholder' }, [
				E('td', { 'class': 'td', 'colspan': '2' }, E('em', {}, _('当前暂无动态解析的代理目标 IP')))
			]));
		} else {
			ips.forEach(function(item) {
				ipTableRows.push(E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td' }, E('code', { 'style': 'font-size: 110%;' }, item.ip)),
					E('td', { 'class': 'td' }, E('span', { 'class': 'badge' }, item.expires))
				]));
			});
		}

		var ipSection = E('div', { 'class': 'cbi-section', 'style': 'margin-top: 25px;' }, [
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;' }, [
				E('h3', { 'style': 'margin: 0;' }, [ _('⚡ 动态劫持 IP 缓存表 (xdns_ip_set)'), ' (', String(ips.length), ')' ]),
				E('button', {
					'class': 'btn cbi-button cbi-button-remove',
					'click': function(ev) {
						var btn = ev.target.closest('button');
						btn.disabled = true;
						fs.exec_direct('/usr/bin/xdns-ctl', ['clear-ips']).then(function() {
							ui.addTimeLimitedNotification(null, E('p', _('已成功清空内核 xdns_ip_set 缓存！')), 3000, 'info');
							location.reload();
						}).catch(function(err) {
							btn.disabled = false;
							ui.addNotification(null, E('p', _('清空失败: %s').format(err.message || err)), 'error');
						});
					}
				}, [ '🧹 ', _('一键清空 IP 缓存') ])
			]),
			E('p', { 'class': 'cbi-section-descr' }, _('当内网发起针对分流域名的 DNS 查询后，响应的目标 IP 将由 eBPF 内核模块自动学习并注入该哈希表，驱动后续 TCP 连接直通代理隧道。')),
			E('table', { 'class': 'table', 'id': 'xdns-ips-table' }, ipTableRows)
		]);

		// TCP Sessions Table
		var sessionTableRows = [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th left' }, _('客户端地址 (Client Endpoint)')),
				E('th', { 'class': 'th left' }, _('原始目标地址 (Original Target)')),
				E('th', { 'class': 'th left' }, _('最后活跃时间 (Last Seen)'))
			])
		];

		if (sessions.length === 0) {
			sessionTableRows.push(E('tr', { 'class': 'tr placeholder' }, [
				E('td', { 'class': 'td', 'colspan': '3' }, E('em', {}, _('当前暂无活跃的透明 TCP 代理会话')))
			]));
		} else {
			sessions.forEach(function(s) {
				sessionTableRows.push(E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td' }, E('code', {}, s.client)),
					E('td', { 'class': 'td' }, E('code', {}, s.target)),
					E('td', { 'class': 'td' }, s.lastSeen)
				]));
			});
		}

		var sessionSection = E('div', { 'class': 'cbi-section', 'style': 'margin-top: 25px;' }, [
			E('h3', {}, [ _('🔗 活跃透明 TCP 代理会话'), ' (', String(sessions.length), ')' ]),
			E('table', { 'class': 'table' }, sessionTableRows)
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
			kpiRow,
			ipSection,
			sessionSection
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

	render: function(data) {
		var self = this;
		var svcData = data[2] || {};
		var statsText = data[3] || '';
		var domainsText = data[4] || '';
		var ipsText = data[5] || '';
		var sessionsText = data[6] || '';
		var fileContent = data[7] || '';

		var domainsList = parseDomains(domainsText);

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
			_('命中代理域名的 DNS 查询将被透明重定向到此地址进行安全解析，如 127.0.0.1:5353 或 192.168.8.1:5353'));
		o.default = '192.168.8.1:5353';
		o.rmempty = false;

		// xkcp_tcp
		o = s.option(form.Value, 'xkcp_tcp', _('透明代理 TCP 重定向目标地址'),
			_('匹配学习到目标 IP 的业务 TCP 流量将被重定向至此透明代理端口，如 192.168.8.1:12345'));
		o.default = '192.168.8.1:12345';
		o.rmempty = false;

		// proxy_domains_file
		o = s.option(form.Value, 'proxy_domains_file', _('分流规则文件路径'),
			_('持久化存储分流域名的本地文件路径'));
		o.default = '/etc/xdns/proxy_domains.txt';
		o.rmempty = false;

		// Render Form section container
		var settingsContainer = E('div', {}, []);

		return m.render().then(function(formNode) {
			settingsContainer.appendChild(formNode);

			// Tabs Container
			var tabsContainer = E('div', {}, [
				E('div', { 'class': 'cbi-section', 'data-tab': 'status', 'data-tab-title': _('运行状态与统计'), 'data-tab-active': 'true' }, [
					self.renderStatusTab(svcData, statsText, ipsText, sessionsText, domainsList.length)
				]),
				E('div', { 'class': 'cbi-section', 'data-tab': 'domains', 'data-tab-title': _('分流域名规则管治') }, [
					self.renderDomainsTab(domainsList, fileContent)
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
