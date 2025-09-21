'use strict';
'require baseclass';
'require form';
'require fs';
'require view';
'require ui';
'require uci';
'require poll';
'require dom';
'require tools.widgets as widgets';

/*
	Copyright 2021-2024 Rafał Wabik - IceG - From eko.one.pl forum
	
	Licensed to the GNU General Public License v3.0.
	
	Thanks to https://github.com/koshev-msk for the initial progress bar calculation for rssi/rsrp/rsrq/sinnr.
*/

// 添加现代化的CSS样式
document.head.append(E('style', { 'type': 'text/css' },
	`
.modem-info-container {
	background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
	border-radius: 12px;
	padding: 20px;
	margin: 16px 0;
	border: 1px solid rgba(255,255,255,0.15);
	box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
:root[data-darkmode="true"] .modem-info-container {
	background: linear-gradient(135deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 100%);
	border-color: rgba(255,255,255,0.1);
	box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
.modem-section-title {
	font-size: 18px;
	font-weight: 600;
	color: #495057;
	margin-bottom: 16px;
	display: flex;
	align-items: center;
	border-bottom: 2px solid rgba(0,123,255,0.2);
	padding-bottom: 8px;
}
:root[data-darkmode="true"] .modem-section-title {
	color: #adb5bd;
}
.modem-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 16px;
	margin-bottom: 20px;
}
.modem-card {
	background: white;
	border-radius: 8px;
	padding: 16px;
	box-shadow: 0 2px 8px rgba(0,0,0,0.08);
	border-left: 4px solid #007bff;
	transition: all 0.3s ease;
}
:root[data-darkmode="true"] .modem-card {
	background: rgba(33, 37, 41, 0.8);
	box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
.modem-card:hover {
	transform: translateY(-2px);
	box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}
:root[data-darkmode="true"] .modem-card:hover {
	box-shadow: 0 4px 16px rgba(0,0,0,0.3);
}
.modem-card-title {
	font-size: 12px;
	color: #6c757d;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	margin-bottom: 8px;
	font-weight: 500;
}
:root[data-darkmode="true"] .modem-card-title {
	color: #adb5bd;
}
.modem-card-value {
	font-size: 16px;
	font-weight: 600;
	color: #495057;
	word-break: break-all;
}
:root[data-darkmode="true"] .modem-card-value {
	color: #ffffff;
}
.signal-progress {
	width: 100%;
	height: 8px;
	background: rgba(0,0,0,0.1);
	border-radius: 4px;
	overflow: hidden;
	margin: 8px 0;
}
.signal-progress-bar {
	height: 100%;
	border-radius: 4px;
	transition: width 0.3s ease;
	background: linear-gradient(90deg, #28a745 0%, #20c997 100%);
}
.signal-strength-container {
	display: flex;
	align-items: center;
	gap: 12px;
}
.signal-icon {
	width: 32px;
	height: 32px;
	opacity: 0.8;
}
.connection-status {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px;
	background: rgba(40,167,69,0.1);
	border-radius: 8px;
	border: 1px solid rgba(40,167,69,0.2);
}
:root[data-darkmode="true"] .connection-status {
	background: rgba(40,167,69,0.2);
	border-color: rgba(40,167,69,0.3);
}
.status-icon {
	width: 16px;
	height: 16px;
}
.data-transfer {
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 12px;
	color: #6c757d;
}
:root[data-darkmode="true"] .data-transfer {
	color: #adb5bd;
}
	`
));

function csq_bar(v, m) {
	const pg = document.querySelector('#csq');
	const vn = parseInt(v) || 0;
	const mn = parseInt(m) || 100;
	const pc = Math.floor((100 / mn) * vn);
	let tip;
	
	if (vn >= 20 && vn <= 31) {
		pg.style.background = 'linear-gradient(90deg, #28a745 0%, #28a745 100%)';
		tip = _('Very good');
	}
	
	if (vn >= 14 && vn <= 19) {
		pg.style.background = 'linear-gradient(90deg, #ffc107 0%, #ffc107 100%)';
		tip = _('Good');
	}
	
	if (vn >= 10 && vn <= 13) {
		pg.style.background = 'linear-gradient(90deg, #fd7e14 0%, #fd7e14 100%)';
		tip = _('Weak');
	}
	
	if (vn <= 9 && vn >= 1) {
		pg.style.background = 'linear-gradient(90deg, #dc3545 0%, #dc3545 100%)';
		tip = _('Very weak');
	}
	
	pg.style.width = `${pc}%`;
	pg.setAttribute('title', `${v} | ${tip} `);
	
	// 添加数值显示
	const parentCard = pg.closest('.modem-card');
	let valueSpan = parentCard.querySelector('.signal-value');
	if (!valueSpan) {
		valueSpan = document.createElement('span');
		valueSpan.className = 'signal-value';
		valueSpan.style.fontSize = '12px';
		valueSpan.style.color = '#6c757d';
		valueSpan.style.marginTop = '4px';
		valueSpan.style.display = 'block';
		pg.parentNode.appendChild(valueSpan);
	}
	valueSpan.textContent = `${v} (${tip})`;
}

function rssi_bar(v, m) {
	const pg = document.querySelector('#rssi');
	let vn = parseInt(v) || 0;
	const mn = parseInt(m) || 100;
	let tip;
	
	if (vn > -50) vn = -50;
	if (vn < -110) vn = -110;
	
	const pc = Math.floor(100 * (1 - (-50 - vn) / (-50 - mn)));
	
	if (vn > -70) {
		pg.style.background = 'linear-gradient(90deg, #28a745 0%, #28a745 100%)';
		tip = _('Very good');
	}
	
	if (vn >= -85 && vn <= -70) {
		pg.style.background = 'linear-gradient(90deg, #ffc107 0%, #ffc107 100%)';
		tip = _('Good');
	}
	
	if (vn >= -100 && vn <= -86) {
		pg.style.background = 'linear-gradient(90deg, #fd7e14 0%, #fd7e14 100%)';
		tip = _('Weak');
	}
	
	if (vn < -100) {
		pg.style.background = 'linear-gradient(90deg, #dc3545 0%, #dc3545 100%)';
		tip = _('Very weak');
	}
	
	pg.style.width = `${pc}%`;
	pg.setAttribute('title', `${v} | ${tip} `);
	
	// 添加数值显示
	const parentCard = pg.closest('.modem-card');
	let valueSpan = parentCard.querySelector('.signal-value');
	if (!valueSpan) {
		valueSpan = document.createElement('span');
		valueSpan.className = 'signal-value';
		valueSpan.style.fontSize = '12px';
		valueSpan.style.color = '#6c757d';
		valueSpan.style.marginTop = '4px';
		valueSpan.style.display = 'block';
		pg.parentNode.appendChild(valueSpan);
	}
	valueSpan.textContent = `${v} (${tip})`;
}

function rsrp_bar(v, m) {
	const pg = document.querySelector('#rsrp');
	let vn = parseInt(v) || 0;
	const mn = parseInt(m) || 100;
	let tip;
	
	if (vn > -50) vn = -50;
	if (vn < -140) vn = -140;
	
	const pc = Math.floor(120 * (1 - (-50 - vn) / (-70 - mn)));
	
	if (vn >= -80) {
		pg.style.background = 'linear-gradient(90deg, #28a745 0%, #28a745 100%)';
		tip = _('Very good');
	}
	
	if (vn >= -90 && vn <= -79) {
		pg.style.background = 'linear-gradient(90deg, #ffc107 0%, #ffc107 100%)';
		tip = _('Good');
	}
	
	if (vn >= -100 && vn <= -89) {
		pg.style.background = 'linear-gradient(90deg, #fd7e14 0%, #fd7e14 100%)';
		tip = _('Weak');
	}
	
	if (vn < -100) {
		pg.style.background = 'linear-gradient(90deg, #dc3545 0%, #dc3545 100%)';
		tip = _('Very weak');
	}
	
	pg.style.width = `${pc}%`;
	pg.setAttribute('title', `${v} | ${tip} `);
	
	// 添加数值显示
	const parentCard = pg.closest('.modem-card');
	let valueSpan = parentCard.querySelector('.signal-value');
	if (!valueSpan) {
		valueSpan = document.createElement('span');
		valueSpan.className = 'signal-value';
		valueSpan.style.fontSize = '12px';
		valueSpan.style.color = '#6c757d';
		valueSpan.style.marginTop = '4px';
		valueSpan.style.display = 'block';
		pg.parentNode.appendChild(valueSpan);
	}
	valueSpan.textContent = `${v} (${tip})`;
}

function sinr_bar(v, m) {
	const pg = document.querySelector('#sinr');
	const vn = parseInt(v) || 0;
	const mn = parseInt(m) || 100;
	let tip;
	
	const pc = Math.floor(100 - (100 * (1 - ((mn - vn) / (mn - 40)))));
	
	if (vn > 20) {
		pg.style.background = 'linear-gradient(90deg, #28a745 0%, #28a745 100%)';
		tip = _('Excellent');
	}
	
	if (vn >= 13 && vn <= 20) {
		pg.style.background = 'linear-gradient(90deg, #ffc107 0%, #ffc107 100%)';
		tip = _('Good');
	}
	
	if (vn > 0 && vn <= 12) {
		pg.style.background = 'linear-gradient(90deg, #fd7e14 0%, #fd7e14 100%)';
		tip = _('Mid cell');
	}
	
	if (vn <= 0) {
		pg.style.background = 'linear-gradient(90deg, #dc3545 0%, #dc3545 100%)';
		tip = _('Cell edge');
	}
	
	pg.style.width = `${pc}%`;
	pg.setAttribute('title', `${v} | ${tip} `);
	
	// 添加数值显示
	const parentCard = pg.closest('.modem-card');
	let valueSpan = parentCard.querySelector('.signal-value');
	if (!valueSpan) {
		valueSpan = document.createElement('span');
		valueSpan.className = 'signal-value';
		valueSpan.style.fontSize = '12px';
		valueSpan.style.color = '#6c757d';
		valueSpan.style.marginTop = '4px';
		valueSpan.style.display = 'block';
		pg.parentNode.appendChild(valueSpan);
	}
	valueSpan.textContent = `${v} (${tip})`;
}

function rsrq_bar(v, m) {
	const pg = document.querySelector('#rsrq');
	let vn = parseInt(v) || 0;
	const mn = parseInt(m) || 100;
	let tip;
	
	const pc = Math.floor(115 - (100 / mn) * vn);
	
	if (vn > 0) vn = 0;
	
	if (vn >= -10) {
		pg.style.background = 'linear-gradient(90deg, #28a745 0%, #28a745 100%)';
		tip = _('Excellent');
	}
	
	if (vn >= -15 && vn <= -9) {
		pg.style.background = 'linear-gradient(90deg, #ffc107 0%, #ffc107 100%)';
		tip = _('Good');
	}
	
	if (vn >= -20 && vn <= -14) {
		pg.style.background = 'linear-gradient(90deg, #fd7e14 0%, #fd7e14 100%)';
		tip = _('Mid cell');
	}
	
	if (vn < -20) {
		pg.style.background = 'linear-gradient(90deg, #dc3545 0%, #dc3545 100%)';
		tip = _('Cell edge');
	}
	
	pg.style.width = `${pc}%`;
	pg.setAttribute('title', `${v} | ${tip} `);
	
	// 添加数值显示
	const parentCard = pg.closest('.modem-card');
	let valueSpan = parentCard.querySelector('.signal-value');
	if (!valueSpan) {
		valueSpan = document.createElement('span');
		valueSpan.className = 'signal-value';
		valueSpan.style.fontSize = '12px';
		valueSpan.style.color = '#6c757d';
		valueSpan.style.marginTop = '4px';
		valueSpan.style.display = 'block';
		pg.parentNode.appendChild(valueSpan);
	}
	valueSpan.textContent = `${v} (${tip})`;
}

function SIMdata(data) {
	const sdata = JSON.parse(data);

	if (sdata.simslot.length > 0) {
		return ui.itemlist(E('span'), [
			_('SIM Slot'), sdata.simslot,
			_('SIM IMSI'), sdata.imsi,
			_('SIM ICCID'), sdata.iccid,
			_('Modem IMEI'), sdata.imei,
			_('Hint'), _('CLICK ME TO SEE NEW MENU')
		]);
	} else {
		return ui.itemlist(E('span'), [
			_('SIM IMSI'), sdata.imsi,
			_('SIM ICCID'), sdata.iccid,
			_('Modem IMEI'), sdata.imei,
			_('Hint'), _('CLICK ME TO SEE NEW MENU')
		]);
	}
}

function active_select() {
	uci.load('modemdefine').then(function() {
		const modemz = uci.get('modemdefine', '@modemdefine[1]', 'comm_port');
		document.getElementById("modc").disabled = !modemz;
	});
}

function formatDuration(sec) {
	if (sec === '-' || sec === '') return '-';
	
	const d = Math.floor(sec / 86400);
	const h = Math.floor(sec / 3600) % 24;
	const m = Math.floor(sec / 60) % 60;
	const s = sec % 60;
	
	let time = d > 0 ? `${d}d ` : '';
	
	if (time !== '') {
		time += `${h}h `;
	} else {
		time = h > 0 ? `${h}h ` : '';
	}
	
	if (time !== '') {
		time += `${m}m `;
	} else {
		time = m > 0 ? `${m}m ` : '';
	}
	
	time += `${s}s`;
	return time;
}

function formatDateTime(s) {
	if (s.length === 14) {
		return s.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1-$2-$3 $4:$5:$6");
	} else if (s.length === 12) {
		return s.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1-$2-$3 $4:$5");
	} else if (s.length === 8) {
		return s.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
	} else if (s.length === 6) {
		return s.replace(/(\d{4})(\d{2})/, "$1-$2");
	}
	return s;
}

function checkOperatorName(t) {
	const words = t.split(" ");
	const firstOccurrences = {};

	for (let i = 0; i < words.length; i++) {
		const word = words[i].toLowerCase();
		if (!firstOccurrences.hasOwnProperty(word)) {
			firstOccurrences[word] = i;
		}
	}

	const uniqueWords = Object.keys(firstOccurrences).map(word => {
		return words[firstOccurrences[word]];
	});

	return uniqueWords.join(" ");
}

// Helper: determine if a modem field value is effectively empty
function isEmptyField(v) {
    return v === undefined || v === null || v === '' || v === '-' || (typeof v === 'string' && v.trim().length === 0);
}

return view.extend({
	modemDialog: baseclass.extend({
		__init__: function(title, description, callback) {
			this.title = title;
			this.description = description;
			this.callback = callback;
		},

		load: function() {
			return uci.load('modemdefine');
		},

		render: function(content) {
			const sections = uci.sections('modemdefine');
			const portM = sections.length;

			let result = "";
			for (let i = 1; i < portM; i++) {
				result += `${sections[i].comm_port}_${sections[i].network}#${sections[i].comm_port} - ${sections[i].modem} (${sections[i].user_desc});`;
			}
			
			const cleanResult = result.slice(0, -1).replace("(undefined)", "");

			ui.showModal(this.title, [
				E('div', { class: 'cbi-section' }, [
					E('div', { class: 'cbi-section-descr' }, this.description),
					E('div', { class: 'cbi-section' },
						E('p', {},
							E('div', { class: 'cbi-value' }, [
								E('p'),
								E('label', { class: 'cbi-value-title' }, [_('Modem')]),
								E('div', { class: 'cbi-value-field' }, [
									E('select', {
										class: 'cbi-input-select',
										id: 'mselect',
										style: 'margin:0px 0; width:100%;',
									},
									(cleanResult || "").trim().split(/;/).map(function(cmd) {
										const fields = cmd.split(/#/);
										const name = fields[1];
										const code = fields[0];
										return E('option', { value: code }, name);
									}))
								])
							]),
						)
					),
				]),
				E('div', { class: 'right' }, [
					E('button', {
						class: 'btn',
						click: ui.createHandlerFn(this, this.handleDissmis),
					}, _('Cancel')),

					' ',
					E('button', {
						id: 'btn_save',
						class: 'btn cbi-button-positive important',
						click: ui.createHandlerFn(this, this.handleSave),
					}, _('Save')),
				]),
			]);
		},

		handleSave: function(ev) {
			return uci.load('modemdefine').then(function() {
				const vx = document.getElementById('mselect').value;
				const marr = vx.split('_');

				uci.set('modemdefine', '@general[0]', 'main_modem', marr[0].toString());
				uci.set('modemdefine', '@general[0]', 'main_network', marr[1].toString());

				uci.save();
				uci.apply();

				window.setTimeout(function() {
					if (!poll.active()) poll.start();
					location.reload();
				}, 2000);
			});
		},

		handleDissmis: function(ev) {
			ui.hideModal();
			if (!poll.active()) poll.start();
		},

		show: function() {
			ui.showModal(null, 
				E('p', { class: 'spinning' }, _('Loading'))
			);
			poll.stop();
			this.load().then(content => {
				ui.hideModal();
				return this.render(content);
			}).catch(e => {
				ui.hideModal();
				return this.error(e);
			});
		},
	}),

	simDialog: baseclass.extend({
		__init__: function(title, description, callback) {
			this.title = title;
			this.description = description;
			this.callback = callback;
		},

		render: function(jsonData) {
			const json = JSON.parse(jsonData);

			if (json) {
				if (!json.imei.length > 2) {
					return false, poll.start();
				}
			}

			ui.showModal(this.title, [
				E('div', { class: 'cbi-section' }, [
					E('div', { class: 'cbi-section-descr' }, this.description),
					E('div', { class: 'cbi-section', style: 'text-align: left; margin: 0 auto; max-width: 90%' }, [
						E('div', { class: 'cbi-value' }, [
							E('label', { class: 'cbi-value-title', style: 'text-align: left; width: 30%' }, [_('SIM IMSI')]),
							E('div', { class: 'cbi-value-field', style: 'text-align: left' }, [
								E('input', {
									class: 'cbi-input-text',
									readonly: 'readonly',
									value: json.imsi,
									style: 'width: 100%'
								})
							])
						]),
						E('div', { class: 'cbi-value' }, [
							E('label', { class: 'cbi-value-title', style: 'text-align: left; width: 30%' }, [_('SIM ICCID')]),
							E('div', { class: 'cbi-value-field', style: 'text-align: left' }, [
								E('input', {
									class: 'cbi-input-text',
									readonly: 'readonly',
									value: json.iccid,
									style: 'width: 100%'
								})
							])
						]),
						E('div', { class: 'cbi-value' }, [
							E('label', { class: 'cbi-value-title', style: 'text-align: left; width: 30%' }, [_('Modem IMEI')]),
							E('div', { class: 'cbi-value-field', style: 'text-align: left' }, [
								E('input', {
									class: 'cbi-input-text',
									readonly: 'readonly',
									value: json.imei,
									style: 'width: 100%'
								})
							])
						])
					])
				]),
				E('div', { class: 'right' }, [
					E('button', {
						class: 'btn',
						click: ui.createHandlerFn(this, this.handleDissmis),
					}, _('Close'))
				])
			]);
		},

		handleDissmis: function(ev) {
			ui.hideModal();
			if (!poll.active()) poll.start();
		},

		show: function(jsonData) {
			ui.showModal(null,
				E('p', { class: 'spinning' }, _('Loading'))
			);
			poll.stop();
			
			ui.hideModal();
			this.render(jsonData);
		},
	}),

	formdata: { threeginfo: {} },
	
	load: function() {
		return L.resolveDefault(fs.exec_direct('/usr/share/3ginfo-lite/3ginfo.sh', ['json']));
	},

	render: function(data) {
		let m, s, o;

		active_select();

		const upModemDialog = new this.modemDialog(
			_('Defined modems'),
			_('Interface for selecting user defined modems.')
		);

		const upSIMDialog = new this.simDialog(
			_('SIM card menu'),
			_('Information read from the SIM card and device.')
		);

		if (data != null) {
			try {
				const json = JSON.parse(data);

				if (!json.hasOwnProperty('error')) {
					if (json.registration === 'SIM not inserted' || json.registration === '-') {
						ui.addNotification(null, E('p', _('Problem with registering to the network, check the SIM card.')), 'info');
					}
					if (json.registration === 'SIM PIN required') {
						ui.addNotification(null, E('p', _('SIM PIN required')), 'info');
					}
					if (json.registration === 'SIM PUK required') {
						ui.addNotification(null, E('p', _('SIM PUK required')), 'info');
					}
					if (json.registration === 'SIM failure') {
						ui.addNotification(null, E('p', _('SIM failure')), 'info');
					}
					if (json.registration === 'SIM busy') {
						ui.addNotification(null, E('p', _('SIM busy')), 'info');
					}
					if (json.registration === 'SIM wrong') {
						ui.addNotification(null, E('p', _('SIM wrong')), 'info');
					}
					if (json.registration === 'SIM PIN2 required') {
						ui.addNotification(null, E('p', _('SIM PIN2 required')), 'info');
					}
					if (json.registration === 'SIM PUK2 required') {
						ui.addNotification(null, E('p', _('SIM PUK2 required')), 'info');
					}
					
					if (json.rsrp === '') {
						ui.addNotification(null, E('p', _('There is a problem reading data from the modem. \
											<br /><br /><b>Please check:</b> \
											<ul><li>1. Modem availability in the system.</li><li>2. The correct installation of the SIM card in the modem.</li><li> \
											3. Port for communication with the modem.</li><li><ul>')), 'info');
					} else {
						poll.add(function() {
							return L.resolveDefault(fs.exec_direct('/usr/share/3ginfo-lite/3ginfo.sh', 'json'))
								.then(function(res) {
									const json = JSON.parse(res);

									if (!json.cport.includes('192.')) {
										if (json.signal === '0' || json.signal === '') {
											fs.exec('sleep 3');
											if (json.signal === '0' || json.signal === '' || json.signal === '-') {
												L.ui.showModal(_('3ginfo-lite'), [
													E('p', { class: 'spinning' }, _('Waiting to read data from the modem...'))
												]);

												window.setTimeout(function() {
													location.reload();
												}, 5000);
											}
										} else {
											L.hideModal();
										}
									}
									
									let icon, wicon, ticon, t;
									wicon = L.resource('icons/loading.gif');
									ticon = L.resource('icons/ctime.png');

									const p = json.signal;
									if (p > 80) {
										icon = L.resource('icons/3ginfo-80-100.png');
									} else if (p > 60) {
										icon = L.resource('icons/3ginfo-60-80.png');
									} else if (p > 40) {
										icon = L.resource('icons/3ginfo-40-60.png');
									} else if (p > 20) {
										icon = L.resource('icons/3ginfo-20-40.png');
									} else if (p > 0) {
										icon = L.resource('icons/3ginfo-0-20.png');
									} else if (p > 0) {
										icon = L.resource('icons/3ginfo-0.png');
									} else {
										icon = L.resource('icons/3ginfo-0.png');
									}

									if (document.getElementById('signal')) {
										const view = document.getElementById("signal");
										view.textContent = `${p}%`;
									}
									
									if (document.getElementById('signal-icon')) {
										const iconView = document.getElementById("signal-icon");
										iconView.src = icon;
									}
									
									if (document.getElementById('signal-bar')) {
										const barView = document.getElementById("signal-bar");
										barView.style.width = `${p}%`;
										// 根据信号强度设置颜色
										if (p >= 75) {
											barView.style.background = 'linear-gradient(90deg, #28a745 0%, #28a745 100%)';
										} else if (p >= 50) {
											barView.style.background = 'linear-gradient(90deg, #ffc107 0%, #ffc107 100%)';
										} else if (p >= 25) {
											barView.style.background = 'linear-gradient(90deg, #fd7e14 0%, #fd7e14 100%)';
										} else {
											barView.style.background = 'linear-gradient(90deg, #dc3545 0%, #dc3545 100%)';
										}
									}

									if (document.getElementById('txpower')) {
										const view = document.getElementById("txpower");
										if (isEmptyField(json.txpower)) view.textContent = '-'; else view.textContent = checkOperatorName(json.txpower);
									}
									if (document.getElementById('voltage')) {
										const view = document.getElementById("voltage");
										if (isEmptyField(json.voltage)) view.textContent = '-'; else view.textContent = checkOperatorName(json.voltage + "V");
									}

									if (document.getElementById('connst')) {
										const view = document.getElementById("connst");
										if (json.conn_time === '' || json.conn_time === '-') {
											view.innerHTML = String.format('<img style="width: 16px; height: 16px; vertical-align: middle;" src="%s"/>' + ' ' + _('Waiting for connection data...'), wicon);
										} else {
											view.innerHTML = String.format('<img style="width: 16px; height: 16px; vertical-align: middle;" src="%s"/>' + ' ' + formatDuration(json.conn_time_sec) + ' ' + ' | \u25bc\u202f' + json.rx + ' \u25b2\u202f' + json.tx, ticon);
										}
									}

									if (document.getElementById('operator')) {
										const view = document.getElementById("operator");
										if (isEmptyField(json.operator_name)) view.textContent = '-'; else view.textContent = checkOperatorName(json.operator_name);
									}

									if (document.getElementById('location')) {
										const viewloc = document.getElementById("location");
										if (!json.location.length > 2) {
											viewloc.style.display = 'none';
										} else {
											viewloc.innerHTML = json.location;
										}
									}

									if (document.getElementById('sim')) {
										const view = document.getElementById("sim");
										const sv = document.getElementById("simv");
										if (json.registration === '') {
											view.textContent = '-';
										} else {
											sv.style.visibility = "visible";
											view.textContent = json.registration;
											if (json.registration === '0') {
												view.textContent = _('Not registered');
											}
											if (json.registration === '1') {
												view.textContent = _('Registered');
											}
											if (json.registration === '2') {
												view.textContent = _('Searching..');
											}
											if (json.registration === '3') {
												view.textContent = _('Registering denied');
											}
											if (json.registration === '5') {
												view.textContent = _('Registered (roaming)');
											}
											if (json.registration === '8') {
												view.textContent = _('Registered for emergency service only');
											}
										}
									}

									if (document.getElementById('mode')) {
										const view = document.getElementById("mode");
										if (isEmptyField(json.mode)) view.textContent = '-'; else view.textContent = json.mode;
									}

									if (document.getElementById('modem')) {
										const view = document.getElementById("modem");
										if (isEmptyField(json.modem)) view.textContent = '-'; else view.textContent = json.modem;
									}

									if (document.getElementById('fw')) {
										const view = document.getElementById("fw");
										if (isEmptyField(json.firmware)) view.textContent = '-'; else view.textContent = json.firmware;
									}

									if (document.getElementById('cport')) {
										const view = document.getElementById("cport");
										if (isEmptyField(json.cport)) view.textContent = '-'; else view.textContent = json.cport;
									}

									if (document.getElementById('protocol')) {
										const view = document.getElementById("protocol");
										if (isEmptyField(json.protocol)) view.textContent = '-'; else view.textContent = json.protocol;
									}

									if (document.getElementById('temp')) {
										const view = document.getElementById("temp");
										const viewn = document.getElementById("tempn");
										const t = json.mtemp;
										if (!t.length > 1 && t.includes(' ') || t === '' || t === '-') {
											viewn.style.display = 'none';
										} else {
											view.textContent = t.replace('&deg;', '°');
										}
									}

									if (document.getElementById('rssi')) {
										const view = document.getElementById("rssi");
										if (json.rssi === '') {
											view.style.visibility = 'hidden';
										} else {
											view.style.visibility = 'visible';
											const z = json.rssi;
											if (z.includes('dBm')) {
												const rssi_min = -110;
												rssi_bar(json.rssi, rssi_min);
											} else {
												const rssi_min = -110;
												rssi_bar(json.rssi + " dBm", rssi_min);
											}
										}
									}

									if (document.getElementById('rsrp')) {
										const view = document.getElementById('rsrp');
										if (json.rsrp === '') {
											view.style.visibility = 'hidden';
										} else {
											view.style.visibility = 'visible';
											const z = json.rsrp;
											if (z.includes('dBm')) {
												const rsrp_min = -140;
												rsrp_bar(json.rsrp, rsrp_min);
											} else {
												const rsrp_min = -140;
												rsrp_bar(json.rsrp + " dBm", rsrp_min);
											}
										}
									}

									if (document.getElementById('sinr')) {
										const view = document.getElementById("sinr");
										if (json.sinr === '') {
											view.style.visibility = 'hidden';
										} else {
											view.style.visibility = 'visible';
											const z = json.sinr;
											if (z.includes('dB')) {
												view.textContent = json.sinr;
											} else {
												const sinr_min = -21;
												sinr_bar(json.sinr + " dB", sinr_min);
											}
										}
									}

									if (document.getElementById('rsrq')) {
										const view = document.getElementById("rsrq");
										if (json.rsrq === '') {
											view.style.visibility = 'hidden';
										} else {
											view.style.visibility = 'visible';
											const z = json.rsrq;
											if (z.includes('dB')) {
												view.textContent = json.rsrq;
											} else {
												const rsrq_min = -20;
												rsrq_bar(json.rsrq + " dB", rsrq_min);
											}
										}
									}

									if (document.getElementById('mccmnc')) {
										const view = document.getElementById("mccmnc");
										if (json.operator_mcc === '' && json.operator_mnc === '') {
											view.textContent = '-';
										} else {
											view.textContent = `${json.operator_mcc} ${json.operator_mnc}`;
										}
									}

									if (document.getElementById('lac')) {
										const view = document.getElementById("lac");
										const viewn = document.getElementById("lacn");
										if (json.lac_dec.length < 2 || json.lac_hex.length < 2) {
											viewn.style.display = "none";
										} else {
											if (json.lac_dec === '' || json.lac_hex === '') {
												const lc = json.lac_dec + ' ' + json.lac_hex;
												const ld = lc.split(' ').join('');
												view.textContent = ld;
											} else {
												view.innerHTML = `${json.lac_dec} (${json.lac_hex})`;
											}
										}
									}

									if (document.getElementById('tac')) {
										const view = document.getElementById("tac");
										let tac_dh;
										if (json.tac_d.length > 1 || json.tac_h.length > 1) {
											tac_dh = `${json.tac_d} (${json.tac_h})`;
											view.textContent = tac_dh;
										} else {
											if (json.tac_dec.length > 1 || json.tac_hex.length > 1) {
												tac_dh = `${json.tac_dec} (${json.tac_hex})`;
												view.textContent = tac_dh;
											} else {
												view.textContent = '-';
											}
										}
									}

									if (document.getElementById('cid')) {
										const view = document.getElementById("cid");
										if (json.cid_dec === '' || json.cid_hex === '') {
											const cc = json.cid_hex + ' ' + json.cid_dec;
											const cd = cc.split(' ').join('');
											view.textContent = cd;
										} else {
											view.innerHTML = `${json.cid_dec} (${json.cid_hex})`;
										}
									}

									if (document.getElementById('pband')) {
										const view = document.getElementById("pband");
										if (json.pband === '') {
											view.textContent = '-';
										} else {
											if (json.pci.length > 0 && json.earfcn.length > 0) {
												view.textContent = `${json.pband} | ${json.pci} ${json.earfcn}`;
											} else {
												view.textContent = json.pband;
											}
										}
									}

									if (document.getElementById('s1band')) {
										const view = document.getElementById("s1band");
										if (json.s1band === '') {
											view.textContent = '-';
										} else {
											if (json.s1pci.length > 0 && json.s1earfcn.length > 0) {
												view.textContent = `${json.s1band} | ${json.s1pci} ${json.s1earfcn}`;
											} else {
												view.textContent = json.s1band;
											}
										}
									}
									
									if (document.getElementById('s2band')) {
										const view = document.getElementById("s2band");
										if (json.s2band === '') {
											view.textContent = '-';
										} else {
											if (json.s2pci.length > 0 && json.s2earfcn.length > 0) {
												view.textContent = `${json.s2band} | ${json.s2pci} ${json.s2earfcn}`;
											} else {
												view.textContent = json.s2band;
											}
										}
									}
									
									if (document.getElementById('s3band')) {
										const view = document.getElementById("s3band");
										if (json.s3band === '') {
											view.textContent = '-';
										} else {
											if (json.s3pci.length > 0 && json.s3earfcn.length > 0) {
												view.textContent = `${json.s3band} | ${json.s3pci} ${json.s3earfcn}`;
											} else {
												view.textContent = json.s3band;
											}
										}
									}
									
									if (document.getElementById('s4band')) {
										const view = document.getElementById("s4band");
										if (json.s4band === '') {
											view.textContent = '-';
										} else {
											if (json.s4pci.length > 0 && json.s4earfcn.length > 0) {
												view.textContent = `${json.s4band} | ${json.s4pci} ${json.s4earfcn}`;
											} else {
												view.textContent = json.s4band;
											}
										}
									}
								});
						});
					}
				}
			} catch (err) {
				ui.addNotification(null, E('p', _('Error: ') + err.message), 'error');
			}
		}

		const info = _('More information about the 3ginfo on the %seko.one.pl forum%s.').format('<a href="https://eko.one.pl/?p=openwrt-3ginfo" target="_blank">', '</a>');
		m = new form.JSONMap(this.formdata, _('3ginfo-lite'), info);

		s = m.section(form.TypedSection, '3ginfo', '', null);
		s.anonymous = true;

		s.render = L.bind(function(view, section_id) {
			return E('div', { class: 'cbi-section' }, [
				// 顶部控制栏
				E('div', { style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;' }, [
					E('h2', { class: 'modem-section-title', style: 'margin: 0; border: none; padding: 0;' }, _('3G/4G/5G Modem Information')),
					E('button', {
						id: 'modc',
						class: 'btn cbi-button cbi-button-action',
						click: ui.createHandlerFn(this, function() {
							return upModemDialog.show();
						}),
						style: 'display: flex; align-items: center; gap: 8px;'
					}, [
						E('span', { style: 'font-size: 18px;' }, '☰'),
						_('Modem Settings')
					]),
				]),

				// 信号强度和连接状态卡片
				E('div', { class: 'modem-grid' }, [
					E('div', { class: 'modem-card', style: 'border-left-color: #28a745;' }, [
						E('div', { class: 'modem-card-title' }, _('Signal Strength')),
						E('div', { id: 'signal-container', class: 'signal-strength-container' }, [
							E('div', { style: 'flex: 1;' }, [
								E('div', { class: 'modem-card-value', id: 'signal' }, '-'),
								E('div', { class: 'signal-progress' }, [
									E('div', { class: 'signal-progress-bar', id: 'signal-bar' })
								])
							]),
							E('img', { class: 'signal-icon', id: 'signal-icon', src: L.resource('icons/3ginfo-0.png') })
						])
					]),
					E('div', { class: 'modem-card', style: 'border-left-color: #17a2b8;' }, [
						E('div', { class: 'modem-card-title' }, _('Connection Status')),
						E('div', { class: 'connection-status', id: 'connst' }, _('Waiting for data...'))
					]),
					E('div', { class: 'modem-card', style: 'border-left-color: #ffc107;' }, [
						E('div', { class: 'modem-card-title' }, _('Operator')),
						E('div', { class: 'modem-card-value', id: 'operator' }, '-'),
						E('div', { style: 'font-size: 12px; color: #6c757d; margin-top: 4px;', id: 'location' }, '-')
					]),
					E('div', { class: 'modem-card', style: 'border-left-color: #6f42c1;' }, [
						E('div', { class: 'modem-card-title' }, _('Technology')),
						E('div', { class: 'modem-card-value', id: 'mode' }, '-')
					])
				]),

				// SIM信息
				E('h4', { class: 'modem-section-title' }, _('SIM Information')),
				E('div', { class: 'modem-grid' }, [
					E('div', { class: 'modem-card', style: 'grid-column: span 2;' }, [
						E('div', { style: 'display: flex; align-items: center; gap: 12px;' }, [
							E('span', {
								class: 'ifacebadge',
								title: null,
								id: 'simv',
								style: 'visibility: hidden; margin: 0; padding: 8px; cursor: pointer; border: 1px solid #ccc; border-radius: 4px;',
								click: ui.createHandlerFn(this, function() {
									return upSIMDialog.show(data);
								}),
							}, [
								E('img', {
									src: L.resource('icons/sim1m.png'),
									style: 'width: 24px; height: auto;'
								})
							]),
							E('div', { style: 'flex: 1;' }, [
								E('div', { class: 'modem-card-title' }, _('SIM Status')),
								E('div', { class: 'modem-card-value', id: 'sim' }, '-')
							])
						])
					])
				]),

				// 信号质量指标
				E('h4', { class: 'modem-section-title' }, _('Signal Quality Metrics')),
				E('div', { class: 'modem-grid' }, [
					E('div', { class: 'modem-card', id: 'csqn' }, [
						E('div', { class: 'modem-card-title' }, [
							_('CSQ'),
							E('div', { style: 'font-size: 11px; color: #6c757d; margin-top: 2px;' }, _('(Signal Strength)'))
						]),
						E('div', { class: 'signal-progress' }, [
							E('div', { class: 'signal-progress-bar', id: 'csq' })
						])
					]),
					E('div', { class: 'modem-card', id: 'rssin' }, [
						E('div', { class: 'modem-card-title' }, [
							_('RSSI'),
							E('div', { style: 'font-size: 11px; color: #6c757d; margin-top: 2px;' }, _('(Received Signal Strength Indicator)'))
						]),
						E('div', { class: 'signal-progress' }, [
							E('div', { class: 'signal-progress-bar', id: 'rssi' })
						])
					]),
					E('div', { class: 'modem-card', id: 'rsrpn' }, [
						E('div', { class: 'modem-card-title' }, [
							_('RSRP'),
							E('div', { style: 'font-size: 11px; color: #6c757d; margin-top: 2px;' }, _('(Reference Signal Receive Power)'))
						]),
						E('div', { class: 'signal-progress' }, [
							E('div', { class: 'signal-progress-bar', id: 'rsrp' })
						])
					]),
					E('div', { class: 'modem-card', id: 'rsrqn' }, [
						E('div', { class: 'modem-card-title' }, [
							_('RSRQ'),
							E('div', { style: 'font-size: 11px; color: #6c757d; margin-top: 2px;' }, _('(Reference Signal Received Quality)'))
						]),
						E('div', { class: 'signal-progress' }, [
							E('div', { class: 'signal-progress-bar', id: 'rsrq' })
						])
					]),
					E('div', { class: 'modem-card', id: 'sinrn' }, [
						E('div', { class: 'modem-card-title' }, [
							_('SINR'),
							E('div', { style: 'font-size: 11px; color: #6c757d; margin-top: 2px;' }, _('(Signal to Interference plus Noise Ratio)'))
						]),
						E('div', { class: 'signal-progress' }, [
							E('div', { class: 'signal-progress-bar', id: 'sinr' })
						])
					])
				]),

				// 设备信息
				E('h4', { class: 'modem-section-title' }, _('Device Information')),
				E('div', { class: 'modem-grid' }, [
					E('div', { class: 'modem-card' }, [
						E('div', { class: 'modem-card-title' }, _('Modem Type')),
						E('div', { class: 'modem-card-value', id: 'modem' }, '-')
					]),
					E('div', { class: 'modem-card' }, [
						E('div', { class: 'modem-card-title' }, _('Firmware')),
						E('div', { class: 'modem-card-value', id: 'fw' }, '-')
					]),
					E('div', { class: 'modem-card' }, [
						E('div', { class: 'modem-card-title' }, _('Communication Port')),
						E('div', { class: 'modem-card-value', id: 'cport' }, '-')
					]),
					E('div', { class: 'modem-card' }, [
						E('div', { class: 'modem-card-title' }, _('Protocol')),
						E('div', { class: 'modem-card-value', id: 'protocol' }, '-')
					]),
					E('div', { class: 'modem-card', id: 'tempn' }, [
						E('div', { class: 'modem-card-title' }, _('Temperature')),
						E('div', { class: 'modem-card-value', id: 'temp' }, '-')
					]),
					E('div', { class: 'modem-card' }, [
						E('div', { class: 'modem-card-title' }, _('TX Power')),
						E('div', { class: 'modem-card-value', id: 'txpower' }, '-')
					]),
					E('div', { class: 'modem-card' }, [
						E('div', { class: 'modem-card-title' }, _('Voltage')),
						E('div', { class: 'modem-card-value', id: 'voltage' }, '-')
					])
				]),

				// 网络信息
				E('h4', { class: 'modem-section-title' }, _('Network Information')),
				E('div', { class: 'modem-grid' }, [
					E('div', { class: 'modem-card' }, [
						E('div', { class: 'modem-card-title' }, _('MCC MNC')),
						E('div', { class: 'modem-card-value', id: 'mccmnc' }, '-')
					]),
					E('div', { class: 'modem-card' }, [
						E('div', { class: 'modem-card-title' }, _('Cell ID')),
						E('div', { class: 'modem-card-value', id: 'cid' }, '-')
					]),
					E('div', { class: 'modem-card' }, [
						E('div', { class: 'modem-card-title' }, _('TAC')),
						E('div', { class: 'modem-card-value', id: 'tac' }, '-')
					]),
					E('div', { class: 'modem-card', id: 'lacn' }, [
						E('div', { class: 'modem-card-title' }, _('LAC')),
						E('div', { class: 'modem-card-value', id: 'lac' }, '-')
					]),
					E('div', { class: 'modem-card' }, [
						E('div', { class: 'modem-card-title' }, _('Primary Band')),
						E('div', { class: 'modem-card-value', id: 'pband' }, '-')
					]),
					E('div', { class: 'modem-card' }, [
						E('div', { class: 'modem-card-title' }, _('CA Band (SCC1)')),
						E('div', { class: 'modem-card-value', id: 's1band' }, '-')
					]),
					E('div', { class: 'modem-card' }, [
						E('div', { class: 'modem-card-title' }, _('CA Band (SCC2)')),
						E('div', { class: 'modem-card-value', id: 's2band' }, '-')
					]),
					E('div', { class: 'modem-card' }, [
						E('div', { class: 'modem-card-title' }, _('CA Band (SCC3)')),
						E('div', { class: 'modem-card-value', id: 's3band' }, '-')
					]),
					E('div', { class: 'modem-card' }, [
						E('div', { class: 'modem-card-title' }, _('CA Band (SCC4)')),
						E('div', { class: 'modem-card-value', id: 's4band' }, '-')
					])
				])
			]);
		}, o, this);

		s = m.section(form.TypedSection, 'threeginfo', null);
		s.anonymous = true;
		s.addremove = false;

		s.tab('opt1', _('BTS Search'));
		s.anonymous = true;

		o = s.taboption('opt1', form.Button, '_search');
		o.title = _('Search BTS using Cell ID');
		o.inputtitle = _('Search');
		o.onclick = function() {
			return uci.load('3ginfo').then(function() {
				const searchsite = uci.get('3ginfo', '@3ginfo[0]', 'website');

				if (searchsite.includes('btsearch')) {
					// http://www.btsearch.pl/szukaj.php?mode=std&search=CellID
					const id_dec = json.cid_dec;
					const id_hex = json.cid_hex;
					const id_dec_conv = parseInt(id_hex, 16);

					if (id_dec.length > 2) {
						window.open(searchsite + id_dec);
					} else {
						window.open(searchsite + id_dec_conv);
					}
				}

				if (searchsite.includes('lteitaly')) {
					// https://lteitaly.it/internal/map.php#bts=MCCMNC.CellIDdiv256
					const zzmnc = json.operator_mnc;
					const first = zzmnc.slice(0, 1);
					const second = zzmnc.slice(1, 2);
					const zzcid = Math.round(json.cid_dec / 256);
					let cutmnc;
					
					if (zzmnc.length === 3) {
						if (first.includes('0')) {
							cutmnc = zzmnc.slice(1, 3);
						}
						if (first.includes('0') && second.includes('0')) {
							cutmnc = zzmnc.slice(2, 3);
						}
					}
					
					if (zzmnc.length === 2) {
						if (first.includes('0')) {
							cutmnc = zzmnc.slice(1, 2);
						} else {
							cutmnc = zzmnc;
						}
					}
					
					if (zzmnc.length < 2 || (!first.includes('0') && !second.includes('0'))) {
						cutmnc = zzmnc;
					}

					window.open(searchsite + json.operator_mcc + cutmnc + '.' + zzcid);
				}
			});
		};

		return m.render();
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
