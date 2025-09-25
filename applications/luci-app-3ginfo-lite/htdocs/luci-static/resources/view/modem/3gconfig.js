'use strict';
'require form';
'require fs';
'require view';
'require uci';
'require ui';
'require tools.widgets as widgets'

const withEmoji = (emoji, msgid) => `${emoji} ${_(msgid)}`;

/*
	Copyright 2021-2024 Rafał Wabik - IceG - From eko.one.pl forum
	
	Licensed to the GNU General Public License v3.0.
*/

// 添加现代化CSS样式
const configPageCSS = `
<style>
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
	box-shadow: 0 4px 20px rgba(0,0,0,0.08);
	border: 1px solid #e9ecef;
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
	font-size: 20px;
	font-weight: 600;
	color: #2c3e50;
	margin-bottom: 20px;
	display: flex;
	align-items: center;
	gap: 10px;
}

.config-section-icon {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	background: linear-gradient(135deg, #4e54c8 0%, #8f94fb 100%);
	border-radius: 50%;
	color: white;
	font-size: 18px;
}

.config-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 25px;
	margin-top: 20px;
}

.config-field {
	background: #f8f9fa;
	border-radius: 8px;
	padding: 20px;
	border: 1px solid #e9ecef;
	transition: all 0.3s ease;
}

.config-field:hover {
	transform: translateY(-2px);
	box-shadow: 0 4px 15px rgba(0,0,0,0.1);
	border-color: #4e54c8;
}

.config-field-label {
	font-weight: 600;
	color: #2c3e50;
	margin-bottom: 8px;
	display: flex;
	align-items: center;
	gap: 8px;
}

.config-field-description {
	color: #6c757d;
	font-size: 14px;
	margin-bottom: 15px;
	line-height: 1.4;
}

.config-input {
	width: 100%;
	padding: 12px 15px;
	border: 2px solid #e9ecef;
	border-radius: 6px;
	font-size: 14px;
	transition: all 0.3s ease;
	background: white;
}

.config-input:focus {
	outline: none;
	border-color: #4e54c8;
	box-shadow: 0 0 0 3px rgba(78, 84, 200, 0.1);
}

.config-select {
	width: 100%;
	padding: 12px 15px;
	border: 2px solid #e9ecef;
	border-radius: 6px;
	font-size: 14px;
	background: white;
	cursor: pointer;
	transition: all 0.3s ease;
}

.config-select:focus {
	outline: none;
	border-color: #4e54c8;
	box-shadow: 0 0 0 3px rgba(78, 84, 200, 0.1);
}

.config-checkbox {
	position: relative;
	display: inline-flex;
	align-items: center;
	gap: 10px;
	cursor: pointer;
	font-weight: 500;
}

.config-checkbox input[type="checkbox"] {
	appearance: none;
	width: 20px;
	height: 20px;
	border: 2px solid #e9ecef;
	border-radius: 4px;
	position: relative;
	cursor: pointer;
	transition: all 0.3s ease;
	background: white;
}

.config-checkbox input[type="checkbox"]:checked {
	background: #4e54c8;
	border-color: #4e54c8;
}

.config-checkbox input[type="checkbox"]:checked::after {
	content: '✓';
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	color: white;
	font-size: 12px;
	font-weight: bold;
}

.config-tabs {
	display: flex;
	margin-bottom: 20px;
	background: #f8f9fa;
	border-radius: 8px;
	padding: 4px;
}

.config-tab {
	flex: 1;
	padding: 12px 20px;
	text-align: center;
	cursor: pointer;
	border-radius: 6px;
	transition: all 0.3s ease;
	font-weight: 500;
	color: #6c757d;
}

.config-tab.active {
	background: white;
	color: #4e54c8;
	box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.config-tab:hover:not(.active) {
	color: #4e54c8;
	background: rgba(78, 84, 200, 0.05);
}

.config-info-box {
	background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
	border: 1px solid #2196f3;
	border-radius: 8px;
	padding: 15px;
	margin: 15px 0;
	color: #1565c0;
}

.config-info-box .info-icon {
	display: inline-block;
	margin-right: 8px;
	font-weight: bold;
}

.config-warning-box {
	background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
	border: 1px solid #ff9800;
	border-radius: 8px;
	padding: 15px;
	margin: 15px 0;
	color: #e65100;
}

.config-actions {
	display: flex;
	justify-content: flex-end;
	gap: 15px;
	margin-top: 30px;
	padding-top: 20px;
	border-top: 2px solid #e9ecef;
}

.config-button {
	padding: 12px 24px;
	border: none;
	border-radius: 8px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.3s ease;
	min-width: 120px;
}

.config-button.primary {
	background: linear-gradient(135deg, #4e54c8 0%, #8f94fb 100%);
	color: white;
}

.config-button.primary:hover {
	transform: translateY(-2px);
	box-shadow: 0 4px 15px rgba(78, 84, 200, 0.4);
}

.config-button.secondary {
	background: #6c757d;
	color: white;
}

.config-button.secondary:hover {
	background: #5a6268;
	transform: translateY(-1px);
}

@media (max-width: 768px) {
	.config-container {
		padding: 15px;
	}
	
	.config-grid {
		grid-template-columns: 1fr;
	}
	
	.config-actions {
		flex-direction: column;
	}
	
	.config-tabs {
		flex-direction: column;
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
	
	.config-field {
		background: #4a5568;
		border-color: #718096;
		color: #e2e8f0;
	}
	
	.config-field-description {
		color: #a0aec0;
	}
	
	.config-input,
	.config-select {
		background: #4a5568;
		border-color: #718096;
		color: #e2e8f0;
	}
	
	.config-tabs {
		background: #4a5568;
	}
	
	.config-tab {
		color: #a0aec0;
	}
	
	.config-tab.active {
		background: #2d3748;
		color: #8f94fb;
	}
}
</style>
`;

return view.extend({
	load: function() {
		return fs.list('/dev').then(function(devs) {
			return devs.filter(function(dev) {
				return dev.name.match(/^ttyUSB/) || dev.name.match(/^cdc-wdm/) || dev.name.match(/^ttyACM/) || dev.name.match(/^mhi_/) || dev.name.match(/^wwan/);
			});
		});
	},

	render: function(devs) {
		// 添加CSS样式到页面
		document.head.insertAdjacentHTML('beforeend', configPageCSS);

		var m, s, o;
		m = new form.Map('3ginfo', _('3ginfo-lite Configuration'), _('Configuration panel for the 3ginfo-lite application.'));

		// 重写标题显示
		m.title = E('div', { 'class': 'config-header' }, [
			E('h2', {}, _('3G/4G/5G Modem Configuration')),
			E('p', {}, _('Configure your modem settings, connection parameters, and diagnostic options for optimal performance.'))
		]);

		// 基本配置部分
		s = m.section(form.TypedSection, '3ginfo', E('div', { 'class': 'config-section-title' }, [
			E('div', { 'class': 'config-section-icon' }, '⚙️'),
			_('Basic Configuration')
		]));
		s.anonymous = true;

		// 网络接口选项
		const networkLabel = withEmoji('🌐', 'Network Interface');
		o = s.option(widgets.NetworkSelect, 'network', networkLabel,
			E('div', { 'class': 'config-field-description' }, [
				_('Select the network interface for Internet access.'),
				E('div', { 'class': 'config-info-box', 'style': 'margin-top: 10px;' }, [
					E('span', { 'class': 'info-icon' }, 'ℹ️'),
					_('This determines which network interface will be used for modem communication.')
				])
			])
		);
		o.exclude = s.section;
		o.nocreate = true;
		o.rmempty = false;
		o.default = 'wan';

		// 通信端口选项
		const deviceLabel = withEmoji('🔌', 'Communication Port / IP Address');
		o = s.option(form.Value, 'device', 
			deviceLabel, 
			E('div', { 'class': 'config-field-description' }, [
				_('Select the appropriate communication port or IP address for your modem type.'),
				E('div', { 'class': 'config-info-box', 'style': 'margin-top: 10px;' }, [
					E('span', { 'class': 'info-icon' }, 'ℹ️'),
					E('strong', {}, _('Port Selection Guide:')),
					E('br'),
					_('• Traditional modem: Select ttyUSBX port'),
					E('br'),
					_('• HiLink modem: Enter IP address (e.g., 192.168.1.1)')
				])
			])
		);
		devs.sort((a, b) => a.name > b.name);
		devs.forEach(dev => o.value('/dev/' + dev.name));
		o.placeholder = _('Please select a port');
		o.rmempty = true;
		
		// 自动拨号选项
		const autoDialLabel = withEmoji('📞', 'Auto Dial');
		const autoDialInf = withEmoji('⚠️', _('Recommended for stable connections and automatic recovery.'));
		o = s.option(form.Flag, 'auto_dial', autoDialLabel,
			E('div', { 'class': 'config-field-description' }, [
				_('Automatically establish connection on system startup.'),
				E('div', { 'class': 'config-warning-box', 'style': 'margin-top: 10px;' }, [
					autoDialInf
				])
			])
		);
		o.default = '1';
		o.rmempty = false;
		
		// 快速休眠选项
		const fastDormancyLabel = withEmoji('💤', 'Fast Dormancy');
		o = s.option(form.Flag, 'fast_dorm', fastDormancyLabel,
			E('div', { 'class': 'config-field-description' }, [
				_('Enable fast dormancy to save battery and network resources.'),
				E('div', { 'class': 'config-info-box', 'style': 'margin-top: 10px;' }, [
					E('span', { 'class': 'info-icon' }, 'ℹ️'),
					_('Fast dormancy helps reduce power consumption during idle periods.')
				])
			])
		);
		o.default = '0';
		o.rmempty = false;
		
		// 休眠时间选项
		const dormTimeLabel = withEmoji('⏱️', 'Dormancy Time (seconds)');
		o = s.option(form.Value, 'time_length', dormTimeLabel,
			E('div', { 'class': 'config-field-description' }, [
				_('Duration (1-30 seconds) of inactivity before entering energy-saving mode.'),
				E('div', { 'class': 'config-info-box', 'style': 'margin-top: 10px;' }, [
					E('span', { 'class': 'info-icon' }, 'ℹ️'),
					_('Lower values save more power but may affect performance. Recommended: 5-10 seconds.')
				])
			])
		);
		o.datatype = 'range(1, 30)';
		o.default = '5';
		o.depends('fast_dorm', '1');
		o.rmempty = false;

		// BTS搜索设置部分
		s = m.section(form.TypedSection, '3ginfo', E('div', { 'class': 'config-section-title' }, [
			E('div', { 'class': 'config-section-icon' }, '🗼'),
			_('BTS Search Settings')
		]));
		s.anonymous = true;
		s.addremove = false;

		const btsSearchLabel = withEmoji('🌐', 'BTS Search Configuration');
		s.tab('bts1', btsSearchLabel);

		o = s.taboption('bts1', form.DummyValue, '_dummy');
		o.rawhtml = true;
		o.default = E('div', { 'class': 'config-info-box' }, [
			E('span', { 'class': 'info-icon' }, 'ℹ️'),
			_('Select a dedicated website for your location to search for Base Transceiver Stations (BTS). This helps identify nearby cell towers and optimize signal reception.')
		]).outerHTML;

		const websiteLabel = withEmoji('🌐', 'Search Website');
		o = s.taboption('bts1', form.ListValue, 'website', websiteLabel,
			E('div', { 'class': 'config-field-description' }, [
				_('Choose the appropriate BTS search engine for your region.'),
				E('div', { 'class': 'config-warning-box', 'style': 'margin-top: 10px;' }, [
					_('⚠️ OpenCellID provides global coverage. Regional sites may offer more detailed local information.')
				])
			])
		);
		o.value('https://opencellid.org/', _('🌐 opencellid.org (Global)'));
		o.value('http://www.btsearch.pl/szukaj.php?mode=std&search=', _('🇵🇱 btsearch.pl (Poland)'));
		o.value('https://lteitaly.it/internal/map.php#bts=', _('🇮🇹 lteitaly.it (Italy)'));
		o.default = 'https://opencellid.org/';
		o.modalonly = true;

		// 添加自定义CSS类到表单sections
		const originalRender = m.render.bind(m);
		m.render = function() {
			const rendered = originalRender();
			// 为表单添加现代化样式类
			setTimeout(() => {
				// 添加容器样式
				const container = document.querySelector('.cbi-map');
				if (container && !container.classList.contains('config-container')) {
					container.classList.add('config-container');
				}
				
				const sections = document.querySelectorAll('.cbi-section');
				sections.forEach(section => {
					section.classList.add('config-section');
				});
				
				const fieldsets = document.querySelectorAll('.cbi-section-node');
				fieldsets.forEach(fieldset => {
					fieldset.classList.add('config-grid');
				});

				const fields = document.querySelectorAll('.cbi-value');
				fields.forEach(field => {
					field.classList.add('config-field');
				});

				const inputs = document.querySelectorAll('input[type="text"], input[type="number"], select');
				inputs.forEach(input => {
					if (input.type === 'text' || input.type === 'number') {
						input.classList.add('config-input');
					} else if (input.tagName === 'SELECT') {
						input.classList.add('config-select');
					}
				});

				const checkboxes = document.querySelectorAll('input[type="checkbox"]');
				checkboxes.forEach(checkbox => {
					const parent = checkbox.closest('.cbi-value');
					if (parent) {
						parent.classList.add('config-checkbox-field');
					}
				});
			}, 100);
			
			return rendered;
		};

		return m.render();
	}
});
