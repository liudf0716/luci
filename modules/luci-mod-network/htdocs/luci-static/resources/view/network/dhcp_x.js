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

        m = new form.Map('dhcp', _('DHCP Server'));
        m.description = _('DHCP Server General Settings');

        s = m.section(form.NamedSection, 'lan', 'dhcp', _('General Setup'));
        
        o = s.option(form.Flag, 'ignore', _('Ignore interface'), 
            _("Disable <abbr title=\"Dynamic Host Configuration Protocol\">DHCP</abbr> for this interface."));
        o.rmempty = false;

        o = s.option(form.Value, 'start', _('Start'), _('Lowest leased address as offset from the network address.'));
        o.datatype = 'integer';
        o.rmempty = false;

        o = s.option(form.Value, 'limit', _('Limit'), _('Maximum number of leased addresses.'));
        o.datatype = 'integer';
        o.rmempty = false;

        o = s.option(form.Value, 'leasetime', _('Lease time'), 
            _('Expiry time of leased addresses, minimum is 2 minutes (<code>2m</code>).'));
        o.datatype = 'string';
        o.rmempty = false;

        return m.render();
    }
});
