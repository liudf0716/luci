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

// 添加表格样式
document.head.append(E('style', { 'type': 'text/css' },
	`
.modem-table {
	width: 100%;
	border-collapse: collapse;
	margin: 16px 0;
	background: #fff;
	border-radius: 8px;
	overflow: hidden;
	box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
:root[data-darkmode="true"] .modem-table {
	background: rgba(33, 37, 41, 0.9);
}
.modem-table th,
.modem-table td {
	padding: 12px 16px;
	text-align: left;
	border-bottom: 1px solid #dee2e6;
}
:root[data-darkmode="true"] .modem-table th,
:root[data-darkmode="true"] .modem-table td {
	border-bottom-color: #495057;
}
.modem-table th {
	background: #f8f9fa;
	font-weight: 600;
	color: #495057;
	font-size: 14px;
}
/* 统一表格列宽 */
.modem-table th:first-child,
.modem-table td:first-child {
	width: 40%;
	min-width: 140px;
	font-weight: 500;
}
.modem-table th:last-child,
.modem-table td:last-child {
	width: 60%;
	word-break: break-word;
}
/* 增强表格视觉一致性 */
.modem-table th:first-child {
	font-weight: 600;
	color: #495057;
}
.modem-table td:first-child {
	background: rgba(248, 249, 250, 0.5);
	border-right: 1px solid rgba(222, 226, 230, 0.5);
}
:root[data-darkmode="true"] .modem-table td:first-child {
	background: rgba(52, 58, 64, 0.3);
	border-right: 1px solid rgba(73, 80, 87, 0.5);
}
:root[data-darkmode="true"] .modem-table th {
	background: rgba(52, 58, 64, 0.8);
	color: #adb5bd;
}
.modem-table td {
	color: #212529;
	font-size: 14px;
}
:root[data-darkmode="true"] .modem-table td {
	color: #ffffff;
}
.modem-table tr:hover {
	background: rgba(0,123,255,0.05);
}
:root[data-darkmode="true"] .modem-table tr:hover {
	background: rgba(0,123,255,0.1);
}
.modem-table tr:last-child td {
	border-bottom: none;
}
.modem-section-title {
	font-size: 18px;
	font-weight: 600;
	color: #495057;
	margin: 24px 0 12px 0;
	border-bottom: 2px solid #007bff;
	padding-bottom: 8px;
}
:root[data-darkmode="true"] .modem-section-title {
	color: #adb5bd;
}
/* 响应式设计 - 移动端优化 */
@media (max-width: 768px) {
	.modem-table {
		font-size: 13px;
		margin: 12px 0;
	}
	.modem-table th,
	.modem-table td {
		padding: 8px 12px;
	}
	.modem-table th:first-child,
	.modem-table td:first-child {
		width: 45%;
		min-width: 120px;
	}
	.modem-table th:last-child,
	.modem-table td:last-child {
		width: 55%;
	}
	.modem-section-title {
		font-size: 16px;
		margin: 20px 0 10px 0;
	}
}
@media (max-width: 480px) {
	.modem-table {
		font-size: 12px;
		margin: 10px 0;
	}
	.modem-table th,
	.modem-table td {
		padding: 6px 8px;
	}
	.modem-table th:first-child,
	.modem-table td:first-child {
		width: 50%;
		min-width: 100px;
	}
	.modem-table th:last-child,
	.modem-table td:last-child {
		width: 50%;
	}
	.modem-section-title {
		font-size: 15px;
		margin: 16px 0 8px 0;
	}
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
	transition: width 0.8s ease, background 0.3s ease;
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

/* Config页面样式 */
.config-container {
	max-width: 1000px;
	margin: 0 auto;
	padding: 20px;
}

.config-header {
	text-align: center;
	margin-bottom: 30px;
	padding: 25px;
	background: linear-gradient(135deg, #4e54c8 0%, #8f94fb 100%);
	border-radius: 12px;
	color: white;
	box-shadow: 0 4px 20px rgba(78, 84, 200, 0.2);
}

.config-header h2 {
	margin: 0 0 10px 0;
	font-size: 28px;
	font-weight: 300;
}

.config-header p {
	margin: 0;
	opacity: 0.9;
	font-size: 16px;
	line-height: 1.5;
}

.config-section {
	background: white;
	border-radius: 12px;
	padding: 30px;
	margin-bottom: 25px;
	box-shadow: 0 2px 20px rgba(0,0,0,0.08);
	border: 1px solid #e9ecef;
	transition: all 0.3s ease;
	position: relative;
	overflow: hidden;
}

.config-section::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 4px;
	background: linear-gradient(90deg, #4e54c8 0%, #8f94fb 100%);
}

.config-section-title {
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 25px;
	font-size: 18px;
	font-weight: 600;
	color: #2c3e50;
}

.config-section-icon {
	font-size: 20px;
	width: 28px;
	height: 28px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #4e54c8 0%, #8f94fb 100%);
	border-radius: 8px;
	color: white;
}

/* 在config-section内的表格样式覆盖 */
.config-section .modem-table {
	margin: 0;
	box-shadow: none;
	border-radius: 0;
	border: none;
}

.config-section .modem-table th,
.config-section .modem-table td {
	border-bottom: 1px solid #e9ecef;
}

.config-section .modem-table th {
	background: transparent;
	padding-bottom: 16px;
}

.config-section .modem-table tr:last-child th,
.config-section .modem-table tr:last-child td {
	border-bottom: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
	.config-container {
		padding: 10px;
	}
	
	.config-section {
		padding: 20px 15px;
	}
	
	.config-section-title {
		font-size: 16px;
	}
	
	.config-section-icon {
		width: 24px;
		height: 24px;
		font-size: 16px;
	}
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
	.config-section {
		background: #2d3748;
		border-color: #4a5568;
		color: #e2e8f0;
	}
	
	.config-section-title {
		color: #e2e8f0;
	}
	
	.config-section .modem-table th {
		color: #e2e8f0;
	}
	
	.config-section .modem-table td {
		color: #a0aec0;
	}
	
	.config-section .modem-table th,
	.config-section .modem-table td {
		border-bottom-color: #4a5568;
	}
}
	`
));

function csq_bar(v, m) {
	const cell = document.querySelector('#csq');
	const vn = parseInt(v) || 0;
	const mn = parseInt(m) || 100;
	const pc = Math.floor((100 / mn) * vn);
	let tip;
	let color;
	
	if (vn >= 20 && vn <= 31) {
		color = '#28a745';
		tip = _('Very good');
	} else if (vn >= 14 && vn <= 19) {
		color = '#ffc107';
		tip = _('Good');
	} else if (vn >= 10 && vn <= 13) {
		color = '#fd7e14';
		tip = _('Weak');
	} else if (vn <= 9 && vn >= 1) {
		color = '#dc3545';
		tip = _('Very weak');
	} else {
		color = '#6c757d';
		tip = _('Unknown');
	}
	
	cell.innerHTML = `
		<div style="display: flex; align-items: center; gap: 8px;">
			<div style="flex: 1; height: 8px; background: rgba(0,0,0,0.1); border-radius: 4px; overflow: hidden;">
				<div style="height: 100%; width: ${pc}%; background: ${color}; border-radius: 4px; transition: all 0.3s ease;"></div>
			</div>
			<span style="font-size: 12px; color: #6c757d; white-space: nowrap;">${v} (${tip})</span>
		</div>
	`;
}

function rssi_bar(v, m) {
	const cell = document.querySelector('#rssi');
	let vn = parseInt(v) || 0;
	const mn = parseInt(m) || 100;
	let tip;
	let color;
	
	if (vn > -50) vn = -50;
	if (vn < -110) vn = -110;
	
	const pc = Math.floor(100 * (1 - (-50 - vn) / (-50 - mn)));
	
	if (vn > -70) {
		color = '#28a745';
		tip = _('Very good');
	} else if (vn >= -85 && vn <= -70) {
		color = '#ffc107';
		tip = _('Good');
	} else if (vn >= -100 && vn <= -86) {
		color = '#fd7e14';
		tip = _('Weak');
	} else if (vn < -100) {
		color = '#dc3545';
		tip = _('Very weak');
	} else {
		color = '#6c757d';
		tip = _('Unknown');
	}
	
	cell.innerHTML = `
		<div style="display: flex; align-items: center; gap: 8px;">
			<div style="flex: 1; height: 8px; background: rgba(0,0,0,0.1); border-radius: 4px; overflow: hidden;">
				<div style="height: 100%; width: ${pc}%; background: ${color}; border-radius: 4px; transition: all 0.3s ease;"></div>
			</div>
			<span style="font-size: 12px; color: #6c757d; white-space: nowrap;">${v} (${tip})</span>
		</div>
	`;
}

function rsrp_bar(v, m) {
	const cell = document.querySelector('#rsrp');
	let vn = parseInt(v) || 0;
	const mn = parseInt(m) || 100;
	let tip;
	let color;
	
	if (vn > -50) vn = -50;
	if (vn < -140) vn = -140;
	
	const pc = Math.floor(120 * (1 - (-50 - vn) / (-70 - mn)));
	
	if (vn >= -80) {
		color = '#28a745';
		tip = _('Very good');
	} else if (vn >= -90 && vn <= -79) {
		color = '#ffc107';
		tip = _('Good');
	} else if (vn >= -100 && vn <= -89) {
		color = '#fd7e14';
		tip = _('Weak');
	} else if (vn < -100) {
		color = '#dc3545';
		tip = _('Very weak');
	} else {
		color = '#6c757d';
		tip = _('Unknown');
	}
	
	cell.innerHTML = `
		<div style="display: flex; align-items: center; gap: 8px;">
			<div style="flex: 1; height: 8px; background: rgba(0,0,0,0.1); border-radius: 4px; overflow: hidden;">
				<div style="height: 100%; width: ${pc}%; background: ${color}; border-radius: 4px; transition: all 0.3s ease;"></div>
			</div>
			<span style="font-size: 12px; color: #6c757d; white-space: nowrap;">${v} (${tip})</span>
		</div>
	`;
}

function sinr_bar(v, m) {
	const cell = document.querySelector('#sinr');
	const vn = parseInt(v) || 0;
	const mn = parseInt(m) || 100;
	let tip;
	let color;
	
	const pc = Math.floor(100 - (100 * (1 - ((mn - vn) / (mn - 40)))));
	
	if (vn > 20) {
		color = '#28a745';
		tip = _('Excellent');
	} else if (vn >= 13 && vn <= 20) {
		color = '#ffc107';
		tip = _('Good');
	} else if (vn > 0 && vn <= 12) {
		color = '#fd7e14';
		tip = _('Mid cell');
	} else if (vn <= 0) {
		color = '#dc3545';
		tip = _('Cell edge');
	} else {
		color = '#6c757d';
		tip = _('Unknown');
	}
	
	cell.innerHTML = `
		<div style="display: flex; align-items: center; gap: 8px;">
			<div style="flex: 1; height: 8px; background: rgba(0,0,0,0.1); border-radius: 4px; overflow: hidden;">
				<div style="height: 100%; width: ${pc}%; background: ${color}; border-radius: 4px; transition: all 0.3s ease;"></div>
			</div>
			<span style="font-size: 12px; color: #6c757d; white-space: nowrap;">${v} (${tip})</span>
		</div>
	`;
}

function rsrq_bar(v, m) {
	const cell = document.querySelector('#rsrq');
	let vn = parseInt(v) || 0;
	const mn = parseInt(m) || 100;
	let tip;
	let color;
	
	const pc = Math.floor(115 - (100 / mn) * vn);
	
	if (vn > 0) vn = 0;
	
	if (vn >= -10) {
		color = '#28a745';
		tip = _('Excellent');
	} else if (vn >= -15 && vn <= -9) {
		color = '#ffc107';
		tip = _('Good');
	} else if (vn >= -20 && vn <= -14) {
		color = '#fd7e14';
		tip = _('Mid cell');
	} else if (vn < -20) {
		color = '#dc3545';
		tip = _('Cell edge');
	} else {
		color = '#6c757d';
		tip = _('Unknown');
	}
	
	cell.innerHTML = `
		<div style="display: flex; align-items: center; gap: 8px;">
			<div style="flex: 1; height: 8px; background: rgba(0,0,0,0.1); border-radius: 4px; overflow: hidden;">
				<div style="height: 100%; width: ${pc}%; background: ${color}; border-radius: 4px; transition: all 0.3s ease;"></div>
			</div>
			<span style="font-size: 12px; color: #6c757d; white-space: nowrap;">${v} (${tip})</span>
		</div>
	`;
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
		// Try index 1 first (multi-modem setup), then fallback to index 0 (single modem)
		let modemz = uci.get('modemdefine', '@modemdefine[1]', 'comm_port');
		if (!modemz) {
			modemz = uci.get('modemdefine', '@modemdefine[0]', 'comm_port');
		}
		const modcElement = document.getElementById("modc");
		if (modcElement) {
			modcElement.disabled = !modemz;
		}
	}).catch(function(e) {
		// If modemdefine config doesn't exist or has errors, disable the button
		const modcElement = document.getElementById("modc");
		if (modcElement) {
			modcElement.disabled = true;
		}
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

function formatDataSize(dataStr) {
	if (!dataStr || dataStr === '-' || dataStr === '') return '-';
	
	// 提取数字部分，支持各种格式（如 "1.23 MB", "1234567", "1,234,567 bytes" 等）
	const numMatch = dataStr.replace(/,/g, '').match(/[\d.]+/);
	if (!numMatch) return dataStr;
	
	let bytes = parseFloat(numMatch[0]);
	
	// 如果原始数据已经包含单位，先转换为字节
	const upperStr = dataStr.toUpperCase();
	if (upperStr.includes('KB') || upperStr.includes('KBYTES')) {
		bytes *= 1024;
	} else if (upperStr.includes('MB') || upperStr.includes('MBYTES')) {
		bytes *= 1024 * 1024;
	} else if (upperStr.includes('GB') || upperStr.includes('GBYTES')) {
		bytes *= 1024 * 1024 * 1024;
	} else if (upperStr.includes('TB') || upperStr.includes('TBYTES')) {
		bytes *= 1024 * 1024 * 1024 * 1024;
	}
	// 如果没有单位或包含'B'/'BYTES'，假设是字节
	
	// 转换为合适的单位
	if (bytes >= 1024 * 1024 * 1024) {
		return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
	} else if (bytes >= 1024 * 1024) {
		return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
	} else if (bytes >= 1024) {
		return (bytes / 1024).toFixed(2) + ' KB';
	} else {
		return bytes.toFixed(0) + ' B';
	}
}

function checkOperatorName(t) {
	if (typeof t !== 'string' || t.trim().length === 0)
		return '-';

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
							ui.addNotification(null, E('p', _('There is a problem reading data from the modem.<br /><br /><b>Please check:</b><ul><li>1. Modem availability in the system.</li><li>2. The correct installation of the SIM card in the modem.</li><li>3. Port for communication with the modem.</li></ul>')), 'info');
					} else {
						// 添加数据缓存来减少不必要的DOM更新
						let lastDataCache = null;
						let pollCounter = 0;
						
						// 设置10秒的轮询间隔
						poll.add(function() {
							return L.resolveDefault(fs.exec_direct('/usr/share/3ginfo-lite/3ginfo.sh', ['json']))
								.then(function(res) {
									const json = JSON.parse(res);
									
									// 检查数据是否有变化
									const currentDataString = JSON.stringify(json);
									if (lastDataCache === currentDataString && pollCounter % 3 !== 0) {
										// 数据没变化且不是每3次强制刷新，跳过DOM更新
										pollCounter++;
										return;
									}
									lastDataCache = currentDataString;
									pollCounter++;

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
									
									// 辅助函数：平滑更新文本内容
									function updateTextContent(elementId, newValue, defaultValue = '-') {
										const element = document.getElementById(elementId);
										if (element) {
											const displayValue = isEmptyField(newValue) ? defaultValue : newValue;
											if (element.textContent !== displayValue) {
												element.style.transition = 'opacity 0.3s ease';
												element.style.opacity = '0.7';
												setTimeout(() => {
													element.textContent = displayValue;
													element.style.opacity = '1';
												}, 150);
											}
										}
									}
									
									// 辅助函数：平滑更新HTML内容
									function updateHtmlContent(elementId, newValue, defaultValue = '-') {
										const element = document.getElementById(elementId);
										if (element) {
											const displayValue = isEmptyField(newValue) ? defaultValue : newValue;
											if (element.innerHTML !== displayValue) {
												element.style.transition = 'opacity 0.3s ease';
												element.style.opacity = '0.7';
												setTimeout(() => {
													element.innerHTML = displayValue;
													element.style.opacity = '1';
												}, 150);
											}
										}
									}
									
									let icon, wicon, ticon, t;
									wicon = L.resource('icons/loading.gif');
									ticon = L.resource('icons/ctime.png');

									const rawSignal = json.signal;
									let signalPercent = null;
									let signalLabel = '-';

									if (!isEmptyField(rawSignal)) {
										const numericSignal = parseFloat(rawSignal);
										if (!isNaN(numericSignal)) {
											if (String(rawSignal).includes('%')) {
												signalPercent = Math.max(0, Math.min(100, numericSignal));
												signalLabel = `${signalPercent}%`;
											} else if (numericSignal <= 0) {
												if (numericSignal <= -10) {
													const bounded = Math.max(-110, Math.min(-50, numericSignal));
													signalPercent = Math.round(((bounded + 110) / 60) * 100);
													signalPercent = Math.max(0, Math.min(100, signalPercent));
													signalLabel = `${numericSignal} dBm (${signalPercent}%)`;
												} else {
													signalLabel = '-';
												}
											} else if (numericSignal <= 97) {
												signalPercent = Math.round((numericSignal / 97) * 100);
												signalPercent = Math.max(0, Math.min(100, signalPercent));
												signalLabel = `${signalPercent}%`;
											} else {
												signalPercent = Math.round(Math.min(100, numericSignal));
												signalLabel = `${signalPercent}%`;
											}
										} else {
											const percentMatch = String(rawSignal).match(/(\d+(?:\.\d+)?)\s*%/);
											if (percentMatch) {
												signalPercent = Math.round(Math.min(100, parseFloat(percentMatch[1])));
												signalLabel = `${signalPercent}%`;
											} else {
												signalLabel = String(rawSignal);
											}
										}
									}

									if (signalPercent === null) {
										const csqNumeric = parseFloat(json.csq);
										if (!isNaN(csqNumeric) && csqNumeric >= 0) {
											signalPercent = Math.round((Math.min(31, csqNumeric) / 31) * 100);
											if (signalLabel === '-' || signalLabel === '') {
												signalLabel = `${signalPercent}%`;
											} else if (!signalLabel.includes('%')) {
												signalLabel += ` (${signalPercent}%)`;
											}
										}
									}

									if (signalPercent === null || isNaN(signalPercent)) {
										signalPercent = 0;
									}

									signalPercent = Math.max(0, Math.min(100, signalPercent));

									if (signalPercent >= 80) {
										icon = L.resource('icons/3ginfo-80-100.png');
									} else if (signalPercent >= 60) {
										icon = L.resource('icons/3ginfo-60-80.png');
									} else if (signalPercent >= 40) {
										icon = L.resource('icons/3ginfo-40-60.png');
									} else if (signalPercent >= 20) {
										icon = L.resource('icons/3ginfo-20-40.png');
									} else if (signalPercent > 0) {
										icon = L.resource('icons/3ginfo-0-20.png');
									} else {
										icon = L.resource('icons/3ginfo-0.png');
									}

									// 平滑更新信号强度
									const signalTextEl = document.getElementById('signal-text');
									if (signalTextEl) {
										const newText = signalLabel;
										if (signalTextEl.textContent !== newText) {
											signalTextEl.style.transition = 'opacity 0.3s ease';
											signalTextEl.style.opacity = '0.7';
											setTimeout(() => {
												signalTextEl.textContent = newText;
												signalTextEl.style.opacity = '1';
											}, 150);
										}
									} else if (document.getElementById('signal')) {
										// 向后兼容旧结构
										const view = document.getElementById('signal');
										const newText = signalLabel;
										if (view.textContent !== newText) {
											view.style.transition = 'opacity 0.3s ease';
											view.style.opacity = '0.7';
											setTimeout(() => {
												view.textContent = newText;
												view.style.opacity = '1';
											}, 150);
										}
									}
									
									// 平滑更新信号图标
									if (document.getElementById('signal-icon')) {
										const iconView = document.getElementById("signal-icon");
										if (iconView.src !== icon) {
											iconView.style.transition = 'opacity 0.3s ease';
											iconView.style.opacity = '0.5';
											setTimeout(() => {
												iconView.src = icon;
												iconView.style.opacity = '1';
											}, 150);
										}
									}
									
									// 平滑更新信号条
									if (document.getElementById('signal-bar')) {
										const barView = document.getElementById("signal-bar");
										const newWidth = `${signalPercent}%`;
										
										// 使用CSS过渡更新宽度
										barView.style.transition = 'width 0.8s ease, background 0.3s ease';
										barView.style.width = newWidth;
										
										// 根据信号强度设置颜色
										let newColor;
										if (signalPercent >= 75) {
											newColor = 'linear-gradient(90deg, #28a745 0%, #28a745 100%)';
										} else if (signalPercent >= 50) {
											newColor = 'linear-gradient(90deg, #ffc107 0%, #ffc107 100%)';
										} else if (signalPercent >= 25) {
											newColor = 'linear-gradient(90deg, #fd7e14 0%, #fd7e14 100%)';
										} else {
											newColor = 'linear-gradient(90deg, #dc3545 0%, #dc3545 100%)';
										}
										barView.style.background = newColor;
									}

									// 使用平滑更新函数更新基本字段
									updateTextContent('txpower', json.txpower);
									updateTextContent('voltage', json.voltage ? json.voltage + "V" : '');
									updateTextContent('operator', checkOperatorName(json.operator_name));
									updateTextContent('mode', json.mode);
									updateTextContent('modem', json.modem);
									updateTextContent('fw', json.firmware);
									updateTextContent('cport', json.cport);
									updateTextContent('protocol', json.protocol);

									// 连接状态更新
									if (document.getElementById('connst')) {
										const view = document.getElementById("connst");
										let newContent;
										if (json.conn_time === '' || json.conn_time === '-') {
											newContent = String.format('<img style="width: 16px; height: 16px; vertical-align: middle;" src="%s"/>' + ' ' + _('Waiting for connection data...'), wicon);
										} else {
											const formattedRx = formatDataSize(json.rx);
											const formattedTx = formatDataSize(json.tx);
											newContent = String.format('<img style="width: 16px; height: 16px; vertical-align: middle;" src="%s"/>' + ' ' + formatDuration(json.conn_time_sec) + ' ' + ' | \u25bc\u202f' + formattedRx + ' \u25b2\u202f' + formattedTx, ticon);
										}
										
										if (view.innerHTML !== newContent) {
											view.style.transition = 'opacity 0.3s ease';
											view.style.opacity = '0.7';
											setTimeout(() => {
												view.innerHTML = newContent;
												view.style.opacity = '1';
											}, 150);
										}
									}

									// 位置信息更新
									if (document.getElementById('location')) {
										const viewloc = document.getElementById("location");
										if (!json.location || json.location.length <= 2) {
											if (viewloc.style.display !== 'none') {
												viewloc.style.display = 'none';
											}
										} else {
											if (viewloc.innerHTML !== json.location) {
												viewloc.style.display = 'block';
												updateHtmlContent('location', json.location);
											}
										}
									}

									// SIM状态更新
									if (document.getElementById('sim')) {
										const view = document.getElementById("sim");
										const sv = document.getElementById("simv");
										let simStatus = '-';
										
										if (json.registration !== '') {
											sv.style.visibility = "visible";
											switch (json.registration) {
												case '0': simStatus = _('Not registered'); break;
												case '1': simStatus = _('Registered'); break;
												case '2': simStatus = _('Searching..'); break;
												case '3': simStatus = _('Registering denied'); break;
												case '5': simStatus = _('Registered (roaming)'); break;
												case '8': simStatus = _('Registered for emergency service only'); break;
												default: simStatus = json.registration;
											}
										}
										updateTextContent('sim', simStatus);
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

									if (document.getElementById('csq')) {
										const csqView = document.getElementById('csq');
										if (isEmptyField(json.csq)) {
											csqView.style.visibility = 'hidden';
											csqView.innerHTML = '-';
										} else {
											csqView.style.visibility = 'visible';
											const csqMax = 31;
											csq_bar(json.csq, csqMax);
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
			return E('div', { class: 'config-container' }, [
				// 配置页面风格的标题区域
				E('div', { class: 'config-header' }, [
					E('h2', {}, _('3G/4G/5G Modem Information')),
					E('p', {}, _('Real-time monitoring of modem status, signal quality, and network information.'))
				]),

				// 顶部控制栏
				E('div', { style: 'display: flex; justify-content: flex-end; margin-bottom: 20px;' }, [
					E('button', {
						id: 'modc',
						class: 'btn cbi-button cbi-button-action',
						click: ui.createHandlerFn(this, function() {
							return upModemDialog.show();
						}),
						style: 'display: flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #4e54c8 0%, #8f94fb 100%); color: white; border: none; padding: 10px 20px; border-radius: 8px;'
					}, [
						E('span', { style: 'font-size: 18px;' }, '☰'),
						_('Modem Settings')
					]),
				]),

				// 连接状态部分
				E('div', { class: 'config-section' }, [
					E('div', { class: 'config-section-title' }, [
						E('div', { class: 'config-section-icon' }, '📶'),
						_('Connection Status')
					]),
					E('table', { class: 'modem-table' }, [
						E('thead', {}, [
							E('tr', {}, [
								E('th', {}, _('Parameter')),
								E('th', {}, _('Value'))
							])
						]),
						E('tbody', {}, [
							E('tr', {}, [
								E('td', {}, _('Signal Strength')),
								E('td', {}, [
									E('div', { class: 'signal-strength-container', id: 'signal-container' }, [
										E('img', {
											id: 'signal-icon',
											class: 'signal-icon',
											src: L.resource('icons/3ginfo-0.png'),
											alt: _('Signal icon')
										}),
										E('div', { class: 'signal-progress' }, [
											E('div', {
												id: 'signal-bar',
												class: 'signal-progress-bar',
												style: 'width: 0%;'
											})
										]),
										E('span', { id: 'signal-text', style: 'min-width: 48px; text-align: right; font-weight: 600;' }, '-')
									])
								])
							]),
							E('tr', {}, [
								E('td', {}, _('Connection Status')),
								E('td', { id: 'connst' }, _('Waiting for data...'))
							]),
							E('tr', {}, [
								E('td', {}, _('Operator')),
								E('td', {}, [
									E('div', { id: 'operator' }, '-'),
									E('div', { style: 'font-size: 12px; color: #6c757d; margin-top: 4px;', id: 'location' }, '-')
								])
							]),
							E('tr', {}, [
								E('td', {}, _('Technology')),
								E('td', { id: 'mode' }, '-')
							])
						])
					])
				]),

				// SIM 信息部分
				E('div', { class: 'config-section' }, [
					E('div', { class: 'config-section-title' }, [
						E('div', { class: 'config-section-icon' }, '📱'),
						_('SIM Information')
					]),
					E('table', { class: 'modem-table' }, [
						E('thead', {}, [
							E('tr', {}, [
								E('th', {}, _('Parameter')),
								E('th', {}, _('Value'))
							])
						]),
						E('tbody', {}, [
							E('tr', {}, [
								E('td', {}, _('SIM Status')),
								E('td', {}, [
									E('span', {
										class: 'ifacebadge',
										title: null,
										id: 'simv',
										style: 'visibility: hidden; margin-right: 8px; padding: 4px; cursor: pointer; border: 1px solid #ccc; border-radius: 4px;',
										click: ui.createHandlerFn(this, function() {
											return upSIMDialog.show(data);
										}),
									}, [
										E('img', {
											src: L.resource('icons/sim1m.png'),
											style: 'width: 16px; height: auto;'
										})
									]),
									E('span', { id: 'sim' }, '-')
								])
							])
						])
					])
				]),

				// 信号质量部分
				E('div', { class: 'config-section' }, [
					E('div', { class: 'config-section-title' }, [
						E('div', { class: 'config-section-icon' }, '📊'),
						_('Signal Quality Metrics')
					]),
					E('table', { class: 'modem-table' }, [
						E('thead', {}, [
							E('tr', {}, [
								E('th', {}, _('Parameter')),
								E('th', {}, _('Value'))
							])
						]),
						E('tbody', {}, [
							E('tr', { id: 'csqn' }, [
								E('td', {}, [
									_('CSQ'),
									E('div', { style: 'font-size: 11px; color: #6c757d; margin-top: 2px;' }, _('(Signal Strength)'))
								]),
								E('td', { id: 'csq' }, '-')
							]),
							E('tr', { id: 'rssin' }, [
								E('td', {}, [
									_('RSSI'),
									E('div', { style: 'font-size: 11px; color: #6c757d; margin-top: 2px;' }, _('(Received Signal Strength Indicator)'))
								]),
								E('td', { id: 'rssi' }, '-')
							]),
							E('tr', { id: 'rsrpn' }, [
								E('td', {}, [
									_('RSRP'),
									E('div', { style: 'font-size: 11px; color: #6c757d; margin-top: 2px;' }, _('(Reference Signal Receive Power)'))
								]),
								E('td', { id: 'rsrp' }, '-')
							]),
							E('tr', { id: 'rsrqn' }, [
								E('td', {}, [
									_('RSRQ'),
									E('div', { style: 'font-size: 11px; color: #6c757d; margin-top: 2px;' }, _('(Reference Signal Received Quality)'))
								]),
								E('td', { id: 'rsrq' }, '-')
							]),
							E('tr', { id: 'sinrn' }, [
								E('td', {}, [
									_('SINR'),
									E('div', { style: 'font-size: 11px; color: #6c757d; margin-top: 2px;' }, _('(Signal to Interference plus Noise Ratio)'))
								]),
								E('td', { id: 'sinr' }, '-')
							])
						])
					])
				]),

				// 设备信息部分
				E('div', { class: 'config-section' }, [
					E('div', { class: 'config-section-title' }, [
						E('div', { class: 'config-section-icon' }, '📟'),
						_('Device Information')
					]),
					E('table', { class: 'modem-table' }, [
						E('thead', {}, [
							E('tr', {}, [
								E('th', {}, _('Parameter')),
								E('th', {}, _('Value'))
							])
						]),
						E('tbody', {}, [
							E('tr', {}, [
								E('td', {}, _('Modem Type')),
								E('td', { id: 'modem' }, '-')
							]),
							E('tr', {}, [
								E('td', {}, _('Firmware')),
								E('td', { id: 'fw' }, '-')
							]),
							E('tr', {}, [
								E('td', {}, _('Communication Port')),
								E('td', { id: 'cport' }, '-')
							]),
							E('tr', {}, [
								E('td', {}, _('Protocol')),
								E('td', { id: 'protocol' }, '-')
							]),
							E('tr', { id: 'tempn' }, [
								E('td', {}, _('Temperature')),
								E('td', { id: 'temp' }, '-')
							]),
							E('tr', {}, [
								E('td', {}, _('TX Power')),
								E('td', { id: 'txpower' }, '-')
							]),
							E('tr', {}, [
								E('td', {}, _('Voltage')),
								E('td', { id: 'voltage' }, '-')
							])
						])
					])
				]),

				// 网络信息部分
				E('div', { class: 'config-section' }, [
					E('div', { class: 'config-section-title' }, [
						E('div', { class: 'config-section-icon' }, '🌐'),
						_('Network Information')
					]),
					E('table', { class: 'modem-table' }, [
						E('thead', {}, [
							E('tr', {}, [
								E('th', {}, _('Parameter')),
								E('th', {}, _('Value'))
							])
						]),
						E('tbody', {}, [
							E('tr', {}, [
								E('td', {}, _('MCC MNC')),
								E('td', { id: 'mccmnc' }, '-')
							]),
							E('tr', {}, [
								E('td', {}, _('Cell ID')),
								E('td', { id: 'cid' }, '-')
							]),
							E('tr', {}, [
								E('td', {}, _('TAC')),
								E('td', { id: 'tac' }, '-')
							]),
							E('tr', { id: 'lacn' }, [
								E('td', {}, _('LAC')),
								E('td', { id: 'lac' }, '-')
							]),
							E('tr', {}, [
								E('td', {}, _('Primary Band')),
								E('td', { id: 'pband' }, '-')
							]),
							E('tr', {}, [
								E('td', {}, _('CA Band (SCC1)')),
								E('td', { id: 's1band' }, '-')
							]),
							E('tr', {}, [
								E('td', {}, _('CA Band (SCC2)')),
								E('td', { id: 's2band' }, '-')
							]),
							E('tr', {}, [
								E('td', {}, _('CA Band (SCC3)')),
								E('td', { id: 's3band' }, '-')
							]),
							E('tr', {}, [
								E('td', {}, _('CA Band (SCC4)')),
								E('td', { id: 's4band' }, '-')
							])
						])
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
		o.title = _('Search Cell Tower using OpenCellID');
		o.inputtitle = _('Search Cell Tower');
		o.description = _('Search for cell tower information using OpenCellID database. Supports MCC, MNC, LAC/TAC and Cell ID parameters.');
		o.onclick = function() {
			// 首先获取当前的modem数据
			return L.resolveDefault(fs.exec_direct('/usr/share/3ginfo-lite/3ginfo.sh', ['json']))
				.then(function(res) {
					if (!res) {
						ui.addNotification(null, E('p', _('Unable to get modem data for BTS search')), 'error');
						return;
					}
					
					const json = JSON.parse(res);
					
					return uci.load('3ginfo').then(function() {
						let searchsite = uci.get('3ginfo', '@3ginfo[0]', 'website');
						
						// 如果没有配置搜索网站，默认使用 opencellid.org
						if (!searchsite) {
							searchsite = 'https://opencellid.org/';
						}

						// OpenCellID 搜索 (默认)
						if (searchsite.includes('opencellid') || !searchsite.includes('btsearch') && !searchsite.includes('lteitaly')) {
							const mcc = json.operator_mcc;
							const mnc = json.operator_mnc;
							const lac = json.lac_dec || json.tac_dec;
							const cid = json.cid_dec;
							
							if (!mcc || !mnc || !cid) {
								ui.addNotification(null, E('p', _('Network information (MCC/MNC/Cell ID) not available for OpenCellID search')), 'error');
								return;
							}
							
							// OpenCellID 前端搜索 - 打开网站并显示搜索信息
							const baseUrl = 'https://opencellid.org/';
							
							// 创建一个包含搜索信息的通知
							const searchInfo = lac ? 
								`MCC: ${mcc}, MNC: ${mnc}, LAC/TAC: ${lac}, Cell ID: ${cid}` :
								`MCC: ${mcc}, MNC: ${mnc}, Cell ID: ${cid}`;
							
							ui.addNotification(null, E('div', {}, [
								E('p', {}, _('Opening OpenCellID with search parameters:')),
								E('p', { style: 'font-family: monospace; background: #f0f0f0; padding: 8px; border-radius: 4px;' }, searchInfo),
								E('p', { style: 'font-size: 12px; color: #666;' }, _('Use the search form on the OpenCellID website with the above parameters.'))
							]), 'info', 8000);
							
							// 打开 OpenCellID 主页
							window.open(baseUrl);
						}
						// BTS Search Poland
						else if (searchsite.includes('btsearch')) {
							// http://www.btsearch.pl/szukaj.php?mode=std&search=CellID
							const id_dec = json.cid_dec;
							const id_hex = json.cid_hex;
							const id_dec_conv = parseInt(id_hex, 16);

							if (id_dec && id_dec.length > 2) {
								window.open(searchsite + id_dec);
							} else if (id_hex) {
								window.open(searchsite + id_dec_conv);
							} else {
								ui.addNotification(null, E('p', _('Cell ID not available for BTS search')), 'error');
							}
						}
						// LTE Italy
						else if (searchsite.includes('lteitaly')) {
							// https://lteitaly.it/internal/map.php#bts=MCCMNC.CellIDdiv256
							const zzmnc = json.operator_mnc;
							const zzmcc = json.operator_mcc;
							const zzcid_dec = json.cid_dec;
							
							if (!zzmnc || !zzmcc || !zzcid_dec) {
								ui.addNotification(null, E('p', _('Network information not available for BTS search')), 'error');
								return;
							}
							
							const first = zzmnc.slice(0, 1);
							const second = zzmnc.slice(1, 2);
							const zzcid = Math.round(zzcid_dec / 256);
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

							window.open(searchsite + zzmcc + cutmnc + '.' + zzcid);
						}
					});
				})
				.catch(function(err) {
					ui.addNotification(null, E('p', _('Error getting modem data: ') + err.message), 'error');
				});
		};

		return m.render();
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
