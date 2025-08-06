'use strict';
'require baseclass';
'require fs';
'require rpc';
'require uci';

document.head.append(E('style', { 'type': 'text/css' },
	`
:root {
	--app-id-font-color: #ffffff;
	--app-id-font-shadow: rgba(0,0,0,0.3);
	--app-id-connected-color: #28a745;
	--app-id-connected-border: #1e7e34;
	--app-id-disconnected-color: #dc3545;
	--app-id-disconnected-border: #bd2130;
	--app-id-undefined-color: #6c757d;
	--app-id-undefined-border: #545b62;
}
:root[data-darkmode="true"] {
	--app-id-font-color: #ffffff;
	--app-id-font-shadow: rgba(0,0,0,0.5);
	--app-id-connected-color: #198754;
	--app-id-connected-border: #146c43;
	--app-id-disconnected-color: #dc3545;
	--app-id-disconnected-border: #b02a37;
	--app-id-undefined-color: #6c757d;
	--app-id-undefined-border: #495057;
}
.id-connected {
	background: linear-gradient(135deg, var(--app-id-connected-color) 0%, #20c997 100%) !important;
	border: 2px solid var(--app-id-connected-border) !important;
	color: var(--app-id-font-color) !important;
	text-shadow: 0 1px 2px var(--app-id-font-shadow);
	box-shadow: 0 2px 4px rgba(40, 167, 69, 0.3);
	position: relative;
}
.id-connected::before {
	content: "●";
	color: #ffffff;
	margin-right: 6px;
	font-size: 1.2em;
	text-shadow: 0 0 3px rgba(255,255,255,0.8);
}
.id-disconnected {
	background: linear-gradient(135deg, var(--app-id-disconnected-color) 0%, #e74c3c 100%) !important;
	border: 2px solid var(--app-id-disconnected-border) !important;
	color: var(--app-id-font-color) !important;
	text-shadow: 0 1px 2px var(--app-id-font-shadow);
	box-shadow: 0 2px 4px rgba(220, 53, 69, 0.3);
	position: relative;
}
.id-disconnected::before {
	content: "●";
	color: #ffffff;
	margin-right: 6px;
	font-size: 1.2em;
	text-shadow: 0 0 3px rgba(255,255,255,0.8);
}
.id-undefined {
	background: linear-gradient(135deg, var(--app-id-undefined-color) 0%, #95a5a6 100%) !important;
	border: 2px solid var(--app-id-undefined-border) !important;
	color: var(--app-id-font-color) !important;
	text-shadow: 0 1px 2px var(--app-id-font-shadow);
	box-shadow: 0 2px 4px rgba(108, 117, 125, 0.3);
	position: relative;
}
.id-undefined::before {
	content: "●";
	color: #ffffff;
	margin-right: 6px;
	font-size: 1.2em;
	text-shadow: 0 0 3px rgba(255,255,255,0.8);
}
.id-label-status {
	display: inline-block;
	word-wrap: break-word;
	margin: 8px 6px !important;
	padding: 12px 20px;
	border-radius: 8px;
	font-weight: 600;
	font-size: 14px;
	transition: all 0.3s ease;
	cursor: default;
	min-width: 180px;
	text-align: left;
}
.id-label-ip {
	display: inline-block;
	word-wrap: break-word;
	margin: 8px 6px !important;
	padding: 12px 20px;
	border-radius: 8px;
	font-weight: 500;
	font-size: 13px;
	transition: all 0.3s ease;
	cursor: default;
	min-width: 200px;
	text-align: left;
	background: rgba(108, 117, 125, 0.1) !important;
	border: 1px solid rgba(108, 117, 125, 0.3) !important;
	color: #495057 !important;
}
:root[data-darkmode="true"] .id-label-ip {
	background: rgba(108, 117, 125, 0.2) !important;
	border-color: rgba(108, 117, 125, 0.4) !important;
	color: #adb5bd !important;
}
.id-label-status:hover {
	transform: translateY(-1px);
	box-shadow: 0 4px 8px rgba(0,0,0,0.2) !important;
}
@keyframes pulse {
	0% { opacity: 1; }
	50% { opacity: 0.7; }
	100% { opacity: 1; }
}
.spinning {
	animation: pulse 1.5s ease-in-out infinite;
}
.internet-status-container {
	background: rgba(255,255,255,0.05);
	border-radius: 12px;
	padding: 16px;
	margin: 12px 0;
	border: 1px solid rgba(255,255,255,0.1);
	width: 100%;
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}
:root[data-darkmode="true"] .internet-status-container {
	background: rgba(0,0,0,0.1);
	border-color: rgba(255,255,255,0.1);
}
`));

return baseclass.extend({
	title: _('Internet Status'),
	appName: 'internet-detector',
	currentAppMode: null,
	inetStatus: null,

	callUIPoll: rpc.declare({
		object: 'luci.internet-detector',
		method: 'UIPoll',
		expect: { '': {} }
	}),

	getUIPoll() {
		return this.callUIPoll().then(data => {
			return data;
		});
	},

	callInetStatus: rpc.declare({
		object: 'luci.internet-detector',
		method: 'InetStatus',
		expect: { '': {} }
	}),

	getInetStatus() {
		return this.callInetStatus().then(data => {
			return data;
		});
	},

	async load() {
		if (!this.currentAppMode) {
			await uci.load(this.appName).then(data => {
				this.currentAppMode = uci.get(this.appName, 'config', 'mode');
			}).catch(e => { });
		};

		if (this.currentAppMode === '2') {
			return this.getUIPoll();
		}
		else if (this.currentAppMode === '1') {
			return L.resolveDefault(this.getInetStatus(), null);
		};
	},

	render(data) {
		if (this.currentAppMode === '0') {
			return;
		}

		this.inetStatus = data;

		let inetStatusArea = E('div', { 'class': 'internet-status-container' });

		if (!this.inetStatus || !this.inetStatus.instances || this.inetStatus.instances.length === 0) {
			let label = E('span', { 'class': 'id-label-status id-undefined' }, _('Undefined'));
			if (this.currentAppMode === '2') {
				label.classList.add('spinning');
			};
			inetStatusArea.append(label);
		} else {
			this.inetStatus.instances.sort((a, b) => a.num > b.num);

			for (let i of this.inetStatus.instances) {
				let status = _('Disconnected');
				let className = 'id-label-status id-disconnected';
				if (i.inet == 0) {
					status = _('Connected');
					className = 'id-label-status id-connected';
				}
				else if (i.inet == -1) {
					status = _('Undefined');
					className = 'id-label-status id-undefined spinning';
				};

				// 创建状态元素
				let statusElement = E('span', {
					'class': className,
					'title': '%s: %s'.format(i.instance, status)
				});
				statusElement.textContent = '%s: %s'.format(i.instance, status);
				inetStatusArea.append(statusElement);

				// 如果有公网IP信息，创建单独的IP元素
				if (i.mod_public_ip !== undefined) {
					let ipText = (i.mod_public_ip === '') ? _('Undefined') : i.mod_public_ip;
					let ipElement = E('span', {
						'class': 'id-label-ip',
						'title': '%s: %s'.format(_('Public IP'), ipText)
					});
					ipElement.textContent = '%s: %s'.format(_('Public IP'), ipText);
					inetStatusArea.append(ipElement);
				}
			};
		};

		return E('div', {
			'class': 'cbi-section',
			'style': 'margin-bottom:1em',
		}, inetStatusArea);
	},
});
