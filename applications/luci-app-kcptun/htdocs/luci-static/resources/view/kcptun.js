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

function getServiceStatus() {
	return L.resolveDefault(callServiceList('kcptun'), {}).then(function (res) {
		var isRunning = false;
		try {
			var instance1 = res['kcptun']['instances'];
			// if instance1 is not null, then kcptun is running
			if (instance1 != null) {
				isRunning = true;
			}
		} catch (e) { }
		return isRunning;
	});
}

function renderStatus(isRunning) {
	var renderHTML = "";
	var spanTemp = '<em><span style="color:%s"><strong>%s %s</strong></span></em>';

	if (isRunning) {
		renderHTML += String.format(spanTemp, 'green', _("kcptun client"), _("running..."));
	} else {
		renderHTML += String.format(spanTemp, 'red', _("kcptun client"), _("not running..."));
	}

	return renderHTML;
}

return view.extend({
	render: function() {
		var m, s, o;

		m = new form.Map('kcptun', _('kcptun'));
		m.description = _("kcptun is a Stable & Secure Tunnel Based On KCP with N:M Multiplexing.");

		// add kcptun-client status section and option 
		s = m.section(form.NamedSection, '_status');
		s.anonymous = true;
		s.render = function (section_id) {
			L.Poll.add(function () {
				return L.resolveDefault(getServiceStatus()).then(function(res) {
					var view = document.getElementById("service_status");
					view.innerHTML = renderStatus(res);
				});
			});

			return E('div', { class: 'cbi-map' },
				E('fieldset', { class: 'cbi-section'}, [
					E('p', { id: 'service_status' },
						_('Collecting data ...'))
				])
			);
		}

		s = m.section(form.TypedSection, "client", _("Client"), _("Client Settings"));
		s.anonymous = true;
		// add client settings
		// disabled
		o = s.option(form.Flag, 'enabled', _('Enable'), _('Enable this kcptun client instance'));
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
		o.datatype = 'portrange';
		o.rmempty = false;
		// key
		o = s.option(form.Value, 'key', _('Key'), _('Pre-shared secret between client and server'));
		o.password = true;
		o.rmempty = false;

		

		return m.render();
	}
});
