'use strict';
'require baseclass';
'require rpc';
'require uci';
'require network';
'require validation';

document.head.append(E('style', { 'type': 'text/css' },
	`
.dhcp-info-container {
	background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
	border-radius: 12px;
	padding: 20px;
	margin: 16px 0;
	border: 1px solid rgba(255,255,255,0.15);
	box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
:root[data-darkmode="true"] .dhcp-info-container {
	background: linear-gradient(135deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 100%);
	border-color: rgba(255,255,255,0.1);
	box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
.dhcp-section-title {
	font-size: 18px;
	font-weight: 600;
	color: #495057;
	margin-bottom: 16px;
	display: flex;
	align-items: center;
	border-bottom: 2px solid rgba(0,123,255,0.2);
	padding-bottom: 8px;
}
:root[data-darkmode="true"] .dhcp-section-title {
	color: #adb5bd;
}
.dhcp-section-title::before {
	margin-right: 8px;
	font-size: 20px;
}
.dhcp-section-title.dhcp4::before {
	content: "📡";
}
.dhcp-section-title.dhcp6::before {
	content: "🌐";
}
.dhcp-leases-table {
	width: 100%;
	border-collapse: separate;
	border-spacing: 0;
	background: white;
	margin-top: 12px;
	border-radius: 8px;
	overflow: hidden;
	box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
:root[data-darkmode="true"] .dhcp-leases-table {
	background: rgba(33, 37, 41, 0.8);
	box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
.dhcp-leases-table .tr {
	transition: all 0.2s ease;
}
.dhcp-leases-table .tr:not(.table-titles):hover {
	background: rgba(0,123,255,0.04);
	transform: none;
	box-shadow: none;
}
:root[data-darkmode="true"] .dhcp-leases-table .tr:not(.table-titles):hover {
	background: rgba(0,123,255,0.08);
}
.dhcp-leases-table .table-titles {
	background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
	border-bottom: 2px solid #007bff;
	color: #495057;
	font-weight: 600;
	position: sticky;
	top: 0;
	z-index: 10;
}
:root[data-darkmode="true"] .dhcp-leases-table .table-titles {
	background: linear-gradient(135deg, #343a40 0%, #495057 100%);
	border-bottom-color: #66b3ff;
	color: #adb5bd;
}
.dhcp-leases-table .table-titles .th {
	padding: 16px 20px;
	text-align: left;
	border: none;
	font-size: 14px;
	color: #212529 !important;
	font-weight: 700;
	text-transform: none;
	letter-spacing: 0.3px;
	position: relative;
	white-space: nowrap;
}
:root[data-darkmode="true"] .dhcp-leases-table .table-titles .th {
	color: #f8f9fa !important;
}
.dhcp-leases-table .table-titles .th:first-child {
	border-radius: 8px 0 0 0;
}
.dhcp-leases-table .table-titles .th:last-child {
	border-radius: 0 8px 0 0;
}
.dhcp-leases-table .table-titles .th:not(:last-child)::after {
	content: '';
	position: absolute;
	right: 0;
	top: 25%;
	height: 50%;
	width: 1px;
	background: rgba(0,0,0,0.1);
}
:root[data-darkmode="true"] .dhcp-leases-table .table-titles .th:not(:last-child)::after {
	background: rgba(255,255,255,0.1);
}
.dhcp-leases-table .tr:not(.table-titles) .th,
.dhcp-leases-table .tr:not(.table-titles) .td {
	padding: 14px 16px;
	border-bottom: 1px solid rgba(0,0,0,0.06);
	vertical-align: middle;
	background: transparent;
	text-align: left;
}
:root[data-darkmode="true"] .dhcp-leases-table .tr:not(.table-titles) .th,
:root[data-darkmode="true"] .dhcp-leases-table .tr:not(.table-titles) .td {
	border-bottom-color: rgba(255,255,255,0.08);
}
.dhcp-leases-table .tr:last-child .th,
.dhcp-leases-table .tr:last-child .td {
	border-bottom: none;
}
.dhcp-leases-table .cbi-section-actions {
	text-align: center;
}
.dhcp-leases-table .table-titles .cbi-section-actions {
	text-align: center;
}
.dhcp-lease-hostname {
	font-weight: 600;
	color: #495057;
}
:root[data-darkmode="true"] .dhcp-lease-hostname {
	color: #adb5bd;
}
.dhcp-lease-ip {
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	background: rgba(0,123,255,0.1);
	padding: 4px 8px;
	border-radius: 4px;
	font-size: 13px;
	color: #007bff;
}
:root[data-darkmode="true"] .dhcp-lease-ip {
	background: rgba(0,123,255,0.2);
	color: #66b3ff;
}
.dhcp-lease-mac {
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	background: rgba(108,117,125,0.1);
	padding: 4px 8px;
	border-radius: 4px;
	font-size: 13px;
	color: #6c757d;
}
:root[data-darkmode="true"] .dhcp-lease-mac {
	background: rgba(108,117,125,0.2);
	color: #adb5bd;
}
.dhcp-lease-time {
	color: #28a745;
	font-weight: 500;
}
.dhcp-lease-time em {
	color: #dc3545;
	font-style: normal;
}
.dhcp-static-button {
	background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
	border: none;
	color: white;
	padding: 6px 12px;
	border-radius: 6px;
	font-size: 12px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
	box-shadow: 0 2px 4px rgba(40,167,69,0.2);
}
.dhcp-static-button:hover:not(:disabled) {
	transform: translateY(-1px);
	box-shadow: 0 4px 8px rgba(40,167,69,0.3);
}
.dhcp-static-button:disabled {
	background: #6c757d;
	cursor: not-allowed;
	opacity: 0.6;
}
.dhcp-no-leases {
	text-align: center;
	padding: 40px 20px;
	color: #6c757d;
	font-style: italic;
}
:root[data-darkmode="true"] .dhcp-no-leases {
	color: #adb5bd;
}
.dhcp-stats-container {
	display: flex;
	gap: 16px;
	margin-bottom: 20px;
	flex-wrap: wrap;
}
.dhcp-stat-card {
	background: rgba(0,123,255,0.1);
	border-radius: 8px;
	padding: 16px;
	flex: 1;
	min-width: 150px;
	text-align: center;
	border: 1px solid rgba(0,123,255,0.2);
}
:root[data-darkmode="true"] .dhcp-stat-card {
	background: rgba(0,123,255,0.15);
	border-color: rgba(0,123,255,0.3);
}
.dhcp-stat-number {
	font-size: 24px;
	font-weight: 700;
	color: #007bff;
	display: block;
}
:root[data-darkmode="true"] .dhcp-stat-number {
	color: #66b3ff;
}
.dhcp-stat-label {
	font-size: 12px;
	color: #6c757d;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	margin-top: 4px;
}
:root[data-darkmode="true"] .dhcp-stat-label {
	color: #adb5bd;
}
	`
));

var callLuciDHCPLeases = rpc.declare({
	object: 'luci-rpc',
	method: 'getDHCPLeases',
	expect: { '': {} }
});

return baseclass.extend({
	title: '',

	isMACStatic: {},
	isDUIDStatic: {},

	load: function () {
		return Promise.all([
			callLuciDHCPLeases(),
			network.getHostHints(),
			L.resolveDefault(uci.load('dhcp'))
		]);
	},

	handleCreateStaticLease: function (lease, ev) {
		ev.currentTarget.classList.add('spinning');
		ev.currentTarget.disabled = true;
		ev.currentTarget.blur();

		var cfg = uci.add('dhcp', 'host');
		uci.set('dhcp', cfg, 'name', lease.hostname);
		uci.set('dhcp', cfg, 'ip', lease.ipaddr);
		uci.set('dhcp', cfg, 'mac', [lease.macaddr.toUpperCase()]);

		return uci.save()
			.then(L.bind(L.ui.changes.init, L.ui.changes))
			.then(L.bind(L.ui.changes.displayChanges, L.ui.changes));
	},

	handleCreateStaticLease6: function (lease, ev) {
		ev.currentTarget.classList.add('spinning');
		ev.currentTarget.disabled = true;
		ev.currentTarget.blur();

		var cfg = uci.add('dhcp', 'host'),
			ip6arr = lease.ip6addrs[0] ? validation.parseIPv6(lease.ip6addrs[0]) : null;

		uci.set('dhcp', cfg, 'name', lease.hostname);
		uci.set('dhcp', cfg, 'duid', lease.duid.toUpperCase());
		uci.set('dhcp', cfg, 'mac', [lease.macaddr]);
		if (ip6arr)
			uci.set('dhcp', cfg, 'hostid', (ip6arr[6] * 0xFFFF + ip6arr[7]).toString(16));

		return uci.save()
			.then(L.bind(L.ui.changes.init, L.ui.changes))
			.then(L.bind(L.ui.changes.displayChanges, L.ui.changes));
	},

	renderLeases: function (data) {
		var leases = Array.isArray(data[0].dhcp_leases) ? data[0].dhcp_leases : [],
			leases6 = Array.isArray(data[0].dhcp6_leases) ? data[0].dhcp6_leases : [],
			machints = data[1].getMACHints(false),
			hosts = uci.sections('dhcp', 'host'),
			isReadonlyView = !L.hasViewPermission();

		for (var i = 0; i < hosts.length; i++) {
			var host = hosts[i];

			if (host.mac) {
				var macs = L.toArray(host.mac);
				for (var j = 0; j < macs.length; j++) {
					var mac = macs[j].toUpperCase();
					this.isMACStatic[mac] = true;
				}
			}
			if (host.duid) {
				var duid = host.duid.toUpperCase();
				this.isDUIDStatic[duid] = true;
			}
		}

		// 统计信息
		var activeLeases = leases.filter(function (lease) { return lease.expires > 0 || lease.expires === false; }).length;
		var expiredLeases = leases.filter(function (lease) { return lease.expires <= 0 && lease.expires !== false; }).length;
		var staticLeases = hosts.length;
		var activeLeases6 = leases6.filter(function (lease) { return lease.expires > 0 || lease.expires === false; }).length;

		var table = E('table', { 'id': 'status_leases', 'class': 'dhcp-leases-table' }, [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th' }, _('Hostname')),
				E('th', { 'class': 'th' }, _('IPv4 Address')),
				E('th', { 'class': 'th' }, _('MAC Address')),
				E('th', { 'class': 'th' }, _('Lease Time')),
				isReadonlyView ? E([]) : E('th', { 'class': 'th cbi-section-actions' }, _('Actions'))
			])
		]);

		cbi_update_table(table, leases.map(L.bind(function (lease) {
			var exp, rows;

			if (lease.expires === false)
				exp = E('span', { 'class': 'dhcp-lease-time' }, E('em', _('unlimited')));
			else if (lease.expires <= 0)
				exp = E('span', { 'class': 'dhcp-lease-time' }, E('em', _('expired')));
			else
				exp = E('span', { 'class': 'dhcp-lease-time' }, '%t'.format(lease.expires));

			var hint = lease.macaddr ? machints.filter(function (h) { return h[0] == lease.macaddr })[0] : null,
				host = null;

			if (hint && lease.hostname && lease.hostname != hint[1])
				host = '%s (%s)'.format(lease.hostname, hint[1]);
			else if (lease.hostname)
				host = lease.hostname;

			rows = [
				E('span', { 'class': 'dhcp-lease-hostname' }, host || '-'),
				E('span', { 'class': 'dhcp-lease-ip' }, lease.ipaddr),
				E('span', { 'class': 'dhcp-lease-mac' }, lease.macaddr),
				exp
			];

			if (!isReadonlyView && lease.macaddr != null) {
				var mac = lease.macaddr.toUpperCase();
				rows.push(E('button', {
					'class': 'dhcp-static-button',
					'click': L.bind(this.handleCreateStaticLease, this, lease),
					'disabled': this.isMACStatic[mac],
					'title': this.isMACStatic[mac] ? _('Already static') : _('Create static lease')
				}, [this.isMACStatic[mac] ? _('Static') : _('Set Static')]));
			}

			return rows;
		}, this)), E('div', { 'class': 'dhcp-no-leases' }, _('No active DHCP leases found')));

		var table6 = E('table', { 'id': 'status_leases6', 'class': 'dhcp-leases-table' }, [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th' }, _('Hostname')),
				E('th', { 'class': 'th' }, _('IPv6 Address')),
				E('th', { 'class': 'th' }, _('DUID')),
				E('th', { 'class': 'th' }, _('Lease Time')),
				isReadonlyView ? E([]) : E('th', { 'class': 'th cbi-section-actions' }, _('Actions'))
			])
		]);

		cbi_update_table(table6, leases6.map(L.bind(function (lease) {
			var exp, rows;

			if (lease.expires === false)
				exp = E('span', { 'class': 'dhcp-lease-time' }, E('em', _('unlimited')));
			else if (lease.expires <= 0)
				exp = E('span', { 'class': 'dhcp-lease-time' }, E('em', _('expired')));
			else
				exp = E('span', { 'class': 'dhcp-lease-time' }, '%t'.format(lease.expires));

			var hint = lease.macaddr ? machints.filter(function (h) { return h[0] == lease.macaddr })[0] : null,
				host = null;

			if (hint && lease.hostname && lease.hostname != hint[1] && lease.ip6addr != hint[1])
				host = '%s (%s)'.format(lease.hostname, hint[1]);
			else if (lease.hostname)
				host = lease.hostname;
			else if (hint)
				host = hint[1];

			var ipv6Display = lease.ip6addrs ?
				lease.ip6addrs.map(function (ip) {
					return E('div', { 'class': 'dhcp-lease-ip' }, ip);
				}) :
				E('span', { 'class': 'dhcp-lease-ip' }, lease.ip6addr);

			rows = [
				E('span', { 'class': 'dhcp-lease-hostname' }, host || '-'),
				ipv6Display,
				E('span', { 'class': 'dhcp-lease-mac' }, lease.duid),
				exp
			];

			if (!isReadonlyView && lease.duid != null) {
				var duid = lease.duid.toUpperCase();
				rows.push(E('button', {
					'class': 'dhcp-static-button',
					'click': L.bind(this.handleCreateStaticLease6, this, lease),
					'disabled': this.isDUIDStatic[duid],
					'title': this.isDUIDStatic[duid] ? _('Already static') : _('Create static lease')
				}, [this.isDUIDStatic[duid] ? _('Static') : _('Set Static')]));
			}

			return rows;
		}, this)), E('div', { 'class': 'dhcp-no-leases' }, _('No active DHCPv6 leases found')));

		return E('div', { 'class': 'dhcp-info-container' }, [
			// 统计信息卡片
			E('div', { 'class': 'dhcp-stats-container' }, [
				E('div', { 'class': 'dhcp-stat-card' }, [
					E('span', { 'class': 'dhcp-stat-number' }, activeLeases.toString()),
					E('div', { 'class': 'dhcp-stat-label' }, _('Active IPv4 Leases'))
				]),
				E('div', { 'class': 'dhcp-stat-card' }, [
					E('span', { 'class': 'dhcp-stat-number' }, activeLeases6.toString()),
					E('div', { 'class': 'dhcp-stat-label' }, _('Active IPv6 Leases'))
				]),
				E('div', { 'class': 'dhcp-stat-card' }, [
					E('span', { 'class': 'dhcp-stat-number' }, staticLeases.toString()),
					E('div', { 'class': 'dhcp-stat-label' }, _('Static Leases'))
				]),
				expiredLeases > 0 ? E('div', { 'class': 'dhcp-stat-card' }, [
					E('span', { 'class': 'dhcp-stat-number' }, expiredLeases.toString()),
					E('div', { 'class': 'dhcp-stat-label' }, _('Expired Leases'))
				]) : E([])
			]),

			// IPv4 DHCP租约表
			E('div', { 'class': 'dhcp-section-title dhcp4' }, _('Active DHCP Leases')),
			table,

			// IPv6 DHCP租约表
			E('div', { 'class': 'dhcp-section-title dhcp6' }, _('Active DHCPv6 Leases')),
			table6
		]);
	},

	render: function (data) {
		if (L.hasSystemFeature('dnsmasq') || L.hasSystemFeature('odhcpd'))
			return this.renderLeases(data);

		return E([]);
	}
});
