'use strict';
'require view';
'require fs';
'require ui';
'require uci';
'require rpc';
'require form';

var callBlockDevices, callMountPoints, callBlockDetect;

callBlockDevices = rpc.declare({
	object: 'luci',
	method: 'getBlockDevices',
	expect: { '': {} }
});

callMountPoints = rpc.declare({
	object: 'luci',
	method: 'getMountPoints',
	expect: { result: [] }
});

callBlockDetect = rpc.declare({
	object: 'luci',
	method: 'setBlockDetect',
	expect: { result: false }
});

function device_textvalue(devices, section_id) {
	var v = (uci.get('fstab', section_id, 'uuid') || '').toLowerCase(),
	    e = Object.keys(devices).filter(function(dev) { return (devices[dev].uuid || '-').toLowerCase() == v })[0];

	if (v) {
		this.section.devices[section_id] = devices[e];

		if (e && devices[e].size)
			return E('span', 'UUID: %h (%s, %1024.2mB)'.format(v, devices[e].dev, devices[e].size));
		else if (e)
			return E('span', 'UUID: %h (%s)'.format(v, devices[e].dev));
		else
			return E('span', 'UUID: %h (<em>%s</em>)'.format(v, _('not present')));
	}

	v = uci.get('fstab', section_id, 'label');
	e = Object.keys(devices).filter(function(dev) { return devices[dev].label == v })[0];

	if (v) {
		this.section.devices[section_id] = this.section.devices[section_id] || devices[e];

		if (e && devices[e].size)
			return E('span', 'Label: %h (%s, %1024.2mB)'.format(v, devices[e].dev, devices[e].size));
		else if (e)
			return E('span', 'Label: %h (%s)'.format(v, devices[e].dev));
		else
			return E('span', 'Label: %h (<em>%s</em>)'.format(v, _('not present')));
	}

	v = uci.get('fstab', section_id, 'device');
	e = Object.keys(devices).filter(function(dev) { return devices[dev].dev == v })[0];

	if (v) {
		this.section.devices[section_id] = this.section.devices[section_id] || devices[e];

		if (e && devices[e].size)
			return E('span', '%h (%1024.2mB)'.format(v, devices[e].size));
		else if (e)
			return E('span', '%h'.format(v));
		else
			return E('span', '%h (<em>%s</em>)'.format(v, _('not present')));
	}
}

return view.extend({
	handleDetect: function(m, ev) {
		return callBlockDetect()
			.then(L.bind(uci.unload, uci, 'fstab'))
			.then(L.bind(m.render, m));
	},

	handleMountAll: function(m, ev) {
		return fs.exec('/sbin/block', ['mount'])
			.then(function(res) {
				if (res.code != 0)
					ui.addNotification(null, E('p', _('The <em>block mount</em> command failed with code %d').format(res.code)));
			})
			.then(L.bind(uci.unload, uci, 'fstab'))
			.then(L.bind(m.render, m));
	},

	handleUmount: function(m, path, ev) {
		return fs.exec('/bin/umount', [path])
			.then(L.bind(uci.unload, uci, 'fstab'))
			.then(L.bind(m.render, m))
			.catch(function(e) { ui.addNotification(null, E('p', e.message)) });
	},

	load: function() {
		return Promise.all([
			callBlockDevices(),
			fs.lines('/proc/filesystems'),
			fs.lines('/etc/filesystems'),
			L.resolveDefault(fs.stat('/usr/sbin/e2fsck'), null),
			L.resolveDefault(fs.stat('/usr/sbin/fsck.f2fs'), null),
			L.resolveDefault(fs.stat('/usr/sbin/fsck.fat'), null),
			L.resolveDefault(fs.stat('/usr/bin/btrfsck'), null),
			L.resolveDefault(fs.stat('/usr/bin/ntfsfix'), null),
			uci.load('fstab')
		]);
	},

	render: function(results) {
		var devices = results[0],
		    procfs = results[1],
		    etcfs = results[2],
		    triggers = {},
		    trigger, m, s, o;

		var fsck = {
			ext2: results[3],
			ext3: results[3],
			ext4: results[3],
			f2fs: results[4],
			vfat: results[5],
			btrfs: results[6],
			ntfs: results[7]
		};

		var filesystems = {};

		for (var i = 0; i < procfs.length; i++)
			if (procfs[i].match(/\S/) && !procfs[i].match(/^nodev\t/))
				filesystems[procfs[i].trim()] = true;

		for (var i = 0; i < etcfs.length; i++)
			if (etcfs[i].match(/\S/))
				filesystems[etcfs[i].trim()] = true;

		filesystems = Object.keys(filesystems).sort();


		if (!uci.sections('fstab', 'global').length)
			uci.add('fstab', 'global');

		m = new form.Map('fstab', _('Mount Points'));

		s = m.section(form.TypedSection, 'global', _('Global Settings'));
		s.addremove = false;
		s.anonymous = true;

		o = s.option(form.Flag, 'anon_mount', _('Anonymous Mount'), _('Mount filesystems not specifically configured'));
		o.default = o.disabled;
		o.rmempty = false;

		o = s.option(form.Flag, 'auto_swap', _('Automount Swap'), _('Automatically mount swap on hotplug'));
		o.default = o.enabled;
		o.rmempty = false;

		o = s.option(form.Flag, 'auto_mount', _('Automount Filesystem'), _('Automatically mount filesystems on hotplug'));
		o.default = o.enabled;
		o.rmempty = false;

		o = s.option(form.Flag, 'check_fs', _('Check filesystems before mount'), _('Automatically check filesystem for errors before mounting'));
		o.default = o.disabled;
		o.rmempty = false;


		// Mount status table
		o = s.option(form.DummyValue, '_mtab');

		o.load = function(section_id) {
			return callMountPoints().then(L.bind(function(mounts) {
				this.mounts = mounts;
			}, this));
		};

		o.render = L.bind(function(view, section_id) {
			var table = E('table', { 'class': 'table' }, [
				E('tr', { 'class': 'tr table-titles' }, [
					E('th', { 'class': 'th' }, _('Filesystem')),
					E('th', { 'class': 'th' }, _('Mount Point')),
					E('th', { 'class': 'th center' }, _('Available')),
					E('th', { 'class': 'th center' }, _('Used')),
					E('th', { 'class': 'th' }, _('Unmount'))
				])
			]);

			var rows = [];

			for (var i = 0; i < this.mounts.length; i++) {
				var used = this.mounts[i].size - this.mounts[i].free,
				    umount = true;

				if (/^\/(overlay|rom|tmp(?:\/.+)?|dev(?:\/.+)?|)$/.test(this.mounts[i].mount))
					umount = false;

				rows.push([
					this.mounts[i].device,
					this.mounts[i].mount,
					'%1024.2mB / %1024.2mB'.format(this.mounts[i].avail, this.mounts[i].size),
					'%.2f%% (%1024.2mB)'.format(100 / this.mounts[i].size * used, used),
					umount ? E('button', {
						'class': 'btn cbi-button-remove',
						'click': ui.createHandlerFn(view, 'handleUmount', m, this.mounts[i].mount),
						'disabled': this.map.readonly || null
					}, [ _('Unmount') ]) : '-'
				]);
			}

			cbi_update_table(table, rows, E('em', _('Unable to obtain mount information')));

			return E([], [ E('h3', _('Mounted file systems')), table ]);
		}, o, this);

		return m.render();
	}
});
