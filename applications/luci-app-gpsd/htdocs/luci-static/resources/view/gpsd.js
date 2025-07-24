'use strict';
'require view';
'require form';
'require fs';
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

function getGPSLocation() {
	return L.resolveDefault(fs.exec('/usr/bin/gpspipe', ['-w', '-n', '12']), {}).then(function (res) {
		var locationData = {
			lat: null,
			lon: null,
			alt: null,
			time: null,
			mode: null,
			error: null
		};
		
		if (res.code === 0 && res.stdout) {
			var lines = res.stdout.split('\n');
			var foundTPV = false;
			
			for (var i = 0; i < lines.length; i++) {
				var line = lines[i].trim();
				if (line.length > 0) {
					try {
						var jsonData = JSON.parse(line);
						if (jsonData.class === "TPV") {
							foundTPV = true;
							if (jsonData.lat !== undefined && jsonData.lon !== undefined) {
								locationData.lat = jsonData.lat;
								locationData.lon = jsonData.lon;
								locationData.alt = jsonData.alt || jsonData.altMSL || null;
								locationData.time = jsonData.time;
								locationData.mode = jsonData.mode;
								break;
							}
						}
					} catch (e) {
						// Continue to next line
					}
				}
			}
			
			if (!foundTPV) {
				locationData.error = 'No TPV data found in gpspipe output';
			}
		} else {
			locationData.error = 'Unable to get GPS data. Please check if GPSD is running and GPS device is connected.';
		}
		
		return locationData;
	}).catch(function(err) {
		return {
			lat: null,
			lon: null,
			alt: null,
			time: null,
			mode: null,
			error: 'GPS service unavailable'
		};
	});
}

function renderGPSLocation(data) {
	var content = '';
	
	if (data.lat !== null && data.lon !== null) {
		content += '<div style="background: #f0f8ff; border: 1px solid #b0d4f1; border-radius: 5px; padding: 15px; margin-bottom: 10px;">';
		content += '<div style="display: flex; align-items: center; margin-bottom: 10px;">';
		content += '<span style="color: #28a745; font-size: 18px; margin-right: 8px;">●</span>';
		content += '<strong style="color: #28a745; font-size: 16px;">' + _('GPS Fix Available') + '</strong>';
		content += '</div>';
		
		content += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">';
		
		// Latitude
		content += '<div style="background: white; padding: 10px; border-radius: 3px; border-left: 4px solid #007bff;">';
		content += '<div style="font-size: 12px; color: #666; margin-bottom: 2px;">' + _('Latitude') + '</div>';
		content += '<div style="font-weight: bold; font-size: 14px;">' + data.lat.toFixed(6) + '°</div>';
		content += '</div>';
		
		// Longitude
		content += '<div style="background: white; padding: 10px; border-radius: 3px; border-left: 4px solid #007bff;">';
		content += '<div style="font-size: 12px; color: #666; margin-bottom: 2px;">' + _('Longitude') + '</div>';
		content += '<div style="font-weight: bold; font-size: 14px;">' + data.lon.toFixed(6) + '°</div>';
		content += '</div>';
		
		// Altitude
		if (data.alt !== null) {
			content += '<div style="background: white; padding: 10px; border-radius: 3px; border-left: 4px solid #28a745;">';
			content += '<div style="font-size: 12px; color: #666; margin-bottom: 2px;">' + _('Altitude') + '</div>';
			content += '<div style="font-weight: bold; font-size: 14px;">' + data.alt.toFixed(1) + ' m</div>';
			content += '</div>';
		}
		
		// Fix Mode
		if (data.mode) {
			var modeText = '';
			var modeColor = '#6c757d';
			switch(data.mode) {
				case 0:
				case 1:
					modeText = _('No Fix');
					modeColor = '#dc3545';
					break;
				case 2:
					modeText = _('2D Fix');
					modeColor = '#ffc107';
					break;
				case 3:
					modeText = _('3D Fix');
					modeColor = '#28a745';
					break;
				default:
					modeText = _('Unknown');
					modeColor = '#6c757d';
			}
			content += '<div style="background: white; padding: 10px; border-radius: 3px; border-left: 4px solid ' + modeColor + ';">';
			content += '<div style="font-size: 12px; color: #666; margin-bottom: 2px;">' + _('Fix Mode') + '</div>';
			content += '<div style="font-weight: bold; font-size: 14px; color: ' + modeColor + ';">' + modeText + '</div>';
			content += '</div>';
		}
		
		content += '</div>'; // End grid
		
		// Time
		if (data.time) {
			var date = new Date(data.time);
			content += '<div style="margin-top: 10px; padding: 8px; background: white; border-radius: 3px; font-size: 12px; color: #666;">';
			content += '<strong>' + _('Last Update') + ':</strong> ' + date.toLocaleString();
			content += '</div>';
		}
		
		content += '</div>'; // End main container
	} else {
		content = '<div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; text-align: center;">';
		content += '<div style="display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">';
		content += '<span style="color: #856404; font-size: 18px; margin-right: 8px;">⚠</span>';
		content += '<strong style="color: #856404; font-size: 16px;">' + _('No GPS Fix Available') + '</strong>';
		content += '</div>';
		
		// Show error information if available
		if (data.error) {
			content += '<div style="background: white; padding: 10px; border-radius: 3px; margin-top: 10px; font-size: 12px; color: #666; text-align: left;">';
			content += '<strong>Status:</strong> ' + data.error;
			content += '</div>';
		}
		
		content += '</div>';
	}
	
	return content;
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

		// GPS Location Section
		s = m.section(form.NamedSection, '_location');
		s.anonymous = true;
		s.render = function (section_id) {
			L.Poll.add(function () {
				return L.resolveDefault(getGPSLocation()).then(function(res) {
					var view = document.getElementById("gps_location");
					if (view) {
						view.innerHTML = renderGPSLocation(res);
					}
				});
			}, 5); // Update every 5 seconds

			return E('div', { class: 'cbi-map' },
				E('fieldset', { class: 'cbi-section'}, [
					E('legend', {}, _('GPS Location Information')),
					E('div', { id: 'gps_location' },
						_('Collecting GPS data ...'))
				])
			);
		};

		return m.render();
	}
});
