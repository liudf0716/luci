'use strict';
'require baseclass';
'require dom';
'require network';
'require uci';
'require fs';
'require rpc';
'require firewall';

document.head.append(E('style', { 'type': 'text/css' },
	`
.wifi-info-container {
	background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
	border-radius: 12px;
	padding: 20px;
	margin: 16px 0;
	border: 1px solid rgba(255,255,255,0.15);
	box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
:root[data-darkmode="true"] .wifi-info-container {
	background: linear-gradient(135deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 100%);
	border-color: rgba(255,255,255,0.1);
	box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
.wifi-section-title {
	font-size: 18px;
	font-weight: 600;
	color: #495057;
	margin-bottom: 16px;
	display: flex;
	align-items: center;
	border-bottom: 2px solid rgba(0,123,255,0.2);
	padding-bottom: 8px;
}
:root[data-darkmode="true"] .wifi-section-title {
	color: #adb5bd;
}
.wifi-section-title::before {
	margin-right: 8px;
	font-size: 20px;
	content: "📶";
}
.wifi-devices-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
	gap: 20px;
	margin-bottom: 24px;
}
.wifi-device-card {
	background: white;
	border-radius: 12px;
	overflow: hidden;
	box-shadow: 0 2px 8px rgba(0,0,0,0.08);
	transition: all 0.3s ease;
}
:root[data-darkmode="true"] .wifi-device-card {
	background: rgba(33, 37, 41, 0.8);
	box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
.wifi-device-card:hover {
	transform: translateY(-2px);
	box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}
:root[data-darkmode="true"] .wifi-device-card:hover {
	box-shadow: 0 4px 16px rgba(0,0,0,0.3);
}
.wifi-device-header {
	background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
	color: white;
	padding: 16px 20px;
	font-weight: 600;
	font-size: 16px;
	position: relative;
}
.wifi-device-header.inactive {
	background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
}
.wifi-device-header::after {
	content: "";
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	height: 2px;
	background: linear-gradient(90deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%);
}
.wifi-device-body {
	padding: 20px;
}
.wifi-device-info {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
	gap: 12px;
	margin-bottom: 16px;
}
.wifi-info-item {
	text-align: center;
	padding: 8px;
	background: rgba(248, 249, 250, 0.8);
	border-radius: 6px;
	border-left: 3px solid #007bff;
}
:root[data-darkmode="true"] .wifi-info-item {
	background: rgba(52, 58, 64, 0.6);
}
.wifi-info-label {
	font-size: 11px;
	color: #6c757d;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	margin-bottom: 4px;
}
:root[data-darkmode="true"] .wifi-info-label {
	color: #adb5bd;
}
.wifi-info-value {
	font-size: 14px;
	font-weight: 600;
	color: #495057;
}
:root[data-darkmode="true"] .wifi-info-value {
	color: #ffffff;
}
.wifi-networks-container {
	margin-top: 16px;
}
.wifi-network-badge {
	display: flex;
	align-items: center;
	background: rgba(0,123,255,0.1);
	border: 1px solid rgba(0,123,255,0.2);
	border-radius: 8px;
	padding: 12px;
	margin-bottom: 8px;
	transition: all 0.2s ease;
}
:root[data-darkmode="true"] .wifi-network-badge {
	background: rgba(0,123,255,0.15);
	border-color: rgba(0,123,255,0.3);
}
.wifi-network-badge:hover {
	background: rgba(0,123,255,0.15);
	border-color: rgba(0,123,255,0.3);
}
:root[data-darkmode="true"] .wifi-network-badge:hover {
	background: rgba(0,123,255,0.25);
}
.wifi-signal-icon {
	width: 24px;
	height: 24px;
	margin-right: 12px;
}
.wifi-network-details {
	flex: 1;
}
.wifi-network-ssid {
	font-weight: 600;
	color: #495057;
	font-size: 14px;
	margin-bottom: 4px;
}
:root[data-darkmode="true"] .wifi-network-ssid {
	color: #ffffff;
}
.wifi-network-info {
	font-size: 12px;
	color: #6c757d;
	line-height: 1.3;
}
:root[data-darkmode="true"] .wifi-network-info {
	color: #adb5bd;
}
.wifi-wps-button {
	background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
	border: none;
	color: white;
	padding: 6px 12px;
	border-radius: 6px;
	font-size: 11px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
	text-transform: uppercase;
	letter-spacing: 0.5px;
}
.wifi-wps-button:hover {
	transform: translateY(-1px);
	box-shadow: 0 2px 8px rgba(40,167,69,0.3);
}
.wifi-wps-button.stop {
	background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
}
.wifi-wps-button.stop:hover {
	box-shadow: 0 2px 8px rgba(220,53,69,0.3);
}
.wifi-assoclist-table {
	width: 100%;
	border-collapse: separate;
	border-spacing: 0;
	background: white;
	border-radius: 8px;
	overflow: hidden;
	box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
:root[data-darkmode="true"] .wifi-assoclist-table {
	background: rgba(33, 37, 41, 0.8);
	box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
.wifi-assoclist-table .table-titles {
	background: rgba(248, 249, 250, 0.9);
	border-bottom: 2px solid rgba(0,123,255,0.2);
	color: #495057;
	font-weight: 600;
	backdrop-filter: blur(10px);
}
:root[data-darkmode="true"] .wifi-assoclist-table .table-titles {
	background: rgba(33, 37, 41, 0.9);
	border-bottom-color: rgba(0,123,255,0.3);
	color: #adb5bd;
}
.wifi-assoclist-table .table-titles .th {
	padding: 14px 16px;
	text-align: left;
	border: none;
	font-size: 13px;
	color: #495057 !important;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.5px;
}
:root[data-darkmode="true"] .wifi-assoclist-table .table-titles .th {
	color: #adb5bd !important;
}
.wifi-assoclist-table .tr:not(.table-titles) .th,
.wifi-assoclist-table .tr:not(.table-titles) .td {
	padding: 14px 16px;
	border-bottom: 1px solid rgba(0,0,0,0.06);
	vertical-align: middle;
	background: transparent;
	text-align: left;
}
:root[data-darkmode="true"] .wifi-assoclist-table .tr:not(.table-titles) .th,
:root[data-darkmode="true"] .wifi-assoclist-table .tr:not(.table-titles) .td {
	border-bottom-color: rgba(255,255,255,0.08);
}
.wifi-assoclist-table .tr:not(.table-titles):hover {
	background: rgba(0,123,255,0.04);
}
:root[data-darkmode="true"] .wifi-assoclist-table .tr:not(.table-titles):hover {
	background: rgba(0,123,255,0.08);
}
.wifi-assoclist-table .cbi-section-actions {
	text-align: center;
}
.wifi-client-badge {
	display: inline-flex;
	align-items: center;
	background: rgba(0,123,255,0.1);
	border-radius: 6px;
	padding: 6px 10px;
	font-size: 12px;
	color: #007bff;
}
:root[data-darkmode="true"] .wifi-client-badge {
	background: rgba(0,123,255,0.2);
	color: #66b3ff;
}
.wifi-client-mac {
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	background: rgba(108,117,125,0.1);
	padding: 4px 8px;
	border-radius: 4px;
	font-size: 12px;
	color: #6c757d;
}
:root[data-darkmode="true"] .wifi-client-mac {
	background: rgba(108,117,125,0.2);
	color: #adb5bd;
}
.wifi-disconnect-button {
	background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
	border: none;
	color: white;
	padding: 6px 12px;
	border-radius: 6px;
	font-size: 11px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
	text-transform: uppercase;
	letter-spacing: 0.5px;
}
.wifi-disconnect-button:hover {
	transform: translateY(-1px);
	box-shadow: 0 2px 8px rgba(220,53,69,0.3);
}
	`
));

return baseclass.extend({
	title: _('Wireless'),

	WPSTranslateTbl: {
		Disabled: _('Disabled'),
		Active: _('Active'),
		'Timed-out': _('Timed-out'),
		Overlap: _('Overlap'),
		Unknown: _('Unknown')
	},

	callSessionAccess: rpc.declare({
		object: 'session',
		method: 'access',
		params: [ 'scope', 'object', 'function' ],
		expect: { 'access': false }
	}),

	wifirate: function(rt) {
		var s = '%.1f\xa0%s, %d\xa0%s'.format(rt.rate / 1000, _('Mbit/s'), rt.mhz, _('MHz')),
		    ht = rt.ht, vht = rt.vht,
			mhz = rt.mhz, nss = rt.nss,
			mcs = rt.mcs, sgi = rt.short_gi,
			he = rt.he, he_gi = rt.he_gi,
			he_dcm = rt.he_dcm;

		if (ht || vht) {
			if (vht) s += ', VHT-MCS\xa0%d'.format(mcs);
			if (nss) s += ', VHT-NSS\xa0%d'.format(nss);
			if (ht)  s += ', MCS\xa0%s'.format(mcs);
			if (sgi) s += ', ' + _('Short GI').replace(/ /g, '\xa0');
		}

		if (he) {
			s += ', HE-MCS\xa0%d'.format(mcs);
			if (nss) s += ', HE-NSS\xa0%d'.format(nss);
			if (he_gi) s += ', HE-GI\xa0%d'.format(he_gi);
			if (he_dcm) s += ', HE-DCM\xa0%d'.format(he_dcm);
		}

		return s;
	},

	handleDelClient: function(wifinet, mac, ev, cmd) {
		var exec = cmd || 'disconnect';

		dom.parent(ev.currentTarget, '.tr').style.opacity = 0.5;
		ev.currentTarget.classList.add('spinning');
		ev.currentTarget.disabled = true;
		ev.currentTarget.blur();

		/* Disconnect client before adding to maclist */
		wifinet.disconnectClient(mac, true, 5, 60000);

		if (exec == 'addlist') {
			wifinet.maclist.push(mac);

			uci.set('wireless', wifinet.sid, 'maclist', wifinet.maclist);

			return uci.save()
				.then(L.bind(L.ui.changes.init, L.ui.changes))
				.then(L.bind(L.ui.changes.displayChanges, L.ui.changes));
		}
	},

	handleGetWPSStatus: function(wifinet) {
		return rpc.declare({
			object: 'hostapd.%s'.format(wifinet),
			method: 'wps_status',
		})()
	},

	handleCallWPS: function(wifinet, ev) {
		ev.currentTarget.classList.add('spinning');
		ev.currentTarget.disabled = true;
		ev.currentTarget.blur();

		return rpc.declare({
			object: 'hostapd.%s'.format(wifinet),
			method: 'wps_start',
		})();
	},

	handleCancelWPS: function(wifinet, ev) {
		ev.currentTarget.classList.add('spinning');
		ev.currentTarget.disabled = true;
		ev.currentTarget.blur();

		return rpc.declare({
			object: 'hostapd.%s'.format(wifinet),
			method: 'wps_cancel',
		})();
	},

	renderbox: function(radio, networks) {
		var chan = null,
		    freq = null,
		    rate = null,
		    badges = [];

		for (var i = 0; i < networks.length; i++) {
			var net = networks[i],
			    is_assoc = (net.getBSSID() != '00:00:00:00:00:00' && net.getChannel() && !net.isDisabled()),
			    quality = net.getSignalPercent();

			var icon;
			if (net.isDisabled())
				icon = L.resource('icons/signal-none.svg');
			else if (quality <= 0)
				icon = L.resource('icons/signal-000-000.svg');
			else if (quality < 25)
				icon = L.resource('icons/signal-000-025.svg');
			else if (quality < 50)
				icon = L.resource('icons/signal-025-050.svg');
			else if (quality < 75)
				icon = L.resource('icons/signal-050-075.svg');
			else
				icon = L.resource('icons/signal-075-100.svg');

			var WPS_button = null;

			if (net.isWPSEnabled) {
				if (net.wps_status == 'Active') {
					WPS_button = E('button', {
						'class' : 'wifi-wps-button stop',
						'click': L.bind(this.handleCancelWPS, this, net.getIfname()),
					}, [ _('Stop WPS') ])
				} else {
					WPS_button = E('button', {
						'class' : 'wifi-wps-button',
						'click': L.bind(this.handleCallWPS, this, net.getIfname()),
					}, [ _('Start WPS') ])
				}
			}

			var networkInfo = [];
			if (net.getActiveSSID()) networkInfo.push(_('SSID') + ': ' + (net.getActiveSSID() || '?'));
			if (net.getActiveMode()) networkInfo.push(_('Mode') + ': ' + net.getActiveMode());
			if (is_assoc && net.getActiveBSSID()) networkInfo.push(_('BSSID') + ': ' + net.getActiveBSSID());
			if (is_assoc && net.getActiveEncryption()) networkInfo.push(_('Encryption') + ': ' + net.getActiveEncryption());
			if (is_assoc && net.assoclist.length) networkInfo.push(_('Associations') + ': ' + net.assoclist.length);
			if (this.WPSTranslateTbl[net.wps_status]) networkInfo.push(_('WPS') + ': ' + this.WPSTranslateTbl[net.wps_status]);

			var badgeElements = [
				E('img', { 'src': icon, 'class': 'wifi-signal-icon' }),
				E('div', { 'class': 'wifi-network-details' }, [
					E('div', { 'class': 'wifi-network-ssid' }, net.getActiveSSID() || _('Hidden Network')),
					E('div', { 'class': 'wifi-network-info' }, [
						networkInfo.join(' • '),
						!is_assoc ? E('div', { 'style': 'color: #dc3545; margin-top: 4px; font-weight: 500;' }, 
							E('em', net.isDisabled() ? _('Wireless is disabled') : _('Wireless is not associated'))
						) : ''
					].filter(Boolean))
				])
			];

			// 只有当WPS_button不为null时才添加到元素数组中
			if (WPS_button !== null) {
				badgeElements.push(WPS_button);
			}

			var badge = E('div', { 'class': 'wifi-network-badge' }, badgeElements);

			badges.push(badge);

			chan = (chan != null) ? chan : net.getChannel();
			freq = (freq != null) ? freq : net.getFrequency();
			rate = (rate != null) ? rate : net.getBitRate();
		}

		return E('div', { class: 'wifi-device-card' }, [
			E('div', { class: 'wifi-device-header' + (radio.isUp() ? '' : ' inactive') }, radio.getName()),
			E('div', { class: 'wifi-device-body' }, [
				E('div', { class: 'wifi-device-info' }, [
					E('div', { class: 'wifi-info-item' }, [
						E('div', { class: 'wifi-info-label' }, _('Type')),
						E('div', { class: 'wifi-info-value' }, radio.getI18n().replace(/^Generic | Wireless Controller .+$/g, ''))
					]),
					E('div', { class: 'wifi-info-item' }, [
						E('div', { class: 'wifi-info-label' }, _('Channel')),
						E('div', { class: 'wifi-info-value' }, chan ? '%d (%.3f %s)'.format(chan, freq, _('GHz')) : '-')
					]),
					E('div', { class: 'wifi-info-item' }, [
						E('div', { class: 'wifi-info-label' }, _('Bitrate')),
						E('div', { class: 'wifi-info-value' }, rate ? '%d %s'.format(rate, _('Mbit/s')) : '-')
					])
				]),
				E('div', { class: 'wifi-networks-container' }, badges)
			])
		]);
	},

	isWPSEnabled: {},

	load: function() {
		return Promise.all([
			network.getWifiDevices(),
			network.getWifiNetworks(),
			network.getHostHints(),
			this.callSessionAccess('access-group', 'luci-mod-status-index-wifi', 'read'),
			this.callSessionAccess('access-group', 'luci-mod-status-index-wifi', 'write'),
			firewall.getZones(),
			L.hasSystemFeature('wifi') ? L.resolveDefault(uci.load('wireless')) : L.resolveDefault(),
		]).then(L.bind(function(data) {
			var tasks = [],
			    radios_networks_hints = data[1],
			    hasWPS = L.hasSystemFeature('hostapd', 'wps');

			for (var i = 0; i < radios_networks_hints.length; i++) {
				tasks.push(L.resolveDefault(radios_networks_hints[i].getAssocList(), []).then(L.bind(function(net, list) {
					net.assoclist = list.sort(function(a, b) { return a.mac > b.mac });
				}, this, radios_networks_hints[i])));

				if (hasWPS && uci.get('wireless', radios_networks_hints[i].sid, 'wps_pushbutton') == '1') {
					radios_networks_hints[i].isWPSEnabled = true;
					tasks.push(L.resolveDefault(this.handleGetWPSStatus(radios_networks_hints[i].getIfname()), null)
						.then(L.bind(function(net, data) {
							net.wps_status = data ? data.pbc_status : _('No Data');
					}, this, radios_networks_hints[i])));
				}
			}

			return Promise.all(tasks).then(function() {
				return data;
			});
		}, this));
	},

	render: function(data) {
		var seen = {},
		    radios = data[0],
		    networks = data[1],
		    hosthints = data[2],
		    hasReadPermission = data[3],
		    hasWritePermission = data[4],
		    zones = data[5];

		var container = E('div', { 'class': 'wifi-info-container' });
		
		// Wireless Devices Section
		var devicesGrid = E('div', { 'class': 'wifi-devices-grid' });

		for (var i = 0; i < radios.sort(function(a, b) { a.getName() > b.getName() }).length; i++)
			devicesGrid.appendChild(this.renderbox(radios[i],
				networks.filter(function(net) { return net.getWifiDeviceName() == radios[i].getName() })));

		if (!devicesGrid.lastElementChild)
			return null;

		container.appendChild(E('div', { 'class': 'wifi-section-title' }, _('Wireless Overview')));
		container.appendChild(devicesGrid);

		// Associated Stations Table
		if (hasReadPermission) {
			var assoclist = E('table', { 'class': 'wifi-assoclist-table', 'id': 'wifi_assoclist_table' }, [
				E('tr', { 'class': 'tr table-titles' }, [
					E('th', { 'class': 'th nowrap' }, _('Network')),
					E('th', { 'class': 'th hide-xs' }, _('MAC address')),
					E('th', { 'class': 'th' }, _('Host')),
					E('th', { 'class': 'th' }, '%s / %s'.format(_('Signal'), _('Noise'))),
					E('th', { 'class': 'th' }, '%s / %s'.format(_('RX Rate'), _('TX Rate')))
				])
			]);

			var rows = [];

			for (var i = 0; i < networks.length; i++) {
				var macfilter = uci.get('wireless', networks[i].sid, 'macfilter'),
				    maclist = {};

				if (macfilter != null && macfilter != 'disable') {
					networks[i].maclist = L.toArray(uci.get('wireless', networks[i].sid, 'maclist'));
					for (var j = 0; j < networks[i].maclist.length; j++) {
						var mac = networks[i].maclist[j].toUpperCase();
						maclist[mac] = true;
					}
				}

				for (var k = 0; k < networks[i].assoclist.length; k++) {
					var bss = networks[i].assoclist[k],
					    name = hosthints.getHostnameByMACAddr(bss.mac),
					    ipv4 = hosthints.getIPAddrByMACAddr(bss.mac),
					    ipv6 = hosthints.getIP6AddrByMACAddr(bss.mac);

					var icon;
					var q = Math.min((bss.signal + 110) / 70 * 100, 100);
					if (q == 0)
						icon = L.resource('icons/signal-000-000.svg');
					else if (q < 25)
						icon = L.resource('icons/signal-000-025.svg');
					else if (q < 50)
						icon = L.resource('icons/signal-025-050.svg');
					else if (q < 75)
						icon = L.resource('icons/signal-050-075.svg');
					else
						icon = L.resource('icons/signal-075-100.svg');

					var sig_title, sig_value;

					if (bss.noise) {
						sig_value = '%d/%d\xa0%s'.format(bss.signal, bss.noise, _('dBm'));
						sig_title = '%s: %d %s / %s: %d %s / %s %d'.format(
							_('Signal'), bss.signal, _('dBm'),
							_('Noise'), bss.noise, _('dBm'),
							_('SNR'), bss.signal - bss.noise);
					}
					else {
						sig_value = '%d\xa0%s'.format(bss.signal, _('dBm'));
						sig_title = '%s: %d %s'.format(_('Signal'), bss.signal, _('dBm'));
					}

					var hint;

					if (name && ipv4 && ipv6)
						hint = '%s <span class="hide-xs">(%s, %s)</span>'.format(name, ipv4, ipv6);
					else if (name && (ipv4 || ipv6))
						hint = '%s <span class="hide-xs">(%s)</span>'.format(name, ipv4 || ipv6);
					else
						hint = name || ipv4 || ipv6 || '?';

					var row = [
						E('div', { 'class': 'wifi-client-badge' }, [
							E('img', { 'src': L.resource('icons/wifi.svg'), 'style': 'width:16px;height:16px;margin-right:8px' }),
							E('span', {}, [
								networks[i].getShortName(),
								E('small', { 'style': 'opacity:0.7;margin-left:4px' }, [ '(', networks[i].getIfname(), ')' ])
							])
						]),
						E('span', { 'class': 'wifi-client-mac' }, bss.mac),
						hint,
						E('span', {
							'class': 'ifacebadge',
							'title': sig_title,
							'data-signal': bss.signal,
							'data-noise': bss.noise
						}, [
							E('img', { 'src': icon, 'style': 'width:16px;height:16px;margin-right:4px' }),
							E('span', {}, sig_value)
						]),
						E('span', {}, [
							E('span', this.wifirate(bss.rx)),
							E('br'),
							E('span', this.wifirate(bss.tx))
						])
					];

					if (bss.vlan) {
						var desc = bss.vlan.getI18n();
						var vlan_network = bss.vlan.getNetwork();
						var vlan_zone;

						if (vlan_network)
							for (let zone of zones)
								if (zone.getNetworks().includes(vlan_network))
									vlan_zone = zone;

						row[0].insertBefore(
							E('div', {
								'class' : 'zonebadge',
								'title' : desc,
								'style' : firewall.getZoneColorStyle(vlan_zone)
							}, [ desc ]), row[0].firstChild);
					}

					if (networks[i].isClientDisconnectSupported() && hasWritePermission) {
						if (assoclist.firstElementChild.childNodes.length < 6)
							assoclist.firstElementChild.appendChild(E('th', { 'class': 'th cbi-section-actions' }));

						if (macfilter != null && macfilter != 'disable' && !maclist[bss.mac]) {
							row.push(new L.ui.ComboButton('button', {
									'addlist': macfilter == 'allow' ?  _('Add to Whitelist') : _('Add to Blacklist'),
									'disconnect': _('Disconnect')
								}, {
									'click': L.bind(this.handleDelClient, this, networks[i], bss.mac),
									'sort': [ 'disconnect', 'addlist' ],
									'classes': {
										'addlist': 'wifi-disconnect-button',
										'disconnect': 'wifi-disconnect-button'
									}
								}).render()
							)
						}
						else {
							row.push(E('button', {
								'class': 'wifi-disconnect-button',
								'click': L.bind(this.handleDelClient, this, networks[i], bss.mac)
							}, [ _('Disconnect') ]));
						}
					}
					else {
						row.push('-');
					}

					rows.push(row);
				}
			}

			cbi_update_table(assoclist, rows, E('em', _('No information available')));

			container.appendChild(E('div', { 'class': 'wifi-section-title', 'style': 'margin-top: 32px;' }, _('Associated Stations')));
			container.appendChild(assoclist);
		}

		return container;
	}
});
