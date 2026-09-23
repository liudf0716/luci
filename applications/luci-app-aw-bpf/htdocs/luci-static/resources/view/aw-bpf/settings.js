'use strict';
'require view';
'require form';
'require uci';
'require fs';
'require poll';
'require rpc';
'require tools.widgets as widgets';

var callServiceList = rpc.declare({
	object: 'service',
	method: 'list',
	params: [ 'name' ],
	expect: { '': {} }
});

function fetchRuntimeStatus() {
	return Promise.all([
		L.resolveDefault(callServiceList('aw-bpf'), {}),
		L.resolveDefault(fs.exec_direct('/usr/bin/aw-bpfctl', ['xdpi', 'status'], 'text'), ''),
		L.resolveDefault(fs.exec_direct('/usr/bin/aw-bpfctl', ['fastpath', 'status'], 'text'), ''),
		L.resolveDefault(fs.exec_direct('/usr/bin/aw-bpfctl', ['router-ip', 'show'], 'text'), '')
	]);
}

function parseServiceStatus(svcData) {
	var isRunning = false, pid = null;
	try {
		var inst = svcData && svcData['aw-bpf'] && svcData['aw-bpf']['instances'] && svcData['aw-bpf']['instances']['instance1'];
		if (inst && inst.running) {
			isRunning = true;
			pid = inst.pid;
		}
	} catch(e) {}
	return { running: isRunning, pid: pid };
}

function parseXdpiStatus(str) {
	if (!str) return { enabled: false, text: _('Unknown') };
	var m = str.match(/xDPI Status:\s*(\w+)/i);
	var isEnabled = m ? (m[1].toLowerCase() === 'enabled') : false;
	return {
		enabled: isEnabled,
		text: isEnabled ? _('Enabled (1)') : _('Disabled (0)')
	};
}

function parseFastpathStatus(str) {
	var res = {
		enabled: false,
		autoLearn: false,
		lanName: null,
		lanIfindex: null,
		lanIp: null,
		wanName: null,
		wanIfindex: null,
		wanIp: null,
		text: _('Disabled (0)')
	};
	if (!str) return res;
	var mStatus = str.match(/FastPath Status:\s*(\w+)/i);
	if (mStatus && mStatus[1].toLowerCase() === 'enabled') {
		res.enabled = true;
		res.text = _('Enabled (1)');
	}
	var mAuto = str.match(/Auto-learn:\s*(\w+)/i);
	if (mAuto && mAuto[1].toLowerCase() === 'on') {
		res.autoLearn = true;
	}
	var mLan = str.match(/LAN Dev:\s*(?:([^\s(),]+)\s+)?\(?(?:ifindex\s+)?(\d+)\)?,\s*IP\s*([0-9.]+)/i);
	if (mLan) {
		res.lanName = mLan[1] || '';
		res.lanIfindex = mLan[2];
		res.lanIp = mLan[3];
	}
	var mWan = str.match(/WAN Dev:\s*(?:([^\s(),]+)\s+)?\(?(?:ifindex\s+)?(\d+)\)?,\s*IP\s*([0-9.]+)/i);
	if (mWan) {
		res.wanName = mWan[1] || '';
		res.wanIfindex = mWan[2];
		res.wanIp = mWan[3];
	}
	return res;
}

function parseRouterIp(str) {
	var res = { lanIp: '-', wanIp: '-' };
	if (!str) return res;
	var mLan = str.match(/LAN IP:\s*([0-9.]+)/i);
	if (mLan) res.lanIp = mLan[1];
	var mWan = str.match(/WAN IP:\s*([0-9.]+)/i);
	if (mWan) res.wanIp = mWan[1];
	return res;
}

function renderBadge(active, textActive, textInactive) {
	var bg = active ? '#28a745' : '#6c757d';
	var text = active ? (textActive || _('RUNNING')) : (textInactive || _('DISABLED'));
	return E('span', {
		'class': 'label ' + (active ? 'success' : 'neutral'),
		'style': 'display:inline-block; padding:3px 8px; border-radius:3px; font-size:90%; font-weight:bold; color:#fff; background-color:' + bg + ';'
	}, text);
}

function renderStatusTable(svc, xdpi, fp, rip) {
	var rows = [];

	// Service daemon
	rows.push(E('tr', { 'class': 'tr' }, [
		E('td', { 'class': 'td', 'style': 'width: 25%; font-weight: bold;' }, _('Service Daemon (aw-eventd)')),
		E('td', { 'class': 'td' }, [
			renderBadge(svc.running, _('RUNNING') + (svc.pid ? ' (PID ' + svc.pid + ')' : ''), _('NOT RUNNING')),
			E('span', { 'style': 'margin-left: 10px; color: #888;' }, _('Kernel event audit consumer & firewall manager'))
		])
	]));

	// xDPI Engine
	rows.push(E('tr', { 'class': 'tr' }, [
		E('td', { 'class': 'td', 'style': 'font-weight: bold;' }, _('xDPI L7 Engine')),
		E('td', { 'class': 'td' }, [
			renderBadge(xdpi.enabled, _('ACTIVE'), _('DISABLED')),
			E('span', { 'style': 'margin-left: 10px; color: #888;' },
				xdpi.enabled ? _('Kernel L7 application & domain deep inspection is active') : _('L7 inspection is turned off in eBPF map'))
		])
	]));

	// FastPath Offloading
	var fpDetails = [];
	if (fp.enabled) {
		var detailStr = _('Auto-learn: ') + (fp.autoLearn ? _('On') : _('Off'));
		var lanDesc = fp.lanName ? (fp.lanName + ' (ifindex ' + fp.lanIfindex + ')') : ('ifindex ' + fp.lanIfindex);
		var wanDesc = fp.wanName ? (fp.wanName + ' (ifindex ' + fp.wanIfindex + ')') : ('ifindex ' + fp.wanIfindex);
		if (fp.lanIp) detailStr += ' | LAN: ' + lanDesc + ' [' + fp.lanIp + ']';
		if (fp.wanIp) detailStr += ' | WAN: ' + wanDesc + ' [' + fp.wanIp + ']';
		fpDetails.push(E('span', { 'style': 'margin-left: 10px; color: #888;' }, detailStr));
		if (fp.wanIp === '0.0.0.0' || !fp.wanIp) {
			fpDetails.push(E('div', { 'style': 'margin-top: 4px; color: #d9534f; font-size: 90%;' },
				_('Notice: WAN IP is not yet acquired. FastPath will activate automatically when WAN connects.')));
		}
	} else {
		fpDetails.push(E('span', { 'style': 'margin-left: 10px; color: #888;' },
			_('eBPF line-rate hardware/kernel forwarding acceleration is disabled')));
	}

	rows.push(E('tr', { 'class': 'tr' }, [
		E('td', { 'class': 'td', 'style': 'font-weight: bold;' }, _('FastPath Acceleration')),
		E('td', { 'class': 'td' }, [
			renderBadge(fp.enabled, _('ACTIVE'), _('DISABLED')),
			E('span', {}, fpDetails)
		])
	]));

	// Router IP Map
	rows.push(E('tr', { 'class': 'tr' }, [
		E('td', { 'class': 'td', 'style': 'font-weight: bold;' }, _('Router IP Map')),
		E('td', { 'class': 'td' }, [
			E('code', {}, 'LAN: ' + (rip.lanIp || '-') + ' / WAN: ' + (rip.wanIp || '-')),
			E('span', { 'style': 'margin-left: 10px; color: #888;' }, _('Interface IPs recognized for FastPath NAT/routing'))
		])
	]));

	return E('table', { 'class': 'table', 'style': 'width: 100%; margin-bottom: 1em;' }, rows);
}

return view.extend({
	load: function() {
		return Promise.all([
			uci.load('aw-bpf'),
			fetchRuntimeStatus()
		]);
	},

	render: function(data) {
		var initStatus = data[1] || [];
		var svc = parseServiceStatus(initStatus[0]);
		var xdpi = parseXdpiStatus(initStatus[1]);
		var fp = parseFastpathStatus(initStatus[2]);
		var rip = parseRouterIp(initStatus[3]);

		var m, s, o;

		m = new form.Map('aw-bpf', _('eBPF Traffic Control & DPI'),
			_('eBPF kernel-level bandwidth control, session audit logging, xDPI L7 classification and FastPath acceleration.'));

		// Status Section
		s = m.section(form.NamedSection, '_status');
		s.anonymous = true;
		var statusContainer = E('div', { 'id': 'aw_bpf_status_box', 'class': 'cbi-section' }, [
			E('h3', {}, _('eBPF Runtime Status')),
			renderStatusTable(svc, xdpi, fp, rip)
		]);
		s.render = function() {
			return statusContainer;
		};

		// General Settings Section
		s = m.section(form.TypedSection, 'aw-bpf', _('General Settings'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'enable_fastpath', _('Enable FastPath Offloading'),
			_('Accelerate established session forwarding and NAT directly in eBPF, achieving line-rate throughput and significantly reducing CPU load.'));
		o.rmempty = false;
		o.default = '1';

		o = s.option(widgets.DeviceSelect, 'lan_dev', _('LAN Interface (FastPath & eBPF)'),
			_('Physical or bridge interface for LAN. Leave empty for automatic detection from network.lan (recommended).'));
		o.noaliases = true;
		o.optional = true;
		o.rmempty = true;

		o = s.option(widgets.DeviceSelect, 'wan_dev', _('WAN Interface (FastPath & eBPF)'),
			_('Physical network interface for WAN. Leave empty for automatic detection from network.wan (recommended).'));
		o.noaliases = true;
		o.optional = true;
		o.rmempty = true;

		o = s.option(form.Flag, 'enable_xdpi', _('Enable xDPI L7 Protocol Recognition'),
			_('Perform deep packet inspection in eBPF to identify application protocols and domain names for traffic classification and statistics.'));
		o.rmempty = false;
		o.default = '1';

		o = s.option(form.Flag, 'enable_event_log', _('Enable Session Event Logging'),
			_('Record TCP/UDP session connection events as structured JSON to system log / syslog.'));
		o.rmempty = false;
		o.default = '0';

		return m.render().then(function(mapNode) {
			poll.add(function() {
				return fetchRuntimeStatus().then(function(res) {
					var s_svc = parseServiceStatus(res[0]);
					var s_xdpi = parseXdpiStatus(res[1]);
					var s_fp = parseFastpathStatus(res[2]);
					var s_rip = parseRouterIp(res[3]);
					var box = document.getElementById('aw_bpf_status_box');
					if (box) {
						box.innerHTML = '';
						box.appendChild(E('h3', {}, _('eBPF Runtime Status')));
						box.appendChild(renderStatusTable(s_svc, s_xdpi, s_fp, s_rip));
					}
				});
			}, 5);

			return mapNode;
		});
	}
});
