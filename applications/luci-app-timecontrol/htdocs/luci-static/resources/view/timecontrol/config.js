'use strict';
'require view';
'require form';
'require fs';
'require tools.widgets as widgets';

return view.extend({
	render: async function() {
		var ipaddrs = {};
		var macaddrs = {};

		const dhcpLeases = await fs.exec_direct('/usr/bin/awk', ['-F', ' ', '{print $2, $3, $4}', '/tmp/dhcp.leases'], 'text');
		const dhcpLines = dhcpLeases.split('\n');
		for (let i = 0; i < dhcpLines.length; i++) {
			const line = dhcpLines[i];
			if (line === '') continue;
			const [mac, ip, hostname] = line.split(' ');
			ipaddrs[ip] = hostname;
			macaddrs[mac] = hostname;
		};

		var m, s, o;
		m = new form.Map('timecontrol', _('Internet Time Control'), _('Internet time control for clients (children) by MAC address'));
		m.template = 'timecontrol/index';
		s = m.section(form.TypedSection, 'basic');
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', _('Enable'));
		o.rmempty = false;

		s = m.section(form.GridSection, 'macbind', _('Client Settings'));
		s.anonymous = true;
		s.addremove = true;

		o = s.option(form.Flag, 'enabled', _('Enable'));
		o.rmempty = false;
		o.default = o.enabled;
		o.editable = true;

		o = s.option(form.Value, 'hostname', _('Hostname'));
		o.rmempty = true;
		o.datatype = 'string';
		o.placeholder = 'hostname';

		o = s.option(form.Value, 'ipv4', _('IP Address'));
		o.datatype = 'or(ip4addr,"ignore")';
		L.sortedKeys(ipaddrs, null, 'addr').forEach(function(ipv4) {
			o.value(ipv4, ipaddrs[ipv4] ? '%s (%s)'.format(ipv4, ipaddrs[ipv4]) : ipv4);
		});

		o = s.option(form.Value, 'macaddr', 'MAC');
		o.rmempty = true;
		o.datatype = 'or(macaddr,"ignore")';

		L.sortedKeys(macaddrs, null, 'addr').forEach(function(mac) {
			o.value(mac, macaddrs[mac] ? '%s (%s)'.format(mac, macaddrs[mac]) : mac);
		});

		function validate_time(section, value) {
			const match = value.match(/^(\d{1,2}):(\d{2})$/);
			if (!match) {
				return _("Time HH:MM");
			}

			let hh = parseInt(match[1], 10);
			let mm = parseInt(match[2], 10);

			if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) {
				return true;
			} else {
				return _("Time HH:MM");
			}
		}

		o = s.option(form.Value, 'timeon', _('No Internet start time'));
		o.default = '00:00';
		o.optional = false;
		o.validate = validate_time

		o = s.option(form.Value, 'timeoff', _('No Internet end time'));
		o.default = '23:59';
		o.optional = false;
		o.validate = validate_time

		o = s.option(form.Flag, 'z1', _('Mo'));
		o.rmempty = true;
		o.default = o.enabled;
		o.editable = true;
		o.inline = true;

		o = s.option(form.Flag, 'z2', _('Tu'));
		o.rmempty = true;
		o.default = o.enabled;
		o.editable = true;

		o = s.option(form.Flag, 'z3', _('We'));
		o.rmempty = true;
		o.default = o.enabled;
		o.editable = true;

		o = s.option(form.Flag, 'z4', _('Th'));
		o.rmempty = true;
		o.default = o.enabled;
		o.editable = true;

		o = s.option(form.Flag, 'z5', _('Fr'));
		o.rmempty = true;
		o.default = o.enabled;
		o.editable = true;

		o = s.option(form.Flag, 'z6', _('Sa'));
		o.rmempty = true;
		o.default = o.enabled;
		o.editable = true;

		o = s.option(form.Flag, 'z7', _('Su'));
		o.rmempty = true;
		o.default = o.enabled;
		o.editable = true;

		return m.render();
	}
});
