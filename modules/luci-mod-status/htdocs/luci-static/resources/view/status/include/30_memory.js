'use strict';
'require baseclass';
'require rpc';

document.head.append(E('style', { 'type': 'text/css' },
	`
.memory-info-container {
	background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
	border-radius: 12px;
	padding: 20px;
	margin: 16px 0;
	border: 1px solid rgba(255,255,255,0.15);
	box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
:root[data-darkmode="true"] .memory-info-container {
	background: linear-gradient(135deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 100%);
	border-color: rgba(255,255,255,0.1);
	box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
.memory-info-table {
	width: 100%;
	border-collapse: separate;
	border-spacing: 0;
	background: transparent;
}
.memory-info-row {
	transition: all 0.2s ease;
}
.memory-info-row:hover {
	background: rgba(0,123,255,0.05);
	transform: translateX(2px);
}
:root[data-darkmode="true"] .memory-info-row:hover {
	background: rgba(0,123,255,0.1);
}
.memory-info-label {
	padding: 12px 16px;
	font-weight: 600;
	color: #495057;
	background: rgba(108,117,125,0.1);
	border-right: 3px solid #007bff;
	border-radius: 6px 0 0 6px;
	width: 35%;
	position: relative;
}
:root[data-darkmode="true"] .memory-info-label {
	color: #adb5bd;
	background: rgba(108,117,125,0.2);
}
.memory-info-label::before {
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
.memory-info-value {
	padding: 12px 16px;
	color: #212529;
	background: rgba(255,255,255,0.7);
	border-radius: 0 6px 6px 0;
}
:root[data-darkmode="true"] .memory-info-value {
	color: #f8f9fa;
	background: rgba(255,255,255,0.05);
}
.memory-info-row:nth-child(even) .memory-info-label {
	background: rgba(40,167,69,0.1);
	border-right-color: #28a745;
}
.memory-info-row:nth-child(even) .memory-info-label::before {
	background: #28a745;
}
.memory-info-row:nth-child(3n) .memory-info-label {
	background: rgba(255,193,7,0.1);
	border-right-color: #ffc107;
}
.memory-info-row:nth-child(3n) .memory-info-label::before {
	background: #ffc107;
}
.memory-progressbar {
	background: rgba(108,117,125,0.2);
	border-radius: 8px;
	height: 20px;
	overflow: hidden;
	position: relative;
}
.memory-progressbar-fill {
	height: 100%;
	background: linear-gradient(90deg, #007bff 0%, #0056b3 100%);
	border-radius: 8px;
	transition: width 0.3s ease;
	position: relative;
}
.memory-progressbar-text {
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
`));

var callSystemInfo = rpc.declare({
	object: 'system',
	method: 'info'
});

function progressbar(value, max, byte) {
	var vn = parseInt(value) || 0,
	    mn = parseInt(max) || 100,
	    fv = byte ? String.format('%1024.2mB', value) : value,
	    fm = byte ? String.format('%1024.2mB', max) : max,
	    pc = Math.floor((100 / mn) * vn);

	return E('div', {
		'class': 'memory-progressbar',
		'title': '%s / %s (%d%%)'.format(fv, fm, pc)
	}, [
		E('div', { 
			'class': 'memory-progressbar-fill',
			'style': 'width:%.2f%%'.format(pc) 
		}),
		E('div', { 'class': 'memory-progressbar-text' }, '%s / %s'.format(fv, fm))
	]);
}

return baseclass.extend({
	title: _('Memory'),

	load: function() {
		return L.resolveDefault(callSystemInfo(), {});
	},

	render: function(systeminfo) {
		var mem = L.isObject(systeminfo.memory) ? systeminfo.memory : {},
		    swap = L.isObject(systeminfo.swap) ? systeminfo.swap : {};

		var fields = [
			_('Total Available'), (mem.available) ? mem.available : (mem.total && mem.free && mem.buffered) ? mem.free + mem.buffered : null, mem.total,
			_('Used'),            (mem.total && mem.free) ? (mem.total - mem.free) : null, mem.total,
		];

		if (mem.buffered)
			fields.push(_('Buffered'), mem.buffered, mem.total);

		if (mem.cached)
			fields.push(_('Cached'), mem.cached, mem.total);

		if (swap.total > 0)
			fields.push(_('Swap free'), swap.free, swap.total);

		var container = E('div', { 'class': 'memory-info-container' });
		var table = E('table', { 'class': 'memory-info-table' });

		for (var i = 0; i < fields.length; i += 3) {
			table.appendChild(E('tr', { 'class': 'memory-info-row' }, [
				E('td', { 'class': 'memory-info-label' }, [ fields[i] ]),
				E('td', { 'class': 'memory-info-value' }, [
					(fields[i + 1] != null) ? progressbar(fields[i + 1], fields[i + 2], true) : '?'
				])
			]));
		}

		container.appendChild(table);
		return container;
	}
});
