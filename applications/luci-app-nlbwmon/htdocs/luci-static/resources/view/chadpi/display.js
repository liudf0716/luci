'use strict';
'require view';
'require network';
'require request';
'require fs';
'require ui';
'require rpc';
'require dom';
'require poll';

var callNetworkRrdnsLookup = rpc.declare({
	object: 'network.rrdns',
	method: 'lookup',
	params: [ 'addrs', 'timeout', 'limit' ],
	expect: { '': {} }
});

var chartRegistry = {},
	trafficPeriods = [],
	trafficData = { columns: [], data: [] },
	hostNames = {},
	hostInfo = {},
	ouiData = [];

var l7proto = {};

return view.extend({
	load: function() {
		return Promise.all([
			this.loadL7Protocols()
		]);
	},

	loadHosts: function() {
		return L.resolveDefault(network.getHostHints()).then(function(res) {
			if (res) {
				var hints = res.getMACHints();

				for (var i = 0; i < hints.length; i++) {
					hostInfo[hints[i][0]] = {
						name: res.getHostnameByMACAddr(hints[i][0]),
						ipv6: res.getIP6AddrByMACAddr(hints[i][0]),
						ipv4: res.getIPAddrByMACAddr(hints[i][0])
					};
				}
			}
		});
	},

	loadOUI: function() {
		var url = 'https://raw.githubusercontent.com/jow-/oui-database/master/oui.json';

		return L.resolveDefault(request.get(url, { cache: true })).then(function(res) {
			res = res ? res.json() : [];

			if (Array.isArray(res))
				ouiData = res;
		});
	},

	loadL7Protocols: function() {
		return L.resolveDefault(fs.exec_direct('/usr/libexec/nlbwmon-action', ['l7proto'], 'json')).then(function(result) {
			var l7proto_array = result.l7_proto;
			l7proto_array.forEach(function(item) {
				l7proto[item.id] = item;
			});
			return l7proto;
		});
	},

	off: function(elem) {
		var val = [0, 0];
		do {
			if (!isNaN(elem.offsetLeft) && !isNaN(elem.offsetTop)) {
				val[0] += elem.offsetLeft;
				val[1] += elem.offsetTop;
			}
		}
		while ((elem = elem.offsetParent) != null);
		return val;
	},

	kpi: function(id, val1, val2, val3) {
		var e = L.dom.elem(id) ? id : document.getElementById(id);

		if (val1 && val2 && val3)
			e.innerHTML = _('%s, %s and %s').format(val1, val2, val3);
		else if (val1 && val2)
			e.innerHTML = _('%s and %s').format(val1, val2);
		else if (val1)
			e.innerHTML = val1;

		e.parentNode.style.display = val1 ? 'list-item' : '';
	},

	pie: function(id, data) {
		var total = data.reduce(function(n, d) { return n + d.value }, 0);

		data.sort(function(a, b) { return b.value - a.value });

		if (total === 0)
			data = [{
				value: 1,
				color: '#cccccc',
				label: [ _('no traffic') ]
			}];

		for (var i = 0; i < data.length; i++) {
			if (!data[i].color) {
				var hue = 120 / (data.length-1) * i;
				data[i].color = 'hsl(%u, 80%%, 50%%)'.format(hue);
				data[i].label.push(hue);
			}
		}

		var node = L.dom.elem(id) ? id : document.getElementById(id),
		    key = L.dom.elem(id) ? id.id : id,
		    ctx = node.getContext('2d');

		if (chartRegistry.hasOwnProperty(key))
			chartRegistry[key].destroy();

		chartRegistry[key] = new Chart(ctx).Doughnut(data, {
			segmentStrokeWidth: 1,
			percentageInnerCutout: 30
		});

		return chartRegistry[key];
	},

	oui: function(mac) {
		var m, l = 0, r = ouiData.length / 3 - 1;
		var mac1 = parseInt(mac.replace(/[^a-fA-F0-9]/g, ''), 16);

		while (l <= r) {
			m = l + Math.floor((r - l) / 2);

			var mask = (0xffffffffffff -
						(Math.pow(2, 48 - ouiData[m * 3 + 1]) - 1));

			var mac1_hi = ((mac1 / 0x10000) & (mask / 0x10000)) >>> 0;
			var mac1_lo = ((mac1 &  0xffff) & (mask &  0xffff)) >>> 0;

			var mac2 = parseInt(ouiData[m * 3], 16);
			var mac2_hi = (mac2 / 0x10000) >>> 0;
			var mac2_lo = (mac2 &  0xffff) >>> 0;

			if (mac1_hi === mac2_hi && mac1_lo === mac2_lo)
				return ouiData[m * 3 + 2];

			if (mac2_hi > mac1_hi ||
				(mac2_hi === mac1_hi && mac2_lo > mac1_lo))
				r = m - 1;
			else
				l = m + 1;
		}

		return null;
	},

	query: function(filter, group, order) {
		var keys = [], columns = {}, records = {}, result = [];

		if (typeof(group) !== 'function' && typeof(group) !== 'object')
			group = ['mac'];

		for (var i = 0; i < trafficData.columns.length; i++)
			columns[trafficData.columns[i]] = i;

		for (var i = 0; i < trafficData.data.length; i++) {
			var record = trafficData.data[i];

			if (typeof(filter) === 'function' && filter(columns, record) !== true)
				continue;

			var key;

			if (typeof(group) === 'function') {
				key = group(columns, record);
			}
			else {
				key = [];

				for (var j = 0; j < group.length; j++)
					if (columns.hasOwnProperty(group[j]))
						key.push(record[columns[group[j]]]);

				key = key.join(',');
			}

			if (!records.hasOwnProperty(key)) {
				var rec = {};

				for (var col in columns)
					rec[col] = record[columns[col]];

				records[key] = rec;
				result.push(rec);
			}
			else {
				records[key].conns    += record[columns.conns];
				records[key].rx_bytes += record[columns.rx_bytes];
				records[key].rx_pkts  += record[columns.rx_pkts];
				records[key].tx_bytes += record[columns.tx_bytes];
				records[key].tx_pkts  += record[columns.tx_pkts];
			}
		}

		if (typeof(order) === 'function')
			result.sort(order);

		return result;
	},

	formatHostname: function(dns) {
		if (dns === undefined || dns === null || dns === '')
			return '-';

		dns = dns.split('.')[0];

		if (dns.length > 12)
			return '<span title="%q">%h…</span>'.format(dns, dns.substr(0, 12));

		return '%h'.format(dns);
	},

	renderHostData: function() {
		var trafData = [], connData = [];
		var rx_total = 0, tx_total = 0, conn_total = 0;

		var hostData = this.query(
			function(c, r) {
				return (r[c.rx_bytes] > 0 || r[c.tx_bytes] > 0);
			},
			['mac'],
			//function(c, r) {
			//	return (r[c.mac] !== '00:00:00:00:00:00') ? r[c.mac] : r[c.ip];
			//},
			function(r1, r2) {
				return ((r2.rx_bytes + r2.tx_bytes) - (r1.rx_bytes + r1.tx_bytes));
			}
		);

		var rows = [];

		for (var i = 0; i < hostData.length; i++) {
			var rec = hostData[i],
			    mac = rec.mac.toUpperCase(),
			    key = (mac !== '00:00:00:00:00:00') ? mac : rec.ip,
			    dns = hostInfo[mac] ? hostInfo[mac].name : null;

			var cell = E('div', this.formatHostname(dns));

			rows.push([
				cell,
				E('a', {
					'href':         '#' + rec.mac,
					'data-col':     'ip',
					'data-tooltip': _('Source IP')
				}, (mac !== '00:00:00:00:00:00') ? mac : _('other')),
				[ rec.conns, E('a', {
					'href':         '#' + rec.mac,
					'data-col':     'layer7',
					'data-tooltip': _('Protocol')
				}, '%1000.2m'.format(rec.conns)) ],
				[ rec.rx_bytes, '%1024.2mB'.format(rec.rx_bytes) ],
				[ rec.rx_pkts,  '%1000.2mP'.format(rec.rx_pkts)  ],
				[ rec.tx_bytes, '%1024.2mB'.format(rec.tx_bytes) ],
				[ rec.tx_pkts,  '%1000.2mP'.format(rec.tx_pkts)  ]
			]);

			trafData.push({
				value: rec.rx_bytes + rec.tx_bytes,
				label: ["%s: %%1024.2mB".format(key), cell]
			});

			connData.push({
				value: rec.conns,
				label: ["%s: %%1000.2m".format(key), cell]
			});

			rx_total += rec.rx_bytes;
			tx_total += rec.tx_bytes;
			conn_total += rec.conns;
		}

		cbi_update_table('#host-data', rows, E('em', _('No data recorded yet.')));

		this.pie('traf-pie', trafData);
		this.pie('conn-pie', connData);

		this.kpi('rx-total', '%1024.2mB'.format(rx_total));
		this.kpi('tx-total', '%1024.2mB'.format(tx_total));
		this.kpi('conn-total', '%1000m'.format(conn_total));
		this.kpi('host-total', '%u'.format(hostData.length));
	},

	renderLayer7Data: function() {
		var rxData = [], txData = [];
		var topConn = [[0],[0],[0]], topRx = [[0],[0],[0]], topTx = [[0],[0],[0]];

		var layer7Data = this.query(
			null, ['layer7'],
			function(r1, r2) {
				return ((r2.rx_bytes + r2.tx_bytes) - (r1.rx_bytes + r1.tx_bytes));
			}
		);

		var rows = [];

		for (var i = 0, c = 0; i < layer7Data.length; i++) {
			var rec = layer7Data[i],
			    cell = E('div', rec.layer7 || _('other'));

			rows.push([
				cell,
				[ rec.conns,    '%1000m'.format(rec.conns)       ],
				[ rec.rx_bytes, '%1024.2mB'.format(rec.rx_bytes) ],
				[ rec.rx_pkts,  '%1000.2mP'.format(rec.rx_pkts)  ],
				[ rec.tx_bytes, '%1024.2mB'.format(rec.tx_bytes) ],
				[ rec.tx_pkts,  '%1000.2mP'.format(rec.tx_pkts)  ]
			]);

			rxData.push({
				value: rec.rx_bytes,
				label: ["%s: %%1024.2mB".format(rec.layer7 || _('other')), cell]
			});

			txData.push({
				value: rec.tx_bytes,
				label: ["%s: %%1024.2mB".format(rec.layer7 || _('other')), cell]
			});

			if (rec.layer7) {
				topRx.push([rec.rx_bytes, rec.layer7]);
				topTx.push([rec.tx_bytes, rec.layer7]);
				topConn.push([rec.conns, rec.layer7]);
			}
		}

		cbi_update_table('#layer7-data', rows, E('em', 	_('No data recorded yet.')));

		this.pie('layer7-rx-pie', rxData);
		this.pie('layer7-tx-pie', txData);

		topRx.sort(function(a, b) { return b[0] - a[0] });
		topTx.sort(function(a, b) { return b[0] - a[0] });
		topConn.sort(function(a, b) { return b[0] - a[0] });

		this.kpi('layer7-total', layer7Data.length);
		this.kpi('layer7-most-rx', topRx[0][1], topRx[1][1], topRx[2][1]);
		this.kpi('layer7-most-tx', topTx[0][1], topTx[1][1], topTx[2][1]);
		this.kpi('layer7-most-conn', topConn[0][1], topConn[1][1], topConn[2][1]);
	},

	renderIPv6Data: function() {
		var col       = { },
		    rx4_total = 0,
		    tx4_total = 0,
		    rx6_total = 0,
		    tx6_total = 0,
		    v4_total  = 0,
		    v6_total  = 0,
		    ds_total  = 0,
		    families  = { },
		    records   = { };

		var ipv6Data = this.query(
			null, ['family', 'mac'],
			function(r1, r2) {
				return ((r2.rx_bytes + r2.tx_bytes) - (r1.rx_bytes + r1.tx_bytes));
			}
		);

		for (var i = 0, c = 0; i < ipv6Data.length; i++) {
			var rec = ipv6Data[i],
			    mac = rec.mac.toUpperCase(),
			    ip  = rec.ip,
			    fam = families[mac] || 0,
			    recs = records[mac] || {};

			if (rec.family == 4) {
				rx4_total += rec.rx_bytes;
				tx4_total += rec.tx_bytes;
				fam |= 1;
			}
			else {
				rx6_total += rec.rx_bytes;
				tx6_total += rec.tx_bytes;
				fam |= 2;
			}

			recs[rec.family] = rec;
			records[mac] = recs;

			families[mac] = fam;
		}

		for (var mac in families) {
			switch (families[mac])
			{
			case 3:
				ds_total++;
				break;

			case 2:
				v6_total++;
				break;

			case 1:
				v4_total++;
				break;
			}
		}

		var rows = [];

		for (var mac in records) {
			if (mac === '00:00:00:00:00:00')
				continue;

			var dns = hostInfo[mac] ? hostInfo[mac].name : null,
			    rec4 = records[mac][4],
			    rec6 = records[mac][6];

			rows.push([
				this.formatHostname(dns),
				mac,
				[
					0,
					E([], [
						E('span', _('IPv4')),
						E('span', _('IPv6'))
					])
				],
				[
					(rec4 ? rec4.rx_bytes : 0) + (rec6 ? rec6.rx_bytes : 0),
					E([], [
						E('span', rec4 ? '%1024.2mB'.format(rec4.rx_bytes) : '-'),
						E('span', rec6 ? '%1024.2mB'.format(rec6.rx_bytes) : '-')
					])
				],
				[
					(rec4 ? rec4.rx_pkts : 0) + (rec6 ? rec6.rx_pkts : 0),
					E([], [
						E('span', rec4 ? '%1000.2mP'.format(rec4.rx_pkts)  : '-'),
						E('span', rec6 ? '%1000.2mP'.format(rec6.rx_pkts)  : '-')
					])
				],
				[
					(rec4 ? rec4.tx_bytes : 0) + (rec6 ? rec6.tx_bytes : 0),
					E([], [
						E('span', rec4 ? '%1024.2mB'.format(rec4.tx_bytes) : '-'),
						E('span', rec6 ? '%1024.2mB'.format(rec6.tx_bytes) : '-')
					])
				],
				[
					(rec4 ? rec4.tx_pkts : 0) + (rec6 ? rec6.tx_pkts : 0),
					E([], [
						E('span', rec4 ? '%1000.2mP'.format(rec4.tx_pkts)  : '-'),
						E('span', rec6 ? '%1000.2mP'.format(rec6.tx_pkts)  : '-')
					])
				]
			]);
		}

		cbi_update_table('#ipv6-data', rows, E('em', _('No data recorded yet.')));

		var shareData = [], hostsData = [];

		if (rx4_total > 0 || tx4_total > 0)
			shareData.push({
				value: rx4_total + tx4_total,
				label: ["IPv4: %1024.2mB"],
				color: 'hsl(140, 100%, 50%)'
		        });

		if (rx6_total > 0 || tx6_total > 0)
			shareData.push({
				value: rx6_total + tx6_total,
				label: ["IPv6: %1024.2mB"],
				color: 'hsl(180, 100%, 50%)'
			});

		if (v4_total > 0)
			hostsData.push({
				value: v4_total,
				label: [_('%d IPv4-only hosts')],
				color: 'hsl(140, 100%, 50%)'
			});

		if (v6_total > 0)
			hostsData.push({
				value: v6_total,
				label: [_('%d IPv6-only hosts')],
				color: 'hsl(180, 100%, 50%)'
			});

		if (ds_total > 0)
			hostsData.push({
				value: ds_total,
				label: [_('%d dual-stack hosts')],
				color: 'hsl(50, 100%, 50%)'
			});

		this.pie('ipv6-share-pie', shareData);
		this.pie('ipv6-hosts-pie', hostsData);

		this.kpi('ipv6-hosts', '%.2f%%'.format(100 / (ds_total + v4_total + v6_total) * (ds_total + v6_total)));
		this.kpi('ipv6-share', '%.2f%%'.format(100 / (rx4_total + rx6_total + tx4_total + tx6_total) * (rx6_total + tx6_total)));
		this.kpi('ipv6-rx', '%1024.2mB'.format(rx6_total));
		this.kpi('ipv6-tx', '%1024.2mB'.format(tx6_total));
	},

	renderHostDetail: function(node, tooltip) {
		var key = node.getAttribute('href').substr(1),
		    col = node.getAttribute('data-col'),
		    label = node.getAttribute('data-tooltip');

		var detailData = this.query(
			function(c, r) {
				return ((r[c.mac] === key || r[c.ip] === key) &&
				        (r[c.rx_bytes] > 0 || r[c.tx_bytes] > 0));
			},
			[col],
			function(r1, r2) {
				return ((r2.rx_bytes + r2.tx_bytes) - (r1.rx_bytes + r1.tx_bytes));
			}
		);

		var rxData = [], txData = [];

		dom.content(tooltip, [
			E('div', { 'class': 'head' }, [
				E('div', { 'class': 'pie' }, [
					E('label', _('Download', 'Traffic counter')),
					E('canvas', { 'id': 'bubble-pie1', 'width': 100, 'height': 100 })
				]),
				E('div', { 'class': 'pie' }, [
					E('label', _('Upload', 'Traffic counter')),
					E('canvas', { 'id': 'bubble-pie2', 'width': 100, 'height': 100 })
				]),
				E('div', { 'class': 'kpi' }, [
					E('ul', [
						E('li', _('Hostname: <big id="bubble-hostname">example.org</big>')),
						E('li', _('Vendor: <big id="bubble-vendor">Example Corp.</big>'))
					])
				])
			]),
			E('table', { 'class': 'table' }, [
				E('tr', { 'class': 'tr table-titles' }, [
					E('th', { 'class': 'th' }, label || col),
					E('th', { 'class': 'th' }, _('Conn.')),
					E('th', { 'class': 'th' }, _('Down. (Bytes)')),
					E('th', { 'class': 'th' }, _('Down. (Pkts.)')),
					E('th', { 'class': 'th' }, _('Up. (Bytes)')),
					E('th', { 'class': 'th' }, _('Up. (Pkts.)')),
				])
			])
		]);

		var rows = [];

		for (var i = 0; i < detailData.length; i++) {
			var rec = detailData[i],
			    cell = E('div', rec[col] || _('other'));

			rows.push([
				cell,
				[ rec.conns,    '%1000.2m'.format(rec.conns)     ],
				[ rec.rx_bytes, '%1024.2mB'.format(rec.rx_bytes) ],
				[ rec.rx_pkts,  '%1000.2mP'.format(rec.rx_pkts)  ],
				[ rec.tx_bytes, '%1024.2mB'.format(rec.tx_bytes) ],
				[ rec.tx_pkts,  '%1000.2mP'.format(rec.tx_pkts)  ]
			]);

			rxData.push({
				label: ['%s: %%1024.2mB'.format(rec[col] || _('other')), cell],
				value: rec.rx_bytes
			});

			txData.push({
				label: ['%s: %%1024.2mB'.format(rec[col] || _('other')), cell],
				value: rec.tx_bytes
			});
		}

		cbi_update_table(tooltip.lastElementChild, rows);

		this.pie(tooltip.querySelector('#bubble-pie1'), rxData);
		this.pie(tooltip.querySelector('#bubble-pie2'), txData);

		var mac = key.toUpperCase();
		var name = hostInfo.hasOwnProperty(mac) ? hostInfo[mac].name : null;

		if (!name)
			for (var i = 0; i < detailData.length; i++)
				if ((name = hostNames[detailData[i].ip]) !== undefined)
					break;

		if (mac !== '00:00:00:00:00:00') {
			this.kpi(tooltip.querySelector('#bubble-hostname'), name);
			this.kpi(tooltip.querySelector('#bubble-vendor'), this.oui(mac));
		}
		else {
			this.kpi(tooltip.querySelector('#bubble-hostname'));
			this.kpi(tooltip.querySelector('#bubble-vendor'));
		}

		var rect = node.getBoundingClientRect(), x, y;

		if ('ontouchstart' in window || window.innerWidth <= 992) {
			var vpHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
			    scrollFrom = window.pageYOffset,
			    scrollTo = scrollFrom + rect.top - vpHeight * 0.5,
			    start = null;

			tooltip.style.top = (rect.top + rect.height + window.pageYOffset) + 'px';
			tooltip.style.left = 0;

			var scrollStep = function(timestamp) {
				if (!start)
					start = timestamp;

				var duration = Math.max(timestamp - start, 1);
				if (duration < 100) {
					document.body.scrollTop = scrollFrom + (scrollTo - scrollFrom) * (duration / 100);
					window.requestAnimationFrame(scrollStep);
				}
				else {
					document.body.scrollTop = scrollTo;
				}
			};

			window.requestAnimationFrame(scrollStep);
		}
		else {
			x = rect.left + rect.width + window.pageXOffset,
		    y = rect.top + window.pageYOffset;

			if ((y + tooltip.offsetHeight) > (window.innerHeight + window.pageYOffset))
				y -= ((y + tooltip.offsetHeight) - (window.innerHeight + window.pageYOffset));

			tooltip.style.top = y + 'px';
			tooltip.style.left = x + 'px';
		}

		return false;
	},

	getL7ProtoDesc: function(id) {
		return l7proto[id] ? l7proto[id].desc : _('Initial traffic');
	},

	renderLayer7Speed: function(data, pie, kpi) {
		var rows = [];
		var rx_data = [], tx_data = [];
		var rx_total = 0, tx_total = 0;
		var topRx = [[0],[0],[0]], topTx = [[0],[0],[0]];

		for (var i = 0; i < data.dpi_stats.length; i++) {
			var rec = data.dpi_stats[i];
			if (rec.egress == 0 && rec.ingress == 0)
				continue;
			[ rec.rx_bytes, '%1024.2mB'.format(rec.rx_bytes) ],
			rows.push([
				this.getL7ProtoDesc(rec.dpi_id),
				[ rec.egress, '%1024.2mbps'.format(rec.egress) ],
				[ rec.egress_bytes, '%1024.2mB'.format(rec.egress_bytes) ],
				[ rec.egress_packets, '%1000.2mP'.format(rec.egress_packets) ],
				[ rec.ingress, '%1024.2mbps'.format(rec.ingress) ],
				[ rec.ingress_bytes, '%1024.2mB'.format(rec.ingress_bytes) ],
				[ rec.ingress_packets, '%1000.2mP'.format(rec.ingress_packets) ]
			]);
			rx_total += rec.ingress;
			tx_total += rec.egress;
			rx_data.push({
				value: rec.ingress,
				label: [this.getL7ProtoDesc(rec.dpi_id)]
			});
			tx_data.push({
				value: rec.egress,
				label: [this.getL7ProtoDesc(rec.dpi_id)]
			});
			topRx.push([rec.ingress, this.getL7ProtoDesc(rec.dpi_id)]);
			topTx.push([rec.egress, this.getL7ProtoDesc(rec.dpi_id)]);
		}

		cbi_update_table('#layer7-speed-data', rows, E('em', _('No data recorded yet.')));

		pie('layer7-speed-rx-pie', rx_data);
		pie('layer7-speed-tx-pie', tx_data);

		topRx.sort(function(a, b) { return b[0] - a[0] });
		topTx.sort(function(a, b) { return b[0] - a[0] });

		kpi('layer7-speed-total', '%u'.format(rows.length));
		kpi('layer7-speed-most-rx', topRx[0][1], topRx[1][1], topRx[2][1]);
		kpi('layer7-speed-most-tx', topTx[0][1], topTx[1][1], topTx[2][1]);
	},

	renderHostSpeed: function(data, pie, kpi, is_ipv6) {
		var rows = [];
		var rx_data = [], tx_data = [];
		var rx_total = 0, tx_total = 0;
		var recs = is_ipv6?data.ipv6_stats:data.ipv4_stats;

		for (var i = 0; i < recs.length; i++) {
			var rec = recs[i];
			if (rec.egress === 0 && rec.ingress === 0)
				continue;
			rows.push([
				rec.addr,
				[ rec.egress, '%1024.2mbps'.format(rec.egress) ],
				[ rec.egress_bytes, '%1024.2mB'.format(rec.egress_bytes) ],
				[ rec.egress_packets, '%1000.2mP'.format(rec.egress_packets) ],
				[ rec.ingress, '%1024.2mbps'.format(rec.ingress) ],
				[ rec.ingress_bytes, '%1024.2mB'.format(rec.ingress_bytes) ],
				[ rec.ingress_packets, '%1000.2mP'.format(rec.ingress_packets) ]
			]);
			rx_total += rec.ingress;
			tx_total += rec.egress;
			rx_data.push({
				value: rec.ingress,
				label: [rec.addr]
			});
			tx_data.push({
				value: rec.egress,
				label: [rec.addr]
			});
		}

		if (is_ipv6) {
			cbi_update_table('#ipv6-speed-data', rows, E('em', _('No data recorded yet.')));
		} else {
			cbi_update_table('#speed-data', rows, E('em', _('No data recorded yet.')));
		}
		
		if (is_ipv6) {
			pie('ipv6-speed-rx-pie', rx_data);
			pie('ipv6-speed-tx-pie', tx_data);

			kpi('ipv6-speed-rx-max', '%1024.2mbps'.format(rx_total));
			kpi('ipv6-speed-tx-max', '%1024.2mbps'.format(tx_total));
			kpi('ipv6-speed-host', '%u'.format(rows.length));
		} else {
			pie('speed-rx-pie', rx_data);
			pie('speed-tx-pie', tx_data);

			kpi('speed-rx-max', '%1024.2mbps'.format(rx_total));
			kpi('speed-tx-max', '%1024.2mbps'.format(tx_total));
			kpi('speed-host', '%u'.format(rows.length));
		}
	},

	pollChaQoSData: function() {
		poll.add(L.bind(function() {
			var pie = this.pie.bind(this);
			var kpi = this.kpi.bind(this);
			var renderHostSpeed = this.renderHostSpeed.bind(this);
			var renderLayer7Speed = this.renderLayer7Speed.bind(this);
			return fs.exec_direct('/usr/libexec/nlbwmon-action', [ 'chastats' ], 'json').then(function(data) {
				renderHostSpeed(data, pie, kpi, false);
				renderHostSpeed(data, pie, kpi, true);
				renderLayer7Speed(data, pie, kpi);    
			});
		}, this), 5);
	},

	render: function() {
		document.addEventListener('tooltip-open', L.bind(function(ev) {
			this.renderHostDetail(ev.detail.target, ev.target);
		}, this));

		if ('ontouchstart' in window) {
			document.addEventListener('touchstart', function(ev) {
				var tooltip = document.querySelector('.cbi-tooltip');
				if (tooltip === ev.target || tooltip.contains(ev.target))
					return;

				ui.hideTooltip(ev);
			});
		}

		var node = E([], [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('view/nlbw.css') }),
			E('script', {
				'type': 'text/javascript',
				'src': L.resource('nlbw.chart.min.js')
			}),

			E('h2', [ _('Network Speed Monitor') ]),

			E('div', [
				E('div', { 'class': 'cbi-section', 'data-tab': 'speed', 'data-tab-title': _('Speed Distribution') }, [
					E('div', { 'class': 'head' }, [
						E('div', { 'class': 'pie' }, [
							E('label', [ _('Download Speed / Host') ]),
							E('canvas', { 'id': 'speed-tx-pie', 'width': 200, 'height': 200 })
						]),

						E('div', { 'class': 'pie' }, [
							E('label', [ _('Upload Speed / Host') ]),
							E('canvas', { 'id': 'speed-rx-pie', 'width': 200, 'height': 200 })
						]),

						E('div', { 'class': 'kpi' }, [
							E('ul', [
								E('li', _('<big id="speed-host">0</big> hosts')),
								E('li', _('<big id="speed-rx-max">0</big> upload speed')),
								E('li', _('<big id="speed-tx-max">0</big> download speed')),
							])
						])
					]),

					E('table', { 'class': 'table', 'id': 'speed-data' }, [
						E('tr', { 'class': 'tr table-titles' }, [
							E('th', { 'class': 'th left hostname' }, [ _('Host') ]),
							E('th', { 'class': 'th right' }, [ _('Download Speed (Bit/s)') ]),
							E('th', { 'class': 'th right' }, [ _('Download (Bytes)') ]),
							E('th', { 'class': 'th right' }, [ _('Download (Packets)') ]),
							E('th', { 'class': 'th right' }, [ _('Upload Speed (Bit/s)') ]),
							E('th', { 'class': 'th right' }, [ _('Upload (Bytes)') ]),
							E('th', { 'class': 'th right' }, [ _('Upload (Packets)') ]),
						]),
						E('tr', { 'class': 'tr placeholder' }, [
							E('td', { 'class': 'td' }, [
								E('em', { 'class': 'spinning' }, [ _('Collecting data...') ])
							])
						])
					])
				]),

				E('div', { 'class': 'cbi-section', 'data-tab': 'layer7', 'data-tab-title': _('Application Protocols') }, [
					E('div', { 'class': 'head' }, [
						E('div', { 'class': 'pie' }, [
							E('label', [ _('Download / Application') ]),
							E('canvas', { 'id': 'layer7-speed-rx-pie', 'width': 200, 'height': 200 })
						]),

						E('div', { 'class': 'pie' }, [
							E('label', [ _('Upload / Application') ]),
							E('canvas', { 'id': 'layer7-speed-tx-pie', 'width': 200, 'height': 200 })
						]),

						E('div', { 'class': 'kpi' }, [
							E('ul', [
								E('li', _('<big id="layer7-speed-total">0</big> different application protocols')),
								E('li', _('<big id="layer7-speed-most-rx">0</big> cause the most download')),
								E('li', _('<big id="layer7-speed-most-tx">0</big> cause the most upload'))
							])
						])
					]),

					E('table', { 'class': 'table', 'id': 'layer7-speed-data' }, [
						E('tr', { 'class': 'tr table-titles' }, [
							E('th', { 'class': 'th left' }, [ _('Application') ]),
							E('th', { 'class': 'th right' }, [ _('Download Speed (Bit/s)') ]),
							E('th', { 'class': 'th right' }, [ _('Download (Bytes)') ]),
							E('th', { 'class': 'th right' }, [ _('Download (Packets)') ]),
							E('th', { 'class': 'th right' }, [ _('Upload Speed (Bit/s)') ]),
							E('th', { 'class': 'th right' }, [ _('Upload (Bytes)') ]),
							E('th', { 'class': 'th right' }, [ _('Upload (Packets)') ]),
						]),
						E('tr', { 'class': 'tr placeholder' }, [
							E('td', { 'class': 'td' }, [
								E('em', { 'class': 'spinning' }, [ _('Collecting data...') ])
							])
						])
					])
				]),

				E('div', { 'class': 'cbi-section', 'data-tab': 'ipv6', 'data-tab-title': _('IPv6') }, [
					E('div', { 'class': 'head' }, [
						E('div', { 'class': 'pie' }, [
							E('label', [ _('Download Speed / Host') ]),
							E('canvas', { 'id': 'ipv6-speed-tx-pie', 'width': 200, 'height': 200 })
						]),

						E('div', { 'class': 'pie' }, [
							E('label', [ _('Upload Speed / Host') ]),
							E('canvas', { 'id': 'ipv6-speed-rx-pie', 'width': 200, 'height': 200 })
						]),

						E('div', { 'class': 'kpi' }, [
							E('ul', [
								E('li', _('<big id="ipv6-speed-host">0</big> hosts')),
								E('li', _('<big id="ipv6-speed-rx-max">0</big> upload speed')),
								E('li', _('<big id="ipv6-speed-tx-max">0</big> download speed')),
							])
						])
					]),

					E('table', { 'class': 'table', 'id': 'ipv6-speed-data' }, [
						E('tr', { 'class': 'tr table-titles' }, [
							E('th', { 'class': 'th left hostname' }, [ _('Host') ]),
							E('th', { 'class': 'th right' }, [ _('Download Speed (Bit/s)') ]),
							E('th', { 'class': 'th right' }, [ _('Download (Bytes)') ]),
							E('th', { 'class': 'th right' }, [ _('Download (Packets)') ]),
							E('th', { 'class': 'th right' }, [ _('Upload Speed (Bit/s)') ]),
							E('th', { 'class': 'th right' }, [ _('Upload (Bytes)') ]),
							E('th', { 'class': 'th right' }, [ _('Upload (Packets)') ]),
						]),
						E('tr', { 'class': 'tr placeholder' }, [
							E('td', { 'class': 'td' }, [
								E('em', { 'class': 'spinning' }, [ _('Collecting data...') ])
							])
						])
					]),
				])
			])
		]);

		ui.tabs.initTabGroup(node.lastElementChild.childNodes);

		this.pollChaQoSData();

		return node;
	},

	handleSave: null,
	handleSaveApply: null,
	handleReset: null
});
