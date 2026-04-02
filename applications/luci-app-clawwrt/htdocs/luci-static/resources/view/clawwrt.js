'use strict';

'require rpc';
'require ui';
'require uci';
'require form';
'require poll';
'require view';

const callGetStatus = rpc.declare({
    object: 'luci.clawwrt',
    method: 'get_status',
    expect: { result: {} }
});

const callGetWanMac = rpc.declare({
    object: 'luci.clawwrt',
    method: 'get_wan_mac',
    expect: { result: {} }
});

function generateDeviceId(macAddress) {
    var macPart = macAddress.replace(/[:-]/g, '').toUpperCase();
    var randomPart = '';
    for (var i = 0; i < 7; i++) {
        randomPart += Math.floor(Math.random() * 10);
    }
    return 'AW' + randomPart + macPart;
}

return view.extend({
    render: function() {
        let m, s, o;

        m = new form.Map('clawwrt', _('ClawWRT'), _('ClawWRT defines a lightweight remote management agent for OpenWrt.'));

        s = m.section(form.TypedSection);
        s.anonymous = true;
        s.render = function() {
            return Promise.all([
                callGetStatus(),
                form.TypedSection.prototype.render.call(this)
            ]).then(results => {
                let status = results[0];
                let section_node = results[1];

                let status_node = E('div', { 'class': 'cbi-value' }, [
                    E('label', { 'class': 'cbi-value-title' }, _('Service Status')),
                    E('div', { 'class': 'cbi-value-field' }, [
                        E('span', {
                            'class': 'label',
                            'style': 'background-color:' + (status.running ? '#46a546' : '#9d261d') + '; color: white; padding: 2px 6px; border-radius: 4px;'
                        }, status.running ? _('Running') + ' (PID: ' + status.pid + ')' : _('Not Running'))
                    ])
                ]);

                return E('div', {}, [
                    status_node,
                    section_node
                ]);
            });
        };

        s = m.section(form.NamedSection, 'main', _('Configuration'));

        s.tab('base', _('Base Settings'));
        s.tab('advanced', _('Advanced Settings'));

        o = s.taboption('base', form.Flag, 'enabled', _('Enabled'));
        o.rmempty = false;

        o = s.taboption('base', form.Value, 'server_addr', _('Server Address'));
        o.datatype = 'host';
        o.placeholder = '127.0.0.1';

        o = s.taboption('base', form.Value, 'server_port', _('Server Port'));
        o.datatype = 'port';
        o.placeholder = '8001';

        o = s.taboption('base', form.Value, 'ws_path', _('WebSocket Path'));
        o.placeholder = '/ws/wifidogx';

        o = s.taboption('base', form.Flag, 'use_ssl', _('Use SSL'));
        o.rmempty = false;

        o = s.taboption('base', form.Value, 'token', _('Token'), _('Authentication token for OpenClaw.'));
        o.password = true;

        o = s.taboption('base', form.Value, 'device_id', _('Device ID'), _('Unique identifier for this device. Leave empty to auto-detect MAC.'));
        o.render = function(section_id) {
            return form.Value.prototype.render.apply(this, arguments).then(node => {
                let input = node.querySelector('input');
                let btn = E('button', {
                    'class': 'cbi-button cbi-button-apply',
                    'style': 'margin-left: 10px',
                    'click': ui.createHandlerFn(this, function() {
                        return callGetWanMac().then(res => {
                            if (res && res.status === 'success') {
                                let new_id = generateDeviceId(res.mac);
                                input.value = new_id;
                                input.dispatchEvent(new Event('input', { bubbles: true }));
                                input.dispatchEvent(new Event('change', { bubbles: true }));
                            } else {
                                ui.addNotification(null, E('p', _('Failed to get WAN MAC address: ') + (res ? res.message : 'Unknown')), 'error');
                            }
                        });
                    })
                }, [ _('Generate') ]);

                let field_box = node.querySelector('.cbi-value-field');
                if (field_box) field_box.appendChild(btn);

                return node;
            });
        };

        o = s.taboption('advanced', form.Value, 'heartbeat_interval', _('Heartbeat Interval'), _('In seconds.'));
        o.datatype = 'uinteger';
        o.placeholder = '60';

        o = s.taboption('advanced', form.ListValue, 'log_level', _('Log Level'));
        o.value('debug', _('Debug'));
        o.value('info', _('Info'));
        o.value('warn', _('Warn'));
        o.value('error', _('Error'));
        o.default = 'info';

        return m.render();
    }
});
