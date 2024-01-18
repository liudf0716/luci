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

        m = new form.Map('dhcp', _('DHCP'));
        m.description = _('DHCP configuration');

        s = m.section(form.NamedSection, 'lan', 'dhcp', _('DHCP configuration'));
        
        o = s.option(form.Flag, 'ignore', _('Dont start DHCP server'));
        o.rmempty = false;

        o = s.option(form.Value, 'start', _('Start address'));
        o.datatype = 'integer';
        o.rmempty = false;

        o = s.option(form.Value, 'limit', _('Limit'));
        o.datatype = 'integer';
        o.rmempty = false;

        o = s.option(form.Value, 'leasetime', _('Lease time'));
        o.datatype = 'string';
        o.rmempty = false;

        return m.render();
    }
});
