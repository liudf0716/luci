'use strict';
'require view';
'require form';
'require uci';

return view.extend({
	load: function() {
		return uci.load('aw-bpf');
	},

	render: function() {
		var m, s, o;

		m = new form.Map('aw-bpf', _('aw-bpf'),
			_('eBPF traffic control, session logging and DNS tools. Captive portal whitelist is configured in apfree-wifidog, not here.'));

		s = m.section(form.TypedSection, 'aw-bpf', _('General'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'enable_event_log', _('Enable aw-eventd'),
			_('Start the session/DNS consumer. Reads dns_ringbuf; does not consume the portal ring buffer.'));
		o.rmempty = false;
		o.default = '0';

		o = s.option(form.Flag, 'enable_qos', _('Enable QoS defaults'));
		o.rmempty = true;

		o = s.option(form.Value, 'qos_down', _('Default download (Mbps)'));
		o.datatype = 'uinteger';
		o.depends('enable_qos', '1');

		o = s.option(form.Value, 'qos_up', _('Default upload (Mbps)'));
		o.datatype = 'uinteger';
		o.depends('enable_qos', '1');

		o = s.option(form.Value, 'ip_timeout', _('DNS trust IP timeout (seconds)'),
			_('Timeout for IPs written to nftables table inet awbpf (trust4/trust6).'));
		o.datatype = 'uinteger';
		o.placeholder = '3600';

		o = s.option(form.DynamicList, 'trusted_wildcard_domains',
			_('Trusted wildcard domains (inet awbpf)'),
			_('Patterns such as *.example.com or .example.com. Matching DNS answers are added to table inet awbpf only, not inet wifidogx.'));
		o.optional = true;
		o.rmempty = true;
		o.placeholder = '.example.com';

		return m.render();
	}
});
