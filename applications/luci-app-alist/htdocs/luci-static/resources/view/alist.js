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
	return L.resolveDefault(callServiceList('alist'), {}).then(function (res) {
		var isRunning = false;
		try {
			running = res['alist']['instances']['alist']['running'];
		} catch (e) { }
		return isRunning;
	});
}

function renderStatus(isRunning) {
	var renderHTML = "";
	var spanTemp = '<em><span style="color:%s"><strong>%s %s</strong></span></em>';

	if (isRunning) {
		renderHTML += String.format(spanTemp, 'green', _("alist"), _("running..."));
	} else {
		renderHTML += String.format(spanTemp, 'red', _("alist"), _("not running..."));
	}

	return renderHTML;
}

return view.extend({
	render: function() {
		var m, s, o;

		m = new form.Map('alist', _('Alist'));
		m.description = _("A file list program that supports multiple storage.");

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

		s = m.section(form.TypedSection, "alist", _("Alist"), _("Basic Settings"));
		s.anonymous = true;
		// disabled
		o = s.option(form.Flag, 'enabled', _('Enable'), _('Enable alist service'));
		o.rmempty = false;
		// auth_server_port
		o = s.option(form.Value, 'port', _('Port'), _('The port of alist server'));
		o.rmempty = false;
		o.datatype = 'port';
        // tmp_dir
        o = s.option(form.Value, 'temp_dir', _('Tmp Dir'), _('The tmp dir of alist server'));
        o.rmempty = false;
        o.datatype = 'string';
		

		return m.render();
	}
});

