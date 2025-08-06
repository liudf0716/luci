'use strict';
'require baseclass';
'require fs';

document.head.append(E('style', { 'type': 'text/css' },
	`
.cpu-info-container {
	background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
	border-radius: 12px;
	padding: 20px;
	margin: 16px 0;
	border: 1px solid rgba(255,255,255,0.15);
	box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
:root[data-darkmode="true"] .cpu-info-container {
	background: linear-gradient(135deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 100%);
	border-color: rgba(255,255,255,0.1);
	box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
.cpu-info-table {
	width: 100%;
	border-collapse: separate;
	border-spacing: 0;
	background: transparent;
}
.cpu-info-row {
	transition: all 0.2s ease;
}
.cpu-info-row:hover {
	background: rgba(0,123,255,0.05);
	transform: translateX(2px);
}
:root[data-darkmode="true"] .cpu-info-row:hover {
	background: rgba(0,123,255,0.1);
}
.cpu-info-header {
	background: rgba(0,123,255,0.1);
	font-weight: 600;
}
.cpu-info-label {
	padding: 12px 16px;
	font-weight: 600;
	color: #495057;
	background: rgba(108,117,125,0.1);
	border-right: 3px solid #007bff;
	border-radius: 6px 0 0 6px;
	width: 35%;
	position: relative;
}
:root[data-darkmode="true"] .cpu-info-label {
	color: #adb5bd;
	background: rgba(108,117,125,0.2);
}
.cpu-info-label::before {
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
.cpu-info-value {
	padding: 12px 16px;
	color: #212529;
	background: rgba(255,255,255,0.7);
	border-radius: 0 6px 6px 0;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 13px;
}
:root[data-darkmode="true"] .cpu-info-value {
	color: #f8f9fa;
	background: rgba(255,255,255,0.05);
}
.cpu-info-row:nth-child(even) .cpu-info-label {
	background: rgba(40,167,69,0.1);
	border-right-color: #28a745;
}
.cpu-info-row:nth-child(even) .cpu-info-label::before {
	background: #28a745;
}
.cpu-info-row:nth-child(3n) .cpu-info-label {
	background: rgba(255,193,7,0.1);
	border-right-color: #ffc107;
}
.cpu-info-row:nth-child(3n) .cpu-info-label::before {
	background: #ffc107;
}
.cpu-status-view-mode-entry {
	display: inline-block;
	cursor: pointer;
	margin: 4px 6px !important;
	padding: 8px 16px;
	border: 2px solid rgba(0,123,255,0.3);
	border-radius: 8px;
	opacity: 0.7;
	background: rgba(0,123,255,0.1);
	color: #007bff;
	font-weight: 500;
	transition: all 0.2s ease;
}
.cpu-status-view-mode-entry:hover {
	opacity: 0.9;
	transform: translateY(-1px);
}
.cpu-status-view-mode-entry-checked {
	border: 2px solid #007bff;
	opacity: 1;
	background: #007bff;
	color: white;
	box-shadow: 0 2px 4px rgba(0,123,255,0.3);
}
.cpu-progressbar {
	background: rgba(108,117,125,0.2);
	border-radius: 8px;
	height: 20px;
	overflow: hidden;
	position: relative;
}
.cpu-progressbar-fill {
	height: 100%;
	background: linear-gradient(90deg, #007bff 0%, #0056b3 100%);
	border-radius: 8px;
	transition: width 0.3s ease;
}
`));

return baseclass.extend({
	title: _('CPU Load'),

	viewName: 'cpu_status',

	availableViewModes: {
		0: ['allCPUs', _('Load')],
		1: ['allCPUsDetail', _('Detailed load')],
		2: ['eachCPU', _('Load of each CPU')],
		3: ['eachCPUDetail', _('Detailed load of each CPU')],
	},

	viewMode: 0,

	lastStatArray: null,

	restoreSettingsFromLocalStorage() {
		let viewModeLocal = localStorage.getItem(`luci-app-${this.viewName}-viewMode`);
		if (viewModeLocal) {
			this.viewMode = Number(viewModeLocal);
		};
	},

	saveSettingsToLocalStorage(viewMode) {
		if (this.viewMode != viewMode) {
			localStorage.setItem(
				`luci-app-${this.viewName}-viewMode`, String(viewMode));
		};
	},

	parseProcData(data) {
		let cpuStatArray = [];
		let statItemsArray = data.trim().split('\n').filter(s => s.startsWith('cpu'));

		for (let str of statItemsArray) {
			let arr = str.split(/\s+/).slice(0, 8);
			arr[0] = (arr[0] === 'cpu') ? Infinity : arr[0].replace('cpu', '');
			cpuStatArray.push(arr.map(e => Number(e)));
		};

		cpuStatArray.sort((a, b) => a[0] - b[0]);

		return cpuStatArray;
	},

	calcCPULoad(cpuStatArray) {
		let retArray = [];
		cpuStatArray.forEach((c, i) => {
			let loadUser = 0,
				loadNice = 0,
				loadSys = 0,
				loadIdle = 0,
				loadIo = 0,
				loadIrq = 0,
				loadSirq = 0,
				loadAvg = 0;
			if (this.lastStatArray !== null) {
				let user = c[1] - this.lastStatArray[i][1],
					nice = c[2] - this.lastStatArray[i][2],
					sys = c[3] - this.lastStatArray[i][3],
					idle = c[4] - this.lastStatArray[i][4],
					io = c[5] - this.lastStatArray[i][5],
					irq = c[6] - this.lastStatArray[i][6],
					sirq = c[7] - this.lastStatArray[i][7];
				let sum = user + nice + sys + idle + io + irq + sirq;
				loadUser = Number((100 * user / sum).toFixed(1));
				loadNice = Number((100 * nice / sum).toFixed(1));
				loadSys = Number((100 * sys / sum).toFixed(1));
				loadIdle = Number((100 * idle / sum).toFixed(1));
				loadIo = Number((100 * io / sum).toFixed(1));
				loadIrq = Number((100 * irq / sum).toFixed(1));
				loadSirq = Number((100 * sirq / sum).toFixed(1));
				loadAvg = Math.round(100 * (user + nice + sys + io + irq + sirq) / sum);
			};
			retArray.push({ loadUser, loadNice, loadSys, loadIdle, loadIo, loadIrq, loadSirq, loadAvg });
		});
		return retArray;
	},

	allCPUs: {
		makeTable() {
			this.table = E('table', { 'class': 'cpu-info-table' });
		},
		append(cpuNum, cpuLoadObj, lastStatArray) {
			if (cpuNum === Infinity) {
				this.table.append(
					E('tr', { 'class': 'cpu-info-row' }, [
						E('td', { 'class': 'cpu-info-label' },
							_('Total load')),
						E('td', { 'class': 'cpu-info-value' },
							E('div', {
								'class': 'cpu-progressbar',
								'title': (lastStatArray !== null) ?
									cpuLoadObj.loadAvg + '%' :
									_('Calculating') + '...',
							},
								E('div', {
									'class': 'cpu-progressbar-fill',
									'style': 'width:' + cpuLoadObj.loadAvg + '%'
								})
							)
						),
					])
				);
			};
		},
	},

	allCPUsDetail: {
		cpuTableTitles: [
			_('All CPUs'),
			_('Load'),
			'user %',
			'nice %',
			'system %',
			'idle %',
			'iowait %',
			'irq %',
			'softirq %',
		],
		makeTable() {
			this.table = E('table', { 'class': 'cpu-info-table' },
				E('tr', { 'class': 'cpu-info-row cpu-info-header' }, [
					E('th', { 'class': 'cpu-info-label' }, this.cpuTableTitles[0]),
					E('th', { 'class': 'cpu-info-value' }, this.cpuTableTitles[1]),
					E('th', { 'class': 'cpu-info-value' }, this.cpuTableTitles[2]),
					E('th', { 'class': 'cpu-info-value' }, this.cpuTableTitles[3]),
					E('th', { 'class': 'cpu-info-value' }, this.cpuTableTitles[4]),
					E('th', { 'class': 'cpu-info-value' }, this.cpuTableTitles[5]),
					E('th', { 'class': 'cpu-info-value' }, this.cpuTableTitles[6]),
					E('th', { 'class': 'cpu-info-value' }, this.cpuTableTitles[7]),
					E('th', { 'class': 'cpu-info-value' }, this.cpuTableTitles[8]),
				])
			);
		},
		append(cpuNum, cpuLoadObj, lastStatArray) {
			if (cpuNum === Infinity) {
				this.table.append(
					E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td left', 'data-title': this.cpuTableTitles[0] },
							_('Total load')),
						E('td', { 'class': 'td left', 'data-title': this.cpuTableTitles[1] },
							E('div', {
								'class': 'cbi-progressbar',
								'title': (lastStatArray !== null) ?
									cpuLoadObj.loadAvg + '%' :
									_('Calculating') + '...',
								'style': 'min-width:8em !important',
							},
								E('div', { 'style': 'width:' + cpuLoadObj.loadAvg + '%' })
							)
						),
						E('td', {
							'class': 'td center',
							'data-title': this.cpuTableTitles[2]
						}, cpuLoadObj.loadUser),
						E('td', {
							'class': 'td center',
							'data-title': this.cpuTableTitles[3]
						}, cpuLoadObj.loadNice),
						E('td', {
							'class': 'td center',
							'data-title': this.cpuTableTitles[4]
						}, cpuLoadObj.loadSys),
						E('td', {
							'class': 'td center',
							'data-title': this.cpuTableTitles[5]
						}, cpuLoadObj.loadIdle),
						E('td', {
							'class': 'td center',
							'data-title': this.cpuTableTitles[6]
						}, cpuLoadObj.loadIo),
						E('td', {
							'class': 'td center',
							'data-title': this.cpuTableTitles[7]
						}, cpuLoadObj.loadIrq),
						E('td', {
							'class': 'td center',
							'data-title': this.cpuTableTitles[8]
						}, cpuLoadObj.loadSirq),
					])
				);
			};
		},
	},

	eachCPU: {
		makeTable() {
			this.table = E('table', { 'class': 'cpu-info-table' });
		},
		append(cpuNum, cpuLoadObj, lastStatArray) {
			this.table.append(
				E('tr', { 'class': 'cpu-info-row' }, [
					E('td', { 'class': 'cpu-info-label' },
						(cpuNum === Infinity) ? _('Total load') : _('CPU') + ' ' + cpuNum),
					E('td', { 'class': 'cpu-info-value' },
						E('div', {
							'class': 'cpu-progressbar',
							'title': (lastStatArray !== null) ?
								cpuLoadObj.loadAvg + '%' :
								_('Calculating') + '...',
						},
							E('div', {
								'class': 'cpu-progressbar-fill',
								'style': 'width:' + cpuLoadObj.loadAvg + '%'
							})
						)
					),
				])
			);
		},
	},

	eachCPUDetail: {
		cpuTableTitles: [
			_('CPU'),
			_('Load'),
			'user %',
			'nice %',
			'system %',
			'idle %',
			'iowait %',
			'irq %',
			'softirq %',
		],
		makeTable() {
			this.table = E('table', { 'class': 'table' },
				E('tr', { 'class': 'tr table-titles' }, [
					E('th', { 'class': 'th left' }, this.cpuTableTitles[0]),
					E('th', { 'class': 'th left' }, this.cpuTableTitles[1]),
					E('th', { 'class': 'th center' }, this.cpuTableTitles[2]),
					E('th', { 'class': 'th center' }, this.cpuTableTitles[3]),
					E('th', { 'class': 'th center' }, this.cpuTableTitles[4]),
					E('th', { 'class': 'th center' }, this.cpuTableTitles[5]),
					E('th', { 'class': 'th center' }, this.cpuTableTitles[6]),
					E('th', { 'class': 'th center' }, this.cpuTableTitles[7]),
					E('th', { 'class': 'th center' }, this.cpuTableTitles[8]),
				])
			);
		},
		append(cpuNum, cpuLoadObj, lastStatArray) {
			this.table.append(
				E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td left', 'data-title': this.cpuTableTitles[0] },
						(cpuNum === Infinity) ? _('Total load') : _('CPU') + ' ' + cpuNum),
					E('td', { 'class': 'td left', 'data-title': this.cpuTableTitles[1] },
						E('div', {
							'class': 'cbi-progressbar',
							'title': (lastStatArray !== null) ?
								cpuLoadObj.loadAvg + '%' :
								_('Calculating') + '...',
							'style': 'min-width:8em !important',
						},
							E('div', { 'style': 'width:' + cpuLoadObj.loadAvg + '%' })
						)
					),
					E('td', {
						'class': 'td center',
						'data-title': this.cpuTableTitles[2]
					}, cpuLoadObj.loadUser),
					E('td', {
						'class': 'td center',
						'data-title': this.cpuTableTitles[3]
					}, cpuLoadObj.loadNice),
					E('td', {
						'class': 'td center',
						'data-title': this.cpuTableTitles[4]
					}, cpuLoadObj.loadSys),
					E('td', {
						'class': 'td center',
						'data-title': this.cpuTableTitles[5]
					}, cpuLoadObj.loadIdle),
					E('td', {
						'class': 'td center',
						'data-title': this.cpuTableTitles[6]
					}, cpuLoadObj.loadIo),
					E('td', {
						'class': 'td center',
						'data-title': this.cpuTableTitles[7]
					}, cpuLoadObj.loadIrq),
					E('td', {
						'class': 'td center',
						'data-title': this.cpuTableTitles[8]
					}, cpuLoadObj.loadSirq),
				])
			);
		},
	},

	makeCPUTable(cpuStatArray, cpuLoadArray) {
		let currentView = (this.availableViewModes[this.viewMode] !== undefined) ?
			this[this.availableViewModes[this.viewMode][0]] :
			this[this.availableViewModes[0][0]];
		currentView.makeTable();
		cpuLoadArray.forEach((c, i) => {
			currentView.append(cpuStatArray[i][0], c, this.lastStatArray);
		});
		return currentView.table;
	},

	load() {
		this.restoreSettingsFromLocalStorage();
		return L.resolveDefault(fs.read('/proc/stat'), null);
	},

	render(cpuData) {
		if (!cpuData) return;

		let cpuStatArray = this.parseProcData(cpuData);

		// For single-core CPU
		if (cpuStatArray.length === 2) {
			cpuStatArray = cpuStatArray.slice(1, 2);
			delete this.availableViewModes[2];
			delete this.availableViewModes[3];
			if (this.viewMode > 1) this.viewMode = 0;
		};

		let cpuLoadArray = this.calcCPULoad(cpuStatArray);
		let cpuTable = this.makeCPUTable(cpuStatArray, cpuLoadArray);

		let viewModeSelectFunc = value => {
			this.saveSettingsToLocalStorage(value);
			this.viewMode = value;
			viewModeEntries.forEach(i => {
				i.classList.remove('cpu-status-view-mode-entry-checked');
			});
			viewModeEntries[value].classList.add('cpu-status-view-mode-entry-checked');
			let newTable = this.makeCPUTable(cpuStatArray, cpuLoadArray);
			cpuTable.replaceWith(newTable);
			cpuTable = newTable;
		};

		let viewModeSelectOnClick = ev => {
			viewModeSelectFunc(ev.target.dataset.value);
			ev.target.blur();
		};

		let viewModeEntries = [];

		for (let [i, v] of Object.entries(this.availableViewModes)) {
			viewModeEntries.push(
				E('span', {
					'class': 'cpu-status-view-mode-entry',
					'href': 'javascript:void(0)',
					'data-value': i,
					'click': viewModeSelectOnClick,
				}, v[1])
			);
		};

		viewModeSelectFunc(this.viewMode);

		this.lastStatArray = cpuStatArray;

		var container = E('div', { 'class': 'cpu-info-container' });
		container.appendChild(E('div',
			{ 'style': 'margin-bottom:1em; padding:0 4px;' },
			viewModeEntries
		));
		container.appendChild(cpuTable);

		return container;
	},
});
