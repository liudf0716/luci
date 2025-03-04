'use strict';
'require view';
'require form';
'require tools.widgets as widgets';

return view.extend({
	render: function() {
		var m, s, o;
		m = new form.Map('timecontrol', _('Internet Time Control'), _('Internet time control for clients (children) by MAC address'));
		m.template = 'timecontrol/index';
		s = m.section(form.TypedSection, 'basic');
		s.anonymous = true;

		o = s.option(form.Flag, 'enable', _('Enable'));
		o.rmempty = false;

		s = m.section(form.GridSection, 'macbind', _('Client Settings'));
		s.anonymous = true;
		s.addremove = true;

		o = s.option(form.Flag, 'enable', _('Enable'));
		o.rmempty = false;
		o.default = o.enabled;
		o.editable = true;
		
		o = s.option(form.Value, 'hostname', 'Hostname');
		o.rmempty = true;
		o.datatype = 'string';
		o.placeholder = 'hostname';

		o = s.option(form.Value, 'macaddr', 'MAC');
		o.rmempty = true;
		o.datatype = 'macaddr';

		o = s.option(form.Value, 'timeon', _('No Internet start time'));
		o.default = '00:00';
		o.optional = false;

		o = s.option(form.Value, 'timeoff', _('No Internet end time'));
		o.default = '23:59';
		o.optional = false;

		o = s.option(form.Flag, 'z1', _('Mo'));
		o.rmempty = true;
		o.default = o.enabled;
		o.editable = true;
		o.inline = true;

		o = s.option(form.Flag, 'z2', _('Tu'));
		o.rmempty = true;
		o.default = o.enabled;
		o.editable = true;

		o = s.option(form.Flag, 'z3', _('We'));
		o.rmempty = true;
		o.default = o.enabled;
		o.editable = true;

		o = s.option(form.Flag, 'z4', _('Th'));
		o.rmempty = true;
		o.default = o.enabled;
		o.editable = true;

		o = s.option(form.Flag, 'z5', _('Fr'));
		o.rmempty = true;
		o.default = o.enabled;
		o.editable = true;

		o = s.option(form.Flag, 'z6', _('Sa'));
		o.rmempty = true;
		o.default = o.enabled;
		o.editable = true;

		o = s.option(form.Flag, 'z7', _('Su'));
		o.rmempty = true;
		o.default = o.enabled;
		o.editable = true;

		return m.render();
	}
});
