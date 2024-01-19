'use strict';
'require view';
'require dom';
'require uci';
'require form';
'require network';
'require tools.widgets as widgets';
'require tools.network as nettools';

return view.extend({
    render: function () {
        var m, s, o;

        m = new form.Map('network', _('Interfaces'));
        m.description = _('Network bypass interface configuration.');

        s = m.section(form.NamedSection, 'lan', 'interface', _('General Settings'));
        
        o = s.option(form.Value, 'ipaddr', _('IPv4 address'));
        o.datatype = 'ip4addr("nomask")';
        o.rmempty = false;

        o = s.option(form.Value, 'netmask', _('IPv4 netmask'));
        o.datatype = 'ip4addr';
		o.rmempty = false;
		o.value("255.255.255.0");
		o.value("255.255.0.0");
		o.value("255.0.0.0");

        o = s.option(form.Value, 'gateway', _('IPv4 gateway'));
        o.datatype = 'ip4addr("nomask")';
        o.rmempty = false;

        o = s.option(form.Value, 'broadcast', _('IPv4 broadcast'));
        o.datatype = 'ip4addr("nomask")';
        o.rmempty = false;

        return m.render();
    }
});

        