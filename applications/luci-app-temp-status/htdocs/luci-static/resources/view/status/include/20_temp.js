'use strict';
'require baseclass';
'require rpc';

document.head.append(E('style', {'type': 'text/css'},
`
.temp-info-container {
	background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
	border-radius: 12px;
	padding: 20px;
	margin: 16px 0;
	border: 1px solid rgba(255,255,255,0.15);
	box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
:root[data-darkmode="true"] .temp-info-container {
	background: linear-gradient(135deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 100%);
	border-color: rgba(255,255,255,0.1);
	box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
.temp-info-table {
	width: 100%;
	border-collapse: separate;
	border-spacing: 0;
	background: transparent;
}
.temp-info-row {
	transition: all 0.2s ease;
}
.temp-info-row:hover {
	background: rgba(0,123,255,0.05);
	transform: translateX(2px);
}
:root[data-darkmode="true"] .temp-info-row:hover {
	background: rgba(0,123,255,0.1);
}
.temp-info-header {
	background: rgba(0,123,255,0.1);
	font-weight: 600;
}
.temp-info-label {
	padding: 12px 16px;
	font-weight: 600;
	color: #495057;
	background: rgba(108,117,125,0.1);
	border-right: 3px solid #007bff;
	border-radius: 6px 0 0 6px;
	width: 35%;
	position: relative;
}
:root[data-darkmode="true"] .temp-info-label {
	color: #adb5bd;
	background: rgba(108,117,125,0.2);
}
.temp-info-label::before {
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
.temp-info-value {
	padding: 12px 16px;
	color: #212529;
	background: rgba(255,255,255,0.7);
	border-radius: 0 6px 6px 0;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 13px;
}
:root[data-darkmode="true"] .temp-info-value {
	color: #f8f9fa;
	background: rgba(255,255,255,0.05);
}
.temp-status-hot .temp-info-label {
	background: rgba(255,193,7,0.3) !important;
	border-right-color: #ffc107 !important;
}
.temp-status-hot .temp-info-label::before {
	background: #ffc107 !important;
}
.temp-status-hot .temp-info-value {
	background: rgba(255,193,7,0.2) !important;
	color: #856404 !important;
}
:root[data-darkmode="true"] .temp-status-hot .temp-info-value {
	color: #ffc107 !important;
}
.temp-status-crit .temp-info-label {
	background: rgba(220,53,69,0.3) !important;
	border-right-color: #dc3545 !important;
}
.temp-status-crit .temp-info-label::before {
	background: #dc3545 !important;
}
.temp-status-crit .temp-info-value {
	background: rgba(220,53,69,0.2) !important;
	color: #721c24 !important;
}
:root[data-darkmode="true"] .temp-status-crit .temp-info-value {
	color: #f5c6cb !important;
}
.temp-info-row:nth-child(even) .temp-info-label {
	background: rgba(40,167,69,0.1);
	border-right-color: #28a745;
}
.temp-info-row:nth-child(even) .temp-info-label::before {
	background: #28a745;
}
`));

return baseclass.extend({
	title       : _('Temperature'),

	tempHot     : 80,

	tempCritical: 100,

	callTempStatus: rpc.declare({
		object: 'luci.temp-status',
		method: 'getTempStatus',
		expect: { '': {} }
	}),

	formatTemp(mc) {
		return Number((mc / 1e3).toFixed(1));
	},

	sortFunc(a, b) {
		return (a.number > b.number) ? 1 : (a.number < b.number) ? -1 : 0;
	},

	load() {
		return L.resolveDefault(this.callTempStatus(), null);
	},

	render(tempData) {
		if(!tempData) return;

		let container = E('div', { 'class': 'temp-info-container' });
		let tempTable = E('table', { 'class': 'temp-info-table' },
			E('tr', { 'class': 'temp-info-row temp-info-header' }, [
				E('th', { 'class': 'temp-info-label' }, _('Sensor')),
				E('th', { 'class': 'temp-info-value' }, _('Temperature')),
			])
		);

		let tempArray = [];

		for(let [k, v] of Object.entries(tempData)) {
			v.sort(this.sortFunc);

			for(let i of Object.values(v)) {
				let sensor = i.title || i.item;

				if(i.sources === undefined) {
					continue;
				};

				i.sources.sort(this.sortFunc);

				for(let j of i.sources) {
					let temp = j.temp;
					let name = (j.label !== undefined) ? sensor + " / " + j.label :
						(j.item !== undefined) ? sensor + " / " + j.item.replace(/_input$/, "") : sensor

					if(temp !== undefined) {
						temp = this.formatTemp(temp);
						tempArray.push(temp);
					};

					let tempHot       = this.tempHot;
					let tempCritical  = this.tempCritical;
					let tpoints       = j.tpoints;
					let tpointsString = '';

					if(tpoints) {
						for(let i of Object.values(tpoints)) {
							let t = this.formatTemp(i.temp);
							tpointsString += `&#10;${i.type}: ${t} °C`;

							if(i.type === 'critical' || i.type === 'emergency') {
								tempCritical = t;
							}
							else if(i.type === 'hot' || i.type === 'max') {
								tempHot = t;
							};
						};
					};

					let rowStyle = (temp >= tempCritical) ? ' temp-status-crit':
						(temp >= tempHot) ? ' temp-status-hot' : '';

					tempTable.append(
						E('tr', { 'class': 'temp-info-row' + rowStyle }, [
							E('td', { 'class': 'temp-info-label' },
								(tpointsString.length > 0) ?
								`<span style="cursor:help; border-bottom:1px dotted" data-tooltip="${tpointsString}">${name}</span>`
								: name
							),
							E('td', { 'class': 'temp-info-value' },
								(temp === undefined) ? '-' : temp + ' °C'),
						])
					);
				};
			};
		};

		if(tempTable.childNodes.length === 1) {
			tempTable.append(
				E('tr', { 'class': 'temp-info-row' },
					E('td', { 'class': 'temp-info-value', 'colspan': '2', 'style': 'text-align: center; font-style: italic;' },
						_('No temperature sensors available')
					)
				)
			);
		};
		container.appendChild(tempTable);
		return container;
	},
});
