'use strict';
'require view';
'require dom';
'require fs';
'require ui';
'require uci';

/*
	Copyright 2021-2024 Rafał Wabik - IceG - From eko.one.pl forum
	
	Licensed to the GNU General Public License v3.0.
*/

// 添加现代化CSS样式
const debugPageCSS = `
<style>
.debug-container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 20px;
}

.debug-header {
	text-align: center;
	margin-bottom: 30px;
	padding: 20px;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 12px;
	color: white;
	box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.debug-header h2 {
	margin: 0 0 10px 0;
	font-size: 28px;
	font-weight: 300;
}

.debug-header p {
	margin: 0;
	opacity: 0.9;
	font-size: 16px;
}

.debug-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
	gap: 20px;
	margin-bottom: 30px;
}

.debug-card {
	background: white;
	border-radius: 12px;
	padding: 25px;
	box-shadow: 0 4px 20px rgba(0,0,0,0.08);
	border: 1px solid #e9ecef;
	transition: all 0.3s ease;
	position: relative;
	overflow: hidden;
}

.debug-card:hover {
	transform: translateY(-2px);
	box-shadow: 0 8px 30px rgba(0,0,0,0.12);
}

.debug-card::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 4px;
	background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

.debug-card-icon {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 50px;
	height: 50px;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 50%;
	margin-bottom: 15px;
	color: white;
	font-size: 20px;
}

.debug-card-title {
	font-size: 18px;
	font-weight: 600;
	color: #2c3e50;
	margin-bottom: 8px;
	display: flex;
	align-items: center;
	gap: 10px;
}

.debug-card-description {
	color: #6c757d;
	margin-bottom: 15px;
	line-height: 1.5;
}

.debug-card-command {
	background: #f8f9fa;
	border: 1px solid #e9ecef;
	border-radius: 6px;
	padding: 8px 12px;
	font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
	font-size: 13px;
	color: #495057;
	margin-bottom: 15px;
}

.debug-action-button {
	width: 100%;
	padding: 12px 20px;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border: none;
	border-radius: 8px;
	color: white;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.3s ease;
	position: relative;
	overflow: hidden;
}

.debug-action-button:hover:not(:disabled) {
	transform: translateY(-1px);
	box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.debug-action-button:disabled {
	opacity: 0.6;
	cursor: not-allowed;
	transform: none;
}

.debug-action-button:active {
	transform: translateY(0);
}

.debug-output-section {
	background: white;
	border-radius: 12px;
	padding: 25px;
	box-shadow: 0 4px 20px rgba(0,0,0,0.08);
	border: 1px solid #e9ecef;
	margin-top: 20px;
}

.debug-output-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20px;
	padding-bottom: 15px;
	border-bottom: 2px solid #e9ecef;
}

.debug-output-title {
	font-size: 18px;
	font-weight: 600;
	color: #2c3e50;
	margin: 0;
}

.debug-output-controls {
	display: flex;
	gap: 10px;
}

.debug-output-textarea {
	width: 100%;
	min-height: 400px;
	border: 2px solid #e9ecef;
	border-radius: 8px;
	padding: 15px;
	font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
	font-size: 13px;
	line-height: 1.4;
	background: #f8f9fa;
	color: #495057;
	resize: vertical;
	transition: border-color 0.3s ease;
}

.debug-output-textarea:focus {
	outline: none;
	border-color: #667eea;
	box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.debug-control-button {
	padding: 8px 16px;
	border: 2px solid transparent;
	border-radius: 6px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.3s ease;
}

.debug-control-button.clear {
	background: #dc3545;
	color: white;
}

.debug-control-button.clear:hover {
	background: #c82333;
	transform: translateY(-1px);
}

.debug-control-button.download {
	background: #28a745;
	color: white;
}

.debug-control-button.download:hover {
	background: #218838;
	transform: translateY(-1px);
}

.debug-status-indicator {
	position: absolute;
	top: 15px;
	right: 15px;
	width: 12px;
	height: 12px;
	border-radius: 50%;
	background: #6c757d;
	transition: all 0.3s ease;
}

.debug-status-indicator.running {
	background: #ffc107;
	animation: pulse 1.5s infinite;
}

.debug-status-indicator.completed {
	background: #28a745;
}

@keyframes pulse {
	0% { opacity: 1; }
	50% { opacity: 0.5; }
	100% { opacity: 1; }
}

@media (max-width: 768px) {
	.debug-grid {
		grid-template-columns: 1fr;
	}
	
	.debug-container {
		padding: 15px;
	}
	
	.debug-output-controls {
		flex-direction: column;
	}
	
	.debug-output-header {
		flex-direction: column;
		align-items: flex-start;
		gap: 15px;
	}
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
	.debug-card,
	.debug-output-section {
		background: #2d3748;
		border-color: #4a5568;
		color: #e2e8f0;
	}
	
	.debug-card-title {
		color: #e2e8f0;
	}
	
	.debug-card-description {
		color: #a0aec0;
	}
	
	.debug-card-command {
		background: #4a5568;
		border-color: #718096;
		color: #e2e8f0;
	}
	
	.debug-output-textarea {
		background: #4a5568;
		border-color: #718096;
		color: #e2e8f0;
	}
	
	.debug-output-title {
		color: #e2e8f0;
	}
}
</style>
`;

return view.extend({
	handleCommand: function(exec, args, statusId) {
		var buttons = document.querySelectorAll('.diag-action > .debug-action-button');
		var statusIndicator = statusId ? document.getElementById(statusId) : null;

		for (var i = 0; i < buttons.length; i++)
			buttons[i].setAttribute('disabled', 'true');

		// 设置运行状态
		if (statusIndicator) {
			statusIndicator.classList.remove('completed');
			statusIndicator.classList.add('running');
		}

		return fs.exec(exec, args).then(function(res) {
			var out = document.querySelector('textarea');
			out.style.display = '';

			dom.content(out, [ res.stdout || '', res.stderr || '' ]);
			fs.write('/tmp/debug_result.txt', [ res.stdout || '' ]);
			
			// 设置完成状态
			if (statusIndicator) {
				statusIndicator.classList.remove('running');
				statusIndicator.classList.add('completed');
			}
		}).catch(function(err) {
			ui.addNotification(null, E('p', [ err ]));
			
			// 重置状态
			if (statusIndicator) {
				statusIndicator.classList.remove('running', 'completed');
			}
		}).finally(function() {
			var viewbc = document.getElementById('clear');
			viewbc.style.display = '';
			var viewbd = document.getElementById('download');
			viewbd.style.display = '';

			for (var i = 0; i < buttons.length; i++)
				buttons[i].removeAttribute('disabled');
		});
	},

	handleUSB: function(ev, cmd) {
		return this.handleCommand('/bin/cat', ['/sys/kernel/debug/usb/devices'], 'usb-status');
	},

	handleTTY: function(ev, cmd) {
		return this.handleCommand('/bin/ls', ['/dev'], 'tty-status');
	},

	handleDBG: function(ev, cmd) {
		return this.handleCommand('/bin/sh', ['-x', '/usr/share/3ginfo-lite/3ginfo.sh'], 'debug-status');
	},
	
	handleDial: function(ev, cmd) {
		var device = uci.get('3ginfo', '3ginfo', 'device') || '/dev/ttyUSB1';
		return this.handleCommand('sms_tool', ['-d', device, 'at', 'AT^NDISDUP=1,1'], 'dial-status');
	},

	handleClear: function(ev) {
		var out = document.getElementById('pre');
		out.style.display = 'none';
		out.value = '';
		var viewbc = document.getElementById('clear');
		viewbc.style.display = 'none';
		var viewbd = document.getElementById('download');
		viewbd.style.display = 'none';
		fs.write('/tmp/debug_result.txt', '');
		
		// 重置所有状态指示器
		var indicators = document.querySelectorAll('.debug-status-indicator');
		for (var i = 0; i < indicators.length; i++) {
			indicators[i].classList.remove('running', 'completed');
		}
	},

	handleDownload: function(ev) {
		return L.resolveDefault(fs.read_direct('/tmp/debug_result.txt'), null).then(function (res) {
				if (res) {
					var link = E('a', {
						'download': 'debug_result.txt',
						'href': URL.createObjectURL(
							new Blob([ res ], { type: 'text/plain' })),
					});
					link.click();
					URL.revokeObjectURL(link.href);
				}
			}).catch(() => {
				ui.addNotification(null, E('p', {}, _('Download error') + ': ' + err.message));
		});

	},

	load: function() {
		return L.resolveDefault(uci.load('luci'));
	},

	render: function(res) {
		// 添加CSS样式到页面
		document.head.insertAdjacentHTML('beforeend', debugPageCSS);


		var view = E('div', { 'class': 'debug-container' }, [
			// 标题区域
			E('div', { 'class': 'debug-header' }, [
				E('h2', {}, [ _('3G/4G/5G Modem Diagnostics') ]),
				E('p', {}, [
					_('Execute various diagnostic commands to check modem availability and troubleshoot data collection issues.')
				])
			]),

			// 诊断工具卡片网格
			E('div', { 'class': 'debug-grid' }, [
				// 拨号功能卡片
				E('div', { 'class': 'debug-card' }, [
					E('div', { 'class': 'debug-status-indicator', 'id': 'dial-status' }),
					E('div', { 'class': 'debug-card-icon' }, '📞'),
					E('div', { 'class': 'debug-card-title' }, _('Modem Dial')),
					E('div', { 'class': 'debug-card-description' }, 
						_('Initialize modem connection and establish data session.')
					),
					E('div', { 'class': 'debug-card-command' }, 'AT^NDISDUP=1,1'),
					E('span', { 'class': 'diag-action' }, [
						E('button', {
							'class': 'debug-action-button',
							'click': ui.createHandlerFn(this, 'handleDial')
						}, [ _('Connect') ])
					])
				]),

				// USB设备信息卡片
				E('div', { 'class': 'debug-card' }, [
					E('div', { 'class': 'debug-status-indicator', 'id': 'usb-status' }),
					E('div', { 'class': 'debug-card-icon' }, '🔌'),
					E('div', { 'class': 'debug-card-title' }, _('USB Devices')),
					E('div', { 'class': 'debug-card-description' }, 
						_('Show detailed USB device information and debug data.')
					),
					E('div', { 'class': 'debug-card-command' }, 'cat /sys/kernel/debug/usb/devices'),
					E('span', { 'class': 'diag-action' }, [
						E('button', {
							'class': 'debug-action-button',
							'click': ui.createHandlerFn(this, 'handleUSB')
						}, [ _('Show USB Info') ])
					])
				]),

				// TTY端口检查卡片
				E('div', { 'class': 'debug-card' }, [
					E('div', { 'class': 'debug-status-indicator', 'id': 'tty-status' }),
					E('div', { 'class': 'debug-card-icon' }, '🔗'),
					E('div', { 'class': 'debug-card-title' }, _('TTY Ports')),
					E('div', { 'class': 'debug-card-description' }, 
						_('Check availability of ttyX communication ports.')
					),
					E('div', { 'class': 'debug-card-command' }, 'ls /dev'),
					E('span', { 'class': 'diag-action' }, [
						E('button', {
							'class': 'debug-action-button',
							'click': ui.createHandlerFn(this, 'handleTTY')
						}, [ _('List Ports') ])
					])
				]),

				// 3ginfo脚本调试卡片
				E('div', { 'class': 'debug-card' }, [
					E('div', { 'class': 'debug-status-indicator', 'id': 'debug-status' }),
					E('div', { 'class': 'debug-card-icon' }, '🔧'),
					E('div', { 'class': 'debug-card-title' }, _('Script Debug')),
					E('div', { 'class': 'debug-card-description' }, 
						_('Run 3ginfo script in debug mode to trace data collection.')
					),
					E('div', { 'class': 'debug-card-command' }, 'sh -x /usr/share/3ginfo-lite/3ginfo.sh'),
					E('span', { 'class': 'diag-action' }, [
						E('button', {
							'class': 'debug-action-button',
							'click': ui.createHandlerFn(this, 'handleDBG')
						}, [ _('Run Debug') ])
					])
				])
			]),

			// 输出区域
			E('div', { 'class': 'debug-output-section' }, [
				E('div', { 'class': 'debug-output-header' }, [
					E('h3', { 'class': 'debug-output-title' }, _('Command Output')),
					E('div', { 'class': 'debug-output-controls' }, [
						E('button', {
							'class': 'debug-control-button clear',
							'id': 'clear',
							'style': 'display:none',
							'click': ui.createHandlerFn(this, 'handleClear')
						}, [ _('Clear') ]),
						E('button', {
							'class': 'debug-control-button download',
							'id': 'download',
							'style': 'display:none',
							'click': ui.createHandlerFn(this, 'handleDownload')
						}, [ _('Download') ])
					])
				]),
				E('textarea', {
					'id': 'pre',
					'class': 'debug-output-textarea',
					'style': 'display:none',
					'readonly': true,
					'wrap': 'off',
					'placeholder': _('Command output will appear here...')
				}, [])
			])
		]);

		return view;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
