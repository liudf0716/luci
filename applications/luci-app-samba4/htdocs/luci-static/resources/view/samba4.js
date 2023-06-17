'use strict';
'require view';
'require fs';
'require uci';
'require form';
'require rpc'
'require tools.widgets as widgets';

var callMountPoints = rpc.declare({
	object: 'luci',
	method: 'getMountPoints',
	expect: { result: [] }
});

return view.extend({
	load: function() {
		return Promise.all([
			L.resolveDefault(fs.stat('/sbin/block'), null),
			L.resolveDefault(fs.stat('/etc/config/fstab'), null),
			L.resolveDefault(fs.stat('/usr/sbin/nmbd'), {}),
			L.resolveDefault(fs.stat('/usr/sbin/samba'), {}),
			L.resolveDefault(fs.stat('/usr/sbin/winbindd'), {}),
			L.resolveDefault(fs.exec('/usr/sbin/smbd', ['-V']), null),
			L.resolveDefault(callMountPoints()),
		]);
	},
	render: function(stats) {
		var m, s, o, v;
		v = '';

		m = new form.Map('samba4', _('Network Shares'));

		if (stats[5] && stats[5].code === 0) {
			v = stats[5].stdout.trim();
		}
		s = m.section(form.TypedSection, 'samba', 'Samba ' + v);
		s.anonymous = true;

		s.tab('general',  _('General Settings'));
		s.tab('template', _('Edit Template'), _('Edit the template that is used for generating the samba configuration.'));

		o = s.taboption('general', widgets.NetworkSelect, 'interface', _('Interface'),
			_('Listen only on the given interface or, if unspecified, on lan'));
		o.multiple = true;
		o.cfgvalue = function(section_id) {
			return L.toArray(uci.get('samba4', section_id, 'interface'));
		};
		o.write = function(section_id, formvalue) {
			var cfgvalue = this.cfgvalue(section_id),
				oldNetworks = L.toArray(cfgvalue),
				newNetworks = L.toArray(formvalue);
			oldNetworks.sort();
			newNetworks.sort();
			if (oldNetworks.join(' ') == newNetworks.join(' '))
				return;
			return uci.set('samba4', section_id, 'interface', newNetworks.join(' '));
		};

		o = s.taboption('general', form.Value, 'workgroup', _('Workgroup'));
		o.placeholder = 'WORKGROUP';

		o = s.taboption('general', form.Value, 'description', _('Description'));
		o.placeholder = 'Samba4 on ChatGPT-Wrt';

		o = s.taboption('template', form.TextValue, '_tmpl',
			null,
			_("This is the content of the file '/etc/samba/smb.conf.template' from which your samba configuration will be generated. \
			Values enclosed by pipe symbols ('|') should not be changed. They get their values from the 'General Settings' tab."));
		o.rows = 20;
		o.cfgvalue = function(section_id) {
			return fs.trimmed('/etc/samba/smb.conf.template');
		};
		o.write = function(section_id, formvalue) {
			return fs.write('/etc/samba/smb.conf.template', formvalue.trim().replace(/\r\n/g, '\n') + '\n');
		};


		s = m.section(form.TableSection, 'sambashare', _('Shared Directories'),
			_('Please add directories to share. Each directory refers to a folder on a mounted device.'));
		s.anonymous = true;
		s.addremove = true;

		s.option(form.Value, 'name', _('Name'));
		o = s.option(form.ListValue, 'path', _('Path'));
		if (stats[0] && stats[1]) {
			o.titleref = L.url('admin', 'system', 'mounts');
		}

		o.rmempty = false;
		o.value('', _('Select a path...'));
		if (stats[6]) {
			for (var i = 0; i < stats[6].length; i++) {
				var umount = true;

				if (/^\/(overlay|rom|tmp(?:\/.+)?|dev(?:\/.+)?|)$/.test(stats[6][i].mount))
					umount = false;

				if (umount) {
					o.value(stats[6][i].mount, stats[6][i].mount + ' (' + stats[6][i].device + ',' + '%1024.2mB / %1024.2mB'.format(stats[6][i].free, stats[6][i].size) + ' )');
				}
			}
		}
		

		o = s.option(form.Flag, 'browseable', _('Browse-able'));
		o.enabled = 'yes';
		o.disabled = 'no';
		o.default = 'yes';

		o = s.option(form.Flag, 'read_only', _('Read-only'));
		o.enabled = 'yes';
		o.disabled = 'no';
		o.default = 'no'; // smb.conf default is 'yes'
		o.rmempty = false;

		return m.render();
	}
});
