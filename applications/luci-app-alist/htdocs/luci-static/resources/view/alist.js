'use strict';
'require view';
'require ui';
'require form';
'require rpc';
'require uci'
'require fs';
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
			isRunning = res['alist']['instances']['alist']['running'];
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
	load: function() {
		return Promise.all([
			L.resolveDefault(fs.exec('/usr/bin/alist', ['version']), null),
		]);
	},

	render: function(stats) {
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
		
		o = s.option(form.DummyValue, 'alist_info', _('Alist Information'), _('Alist Information'));

		o.render = L.bind(function(view, section_id) {
			var table = E('table', { 'class': 'table' }, [
				E('tr', { 'class': 'tr table-titles' }, [
					E('th', { 'class': 'th' }, _('Information')),
					E('th', { 'class': 'th' }, _('Value')),
				])
			]);
			// get alist listen port
			var port = uci.get('alist', section_id, 'port');
			// get router ip
			var ip = window.location.hostname;
			if (port == null || port == '') {
				port = '5244';
			}
			var url = "http://" + ip + ":" + port;

			var rows = [];
			rows.push([ _('Version'), '3.18.0' ]);
			rows.push([ _('Default User'), 'admin' ]);
			rows.push([ _('Default Password'), 'chatgptwrt' ]);
			rows.push([ _('Visit Url'), url ]);

			cbi_update_table(table, rows, E('em', _('Unable to obtain alist information')));

			return E([], [ E('h3', _('Alist Information')), table ]);
		}, o, this);

		return m.render();
	}
});

