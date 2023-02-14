'use strict';
'require view';
'require ui';
'require form';
'require rpc';
'require tools.widgets as widgets';

var callServiceList = rpc.declare({
	object: 'service',
	method: 'list',
	params: ['name'],
	expect: { '': {} }
});

return view.extend({
	render: function() {
		var m, s, o;

		m = new form.Map('kcptun', _('kcptun'));
		m.description = _("kcptun is a Stable & Secure Tunnel Based On KCP with N:M Multiplexing.");

		s = m.section(form.TypedSection, "client", _("Client"), _("Client Settings"));
		s.anonymous = true;
		// add client settings
		// disabled
		o = s.option(form.Flag, 'disabled', _('Disabled'), _('Disable this kcptun client instance'));
		o.rmempty = false;
		// local_port
		o = s.option(form.Value, 'local_port', _('Local port'), _('Local port to listen'));
		o.datatype = 'port';
		o.rmempty = false;
		// server
		o = s.option(form.Value, 'server', _('Server address'), _('Server address to connect'));
		o.datatype = 'host';
		o.rmempty = false;
		// server_port
		o = s.option(form.Value, 'server_port', _('Server port'), _('Server port-range to connect'));
		o.datatype = 'string';
		o.rmempty = false;
		// key
		o = s.option(form.Value, 'key', _('Key'), _('Pre-shared secret between client and server'));
		o.password = true;
		o.rmempty = false;

		

		return m.render();
	}
});
