'use strict';
'require baseclass';
'require fs';
'require network';
'require rpc';
'require uci';

document.head.append(E('style', { 'type': 'text/css' },
	`
.network-info-container {
	background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
	border-radius: 12px;
	padding: 20px;
	margin: 16px 0;
	border: 1px solid rgba(255,255,255,0.15);
	box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
:root[data-darkmode="true"] .network-info-container {
	background: linear-gradient(135deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 100%);
	border-color: rgba(255,255,255,0.1);
	box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
.network-section-title {
	font-size: 18px;
	font-weight: 600;
	color: #495057;
	margin-bottom: 16px;
	display: flex;
	align-items: center;
	border-bottom: 2px solid rgba(0,123,255,0.2);
	padding-bottom: 8px;
}
:root[data-darkmode="true"] .network-section-title {
	color: #adb5bd;
}
.network-section-title::before {
	margin-right: 8px;
	font-size: 20px;
}
.network-section-title.internet::before {
	content: "🌐";
}
.network-section-title.connections::before {
	content: "🔗";
}
.network-section-title.interfaces::before {
	content: "🔌";
}
.network-connections-table {
	width: 100%;
	border-collapse: separate;
	border-spacing: 0;
	background: transparent;
}
.network-connections-row {
	transition: all 0.2s ease;
}
.network-connections-row:hover {
	background: rgba(0,123,255,0.05);
	transform: translateX(2px);
}
:root[data-darkmode="true"] .network-connections-row:hover {
	background: rgba(0,123,255,0.1);
}
.network-connections-label {
	padding: 12px 16px;
	font-weight: 600;
	color: #495057;
	background: rgba(108,117,125,0.1);
	border-right: 3px solid #007bff;
	border-radius: 6px 0 0 6px;
	width: 35%;
	position: relative;
}
:root[data-darkmode="true"] .network-connections-label {
	color: #adb5bd;
	background: rgba(108,117,125,0.2);
}
.network-connections-label::before {
	content: "";
	position: absolute;
	left: 8px;
	top: 50%;
	transform: translateY(-50%);
	width: 4px;
	height: 4px;
	background: #007bff;
	border-radius: 50%;
}
.network-connections-value {
	padding: 12px 16px;
	color: #212529;
	background: rgba(255,255,255,0.7);
	border-radius: 0 6px 6px 0;
}
:root[data-darkmode="true"] .network-connections-value {
	color: #f8f9fa;
	background: rgba(255,255,255,0.05);
}
.network-progressbar {
	background: rgba(108,117,125,0.2);
	border-radius: 8px;
	height: 20px;
	overflow: hidden;
	position: relative;
}
.network-progressbar-fill {
	height: 100%;
	background: linear-gradient(90deg, #007bff 0%, #0056b3 100%);
	border-radius: 8px;
	transition: width 0.3s ease;
}
.network-progressbar-text {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	color: white;
	font-size: 12px;
	font-weight: 600;
	text-shadow: 0 1px 2px rgba(0,0,0,0.5);
	z-index: 1;
}
.network-interfaces-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 16px;
	margin-top: 16px;
}
.network-interface-card {
	background: rgba(255,255,255,0.8);
	border-radius: 12px;
	padding: 16px;
	border: 2px solid transparent;
	transition: all 0.3s ease;
}
:root[data-darkmode="true"] .network-interface-card {
	background: rgba(255,255,255,0.05);
}
.network-interface-card:hover {
	transform: translateY(-2px);
	box-shadow: 0 8px 20px rgba(0,0,0,0.15);
	border-color: rgba(0,123,255,0.3);
}
.network-interface-card.active {
	border-color: #28a745;
	background: linear-gradient(135deg, rgba(40,167,69,0.1) 0%, rgba(255,255,255,0.8) 100%);
}
:root[data-darkmode="true"] .network-interface-card.active {
	background: linear-gradient(135deg, rgba(40,167,69,0.2) 0%, rgba(255,255,255,0.05) 100%);
}
.network-interface-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 12px;
	padding-bottom: 8px;
	border-bottom: 1px solid rgba(0,0,0,0.1);
}
:root[data-darkmode="true"] .network-interface-header {
	border-bottom-color: rgba(255,255,255,0.1);
}
.network-interface-title {
	font-weight: 700;
	font-size: 16px;
	color: #212529;
}
:root[data-darkmode="true"] .network-interface-title {
	color: #f8f9fa;
}
.network-interface-status {
	width: 20px;
	height: 20px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 10px;
	font-weight: bold;
	color: white;
}
.network-interface-status.active {
	background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
	box-shadow: 0 2px 4px rgba(40,167,69,0.3);
}
.network-interface-status.inactive {
	background: linear-gradient(135deg, #6c757d 0%, #95a5a6 100%);
	box-shadow: 0 2px 4px rgba(108,117,125,0.3);
}
.network-interface-info {
	font-size: 13px;
	line-height: 1.4;
}
.network-interface-info .info-item {
	display: flex;
	justify-content: space-between;
	margin-bottom: 4px;
	padding: 2px 0;
}
.network-interface-info .info-label {
	font-weight: 500;
	color: #6c757d;
}
:root[data-darkmode="true"] .network-interface-info .info-label {
	color: #adb5bd;
}
.network-interface-info .info-value {
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	color: #212529;
}
:root[data-darkmode="true"] .network-interface-info .info-value {
	color: #f8f9fa;
}
.internet-status-badges {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	margin-bottom: 16px;
}
.internet-status-badge {
	display: inline-block;
	padding: 8px 16px;
	border-radius: 8px;
	font-weight: 600;
	font-size: 14px;
	transition: all 0.3s ease;
	cursor: default;
	min-width: 160px;
	text-align: left;
	position: relative;
}
.internet-status-badge::before {
	content: "●";
	margin-right: 6px;
	font-size: 1.2em;
}
.internet-status-badge.connected {
	background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
	border: 2px solid #1e7e34;
	color: #ffffff;
	text-shadow: 0 1px 2px rgba(0,0,0,0.3);
	box-shadow: 0 2px 4px rgba(40, 167, 69, 0.3);
}
.internet-status-badge.disconnected {
	background: linear-gradient(135deg, #dc3545 0%, #e74c3c 100%);
	border: 2px solid #bd2130;
	color: #ffffff;
	text-shadow: 0 1px 2px rgba(0,0,0,0.3);
	box-shadow: 0 2px 4px rgba(220, 53, 69, 0.3);
}
.internet-status-badge.undefined {
	background: linear-gradient(135deg, #6c757d 0%, #95a5a6 100%);
	border: 2px solid #545b62;
	color: #ffffff;
	text-shadow: 0 1px 2px rgba(0,0,0,0.3);
	box-shadow: 0 2px 4px rgba(108, 117, 125, 0.3);
}
.internet-status-badge.undefined.spinning {
	animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
	0% { opacity: 1; }
	50% { opacity: 0.7; }
	100% { opacity: 1; }
}
.internet-ip-badge {
	background: rgba(108, 117, 125, 0.1);
	border: 1px solid rgba(108, 117, 125, 0.3);
	color: #495057;
	padding: 8px 16px;
	border-radius: 8px;
	font-weight: 500;
	font-size: 13px;
	min-width: 180px;
}
:root[data-darkmode="true"] .internet-ip-badge {
	background: rgba(108, 117, 125, 0.2);
	border-color: rgba(108, 117, 125, 0.4);
	color: #adb5bd;
}
`));

function progressbar(value, max, byte) {
	var vn = parseInt(value) || 0,
	    mn = parseInt(max) || 100,
	    fv = byte ? String.format('%1024.2mB', value) : value,
	    fm = byte ? String.format('%1024.2mB', max) : max,
	    pc = Math.floor((100 / mn) * vn);

	return E('div', {
		'class': 'network-progressbar',
		'title': '%s / %s (%d%%)'.format(fv, fm, pc)
	}, [
		E('div', { 
			'class': 'network-progressbar-fill',
			'style': 'width:%.2f%%'.format(pc) 
		}),
		E('div', { 'class': 'network-progressbar-text' }, '%s / %s'.format(fv, fm))
	]);
}

function renderBadge(icon, iconTitle, label, value, label2, value2) {
	return E('div', { 'style': 'display: flex; align-items: center; margin-top: 8px;' }, [
		icon ? E('img', { 'src': icon, 'title': iconTitle || '', 'style': 'width: 16px; height: 16px; margin-right: 8px;' }) : null,
		E('div', { 'style': 'font-size: 12px; line-height: 1.3;' }, [
			E('div', {}, [
				E('strong', {}, label + ': '),
				E('span', {}, value || '-')
			]),
			label2 ? E('div', {}, [
				E('strong', {}, label2 + ': '),
				E('span', {}, value2 || '-')
			]) : null
		])
	]);
}

function renderInterfaceCard(ifc, ipv6) {
	var dev = ifc.getL3Device(),
	    active = (dev && ifc.getProtocol() != 'none'),
	    addrs = (ipv6 ? ifc.getIP6Addrs() : ifc.getIPAddrs()) || [],
	    dnssrv = (ipv6 ? ifc.getDNS6Addrs() : ifc.getDNSAddrs()) || [],
	    expires = ifc.getExpiry(),
	    uptime = ifc.getUptime();

	var cardClass = 'network-interface-card';
	if (active) cardClass += ' active';

	return E('div', { 'class': cardClass }, [
		E('div', { 'class': 'network-interface-header' }, [
			E('div', { 'class': 'network-interface-title' }, 
				ipv6 ? _('IPv6 Upstream') : _('IPv4 Upstream')),
			E('div', { 
				'class': 'network-interface-status ' + (active ? 'active' : 'inactive'),
				'title': active ? _('Active') : _('Inactive')
			}, active ? '✓' : '✗')
		]),
		E('div', { 'class': 'network-interface-info' }, [
			E('div', { 'class': 'info-item' }, [
				E('span', { 'class': 'info-label' }, _('Protocol')),
				E('span', { 'class': 'info-value' }, ifc.getI18n() || _('Not connected'))
			]),
			addrs.length > 0 ? E('div', { 'class': 'info-item' }, [
				E('span', { 'class': 'info-label' }, _('Address')),
				E('span', { 'class': 'info-value' }, addrs.join(', '))
			]) : null,
			E('div', { 'class': 'info-item' }, [
				E('span', { 'class': 'info-label' }, _('Gateway')),
				E('span', { 'class': 'info-value' }, 
					ipv6 ? (ifc.getGateway6Addr() || '::') : (ifc.getGatewayAddr() || '0.0.0.0'))
			]),
			dnssrv.length > 0 ? E('div', { 'class': 'info-item' }, [
				E('span', { 'class': 'info-label' }, _('DNS')),
				E('span', { 'class': 'info-value' }, dnssrv.join(', '))
			]) : null,
			uptime > 0 ? E('div', { 'class': 'info-item' }, [
				E('span', { 'class': 'info-label' }, _('Uptime')),
				E('span', { 'class': 'info-value' }, '%t'.format(uptime))
			]) : null,
			renderBadge(
				L.resource('icons/%s.svg').format(dev ? dev.getType() : 'ethernet_disabled'), 
				null,
				_('Device'), dev ? dev.getI18n() : '-',
				_('MAC'), dev ? dev.getMAC() : '-'
			)
		])
	]);
}

return baseclass.extend({
	title: _('Network'),
	appName: 'internet-detector',
	currentAppMode: null,
	inetStatus: null,

	callUIPoll: rpc.declare({
		object: 'luci.internet-detector',
		method: 'UIPoll',
		expect: { '': {} }
	}),

	callInetStatus: rpc.declare({
		object: 'luci.internet-detector',
		method: 'InetStatus',
		expect: { '': {} }
	}),

	async getInternetStatus() {
		if (!this.currentAppMode) {
			try {
				await uci.load(this.appName);
				this.currentAppMode = uci.get(this.appName, 'config', 'mode');
			} catch (e) {
				this.currentAppMode = '0';
			}
		}

		if (this.currentAppMode === '2') {
			return L.resolveDefault(this.callUIPoll(), null);
		} else if (this.currentAppMode === '1') {
			return L.resolveDefault(this.callInetStatus(), null);
		}
		return null;
	},

	load: function() {
		return Promise.all([
			fs.trimmed('/proc/sys/net/netfilter/nf_conntrack_count'),
			fs.trimmed('/proc/sys/net/netfilter/nf_conntrack_max'),
			network.getWANNetworks(),
			network.getWAN6Networks(),
			this.getInternetStatus()
		]);
	},

	renderInternetStatus: function(internetData) {
		if (this.currentAppMode === '0' || !internetData) {
			return null;
		}

		var statusBadges = E('div', { 'class': 'internet-status-badges' });

		if (!internetData.instances || internetData.instances.length === 0) {
			var badge = E('span', { 'class': 'internet-status-badge undefined' }, _('Undefined'));
			if (this.currentAppMode === '2') {
				badge.classList.add('spinning');
			}
			statusBadges.appendChild(badge);
		} else {
			internetData.instances.sort((a, b) => a.num > b.num);

			for (let instance of internetData.instances) {
				let status = _('Disconnected');
				let badgeClass = 'internet-status-badge disconnected';
				
				if (instance.inet == 0) {
					status = _('Connected');
					badgeClass = 'internet-status-badge connected';
				} else if (instance.inet == -1) {
					status = _('Undefined');
					badgeClass = 'internet-status-badge undefined spinning';
				}

				// 状态标签
				let statusBadge = E('span', {
					'class': badgeClass,
					'title': '%s: %s'.format(instance.instance, status)
				});
				statusBadge.textContent = '%s: %s'.format(instance.instance, status);
				statusBadges.appendChild(statusBadge);

				// 公网IP标签
				if (instance.mod_public_ip !== undefined) {
					let ipText = (instance.mod_public_ip === '') ? _('Undefined') : instance.mod_public_ip;
					let ipBadge = E('span', {
						'class': 'internet-ip-badge',
						'title': '%s: %s'.format(_('Public IP'), ipText)
					});
					ipBadge.textContent = '%s: %s'.format(_('Public IP'), ipText);
					statusBadges.appendChild(ipBadge);
				}
			}
		}

		return statusBadges;
	},

	render: function(data) {
		var ct_count = +data[0],
		    ct_max = +data[1],
		    wan_nets = data[2],
		    wan6_nets = data[3],
		    internetData = data[4];

		var container = E('div', { 'class': 'network-info-container' });

		// 互联网状态部分
		var internetStatus = this.renderInternetStatus(internetData);
		if (internetStatus) {
			container.appendChild(E('div', { 'class': 'network-section-title internet' }, _('Internet Status')));
			container.appendChild(internetStatus);
		}

		// 网络接口部分
		if (wan_nets.length > 0 || wan6_nets.length > 0) {
			container.appendChild(E('div', { 'class': 'network-section-title interfaces' }, _('Network Interfaces')));
			
			var interfacesGrid = E('div', { 'class': 'network-interfaces-grid' });
			
			for (var i = 0; i < wan_nets.length; i++) {
				interfacesGrid.appendChild(renderInterfaceCard(wan_nets[i], false));
			}
			
			for (var i = 0; i < wan6_nets.length; i++) {
				interfacesGrid.appendChild(renderInterfaceCard(wan6_nets[i], true));
			}
			
			container.appendChild(interfacesGrid);
		}

		// 连接统计部分
		if (ct_max) {
			container.appendChild(E('div', { 'class': 'network-section-title connections' }, _('Active Connections')));
			
			var connectionsTable = E('table', { 'class': 'network-connections-table' });
			connectionsTable.appendChild(E('tr', { 'class': 'network-connections-row' }, [
				E('td', { 'class': 'network-connections-label' }, _('Active Connections')),
				E('td', { 'class': 'network-connections-value' }, [
					progressbar(ct_count, ct_max)
				])
			]));
			
			container.appendChild(connectionsTable);
		}

		return container;
	}
});
