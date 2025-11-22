'use strict';
'require view';
'require form';
'require network';
'require uci';
'require ui';

return view.extend({
    load: function () {
        return Promise.all([
            network.getDevices(),
            uci.load('network')
        ]);
    },

    render: function (data) {
        var m, s, o;

        m = new form.Map('network', _('xl2tpd L2TP Configuration'),
            _('Configure L2TP VPN tunnels using xl2tpd daemon.'));

        // L2TP Interfaces Section
        s = m.section(form.GridSection, 'interface', _('L2TP Interfaces'),
            _('Manage L2TP network interfaces. Each interface represents an L2TP tunnel connection.'));
        s.addremove = true;
        s.anonymous = false;
        s.nodescriptions = true;
        s.filter = function (section_id) {
            return uci.get('network', section_id, 'proto') === 'l2tp';
        };
        s.handleAdd = function (ev) {
            var config = this.uciconfig || this.map.config,
                name = this.ucivalue(this.addsection(ev));

            uci.set(config, name, 'proto', 'l2tp');
            return this.map.save(null, true);
        };

        s.modaltitle = function (section_id) {
            return _('Edit L2TP Interface') + ' » ' + section_id;
        };

        o = s.option(form.Flag, 'auto', _('Bring up on boot'),
            _('Automatically bring up this interface on system boot'));
        o.default = '1';
        o.editable = true;

        o = s.option(form.Value, 'server', _('L2TP Server'),
            _('L2TP server address in format: host[:port]. Port defaults to 1701.'));
        o.datatype = 'host';
        o.placeholder = 'vpn.example.com or 192.168.1.1:1701';
        o.rmempty = false;
        o.editable = true;

        // Detailed options in modal
        o = s.taboption('general', form.Value, 'server', _('L2TP Server'),
            _('L2TP server address in format: host[:port]. Port defaults to 1701.'));
        o.datatype = 'host';
        o.placeholder = 'vpn.example.com or 192.168.1.1:1701';
        o.rmempty = false;

        o = s.taboption('general', form.Value, 'username', _('Username'),
            _('Username for PPP authentication'));
        o.placeholder = 'user@example.com';

        o = s.taboption('general', form.Value, 'password', _('Password'),
            _('Password for PPP authentication'));
        o.password = true;

        o = s.taboption('general', form.Value, 'mtu', _('MTU'),
            _('Maximum Transmission Unit (MTU). Leave empty for default (1400).'));
        o.datatype = 'range(68,9000)';
        o.placeholder = '1400';

        o = s.taboption('general', form.Flag, 'ipv6', _('Enable IPv6'),
            _('Enable IPv6 support for this tunnel'));
        o.default = '0';

        // Advanced Options Tab
        o = s.taboption('advanced', form.Value, 'keepalive', _('Keepalive'),
            _('LCP echo keepalive in format: failure_count[,interval]. Example: 5,60 means send echo every 60 seconds, fail after 5 missed echoes.'));
        o.placeholder = '5,60';
        o.validate = function (section_id, value) {
            if (!value)
                return true;

            var parts = value.split(',');
            if (parts.length > 2)
                return _('Invalid format. Use: failure_count[,interval]');

            for (var i = 0; i < parts.length; i++) {
                if (!/^\d+$/.test(parts[i].trim()))
                    return _('Values must be positive integers');
            }
            return true;
        };

        o = s.taboption('advanced', form.Value, 'checkup_interval', _('Checkup Interval'),
            _('Interval in seconds to check if interface is up and retry if down. Set to 0 to disable automatic retry.'));
        o.datatype = 'uinteger';
        o.placeholder = '0';
        o.default = '0';

        o = s.taboption('advanced', form.TextValue, 'pppd_options', _('Additional PPP Options'),
            _('Additional options to pass to pppd daemon. One option per line.'));
        o.rows = 5;
        o.placeholder = 'nodefaultroute\\nnoipdefault\\nproxyarp';
        o.monospace = true;

        o = s.taboption('advanced', form.Value, 'metric', _('Gateway Metric'),
            _('Metric for the default gateway'));
        o.datatype = 'uinteger';
        o.placeholder = '0';

        o = s.taboption('advanced', form.Flag, 'defaultroute', _('Use as default gateway'),
            _('If enabled, use the tunnel as the default gateway'));
        o.default = '1';

        o = s.taboption('advanced', form.Flag, 'peerdns', _('Use DNS from peer'),
            _('Use DNS servers provided by the peer'));
        o.default = '1';

        return m.render();
    }
});
