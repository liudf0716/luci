'use strict';
'require view';
'require form';
'require rpc';
'require poll';
'require tools.widgets as widgets';

const callServiceList = rpc.declare({
	object: 'service',
	method: 'list',
	params: ['name'],
	expect: { '': {} }
});

function getServiceStatus() {
	return L.resolveDefault(callServiceList('gpsd'), {}).then(function (res) {
		var isRunning = false;
		try {
			// Check if gpsd service has running instances
			var instances = res['gpsd']['instances'];
			for (var instance in instances) {
				if (instances[instance]['running']) {
					isRunning = true;
					break;
				}
			}
		} catch (e) { }
		return isRunning;
	});
}

function renderStatus(isRunning) {
	var spanTemp = '<em><span style="color:%s"><strong>%s</strong></span></em>';
	
	if (isRunning) {
		return String.format(spanTemp, 'green', _("Running"));
	} else {
		return String.format(spanTemp, 'red', _("Stopped"));
	}
}

return view.extend({
	render: function() {
		var m, s, o;

		m = new form.Map('gpsd', _('GPSD Configuration'), 
			_('GPSD is a daemon that monitors one or more GPS devices and provides location data to client applications.'));

		// Service Status Section
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
					E('legend', {}, _('Service Status')),
					E('p', { id: 'service_status' },
						_('Collecting data ...'))
				])
			);
		};

		// Configuration Section
		s = m.section(form.TypedSection, 'gpsd', _('General Settings'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'enabled', _('Enable GPSD'));
		o.default = '0';
		o.rmempty = false;

		o = s.option(form.Value, 'device', _('GPS Device'));
		o.placeholder = '/dev/ttyS1';
		o.default = '/dev/ttyS1';
		o.datatype = 'string';
		o.rmempty = false;
		o.description = _('Serial device path where GPS receiver is connected (e.g., /dev/ttyUSB0, /dev/ttyS1)');

		o = s.option(form.Value, 'port', _('TCP Port'));
		o.placeholder = '2947';
		o.default = '2947';
		o.datatype = 'port';
		o.rmempty = false;
		o.description = _('TCP port for GPSD daemon to listen on (default: 2947)');

		o = s.option(form.Flag, 'listen_globally', _('Listen Globally'));
		o.default = '0';
		o.rmempty = false;
		o.description = _('Allow connections from any IP address (not just localhost). Enable this if you want to access GPS data from other devices on the network.');

		// Advanced Settings Section
		s = m.section(form.TypedSection, 'gpsd', _('Advanced Settings'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Value, 'options', _('Additional Options'));
		o.optional = true;
		o.placeholder = '-n -P /var/run/gpsd.pid';
		o.description = _('Additional command line options for GPSD daemon. See gpsd manual for available options.');

		return m.render();
	}
});
