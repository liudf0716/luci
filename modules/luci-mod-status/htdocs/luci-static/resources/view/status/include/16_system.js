'use strict';
'require baseclass';
'require fs';
'require rpc';

document.head.append(E('style', { 'type': 'text/css' },
	`
.system-info-container {
	background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
	border-radius: 12px;
	padding: 20px;
	margin: 16px 0;
	border: 1px solid rgba(255,255,255,0.15);
	box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
:root[data-darkmode="true"] .system-info-container {
	background: linear-gradient(135deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 100%);
	border-color: rgba(255,255,255,0.1);
	box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
.system-info-table {
	width: 100%;
	border-collapse: separate;
	border-spacing: 0;
	background: transparent;
}
.system-info-row {
	transition: all 0.2s ease;
}
.system-info-row:hover {
	background: rgba(0,123,255,0.05);
	transform: translateX(2px);
}
:root[data-darkmode="true"] .system-info-row:hover {
	background: rgba(0,123,255,0.1);
}
.system-info-label {
	padding: 12px 16px;
	font-weight: 600;
	color: #495057;
	background: rgba(108,117,125,0.1);
	border-right: 3px solid #007bff;
	border-radius: 6px 0 0 6px;
	width: 35%;
	position: relative;
}
:root[data-darkmode="true"] .system-info-label {
	color: #adb5bd;
	background: rgba(108,117,125,0.2);
}
.system-info-label::before {
	content: "";
	position: absolute;
	left: 8px;
	top: 50%;
	transform: translateY(-50%);
	width: 4px;
	height: 4px;
	background: #007bff;
	border-radius: 50%;
}
.system-info-value {
	padding: 12px 16px;
	color: #212529;
	background: rgba(255,255,255,0.7);
	border-radius: 0 6px 6px 0;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 13px;
	word-break: break-all;
}
:root[data-darkmode="true"] .system-info-value {
	color: #f8f9fa;
	background: rgba(255,255,255,0.05);
}
.system-info-row:nth-child(even) .system-info-label {
	background: rgba(40,167,69,0.1);
	border-right-color: #28a745;
}
.system-info-row:nth-child(even) .system-info-label::before {
	background: #28a745;
}
.system-info-row:nth-child(3n) .system-info-label {
	background: rgba(255,193,7,0.1);
	border-right-color: #ffc107;
}
.system-info-row:nth-child(3n) .system-info-label::before {
	background: #ffc107;
}
.system-info-highlight {
	background: linear-gradient(90deg, rgba(0,123,255,0.1) 0%, transparent 100%) !important;
	font-weight: 600 !important;
	color: #007bff !important;
}
:root[data-darkmode="true"] .system-info-highlight {
	color: #66b3ff !important;
}
`));

var callLuciVersion = rpc.declare({
	object: 'luci',
	method: 'getVersion'
});

var callSystemBoard = rpc.declare({
	object: 'system',
	method: 'board'
});

var callSystemInfo = rpc.declare({
	object: 'system',
	method: 'info'
});

var callNetworkInfo = rpc.declare({
	object: 'luci-rpc',
	method: 'getNetworkDevices'
});

return baseclass.extend({
	title: _('System'),

	load: function () {
		return Promise.all([
			L.resolveDefault(callSystemBoard(), {}),
			L.resolveDefault(callSystemInfo(), {}),
			L.resolveDefault(callLuciVersion(), { revision: _('unknown version'), branch: 'LuCI' }),
			L.resolveDefault(callNetworkInfo(), {})
		]);
	},

	render: function (data) {
		var boardinfo = data[0],
			systeminfo = data[1],
			luciversion = data[2],
			iface = data[3];

		luciversion = luciversion.branch + ' ' + luciversion.revision;

		var datestr = null;

		if (systeminfo.localtime) {
			var date = new Date(systeminfo.localtime * 1000);

			datestr = '%04d-%02d-%02d %02d:%02d:%02d'.format(
				date.getUTCFullYear(),
				date.getUTCMonth() + 1,
				date.getUTCDate(),
				date.getUTCHours(),
				date.getUTCMinutes(),
				date.getUTCSeconds()
			);
		}

		var sn = '?';
		if (iface && iface['br-lan'] && iface['br-lan'].mac) {
			sn = iface['br-lan'].mac.replace(/:/g, '').toUpperCase();
		}

		// 转换特定的型号名称
		var modelName = boardinfo.model;
		if (modelName === 'SunnyWiFi S300V20') {
			modelName = 'S300V2.0';
		}

		var fields = [
			{ label: _('Hostname'), value: boardinfo.hostname, highlight: true },
			{ label: _('Model'), value: modelName, highlight: true },
			{ label: _('SN'), value: sn },
			{ label: _('Architecture'), value: boardinfo.system },
			{ label: _('Target Platform'), value: (L.isObject(boardinfo.release) ? boardinfo.release.target : '') },
			{ label: _('Firmware Version'), value: (L.isObject(boardinfo.release) ? boardinfo.release.description + ' / ' : '') + (luciversion || '') },
			{ label: _('Kernel Version'), value: boardinfo.kernel },
			{ label: _('Local Time'), value: datestr },
			{ label: _('Uptime'), value: systeminfo.uptime ? '%t'.format(systeminfo.uptime) : null },
			{
				label: _('Load Average'), value: Array.isArray(systeminfo.load) ? '%.2f, %.2f, %.2f'.format(
					systeminfo.load[0] / 65535.0,
					systeminfo.load[1] / 65535.0,
					systeminfo.load[2] / 65535.0
				) : null
			}
		];

		var container = E('div', { 'class': 'system-info-container' });
		var table = E('table', { 'class': 'system-info-table' });

		for (var i = 0; i < fields.length; i++) {
			var field = fields[i];
			var valueClass = 'system-info-value';
			if (field.highlight) {
				valueClass += ' system-info-highlight';
			}

			table.appendChild(E('tr', { 'class': 'system-info-row' }, [
				E('td', { 'class': 'system-info-label' }, [field.label]),
				E('td', { 'class': valueClass }, [(field.value != null) ? field.value : '?'])
			]));
		}

		container.appendChild(table);
		return container;
	}
});
