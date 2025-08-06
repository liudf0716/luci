'use strict';
'require baseclass';
'require rpc';

document.head.append(E('style', { 'type': 'text/css' },
	`
.storage-info-container {
	background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
	border-radius: 12px;
	padding: 20px;
	margin: 16px 0;
	border: 1px solid rgba(255,255,255,0.15);
	box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
:root[data-darkmode="true"] .storage-info-container {
	background: linear-gradient(135deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 100%);
	border-color: rgba(255,255,255,0.1);
	box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
.storage-info-table {
	width: 100%;
	border-collapse: separate;
	border-spacing: 0;
	background: transparent;
}
.storage-info-row {
	transition: all 0.2s ease;
}
.storage-info-row:hover {
	background: rgba(0,123,255,0.05);
	transform: translateX(2px);
}
:root[data-darkmode="true"] .storage-info-row:hover {
	background: rgba(0,123,255,0.1);
}
.storage-info-label {
	padding: 12px 16px;
	font-weight: 600;
	color: #495057;
	background: rgba(108,117,125,0.1);
	border-right: 3px solid #007bff;
	border-radius: 6px 0 0 6px;
	width: 35%;
	position: relative;
}
:root[data-darkmode="true"] .storage-info-label {
	color: #adb5bd;
	background: rgba(108,117,125,0.2);
}
.storage-info-label::before {
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
.storage-info-value {
	padding: 12px 16px;
	color: #212529;
	background: rgba(255,255,255,0.7);
	border-radius: 0 6px 6px 0;
}
:root[data-darkmode="true"] .storage-info-value {
	color: #f8f9fa;
	background: rgba(255,255,255,0.05);
}
.storage-info-row:nth-child(even) .storage-info-label {
	background: rgba(40,167,69,0.1);
	border-right-color: #28a745;
}
.storage-info-row:nth-child(even) .storage-info-label::before {
	background: #28a745;
}
.storage-info-row:nth-child(3n) .storage-info-label {
	background: rgba(255,193,7,0.1);
	border-right-color: #ffc107;
}
.storage-info-row:nth-child(3n) .storage-info-label::before {
	background: #ffc107;
}
.storage-progressbar {
	background: rgba(108,117,125,0.2);
	border-radius: 8px;
	height: 20px;
	overflow: hidden;
	position: relative;
}
.storage-progressbar-fill {
	height: 100%;
	border-radius: 8px;
	transition: width 0.3s ease;
	position: relative;
}
.storage-progressbar-text {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	color: white;
	font-size: 12px;
	font-weight: 600;
	text-shadow: 0 1px 2px rgba(0,0,0,0.5);
	z-index: 1;
}
.storage-disk-space .storage-progressbar-fill {
	background: linear-gradient(90deg, #007bff 0%, #0056b3 100%);
}
.storage-temp-space .storage-progressbar-fill {
	background: linear-gradient(90deg, #28a745 0%, #1e7e34 100%);
}
.storage-mount-point .storage-progressbar-fill {
	background: linear-gradient(90deg, #ffc107 0%, #e0a800 100%);
}
.storage-info-icon {
	margin-right: 8px;
	font-size: 14px;
}
`));

var callSystemInfo = rpc.declare({
	object: 'system',
	method: 'info'
});

var callMountPoints = rpc.declare({
	object: 'luci',
	method: 'getMountPoints',
	expect: { result: [] }
});

var MountSkipList = [
	"/rom",
	"/tmp",
	"/dev",
	"/overlay",
	"/",
]

function progressbar(value, max, byte, type) {
	var vn = parseInt(value) || 0,
		mn = parseInt(max) || 100,
		fv = byte ? String.format('%1024.2mB', value) : value,
		fm = byte ? String.format('%1024.2mB', max) : max,
		pc = Math.floor((100 / mn) * vn);

	var typeClass = '';
	if (type === 'disk') typeClass = 'storage-disk-space';
	else if (type === 'temp') typeClass = 'storage-temp-space';
	else typeClass = 'storage-mount-point';

	return E('div', {
		'class': 'storage-progressbar ' + typeClass,
		'title': '%s / %s (%d%%)'.format(fv, fm, pc)
	}, [
		E('div', {
			'class': 'storage-progressbar-fill',
			'style': 'width:%.2f%%'.format(pc)
		}),
		E('div', { 'class': 'storage-progressbar-text' }, '%s / %s'.format(fv, fm))
	]);
}

return baseclass.extend({
	title: _('Storage'),

	load: function () {
		return Promise.all([
			L.resolveDefault(callSystemInfo(), {}),
			L.resolveDefault(callMountPoints(), {}),
		]);
	},

	render: function (data) {
		var systeminfo = data[0],
			mounts = data[1],
			root = L.isObject(systeminfo.root) ? systeminfo.root : {},
			tmp = L.isObject(systeminfo.tmp) ? systeminfo.tmp : {};

		const existenceChk = function (fields, name, values) {
			if (!fields.hasOwnProperty(name))
				fields[name] = values;
		};

		var fields = [];

		// 添加磁盘空间信息
		if (root.used !== undefined && root.total !== undefined) {
			fields.push({
				name: '💾 ' + _('Disk space'),
				used: root.used * 1024,
				size: root.total * 1024,
				type: 'disk'
			});
		}

		// 添加临时空间信息
		if (tmp.used !== undefined && tmp.total !== undefined) {
			fields.push({
				name: '🗂️ ' + _('Temp space'),
				used: tmp.used * 1024,
				size: tmp.total * 1024,
				type: 'temp'
			});
		}

		// 添加挂载点信息
		for (var i = 0; i < mounts.length; i++) {
			var entry = mounts[i];

			if (MountSkipList.includes(entry.mount))
				continue;

			var name = '📁 ' + entry.device + ' (' + entry.mount + ')',
				used = entry.size - entry.free;

			fields.push({
				name: name,
				used: used,
				size: entry.size,
				type: 'mount'
			});
		}

		var container = E('div', { 'class': 'storage-info-container' });
		var table = E('table', { 'class': 'storage-info-table' });

		fields.forEach(function (field) {
			table.appendChild(E('tr', { 'class': 'storage-info-row' }, [
				E('td', { 'class': 'storage-info-label' }, [field.name]),
				E('td', { 'class': 'storage-info-value' }, [
					(field.used != null) ? progressbar(field.used, field.size, true, field.type) : '?'
				])
			]));
		});

		container.appendChild(table);
		return container;
	}
});
