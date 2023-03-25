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
	return L.resolveDefault(callServiceList('ss-redir'), {}).then(function (res) {
		var isRunning = false;
		try {
			isRunning = res['ss-redir']['instances']['instance1']['running'];
		} catch (e) { }
		return isRunning;
	});
}

function renderStatus(isRunning) {
	var renderHTML = "";
	var spanTemp = '<em><span style="color:%s"><strong>%s %s</strong></span></em>';

	if (isRunning) {
		renderHTML += String.format(spanTemp, 'green', _("ss-redir "), _("running..."));
	} else {
		renderHTML += String.format(spanTemp, 'red', _("ss-redir "), _("not running..."));
	}

	return renderHTML;
}

return view.extend({
	render: function() {
		var m, s, o;

		m = new form.Map('ss-redir', _('ss-redir'));
		m.description = _("ss-redir redirect tcp service to kcptun client process.");

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

        s = m.section(form.NamedSection, 'server', 'ss_redir');
		s.dynamic = true;

        // add two tabs 
        s.tab('server', _('Shadowsocks Server Settings'));
        s.tab('ss-redir', _('ss-redir Settings'));

        // server settings
        o = s.taboption('server', form.Value, "server", _("Server Address"),
            _("The address of kcptun client listening on. default: 127.0.0.1"));
        o.datatype = "host";
        o.rmempty = false;
        o = s.taboption('server', form.Value, "server_port", _("Server Port"),
            _("The port of kcptun client listening on. default: 12948"));
        o.datatype = "port";
        o.rmempty = false;
        o = s.taboption('server', form.Value, "password", _("Password"),
            _("The password of shadowsocks server"));
        o.password = true;
        o.rmempty = false;
        o = s.taboption('server', form.ListValue, "encrypt", _("Encryption Method"),
            _("The encryption method of shadowsocks server"));
        o.value("aes-128-cfb", _("aes-128-cfb"));
        o.value("aes-192-cfb", _("aes-192-cfb"));
        o.value("aes-256-cfb", _("aes-256-cfb"));
        o.value("aes-128-gcm", _("aes-128-gcm"));
        o.value("aes-192-gcm", _("aes-192-gcm"));
        o.value("aes-256-gcm", _("aes-256-gcm"));
        o.value("chaCha20-ietf-poly1305", _("chaCha20-ietf-poly1305"));
        o.value("xChaCha20-ietf-poly1305", _("xChaCha20-ietf-poly1305")); 
        o.rmempty = false;

        // ss-redir settings
        o = s.taboption('ss-redir', form.Flag, "enabled", _("Enable"),
            _("Enable ss-redir service"));
        o.rmempty = false;


		return m.render();
	}
});
