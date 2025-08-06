'use strict';
'require baseclass';
'require fs';
'require ui';
'require uci';
'require rpc';
'require network';
'require firewall';

document.head.append(E('style', { 'type': 'text/css' },
	`
.ports-info-container {
	background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
	border-radius: 12px;
	padding: 20px;
	margin: 16px 0;
	border: 1px solid rgba(255,255,255,0.15);
	box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
:root[data-darkmode="true"] .ports-info-container {
	background: linear-gradient(135deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 100%);
	border-color: rgba(255,255,255,0.1);
	box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
.ports-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 16px;
	margin-top: 16px;
}
.port-card {
	background: rgba(255,255,255,0.8);
	border-radius: 12px;
	padding: 16px;
	border: 2px solid transparent;
	transition: all 0.3s ease;
	position: relative;
	overflow: hidden;
}
:root[data-darkmode="true"] .port-card {
	background: rgba(255,255,255,0.05);
}
.port-card:hover {
	transform: translateY(-2px);
	box-shadow: 0 8px 20px rgba(0,0,0,0.15);
	border-color: rgba(0,123,255,0.3);
}
.port-card-connected {
	border-color: #28a745;
	background: linear-gradient(135deg, rgba(40,167,69,0.1) 0%, rgba(255,255,255,0.8) 100%);
}
:root[data-darkmode="true"] .port-card-connected {
	background: linear-gradient(135deg, rgba(40,167,69,0.2) 0%, rgba(255,255,255,0.05) 100%);
}
.port-card-disconnected {
	border-color: #dc3545;
	background: linear-gradient(135deg, rgba(220,53,69,0.1) 0%, rgba(255,255,255,0.8) 100%);
}
:root[data-darkmode="true"] .port-card-disconnected {
	background: linear-gradient(135deg, rgba(220,53,69,0.2) 0%, rgba(255,255,255,0.05) 100%);
}
.port-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 12px;
	padding-bottom: 8px;
	border-bottom: 1px solid rgba(0,0,0,0.1);
}
:root[data-darkmode="true"] .port-header {
	border-bottom-color: rgba(255,255,255,0.1);
}
.port-name {
	font-weight: 700;
	font-size: 16px;
	color: #212529;
}
:root[data-darkmode="true"] .port-name {
	color: #f8f9fa;
}
.port-status-icon {
	width: 24px;
	height: 24px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 12px;
	font-weight: bold;
	color: white;
	text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}
.port-status-connected {
	background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
	box-shadow: 0 2px 4px rgba(40,167,69,0.3);
}
.port-status-disconnected {
	background: linear-gradient(135deg, #dc3545 0%, #e74c3c 100%);
	box-shadow: 0 2px 4px rgba(220,53,69,0.3);
}
.port-body {
	text-align: center;
	margin: 16px 0;
}
.port-icon {
	width: 48px;
	height: 48px;
	margin: 0 auto 12px;
	opacity: 0.8;
	transition: opacity 0.3s ease;
}
.port-card:hover .port-icon {
	opacity: 1;
}
.port-speed {
	font-size: 14px;
	font-weight: 600;
	color: #495057;
	margin-bottom: 8px;
}
:root[data-darkmode="true"] .port-speed {
	color: #adb5bd;
}
.port-zones {
	display: flex;
	height: 4px;
	border-radius: 2px;
	overflow: hidden;
	margin: 12px 0;
	box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);
}
.port-zone {
	flex: 1;
	transition: opacity 0.3s ease;
}
.port-stats {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 8px;
	margin-top: 12px;
	font-size: 12px;
}
.port-stat {
	background: rgba(0,0,0,0.05);
	padding: 6px 8px;
	border-radius: 6px;
	text-align: center;
}
:root[data-darkmode="true"] .port-stat {
	background: rgba(255,255,255,0.05);
}
.port-stat-label {
	display: block;
	font-size: 10px;
	opacity: 0.7;
	margin-bottom: 2px;
}
.port-stat-value {
	font-weight: 600;
	color: #007bff;
}
:root[data-darkmode="true"] .port-stat-value {
	color: #66b3ff;
}
.ports-title {
	font-size: 18px;
	font-weight: 600;
	color: #495057;
	margin-bottom: 8px;
	display: flex;
	align-items: center;
}
:root[data-darkmode="true"] .ports-title {
	color: #adb5bd;
}
.ports-title::before {
	content: "🔌";
	margin-right: 8px;
	font-size: 20px;
}
`));

var callGetBuiltinEthernetPorts = rpc.declare({
	object: 'luci',
	method: 'getBuiltinEthernetPorts',
	expect: { result: [] }
});

function isString(v) {
	return typeof (v) === 'string' && v !== '';
}

function resolveVLANChain(ifname, bridges, mapping) {
	while (!mapping[ifname]) {
		var m = ifname.match(/^(.+)\.([^.]+)$/);

		if (!m)
			break;

		if (bridges[m[1]]) {
			if (bridges[m[1]].vlan_filtering)
				mapping[ifname] = bridges[m[1]].vlans[m[2]];
			else
				mapping[ifname] = bridges[m[1]].ports;
		}
		else if (/^[0-9]{1,4}$/.test(m[2]) && m[2] <= 4095) {
			mapping[ifname] = [m[1]];
		}
		else {
			break;
		}

		ifname = m[1];
	}
}

function buildVLANMappings(mapping) {
	var bridge_vlans = uci.sections('network', 'bridge-vlan'),
		vlan_devices = uci.sections('network', 'device'),
		interfaces = uci.sections('network', 'interface'),
		bridges = {};

	/* find bridge VLANs */
	for (var i = 0, s; (s = bridge_vlans[i]) != null; i++) {
		if (!isString(s.device) || !/^[0-9]{1,4}$/.test(s.vlan) || +s.vlan > 4095)
			continue;

		var aliases = L.toArray(s.alias),
			ports = L.toArray(s.ports),
			br = bridges[s.device] = (bridges[s.device] || { ports: [], vlans: {}, vlan_filtering: true });

		br.vlans[s.vlan] = [];

		for (var j = 0; j < ports.length; j++) {
			var port = ports[j].replace(/:[ut*]+$/, '');

			if (br.ports.indexOf(port) === -1)
				br.ports.push(port);

			br.vlans[s.vlan].push(port);
		}

		for (var j = 0; j < aliases.length; j++)
			if (aliases[j] != s.vlan)
				br.vlans[aliases[j]] = br.vlans[s.vlan];
	}

	/* find bridges, VLAN devices */
	for (var i = 0, s; (s = vlan_devices[i]) != null; i++) {
		if (s.type == 'bridge') {
			if (!isString(s.name))
				continue;

			var ports = L.toArray(s.ports),
				br = bridges[s.name] || (bridges[s.name] = { ports: [], vlans: {}, vlan_filtering: false });

			if (s.vlan_filtering == '0')
				br.vlan_filtering = false;
			else if (s.vlan_filtering == '1')
				br.vlan_filtering = true;

			for (var j = 0; j < ports.length; j++)
				if (br.ports.indexOf(ports[j]) === -1)
					br.ports.push(ports[j]);

			mapping[s.name] = br.ports;
		}
		else if (s.type == '8021q' || s.type == '8021ad') {
			if (!isString(s.name) || !isString(s.vid) || !isString(s.ifname))
				continue;

			/* parent device is a bridge */
			if (bridges[s.ifname]) {
				/* parent bridge is VLAN enabled, device refers to VLAN ports */
				if (bridges[s.ifname].vlan_filtering)
					mapping[s.name] = bridges[s.ifname].vlans[s.vid];

				/* parent bridge is not VLAN enabled, device refers to all bridge ports */
				else
					mapping[s.name] = bridges[s.ifname].ports;
			}

			/* parent is a simple netdev */
			else {
				mapping[s.name] = [s.ifname];
			}

			resolveVLANChain(s.ifname, bridges, mapping);
		}
	}

	/* resolve VLAN tagged interfaces in bridge ports */
	for (var brname in bridges) {
		for (var i = 0; i < bridges[brname].ports.length; i++)
			resolveVLANChain(bridges[brname].ports[i], bridges, mapping);

		for (var vid in bridges[brname].vlans)
			for (var i = 0; i < bridges[brname].vlans[vid].length; i++)
				resolveVLANChain(bridges[brname].vlans[vid][i], bridges, mapping);
	}

	/* find implicit VLAN devices */
	for (var i = 0, s; (s = interfaces[i]) != null; i++) {
		if (!isString(s.device))
			continue;

		resolveVLANChain(s.device, bridges, mapping);
	}
}

function resolveVLANPorts(ifname, mapping, seen) {
	var ports = [];

	if (!seen)
		seen = {};

	if (mapping[ifname]) {
		for (var i = 0; i < mapping[ifname].length; i++) {
			if (!seen[mapping[ifname][i]]) {
				seen[mapping[ifname][i]] = true;
				ports.push.apply(ports, resolveVLANPorts(mapping[ifname][i], mapping, seen));
			}
		}
	}
	else {
		ports.push(ifname);
	}

	return ports.sort(L.naturalCompare);
}

function buildInterfaceMapping(zones, networks) {
	var vlanmap = {},
		portmap = {},
		netmap = {};

	buildVLANMappings(vlanmap);

	for (var i = 0; i < networks.length; i++) {
		var l3dev = networks[i].getDevice();

		if (!l3dev)
			continue;

		var ports = resolveVLANPorts(l3dev.getName(), vlanmap);

		for (var j = 0; j < ports.length; j++) {
			portmap[ports[j]] = portmap[ports[j]] || { networks: [], zones: [] };
			portmap[ports[j]].networks.push(networks[i]);
		}

		netmap[networks[i].getName()] = networks[i];
	}

	for (var i = 0; i < zones.length; i++) {
		var networknames = zones[i].getNetworks();

		for (var j = 0; j < networknames.length; j++) {
			if (!netmap[networknames[j]])
				continue;

			var l3dev = netmap[networknames[j]].getDevice();

			if (!l3dev)
				continue;

			var ports = resolveVLANPorts(l3dev.getName(), vlanmap);

			for (var k = 0; k < ports.length; k++) {
				portmap[ports[k]] = portmap[ports[k]] || { networks: [], zones: [] };

				if (portmap[ports[k]].zones.indexOf(zones[i]) === -1)
					portmap[ports[k]].zones.push(zones[i]);
			}
		}
	}

	return portmap;
}

function formatSpeed(carrier, speed, duplex) {
	if ((speed > 0) && duplex) {
		var d = (duplex == 'half') ? '\u202f(H)' : '',
			e = E('span', { 'title': _('Speed: %d Mibit/s, Duplex: %s').format(speed, duplex) });

		switch (true) {
			case (speed < 1000):
				e.innerText = '%d\u202fM%s'.format(speed, d);
				break;
			case (speed == 1000):
				e.innerText = '1\u202fGbE' + d;
				break;
			case (speed >= 1e6 && speed < 1e9):
				e.innerText = '%f\u202fTbE'.format(speed / 1e6);
				break;
			case (speed >= 1e9):
				e.innerText = '%f\u202fPbE'.format(speed / 1e9);
				break;
			default: e.innerText = '%f\u202fGbE'.format(speed / 1000);
		}

		return e;
	}

	return carrier ? _('Connected') : _('no link');
}

function formatStats(portdev) {
	var stats = portdev._devstate('stats') || {};

	return ui.itemlist(E('span'), [
		_('Received bytes'), '%1024mB'.format(stats.rx_bytes),
		_('Received packets'), '%1000mPkts.'.format(stats.rx_packets),
		_('Received multicast'), '%1000mPkts.'.format(stats.multicast),
		_('Receive errors'), '%1000mPkts.'.format(stats.rx_errors),
		_('Receive dropped'), '%1000mPkts.'.format(stats.rx_dropped),

		_('Transmitted bytes'), '%1024mB'.format(stats.tx_bytes),
		_('Transmitted packets'), '%1000mPkts.'.format(stats.tx_packets),
		_('Transmit errors'), '%1000mPkts.'.format(stats.tx_errors),
		_('Transmit dropped'), '%1000mPkts.'.format(stats.tx_dropped),

		_('Collisions seen'), stats.collisions
	]);
}

function renderNetworkBadge(network, zonename) {
	var l3dev = network.getDevice();
	var span = E('span', { 'class': 'ifacebadge', 'style': 'margin:.125em 0' }, [
		E('span', {
			'class': 'zonebadge',
			'title': zonename ? _('Part of zone %q').format(zonename) : _('No zone assigned'),
			'style': firewall.getZoneColorStyle(zonename)
		}, '\u202f'),
		'\u202f', network.getName(), ': '
	]);

	if (l3dev)
		span.appendChild(E('img', {
			'title': l3dev.getI18n(),
			'src': L.resource('icons/%s%s.svg'.format(l3dev.getType(), l3dev.isUp() ? '' : '_disabled'))
		}));
	else
		span.appendChild(E('em', _('(no interfaces attached)')));

	return span;
}

function renderNetworksTooltip(pmap) {
	var res = [null],
		zmap = {};

	for (var i = 0; pmap && i < pmap.zones.length; i++) {
		var networknames = pmap.zones[i].getNetworks();

		for (var k = 0; k < networknames.length; k++)
			zmap[networknames[k]] = pmap.zones[i].getName();
	}

	for (var i = 0; pmap && i < pmap.networks.length; i++)
		res.push(E('br'), renderNetworkBadge(pmap.networks[i], zmap[pmap.networks[i].getName()]));

	if (res.length > 1)
		res[0] = N_((res.length - 1) / 2, 'Part of network:', 'Part of networks:');
	else
		res[0] = _('Port is not part of any network');

	return E([], res);
}

return baseclass.extend({
	title: _('Port status'),

	load: function () {
		return Promise.all([
			L.resolveDefault(callGetBuiltinEthernetPorts(), []),
			L.resolveDefault(fs.read('/etc/board.json'), '{}'),
			firewall.getZones(),
			network.getNetworks(),
			uci.load('network')
		]);
	},

	render: function (data) {
		if (L.hasSystemFeature('swconfig'))
			return null;

		var board = JSON.parse(data[1]),
			known_ports = [],
			port_map = buildInterfaceMapping(data[2], data[3]);

		if (Array.isArray(data[0]) && data[0].length > 0) {
			known_ports = data[0].map(port => ({
				...port,
				netdev: network.instantiateDevice(port.device)
			}));
		}
		else {
			if (L.isObject(board) && L.isObject(board.network)) {
				for (var k = 'lan'; k != null; k = (k == 'lan') ? 'wan' : null) {
					if (!L.isObject(board.network[k]))
						continue;

					if (Array.isArray(board.network[k].ports))
						for (let i = 0; i < board.network[k].ports.length; i++)
							known_ports.push({
								role: k,
								device: board.network[k].ports[i],
								netdev: network.instantiateDevice(board.network[k].ports[i])
							});
					else if (typeof (board.network[k].device) == 'string')
						known_ports.push({
							role: k,
							device: board.network[k].device,
							netdev: network.instantiateDevice(board.network[k].device)
						});
				}
			}
		}

		known_ports.sort(function (a, b) {
			return L.naturalCompare(a.device, b.device);
		});

		var container = E('div', { 'class': 'ports-info-container' });

		if (known_ports.length === 0) {
			container.appendChild(E('div', { 'style': 'text-align: center; padding: 40px; color: #6c757d; font-style: italic;' },
				_('No network ports detected')
			));
			return container;
		}

		container.appendChild(E('div', { 'class': 'ports-title' }, _('Network Ports')));

		var portsGrid = E('div', { 'class': 'ports-grid' });

		known_ports.forEach(function (port) {
			var speed = port.netdev.getSpeed(),
				duplex = port.netdev.getDuplex(),
				carrier = port.netdev.getCarrier(),
				pmap = port_map[port.netdev.getName()],
				pzones = (pmap && pmap.zones.length) ? pmap.zones.sort(function (a, b) { return L.naturalCompare(a.getName(), b.getName()) }) : [null];

			var cardClass = 'port-card';
			if (carrier) {
				cardClass += ' port-card-connected';
			} else {
				cardClass += ' port-card-disconnected';
			}

			var portCard = E('div', { 'class': cardClass }, [
				// Header with port name and status
				E('div', { 'class': 'port-header' }, [
					E('div', { 'class': 'port-name' }, port.netdev.getName()),
					E('div', {
						'class': 'port-status-icon ' + (carrier ? 'port-status-connected' : 'port-status-disconnected'),
						'title': carrier ? _('Connected') : _('Disconnected')
					}, carrier ? '✓' : '✗')
				]),

				// Port icon and speed
				E('div', { 'class': 'port-body' }, [
					E('img', {
						'class': 'port-icon',
						'src': L.resource('icons/port_%s.svg').format(carrier ? 'up' : 'down')
					}),
					E('div', { 'class': 'port-speed' }, formatSpeed(carrier, speed, duplex))
				]),

				// Zone indicators
				E('div', {
					'class': 'port-zones cbi-tooltip-container',
					'title': _('Click for network details')
				}, [
					E('div', { 'class': 'port-zones' }, pzones.map(function (zone) {
						return E('div', {
							'class': 'port-zone',
							'style': 'opacity:' + (carrier ? 1 : 0.25) + ';' + firewall.getZoneColorStyle(zone)
						});
					})),
					E('span', { 'class': 'cbi-tooltip' }, [renderNetworksTooltip(pmap)])
				]),

				// Traffic statistics
				E('div', { 'class': 'port-stats cbi-tooltip-container' }, [
					E('div', { 'class': 'port-stat' }, [
						E('span', { 'class': 'port-stat-label' }, _('TX')),
						E('div', { 'class': 'port-stat-value' }, '%1024.1mB'.format(port.netdev.getTXBytes()))
					]),
					E('div', { 'class': 'port-stat' }, [
						E('span', { 'class': 'port-stat-label' }, _('RX')),
						E('div', { 'class': 'port-stat-value' }, '%1024.1mB'.format(port.netdev.getRXBytes()))
					]),
					E('span', { 'class': 'cbi-tooltip' }, formatStats(port.netdev))
				])
			]);

			portsGrid.appendChild(portCard);
		});

		container.appendChild(portsGrid);
		return container;
	}
});
