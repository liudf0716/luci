'use strict';
'require view';
'require ui';
'require form';
'require rpc';
'require uci';
'require fs';
'require tools.widgets as widgets';
'require tools.github as github';
'require uci.apply';

var callServiceList = rpc.declare({
    object: 'service',
    method: 'list',
    params: ['name'],
    expect: { '': {} }
});
       
var statusReloadInterval = 5;

function getServiceStatus() {
    return L.resolveDefault(callServiceList('xkcptun'), {}).then(function (res) {
        var isRunning = false;
        try {
            var instance1 = res['xkcptun']['instances'];
            if (instance1 != null) {
                isRunning = true;
            }
        } catch (e) { }
        return isRunning;
    });
}

function renderStatus(isRunning) {
    var renderHTML = "";
    var spanTemp = '<em><span style="color:%s"><strong>%s %s</strong></span></em>';

    if (isRunning) {
        renderHTML += String.format(spanTemp, 'green', _("xkcptun"), _("RUNNING"));
    } else {
        renderHTML += String.format(spanTemp, 'red', _("xkcptun"), _("STOPPED"));
    }

    return renderHTML;
}

function renderStatus(isRunning) {
    var renderHTML = "";
    var spanTemp = '<em><span style="color:%s"><strong>%s %s</strong></span></em>';

    if (isRunning) {
        renderHTML += String.format(spanTemp, 'green', _("xkcptun"), _("running..."));
    } else {
        renderHTML += String.format(spanTemp, 'red', _("xkcptun"), _("not running..."));
    }

    return renderHTML;
}

return view.extend({
    handleServiceStatus: function() {
        return callServiceList('xkcptun').then(function(res) {
            return res && res.xkcptun ? _('Running') : _('Stopped');
        });
    },

    load: function() {
        return Promise.all([
            uci.load('xkcptun')
        ]);
    },

    render: function() {
        var m, s, o;

        m = new form.Map('xkcptun', _('xkcptun'));
        m.description = github.luci_desc('A secure tunnel solution based on KCP protocol with N:M multiplexing', 'liudf0716', 'xkcptun');

        // Status Section
        s = m.section(form.NamedSection, '_status');
        s.anonymous = true;
        s.render = function (section_id) {
            L.Poll.add(function () {
                return L.resolveDefault(getServiceStatus()).then(function(res) {
                    var view = document.getElementById("service_status");
                    if (view) {
                        view.innerHTML = renderStatus(res);
                    }
                });
            }, statusReloadInterval);

            return E('div', { class: 'cbi-map' },
                E('fieldset', { class: 'cbi-section'}, [
                    E('p', { id: 'service_status' },
                        _('Collecting data ...'))
                ])
            );
        };

        // Settings Tabs
        s = m.section(form.TypedSection, 'xkcptun', _('Settings'));
        s.anonymous = true;
        s.addremove = false;
        s.tab('basic', _('Basic Settings'));
        s.tab('advanced', _('Advanced Settings'));

        // Basic Settings
        o = s.taboption('basic', form.Flag, 'enabled', _('Enable'));
        o.default = '0';
        o.rmempty = false;

        o = s.taboption('basic', form.Value, 'localinterface', _('Local Interface'));
        o.default = 'br-lan';
        o.rmempty = false;

        o = s.taboption('basic', form.Value, 'localport', _('Local Port'));
        o.datatype = 'port';
        o.default = '12948';
        o.rmempty = false;

        o = s.taboption('basic', form.Value, 'remoteaddr', _('Server Address'));
        o.datatype = 'host';
        o.rmempty = false;

        o = s.taboption('basic', form.Value, 'remoteport', _('Server Port'));
        o.datatype = 'port';
        o.rmempty = false;

        o = s.taboption('basic', form.Value, 'key', _('Key'));
        o.password = true;
        o.rmempty = false;

        o = s.taboption('basic', form.ListValue, 'crypt', _('Encryption'));
        o.value('aes', 'AES');
        o.value('aes-128', 'AES-128');
        o.value('aes-192', 'AES-192');
        o.value('salsa20', 'Salsa20');
        o.value('blowfish', 'Blowfish');
        o.value('twofish', 'Twofish');
        o.value('cast5', 'CAST5');
        o.value('3des', '3DES');
        o.value('tea', 'TEA');
        o.value('xtea', 'XTEA');
        o.value('xor', 'XOR');
        o.value('sm4', 'SM4');
        o.value('none', 'None');
        o.default = 'none';
        o.rmempty = false;

        // Advanced Settings
        o = s.taboption('advanced', form.Value, 'mtu', _('MTU'));
        o.datatype = 'range(1,1500)';
        o.default = '1350';
        o.rmempty = false;

        o = s.taboption('advanced', form.Value, 'sndwnd', _('Send Window'));
        o.datatype = 'uinteger';
        o.default = '1024';
        o.rmempty = false;

        o = s.taboption('advanced', form.Value, 'rcvwnd', _('Receive Window'));
        o.datatype = 'uinteger';
        o.default = '1024';
        o.rmempty = false;

        o = s.taboption('advanced', form.Value, 'datashard', _('Data Shard'));
        o.datatype = 'uinteger';
        o.default = '10';
        o.rmempty = false;

        o = s.taboption('advanced', form.Value, 'parityshard', _('Parity Shard'));
        o.datatype = 'uinteger';
        o.default = '3';
        o.rmempty = false;

        o = s.taboption('advanced', form.Flag, 'nocomp', _('Disable Compression'));
        o.default = '1';
        o.rmempty = false;

        o = s.taboption('advanced', form.Flag, 'acknodelay', _('NoDelay'));
        o.default = '0';
        o.rmempty = false;

        o = s.taboption('advanced', form.Value, 'interval', _('Update Interval'));
        o.datatype = 'uinteger';
        o.default = '20';
        o.rmempty = false;

        o = s.taboption('advanced', form.Value, 'resend', _('Resend Window'));
        o.datatype = 'uinteger';
        o.default = '2';
        o.rmempty = false;

        o = s.taboption('advanced', form.Flag, 'nc', _('No Congestion'));
        o.default = '1';
        o.rmempty = false;

        o = s.taboption('advanced', form.Value, 'sockbuf', _('Socket Buffer'));
        o.datatype = 'uinteger';
        o.default = '4194304';
        o.rmempty = false;

        o = s.taboption('advanced', form.Value, 'keepalive', _('Keepalive'));
        o.datatype = 'uinteger';
        o.default = '10';
        o.rmempty = false;

        return m.render();
    }
});
