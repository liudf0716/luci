'use strict';
'require view';
'require ui';
'require dom';
'require poll';

// CSS styles matching LuCI standard & Argon / Bootstrap theme
const viewStyles = `
.ems-kpi-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 15px;
	margin-bottom: 20px;
}
.ems-kpi-card {
	background: var(--background-color-high, rgba(255, 255, 255, 0.05));
	border: 1px solid var(--border-color-medium, rgba(255, 255, 255, 0.1));
	border-radius: 8px;
	padding: 16px;
	position: relative;
	overflow: hidden;
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}
.ems-kpi-card::before {
	content: '';
	position: absolute;
	top: 0; left: 0; right: 0;
	height: 3px;
	background: var(--kpi-accent, #06b6d4);
}
.ems-kpi-title {
	font-size: 12px;
	color: var(--text-color-medium, #888);
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8px;
}
.ems-kpi-val {
	font-size: 24px;
	font-weight: 700;
	font-family: monospace;
	color: var(--kpi-accent, #06b6d4);
	display: flex;
	align-items: baseline;
	gap: 6px;
}
.ems-kpi-unit {
	font-size: 12px;
	font-weight: normal;
	color: var(--text-color-medium, #888);
}
.ems-kpi-sub {
	margin-top: 6px;
	font-size: 11px;
	color: var(--text-color-medium, #888);
	display: flex;
	justify-content: space-between;
}
.ems-chart-container {
	width: 100%;
	height: 340px;
	min-height: 340px;
	margin-bottom: 10px;
}
.ems-badge {
	display: inline-block;
	padding: 2px 8px;
	border-radius: 4px;
	font-size: 11px;
	font-weight: bold;
	font-family: monospace;
}
.ems-badge-success { background: rgba(16, 185, 129, 0.2); color: #10b981; }
.ems-badge-warning { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
.ems-badge-info    { background: rgba(6, 182, 212, 0.2); color: #06b6d4; }
.ems-badge-danger  { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
.ems-log-box {
	background: #0d1117;
	color: #58a6ff;
	font-family: monospace;
	font-size: 11.5px;
	padding: 12px;
	border-radius: 6px;
	height: 150px;
	overflow-y: auto;
	line-height: 1.5;
	border: 1px solid rgba(255, 255, 255, 0.1);
}
.ems-btn-group {
	display: flex;
	gap: 10px;
	margin-bottom: 15px;
	flex-wrap: wrap;
}
.ems-btn {
	padding: 6px 14px;
	border-radius: 6px;
	font-size: 12px;
	cursor: pointer;
	border: 1px solid var(--border-color-medium, #444);
	background: var(--background-color-high, #222);
	color: inherit;
	transition: all 0.2s;
}
.ems-btn:hover {
	border-color: #06b6d4;
	color: #06b6d4;
}
.ems-btn-primary {
	background: #06b6d4;
	color: #fff;
	border-color: #06b6d4;
}
.ems-btn-primary:hover {
	background: #0891b2;
	color: #fff;
}
`;

let echartsLoadPromise = null;
function ensureECharts() {
	if (window.echarts) {
		return Promise.resolve(window.echarts);
	}
	if (echartsLoadPromise) {
		return echartsLoadPromise;
	}
	echartsLoadPromise = new Promise((resolve, reject) => {
		let script = document.querySelector('script[src*="echarts.min.js"]');
		if (!script) {
			script = E('script', {
				'type': 'text/javascript',
				'src': L.resource('echarts.min.js')
			});
			document.head.appendChild(script);
		}
		script.addEventListener('load', function() {
			if (window.echarts) {
				resolve(window.echarts);
			} else {
				reject(new Error('echarts not defined'));
			}
		}, { once: true });
		script.addEventListener('error', function() {
			reject(new Error('Failed to load echarts.min.js'));
		}, { once: true });
	});
	return echartsLoadPromise;
}

return view.extend({
	load: function() {
		return Promise.resolve();
	},

	render: function() {
		const m = E('div', { 'class': 'cbi-map' });

		// Append custom CSS
		if (!document.getElementById('hydrogen-ems-styles')) {
			document.head.appendChild(E('style', { 'id': 'hydrogen-ems-styles', 'type': 'text/css' }, viewStyles));
		}

		// Page Header - 通俗易懂的标题与介绍
		m.appendChild(E('h2', {}, _('加氢站智能能量管理系统 (ChaWRT 工业边缘控制大脑)')));
		m.appendChild(E('div', { 'class': 'cbi-map-descr' }, 
			_('基于 ChaWRT 工业边缘架构：为大型加氢站提供「分时电价智能省电、车载气瓶防爆温控、工业设备高可靠通信、远程免公网IP内网穿透」全套功能，让工业现场既省电又安全。')
		));

		// Action Buttons Bar
		const btnFastFill = E('button', { 'class': 'ems-btn ems-btn-primary' }, [
			E('span', {}, '🚀 '),
			_('模拟 35MPa 极速加注 (防爆温控测试)')
		]);
		const btnToggleTariff = E('button', { 'class': 'ems-btn' }, [
			E('span', {}, '⏱️ '),
			_('切换峰平谷电价 (测试智能省电)')
		]);
		const btnToggleSim = E('button', { 'class': 'ems-btn' }, [
			E('span', {}, '⏸️ '),
			_('暂停/恢复实时监控')
		]);

		const btnBar = E('div', { 'class': 'ems-btn-group' }, [
			btnFastFill, btnToggleTariff, btnToggleSim
		]);
		m.appendChild(btnBar);

		// KPI Cards
		const kpiKwhVal = E('span', {}, '2.14');
		const kpiKgVal = E('span', {}, '7,842');
		const kpiTariffBadge = E('span', { 'class': 'ems-badge ems-badge-warning' }, _('平段电价'));
		const kpiTariffPrice = E('span', {}, '0.78');

		const kpiSection = E('div', { 'class': 'ems-kpi-grid' }, [
			E('div', { 'class': 'ems-kpi-card', 'style': '--kpi-accent: #10b981;' }, [
				E('div', { 'class': 'ems-kpi-title' }, [
					E('span', {}, _('每公斤加氢耗电量')),
					E('span', { 'class': 'ems-badge ems-badge-success' }, _('达标卓越'))
				]),
				E('div', { 'class': 'ems-kpi-val' }, [
					kpiKwhVal,
					E('span', { 'class': 'ems-kpi-unit' }, '度电/公斤')
				]),
				E('div', { 'class': 'ems-kpi-sub' }, [
					E('span', {}, _('国家标杆值: ≤ 2.50度/kg')),
					E('span', { 'style': 'color: #10b981; font-weight: bold;' }, '优化节电 14.4%')
				])
			]),

			E('div', { 'class': 'ems-kpi-card', 'style': '--kpi-accent: #06b6d4;' }, [
				E('div', { 'class': 'ems-kpi-title' }, [
					E('span', {}, _('24小时站内加注总量')),
					E('span', { 'class': 'ems-badge ems-badge-info' }, _('9吨级示范站'))
				]),
				E('div', { 'class': 'ems-kpi-val' }, [
					kpiKgVal,
					E('span', { 'class': 'ems-kpi-unit' }, '公斤 / 9,000公斤')
				]),
				E('div', { 'class': 'ems-kpi-sub' }, [
					E('span', {}, _('站内负荷率: 87.1%')),
					E('span', { 'style': 'color: #06b6d4;' }, _('大负荷连续供氢'))
				])
			]),

			E('div', { 'class': 'ems-kpi-card', 'style': '--kpi-accent: #f59e0b;' }, [
				E('div', { 'class': 'ems-kpi-title' }, [
					E('span', {}, _('分时电价状态 (智能避峰)')),
					kpiTariffBadge
				]),
				E('div', { 'class': 'ems-kpi-val' }, [
					kpiTariffPrice,
					E('span', { 'class': 'ems-kpi-unit' }, '元/度')
				]),
				E('div', { 'class': 'ems-kpi-sub' }, [
					E('span', {}, _('避开高峰高电价运行')),
					E('span', { 'style': 'color: #f59e0b;' }, _('年省电费约 54 万元'))
				])
			]),

			E('div', { 'class': 'ems-kpi-card', 'style': '--kpi-accent: #8b5cf6;' }, [
				E('div', { 'class': 'ems-kpi-title' }, [
					E('span', {}, _('预冷机自适应省电率')),
					E('span', { 'class': 'ems-badge ems-badge-info' }, _('防爆温控'))
				]),
				E('div', { 'class': 'ems-kpi-val' }, [
					E('span', {}, '52.9'),
					E('span', { 'class': 'ems-kpi-unit' }, '% 冷气节电')
				]),
				E('div', { 'class': 'ems-kpi-sub' }, [
					E('span', {}, _('按需制冷，告别死板深冷')),
					E('span', { 'style': 'color: #8b5cf6;' }, _('瓶温稳定 < 75℃'))
				])
			])
		]);
		m.appendChild(kpiSection);

		// Section: 0D Thermodynamic Solver Chart
		const chartDom = E('div', { 'class': 'ems-chart-container' });
		const solverSection = E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('车载气瓶防爆温控与充气曲线 (毫秒级智能调温)')),
			E('div', { 'class': 'cbi-section-descr' }, 
				_('ChaWRT 实时推算充气过程中车载气瓶内部温度，在保证极速充气的同时动态调节制冷机冷气输出，严格将温度控制在安全线（75℃）以下，既消除超温危险，又帮加氢站省下一半冷气电费。')
			),
			chartDom
		]);
		m.appendChild(solverSection);

		// Section: Station EMS & Multi-energy Dispatch Table
		const emsTable = E('table', { 'class': 'table' }, [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th' }, _('站内核心设备')),
				E('th', { 'class': 'th' }, _('设备规模规格')),
				E('th', { 'class': 'th' }, _('当前运行状态')),
				E('th', { 'class': 'th' }, _('ChaWRT 智能控制策略')),
				E('th', { 'class': 'th' }, _('设备通信连接'))
			]),
			E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td' }, E('strong', {}, _('45MPa 大功率氢气压缩机组'))),
				E('td', { 'class': 'td' }, '3000 kg/天 × 3台 (装机 2200kW)'),
				E('td', { 'class': 'td' }, E('span', { 'class': 'ems-badge ems-badge-success' }, '#1机 100% | #2机 60% | #3机 备用')),
				E('td', { 'class': 'td' }, '深夜谷电满载储气，白天高峰自动停机或降频，年省54万'),
				E('td', { 'class': 'td' }, '工业以太网 / 正常 (时延12ms)')
			]),
			E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td' }, E('strong', {}, _('35MPa/70MPa 双枪加氢机'))),
				E('td', { 'class': 'td' }, '充氢速度 ≥ 7.2 kg/分钟 (双枪)'),
				E('td', { 'class': 'td' }, E('span', { 'class': 'ems-badge ems-badge-info' }, '#1枪 正在充装 49吨物流重卡')),
				E('td', { 'class': 'td' }, '智能防爆温控算法介入，加气速度拉满且绝不超温'),
				E('td', { 'class': 'td' }, '工业PLC控制器 / 安全联锁有效')
			]),
			E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td' }, E('strong', {}, _('高压储氢钢瓶管束组'))),
				E('td', { 'class': 'td' }, '总水容积 24m³，高中低三级储气'),
				E('td', { 'class': 'td' }, '储气罐储量 88.5% (高压端 43.5 MPa)'),
				E('td', { 'class': 'td' }, '白天高电价时段直接放气加氢，压缩机不花高价电'),
				E('td', { 'class': 'td' }, '现场高精传感器 / 正常')
			]),
			E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td' }, E('strong', {}, _('站房屋顶太阳能光伏与储能'))),
				E('td', { 'class': 'td' }, '屋顶光伏 400kW + 储能电池 500度'),
				E('td', { 'class': 'td' }, '光伏实时发电 380kW (100% 站内自己用完)'),
				E('td', { 'class': 'td' }, '优先用太阳能绿电加氢，最大化减少向电网买电'),
				E('td', { 'class': 'td' }, '工业通信总线 / 在线')
			])
		]);

		const emsSection = E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('站内各设备联动运行与省电状态')),
			emsTable
		]);
		m.appendChild(emsSection);

		// Section: Modbus Real-time Logs & xfrpc Cloud Sync
		const logBox = E('div', { 'class': 'ems-log-box' });
		const logSection = E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('现场设备联动通信与远程内网穿透 (实时状态)')),
			E('div', { 'class': 'cbi-section-descr' },
				_('ChaWRT 与站内加氢机、大压缩机、智能仪表保持实时通信；同时通过内置的远程免公网IP内网穿透功能，专家在学校或远程办公室随时可一键查看现场设备。')
			),
			logBox
		]);
		m.appendChild(logSection);

		// Simulation Data & Logic
		let isRunning = true;
		let pressure = 14.0;
		let temp = 48.0;
		let stepCount = 0;
		let tariffMode = 1; // 0: 谷电 0.32, 1: 平电 0.78, 2: 尖峰 1.35
		const tariffs = [
			{ name: '深夜谷段电价 (满载储气)', price: '0.32', badge: 'ems-badge-success' },
			{ name: '白天平段电价 (平稳运行)', price: '0.78', badge: 'ems-badge-warning' },
			{ name: '高峰尖峰电价 (避峰省电)', price: '1.35', badge: 'ems-badge-danger' }
		];

		const timeAxis = [];
		const pressureSeries = [];
		const tempSeries = [];
		const limitSeries = [];
		for (let i = 0; i < 40; i++) {
			timeAxis.push(i + 's');
			pressureSeries.push(10 + i * 0.4);
			tempSeries.push(30 + i * 0.8);
			limitSeries.push(85.0);
		}

		let myChart = null;
		let tickTimer = null;
		let resizeHandler = null;
		let isCleanedUp = false;

		function cleanup() {
			if (isCleanedUp) return;
			isCleanedUp = true;
			if (tickTimer) {
				clearInterval(tickTimer);
				tickTimer = null;
			}
			if (resizeHandler) {
				window.removeEventListener('resize', resizeHandler);
				resizeHandler = null;
			}
			window.removeEventListener('hashchange', cleanup);
			if (myChart) {
				try { myChart.dispose(); } catch (e) {}
				myChart = null;
			}
		}

		this._cleanup = cleanup;
		window.addEventListener('hashchange', cleanup, { once: true });

		function initECharts() {
			ensureECharts().then(function(echarts) {
				if (isCleanedUp || !m.isConnected) return;
				myChart = echarts.init(chartDom);
				const option = {
					tooltip: { trigger: 'axis' },
					legend: { data: ['车载气瓶压力 (MPa)', '气瓶内部温度 (℃)', '85℃ 危险红线'] },
					grid: { left: '4%', right: '4%', bottom: '8%', top: '15%', containLabel: true },
					xAxis: { type: 'category', data: timeAxis, boundaryGap: false },
					yAxis: [
						{ type: 'value', name: '压力 (MPa)', min: 0, max: 40, position: 'left' },
						{ type: 'value', name: '温度 (℃)', min: 0, max: 100, position: 'right' }
					],
					series: [
						{
							name: '车载气瓶压力 (MPa)',
							type: 'line',
							smooth: true,
							itemStyle: { color: '#06b6d4' },
							lineStyle: { width: 3 },
							data: pressureSeries
						},
						{
							name: '气瓶内部温度 (℃)',
							type: 'line',
							smooth: true,
							yAxisIndex: 1,
							itemStyle: { color: '#f59e0b' },
							lineStyle: { width: 3 },
							data: tempSeries
						},
						{
							name: '85℃ 危险红线',
							type: 'line',
							yAxisIndex: 1,
							lineStyle: { width: 2, type: 'dashed', color: '#ef4444' },
							data: limitSeries
						}
					]
				};
				myChart.setOption(option);
			}).catch(function(err) {
				console.warn('ECharts script load failed:', err);
				if (!isCleanedUp && m.isConnected && chartDom) {
					chartDom.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-color-medium,#888);font-size:13px;">图表脚本加载失败，已停止重试</div>';
				}
			});
		}

		resizeHandler = function() {
			if (myChart && m.isConnected) {
				myChart.resize();
			}
		};
		window.addEventListener('resize', resizeHandler);

		function appendLogMessage(msg) {
			const now = new Date();
			const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
			const line = E('div', {}, `[${timeStr}] ${msg}`);
			logBox.appendChild(line);
			if (logBox.children.length > 30) {
				logBox.removeChild(logBox.children[0]);
			}
			logBox.scrollTop = logBox.scrollHeight;
		}

		function tick() {
			if (!m.isConnected) {
				cleanup();
				return;
			}
			if (!isRunning) return;
			stepCount++;

			if (pressure < 35.0) {
				pressure += 0.35;
				if (pressure > 35.0) pressure = 35.0;
			} else {
				if (stepCount % 80 === 0) pressure = 12.0;
			}

			if (pressure < 28.0) {
				temp += 0.45;
			} else {
				temp -= 0.12; // 防爆调温起效
			}
			if (temp > 74.5) temp = 74.5;
			if (temp < 30.0) temp = 30.0;

			timeAxis.push(stepCount + 's');
			if (timeAxis.length > 40) timeAxis.shift();

			pressureSeries.push(parseFloat(pressure.toFixed(1)));
			if (pressureSeries.length > 40) pressureSeries.shift();

			tempSeries.push(parseFloat(temp.toFixed(1)));
			if (tempSeries.length > 40) tempSeries.shift();

			limitSeries.push(85.0);
			if (limitSeries.length > 40) limitSeries.shift();

			if (myChart) {
				myChart.setOption({
					xAxis: { data: timeAxis },
					series: [
						{ data: pressureSeries },
						{ data: tempSeries },
						{ data: limitSeries }
					]
				});
			}

			if (stepCount % 3 === 0) {
				const logs = [
					`[防爆温控] 气瓶压力=${pressure.toFixed(1)}MPa, 当前气温=${temp.toFixed(1)}℃ -> 动态调温最佳，安全裕量充足`,
					`[设备联动] 向加气机与PLC下发最新加气策略，通信时延仅 6ms (连接正常)`,
					`[远程穿透] 加密安全隧道已连接，现场数据已实时同步至远程专家终端 (18ms)`,
					`[防爆检测] 车载气瓶安全防爆认证通过，符合国家加氢安全规范`
				];
				appendLogMessage(logs[stepCount % logs.length]);
			}
		}

		// Button listeners
		btnFastFill.onclick = function() {
			pressure = 5.0;
			temp = 20.0;
			isRunning = true;
			appendLogMessage('>>> [现场测试] 启动 35MPa 极速加氢测试，防爆温控算法已介入');
			ui.addNotification(null, E('p', _('大流量快速加注测试已触发：防爆温控算法实时平抑升温，确保瓶温不超标')), 'info');
		};

		btnToggleTariff.onclick = function() {
			tariffMode = (tariffMode + 1) % tariffs.length;
			const cur = tariffs[tariffMode];
			kpiTariffBadge.className = 'ems-badge ' + cur.badge;
			kpiTariffBadge.innerText = cur.name;
			kpiTariffPrice.innerText = cur.price;
			appendLogMessage(`[智能省电管家] 电价工况切换至: ${cur.name} (${cur.price}元/度)，大压缩机已自动调整负荷避峰省电`);
		};

		btnToggleSim.onclick = function() {
			isRunning = !isRunning;
			btnToggleSim.querySelector('span:first-child').innerText = isRunning ? '⏸️ ' : '▶️ ';
			appendLogMessage(isRunning ? '[系统通知] 实时监控与算法已恢复' : '[系统通知] 实时监控已暂停');
		};

		// Start loop & chart
		initECharts();
		tickTimer = setInterval(tick, 500);

		return m;
	},

	unload: function() {
		if (typeof this._cleanup === 'function') {
			this._cleanup();
			this._cleanup = null;
		}
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
