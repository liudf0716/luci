'use strict';
'require view';
'require poll';
'require rpc';
'require ui';
'require fs';

var callServiceList = rpc.declare({
    object: 'service',
    method: 'list',
    params: ['name'],
    expect: { '': {} }
});

var callNetworkStatus = rpc.declare({
    object: 'network.interface',
    method: 'status',
    params: ['interface'],
    expect: { '': {} }
});

return view.extend({
    load: function () {
        return Promise.all([
            callServiceList('xl2tpd'),
            L.resolveDefault(fs.exec_direct('/usr/sbin/xl2tpd-control', ['-c', '/var/run/xl2tpd/l2tp-control', 'list'], 'text'), '')
        ]);
    },

    render: function (data) {
        var serviceStatus = data[0];
        var tunnelList = data[1];

        var isRunning = false;
        if (serviceStatus && serviceStatus.xl2tpd && serviceStatus.xl2tpd.instances) {
            var instances = serviceStatus.xl2tpd.instances;
            for (var inst in instances) {
                if (instances[inst].running) {
                    isRunning = true;
                    break;
                }
            }
        }

        var view = E('div', { 'class': 'cbi-map' }, [
            E('h2', {}, _('xl2tpd L2TP Status')),
            E('div', { 'class': 'cbi-section' }, [
                E('h3', {}, _('Daemon Status')),
                E('div', { 'class': 'cbi-value' }, [
                    E('label', { 'class': 'cbi-value-title' }, _('Service Status:')),
                    E('div', { 'class': 'cbi-value-field' }, [
                        E('span', {
                            'style': isRunning ? 'color: green; font-weight: bold;' : 'color: red; font-weight: bold;'
                        }, isRunning ? _('Running') : _('Stopped'))
                    ])
                ])
            ])
        ]);

        // Parse and display tunnel information
        if (isRunning && tunnelList && tunnelList.trim() !== '') {
            var tunnelSection = E('div', { 'class': 'cbi-section' }, [
                E('h3', {}, _('Active Tunnels'))
            ]);

            var tunnelLines = tunnelList.trim().split('\n');
            if (tunnelLines.length > 0) {
                var tunnelTable = E('table', { 'class': 'table cbi-section-table' }, [
                    E('tr', { 'class': 'tr table-titles' }, [
                        E('th', { 'class': 'th' }, _('Tunnel Name')),
                        E('th', { 'class': 'th' }, _('Status')),
                        E('th', { 'class': 'th' }, _('Information'))
                    ])
                ]);

                tunnelLines.forEach(function (line) {
                    if (line.trim() === '') return;

                    var parts = line.split(/\s+/);
                    var tunnelName = parts[0] || _('Unknown');
                    var status = _('Active');
                    var info = line.substring(tunnelName.length).trim() || '-';

                    tunnelTable.appendChild(
                        E('tr', { 'class': 'tr' }, [
                            E('td', { 'class': 'td' }, tunnelName),
                            E('td', { 'class': 'td' }, [
                                E('span', { 'style': 'color: green;' }, status)
                            ]),
                            E('td', { 'class': 'td' }, info)
                        ])
                    );
                });

                tunnelSection.appendChild(tunnelTable);
            } else {
                tunnelSection.appendChild(
                    E('div', { 'class': 'cbi-value' }, [
                        E('em', {}, _('No active tunnels'))
                    ])
                );
            }

            view.appendChild(tunnelSection);
        } else if (isRunning) {
            view.appendChild(
                E('div', { 'class': 'cbi-section' }, [
                    E('h3', {}, _('Active Tunnels')),
                    E('div', { 'class': 'cbi-value' }, [
                        E('em', {}, _('No active tunnels'))
                    ])
                ])
            );
        }

        // Add control buttons
        var buttonSection = E('div', { 'class': 'cbi-section' }, [
            E('div', { 'class': 'cbi-value' }, [
                E('button', {
                    'class': 'cbi-button cbi-button-action',
                    'click': L.bind(function (ev) {
                        ev.preventDefault();
                        ui.showModal(_('Restarting xl2tpd...'), [
                            E('p', { 'class': 'spinning' }, _('Please wait...'))
                        ]);

                        fs.exec('/etc/init.d/xl2tpd', ['restart']).then(function () {
                            ui.hideModal();
                            ui.addNotification(null, E('p', _('xl2tpd service restarted')), 'info');
                            // Reload page after short delay
                            window.setTimeout(function () {
                                window.location.reload();
                            }, 2000);
                        }).catch(function (err) {
                            ui.hideModal();
                            ui.addNotification(null, E('p', _('Failed to restart service: %s').format(err)), 'error');
                        });
                    }, this)
                }, _('Restart Service')),
                ' ',
                E('button', {
                    'class': 'cbi-button cbi-button-reload',
                    'click': function (ev) {
                        ev.preventDefault();
                        window.location.reload();
                    }
                }, _('Refresh'))
            ])
        ]);

        view.appendChild(buttonSection);

        // Auto-refresh every 5 seconds
        poll.add(L.bind(function () {
            return this.load().then(L.bind(function (refreshData) {
                var newView = this.render(refreshData);
                document.querySelector('.cbi-map').replaceWith(newView.firstChild);
            }, this));
        }, this), 5);

        return view;
    },

    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
