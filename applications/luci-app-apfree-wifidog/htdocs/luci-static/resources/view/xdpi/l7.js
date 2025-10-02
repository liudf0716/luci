'use strict';
'require view';
'require fs';
'require ui';
'require poll';
'require rpc';
'require dom';

var chartRegistry = {};
var downloadLineChart, uploadLineChart;

// Data structures for stacked line charts
var lineCategories = [];
var downloadSeriesData = {};
var uploadSeriesData = {};

// Color palette for chart series
var colorPalette = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'];

var currentSortInfo = {
	table: null,
	column: null,
	reverse: false
};
var sidLookupTable = {};
var isPaused = false;
var lastUpdated = null;
var pollActive = false;
var lastSIDData = null;
var resizeListenerAdded = false;
var resizeTimer = null;

// Pre-fill with 60 empty points for a smooth start
for (var i = 0; i < 60; i++) {
	lineCategories.push('');
}

// Helper to convert hex to rgba
function hexToRgba(hex, opacity) {
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? 
		'rgba(' + parseInt(result[1], 16) + ', ' + parseInt(result[2], 16) + ', ' + parseInt(result[3], 16) + ', ' + opacity + ')' :
		null;
};

return view.extend({
	load: function() {
		return Promise.all([
			this.loadSIDData(),
			this.loadL7ProtoData()
		]);
	},

	showError: function(message) {
		var errorEl = document.getElementById('l7-error-message');
		if (errorEl) {
			errorEl.textContent = message;
			errorEl.style.display = 'block';
		}
	},

	hideError: function() {
		var errorEl = document.getElementById('l7-error-message');
		if (errorEl) {
			errorEl.style.display = 'none';
		}
	},

	loadSIDData: function() {
		var self = this;
		return fs.exec_direct('/usr/bin/aw-bpfctl', ['sid', 'json'], 'json').then(function(result) {
			self.hideError();
			lastSIDData = result;
			return result;
		}).catch(function(error) {
			console.error('Error loading SID data:', error);
			self.showError(_('Error loading SID data: %s').format(error.message));
			return { status: 'error', data: [] };
		});
	},

	loadL7ProtoData: function() {
		var self = this;
		return fs.exec_direct('/usr/bin/aw-bpfctl', ['l7', 'json'], 'json').then(function(result) {
			self.hideError();
			return result;
		}).catch(function(error) {
			console.error('Error loading L7 protocol data:', error);
			self.showError(_('Error loading L7 protocol data: %s').format(error.message));
			return { status: 'error', data: [] };
		});
	},

	updateStackedLineCharts: function(perServiceDownload, perServiceUpload) {
		var now = new Date().toLocaleTimeString();
		lineCategories.push(now);
		lineCategories.shift();
	
		var processChartData = function(seriesData, perServiceData) {
			var allServices = Object.keys(seriesData);
			Object.keys(perServiceData).forEach(function(service) {
				if (allServices.indexOf(service) === -1) {
					allServices.push(service);
				}
			});
	
			allServices.forEach(function(service) {
				if (!seriesData[service]) {
					seriesData[service] = Array(59).fill(0);
				}
				var rate = perServiceData[service] || 0;
				seriesData[service].push(rate);
				seriesData[service].shift();
			});
	
			return Object.keys(seriesData).map(function(service, index) {
				var color = colorPalette[index % colorPalette.length];
				return {
					name: service,
					type: 'line',
					stack: 'Total',
					smooth: true,
					lineStyle: { width: 1, color: color },
					showSymbol: false,
					itemStyle: { color: color },
					areaStyle: {
						color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
							{ offset: 0, color: hexToRgba(color, 0.5) },
							{ offset: 1, color: hexToRgba(color, 0) }
						])
					},
					data: seriesData[service]
				};
			});
		};
	
		var downloadChartSeries = processChartData(downloadSeriesData, perServiceDownload);
		var uploadChartSeries = processChartData(uploadSeriesData, perServiceUpload);
	
		var legendData = downloadChartSeries.map(function(s) { return s.name; });

		if (downloadLineChart) {
			downloadLineChart.setOption({
				legend: { data: legendData, type: 'scroll', top: 0, left: 'center' },
				series: downloadChartSeries,
				xAxis: { data: lineCategories }
			});
		}
	
		if (uploadLineChart) {
			uploadLineChart.setOption({
				legend: { data: legendData, type: 'scroll', top: 0, left: 'center' },
				series: uploadChartSeries,
				xAxis: { data: lineCategories }
			});
		}
	},

	pie: function(id, data, valueFormatter) {
		var total = data.reduce(function(n, d) { return n + d.value; }, 0);

		data.sort(function(a, b) { return b.value - a.value; });

		if (total === 0) {
			data = [{ value: 1, color: '#cccccc', name: _('no traffic') }];
		}

		data.forEach(function(d, i) {
			if (!d.color) {
				var hue = (i * 137.508) % 360;
				d.color = 'hsl(' + hue + ', 75%, 55%)';
			}
		});

		var option = {
			tooltip: {
				trigger: 'item',
				formatter: function(params) {
					if (valueFormatter) {
						// 将 ECharts params 对象转换为自定义格式
						return valueFormatter({
							name: params.name,
							value: params.value,
							percent: params.percent.toFixed(2)
						});
					}
					return params.name + ': ' + params.value + ' (' + params.percent.toFixed(2) + '%)';
				}
			},
			series: [{
				type: 'pie',
				radius: ['25%', '80%'],
				avoidLabelOverlap: false,
				padAngle: 10,
				itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
				label: { show: false, position: 'center' },
				emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
				labelLine: { show: false },
				data: data.map(function(d) {
					return { value: d.value, name: d.label || d.name, itemStyle: { color: d.color } };
				})
			}]
		};

		var dom = typeof id === 'string' ? document.getElementById(id) : id;

		if (!chartRegistry[id]) {
			chartRegistry[id] = echarts.init(dom);
		}

		chartRegistry[id].setOption(option, true);

		return chartRegistry[id];
	},

	sortTable: function(table, column) {
		var tbody = table.querySelector('tbody');
		if (!tbody) return;
		var rows = Array.from(tbody.querySelectorAll('tr:not(.table-titles):not(.placeholder)'));
		var reverse = (currentSortInfo.table === table && currentSortInfo.column === column) ? !currentSortInfo.reverse : false;

		table.querySelectorAll('th').forEach(function(th) {
			th.classList.remove('th-sort-asc', 'th-sort-desc');
		});

		var th = table.querySelector('th:nth-child(' + (column + 1) + ')');
		th.classList.add(reverse ? 'th-sort-desc' : 'th-sort-asc');

		rows.sort(function(row1, row2) {
			var a = row1.cells[column].getAttribute('data-value') || row1.cells[column].textContent;
			var b = row2.cells[column].getAttribute('data-value') || row2.cells[column].textContent;

			if (!isNaN(a) && !isNaN(b)) { a = Number(a); b = Number(b); }

			if (a < b) return reverse ? 1 : -1;
			if (a > b) return reverse ? -1 : 1;
			return 0;
		});

		currentSortInfo.table = table;
		currentSortInfo.column = column;
		currentSortInfo.reverse = reverse;

		rows.forEach(function(row) { tbody.removeChild(row); });
		rows.forEach(function(row) { tbody.appendChild(row); });
	},

	formatMbps: function(bits) {
		if (typeof bits !== 'number') return '0.00 Mbps';
		return (bits / 1024 / 1024).toFixed(2) + ' Mbps';
	},

	formatMB: function(bytes) {
		if (typeof bytes !== 'number') return '0.00 MB';
		return (bytes / 1024 / 1024).toFixed(2) + ' MB';
	},

	renderSIDData: function(data) {
		var rows = [];
		var txRateData = [], rxRateData = [];
		var txVolumeData = [], rxVolumeData = [];
		var tx_rate_total = 0, rx_rate_total = 0;
		var tx_bytes_total = 0, rx_bytes_total = 0;
		var perServiceTxRate = {};
		var perServiceRxRate = {};
		var self = this;
		var allItems = [];
		
		if (data && data.status === 'success' && Array.isArray(data.data)) {
			allItems = data.data;
			var listSizeEl = document.getElementById('sid-size-select');
			var listSize = listSizeEl ? parseInt(listSizeEl.value, 10) : 10;

			var activeConnections = allItems.filter(function(item) { return item.incoming.rate > 0 || item.outgoing.rate > 0; });
			var inactiveConnections = allItems.filter(function(item) { return item.incoming.rate === 0 && item.outgoing.rate === 0; });
		
			activeConnections.sort(function(a, b) { return (b.incoming.rate + b.outgoing.rate) - (a.incoming.rate + a.outgoing.rate); });
			inactiveConnections.sort(function(a, b) { return b.incoming.total_bytes - a.incoming.total_bytes; });
		
			var displayData = activeConnections;
			if (displayData.length < listSize) {
				displayData = displayData.concat(inactiveConnections.slice(0, listSize - displayData.length));
			}
			
			if (displayData.length > listSize) {
				displayData = displayData.slice(0, listSize);
			}

			displayData.forEach(function(item) {
				var domainOrL7Proto = 'unknown';
				var lookupInfo = sidLookupTable[item.sid];
				
				if (lookupInfo) {
					domainOrL7Proto = lookupInfo.name;
				} else if (item.sid_type === 'Domain' && item.domain && item.domain !== 'unknown') {
					domainOrL7Proto = item.domain;
				} else if (item.sid_type === 'L7' && item.l7_proto_desc && item.l7_proto_desc !== 'unknown') {
					domainOrL7Proto = item.l7_proto_desc;
				}
				
				rows.push([
					item.sid,
					domainOrL7Proto,
					[ item.incoming.rate, '%1024.2mbps'.format(item.incoming.rate) ],
					[ item.incoming.total_bytes, '%1024.2mB'.format(item.incoming.total_bytes) ],
					[ item.incoming.total_packets, '%1000.2mP'.format(item.incoming.total_packets) ],
					[ item.outgoing.rate, '%1024.2mbps'.format(item.outgoing.rate) ],
					[ item.outgoing.total_bytes, '%1024.2mB'.format(item.outgoing.total_bytes) ],
					[ item.outgoing.total_packets, '%1000.2mP'.format(item.outgoing.total_packets) ]
				]);

				txRateData.push({ value: item.incoming.rate, label: domainOrL7Proto });
				rxRateData.push({ value: item.outgoing.rate, label: domainOrL7Proto });
				txVolumeData.push({ value: item.incoming.total_bytes, label: domainOrL7Proto });
				rxVolumeData.push({ value: item.outgoing.total_bytes, label: domainOrL7Proto });

				perServiceTxRate[domainOrL7Proto] = (perServiceTxRate[domainOrL7Proto] || 0) + item.incoming.rate;
				perServiceRxRate[domainOrL7Proto] = (perServiceRxRate[domainOrL7Proto] || 0) + item.outgoing.rate;
			});

			allItems.forEach(function(item) {
				tx_rate_total += item.incoming.rate;
				rx_rate_total += item.outgoing.rate;
				tx_bytes_total += item.incoming.total_bytes;
				rx_bytes_total += item.outgoing.total_bytes;
			});
		}

		this.updateStackedLineCharts(perServiceTxRate, perServiceRxRate);

		var table = document.getElementById('sid-data');
		cbi_update_table('#sid-data', rows, E('em', _('No data recorded yet.')));

		var headers = table.querySelectorAll('th');
		
		if (!table.hasAttribute('data-sort-initialized')) {
			headers.forEach(function(header, index) {
				header.style.cursor = 'pointer';
				header.addEventListener('click', function() { self.sortTable(table, index); });
			});
			table.setAttribute('data-sort-initialized', 'true');
		}

		table.querySelectorAll('tr:not(.table-titles):not(.placeholder)').forEach(function(row, rowIndex) {
			if (!rows[rowIndex]) return;
			Array.from(row.cells).forEach(function(cell, cellIndex) {
				if (Array.isArray(rows[rowIndex][cellIndex])) {
					cell.setAttribute('data-value', rows[rowIndex][cellIndex][0]);
				}
			});
		});

		this.pie('sid-tx-rate-pie', txRateData, function(p) { return p.name + ': ' + self.formatMbps(p.value) + ' (' + p.percent + '%)'; });
		this.pie('sid-rx-rate-pie', rxRateData, function(p) { return p.name + ': ' + self.formatMbps(p.value) + ' (' + p.percent + '%)'; });
		this.pie('sid-tx-volume-pie', txVolumeData, function(p) { return p.name + ': ' + self.formatMB(p.value) + ' (' + p.percent + '%)'; });
		this.pie('sid-rx-volume-pie', rxVolumeData, function(p) { return p.name + ': ' + self.formatMB(p.value) + ' (' + p.percent + '%)'; });

		var sidTotalEl = document.getElementById('sid-total-val');
		if(sidTotalEl) sidTotalEl.textContent = allItems.length;

		var txRateEl = document.getElementById('sid-tx-rate-val');
		if(txRateEl) txRateEl.textContent = '%1024.2mbps'.format(tx_rate_total);

		var rxRateEl = document.getElementById('sid-rx-rate-val');
		if(rxRateEl) rxRateEl.textContent = '%1024.2mbps'.format(rx_rate_total);

		var txVolEl = document.getElementById('sid-tx-volume-val');
		if(txVolEl) txVolEl.textContent = '%1024.2mB'.format(tx_bytes_total);

		var rxVolEl = document.getElementById('sid-rx-volume-val');
		if(rxVolEl) rxVolEl.textContent = '%1024.2mB'.format(rx_bytes_total);

		lastUpdated = new Date();
		var timestampEl = document.getElementById('last-updated');
		if (timestampEl) {
			timestampEl.textContent = _('Last updated: %s').format(lastUpdated.toLocaleTimeString());
		}
	},

	renderL7ProtoData: function(data) {
		var rows = [];
		var self = this;
		
		sidLookupTable = {};
		
		if (data && data.status === 'success' && data.data) {
			if (Array.isArray(data.data.protocols)) {
				data.data.protocols.forEach(function(item) {
					sidLookupTable[item.sid] = { type: 'protocol', name: item.protocol };
					rows.push([ item.id, item.protocol, item.sid ]);
				});
			}
			
			if (Array.isArray(data.data.domains)) {
				data.data.domains.forEach(function(item) {
					sidLookupTable[item.sid] = { type: 'domain', name: item.domain };
					rows.push([ item.id, item.domain, item.sid ]);
				});
			}
		}

		var table = document.getElementById('l7proto-data');
		var headers = table.querySelectorAll('th');
		
		if (!table.hasAttribute('data-sort-initialized')) {
			headers.forEach(function(header, index) {
				header.style.cursor = 'pointer';
				header.addEventListener('click', function() { self.sortTable(table, index); });
			});
			table.setAttribute('data-sort-initialized', 'true');
		}

		cbi_update_table('#l7proto-data', rows, E('em', _('No data recorded yet.')));
	},

	pollL7Data: function() {
		if (pollActive) return;

		var self = this;
		pollActive = true;
		
		self.loadL7ProtoData().then(function(l7data) {
			self.renderL7ProtoData(l7data);
			return self.loadSIDData();
		}).then(function(sidData){
			self.renderSIDData(sidData);
		});

		poll.add(function() {
			if (isPaused) return Promise.resolve();
			
			return self.loadL7ProtoData().then(function(data) {
				self.renderL7ProtoData(data);
			}).then(function() {
				return self.loadSIDData().then(function(data) {
					self.renderSIDData(data);
				});
			});
		}, 5);
	},

	initializeUI: function() {
		if (window.echarts) {
			var dlChartEl = document.getElementById('download-speed-line-chart');
			var ulChartEl = document.getElementById('upload-speed-line-chart');
			if (!dlChartEl || !ulChartEl) return;

			var baseChartOption = {
				tooltip: {
					trigger: 'axis',
					formatter: function (params) {
						if (!params || params.length === 0) {
							return null;
						}
						var tooltipContent = params[0].axisValueLabel + '<br/>';
						params.sort(function(a, b) { return b.value - a.value; });
						params.forEach(function(item) {
							if (item.value > 0) {
								tooltipContent += item.marker + ' ' + item.seriesName + ': ' + '%1024.2mbps'.format(item.value) + '<br/>';
							}
						});
						return tooltipContent;
					}
				},
				grid: { left: '3%', right: '4%', bottom: '10%', top: '50px', containLabel: true },
				xAxis: { type: 'category', boundaryGap: false, data: lineCategories },
				yAxis: { type: 'value', axisLabel: { formatter: function(val) { return '%1024.2mbps'.format(val); } } },
				series: []
			};


		downloadLineChart = echarts.init(dlChartEl);
		downloadLineChart.setOption(baseChartOption);

		uploadLineChart = echarts.init(ulChartEl);
		uploadLineChart.setOption(baseChartOption);

		// 添加窗口大小变化监听器，使图表能够响应式调整
		if (!resizeListenerAdded) {
			var resizeTimer = null;
			var resizeHandler = function() {
				// 使用防抖，避免频繁触发 resize
				if (resizeTimer) {
					clearTimeout(resizeTimer);
				}
				resizeTimer = setTimeout(function() {
					// 调整折线图大小
					if (downloadLineChart) {
						downloadLineChart.resize();
					}
					if (uploadLineChart) {
						uploadLineChart.resize();
					}
					// 调整饼图大小
					Object.keys(chartRegistry).forEach(function(chartId) {
						if (chartRegistry[chartId]) {
							chartRegistry[chartId].resize();
						}
					});
				}, 200);
			};
			
			window.addEventListener('resize', resizeHandler);
			resizeListenerAdded = true;
		}

		this.pollL7Data();
	} else {
		setTimeout(this.initializeUI.bind(this), 50);
	}
},	render: function() {
		var self = this;

		var tabContainer = E('div', {}, [
			E('div', { 'class': 'cbi-section', 'data-tab': 'sid', 'data-tab-title': _('L7 SID Data') }, [
				E('div', { 'class': 'dashboard-container' }, [
					E('div', { 'class': 'line-chart-row' }, [
						E('div', { 'class': 'chart-card' }, [
							E('h4', [_('Real-time Download Speed')]),
							E('div', { id: 'download-speed-line-chart', style: 'width: 100%; height: 350px;' })
						]),
						E('div', { 'class': 'chart-card' }, [
							E('h4', [_('Real-time Upload Speed')]),
							E('div', { id: 'upload-speed-line-chart', style: 'width: 100%; height: 350px;' })
						])
					]),
					E('div', { 'class': 'kpi-row' }, [
						E('div', { 'class': 'kpi-card' }, [ E('big', { id: 'sid-total-val' }, '0'), E('span', { 'class': 'kpi-card-label' }, _('L7 Protocol Data')) ]),
						E('div', { 'class': 'kpi-card' }, [ E('big', { id: 'sid-tx-rate-val' }, '0'), E('span', { 'class': 'kpi-card-label' }, _('Download Speed')) ]),
						E('div', { 'class': 'kpi-card' }, [ E('big', { id: 'sid-rx-rate-val' }, '0'), E('span', { 'class': 'kpi-card-label' }, _('Upload Speed')) ]),
						E('div', { 'class': 'kpi-card' }, [ E('big', { id: 'sid-tx-volume-val' }, '0'), E('span', { 'class': 'kpi-card-label' }, _('Download Total')) ]),
						E('div', { 'class': 'kpi-card' }, [ E('big', { id: 'sid-rx-volume-val' }, '0'), E('span', { 'class': 'kpi-card-label' }, _('Upload Total')) ])
					]),
					E('div', { 'class': 'chart-grid' }, [
						E('div', { 'class': 'chart-card' }, [
							E('h4', [_('Download Speed / SID')]),
							E('div', { id: 'sid-tx-rate-pie', style: 'width: 100%; height: 300px;' })
						]),
						E('div', { 'class': 'chart-card' }, [
							E('h4', [_('Upload Speed / SID')]),
							E('div', { id: 'sid-rx-rate-pie', style: 'width: 100%; height: 300px;' })
						]),
						E('div', { 'class': 'chart-card' }, [
							E('h4', [_('Download Total')]),
							E('div', { id: 'sid-tx-volume-pie', style: 'width: 100%; height: 300px;' })
						]),
						E('div', { 'class': 'chart-card' }, [
							E('h4', [_('Upload Total')]),
							E('div', { id: 'sid-rx-volume-pie', style: 'width: 100%; height: 300px;' })
						])
					])
				]),
				E('table', { 'class': 'table', 'id': 'sid-data' }, [
					E('tr', { 'class': 'tr table-titles' }, [
						E('th', { 'class': 'th left' }, [ _('SID') ]),
						E('th', { 'class': 'th left' }, [ _('Domain&L7Protocol') ]),
						E('th', { 'class': 'th right' }, [ _('Download Speed (Bit/s)') ]),
						E('th', { 'class': 'th right' }, [ _('Download (Bytes)') ]),
						E('th', { 'class': 'th right' }, [ _('Download (Packets)') ]),
						E('th', { 'class': 'th right' }, [ _('Upload Speed (Bit/s)') ]),
						E('th', { 'class': 'th right' }, [ _('Upload (Bytes)') ]),
						E('th', { 'class': 'th right' }, [ _('Upload (Packets)') ])
					]),
					E('tr', { 'class': 'tr placeholder' }, [
						E('td', { 'class': 'td', 'colspan': '8' }, [
							E('em', { 'class': 'spinning' }, [ _('Collecting data...') ])
						])
					])
				])
			]),
			E('div', { 'class': 'cbi-section', 'data-tab': 'l7proto', 'data-tab-title': _('L7 Protocol Data') }, [
				E('table', { 'class': 'table', 'id': 'l7proto-data' }, [
					E('tr', { 'class': 'tr table-titles' }, [
						E('th', { 'class': 'th left' }, [ _('ID') ]),
						E('th', { 'class': 'th left' }, [ _('Domain&L7Protocol') ]),
						E('th', { 'class': 'th right' }, [ _('SID') ])
					]),
					E('tr', { 'class': 'tr placeholder' }, [
						E('td', { 'class': 'td', 'colspan': '3' }, [
							E('em', { 'class': 'spinning' }, [ _('Collecting data...') ])
						])
					])
				])
			])
		]);

		var controls = E('div', { 'class': 'l7-controls' }, [
			E('div', { 'class': 'l7-controls-left' }, [
				E('label', { 'for': 'sid-size-select' }, _('Show entries: ')),
				E('select', {
					'id': 'sid-size-select',
					'change': ui.createHandlerFn(this, function() {
						if (lastSIDData) {
							self.renderSIDData(lastSIDData);
						}
					})
				}, [
					E('option', { 'value': '10' }, '10'),
					E('option', { 'value': '15' }, '15'),
					E('option', { 'value': '20' }, '20'),
					E('option', { 'value': '25' }, '25')
				])
			]),
			E('div', { 'class': 'l7-controls-right' }, [
				E('span', { 'id': 'last-updated' }, _('Last updated: never')),
				E('button', {
					'class': 'cbi-button cbi-button-apply',
					'click': function(ev) {
						isPaused = !isPaused;
						ev.target.textContent = isPaused ? _('Resume') : _('Pause');
					}
				}, _('Pause'))
			])
		]);

		var node = E([], [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('view/wifidogx.css') }),
			E('style', { type: 'text/css' },
		'@keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } } '+
		'@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } '+
		'@keyframes shimmer { 0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; } } '+
		'.th-sort-asc::after { content: " ▲"; color: #3771c8; font-size: 0.8em; } '+
		'.th-sort-desc::after { content: " ▼"; color: #3771c8; font-size: 0.8em; } '+
		'.table .th { cursor: pointer; transition: all 0.3s ease; user-select: none; position: relative; } '+
		'.table .th:hover { background-color: #e3f2fd; transform: translateY(-1px); } '+
		'.table { border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-top: 16px; } '+
		'.table .tr.table-titles { background: linear-gradient(135deg, #3771c8 0%, #5e92f3 100%); color: white; } '+
		'.table .tr.table-titles .th { font-weight: 600; letter-spacing: 0.3px; padding: 14px 10px; } '+
		'.table .tr:not(.table-titles):nth-child(even) { background-color: #f9fafb; } '+
		'.table .tr:not(.table-titles):hover { background-color: #f0f7ff; transition: background-color 0.2s ease; } '+
		'.table .td { padding: 12px 10px; } '+
		'#l7-error-message { color: #d32f2f; background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%); border: 2px solid #ef5350; border-radius: 10px; padding: 14px 18px; margin-bottom: 20px; display: none; box-shadow: 0 3px 10px rgba(211,47,47,0.2); animation: slideDown 0.4s ease; font-weight: 500; } '+
		'h2 { color: #1e293b; font-weight: 700; font-size: 1.8em; letter-spacing: 0.5px; margin-bottom: 28px; padding-bottom: 12px; border-bottom: 3px solid #3771c8; display: inline-block; } '+
		'.dashboard-container { display: flex; flex-direction: column; gap: 28px; margin-bottom: 28px; animation: fadeIn 0.6s ease; } '+
		'.kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 18px; } '+
		'.kpi-card { background: linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%); border-radius: 14px; padding: 24px 20px; text-align: center; border: 1px solid #e0e6ed; box-shadow: 0 3px 15px rgba(0,0,0,0.08); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden; } '+
		'.kpi-card::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #3771c8 0%, #5e92f3 50%, #3771c8 100%); background-size: 200% 100%; animation: shimmer 3s linear infinite; } '+
		'.kpi-card:hover { transform: translateY(-6px) scale(1.02); box-shadow: 0 8px 25px rgba(55,113,200,0.2); } '+
		'.kpi-card big { display: block; font-size: 2.2em; font-weight: 700; background: linear-gradient(135deg, #3771c8 0%, #5e92f3 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 10px; line-height: 1.2; } '+
		'.kpi-card-label { font-size: 0.92em; color: #64748b; font-weight: 500; letter-spacing: 0.4px; text-transform: uppercase; } '+
		'.line-chart-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(480px, 1fr)); gap: 24px; } '+
		'.chart-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 24px; } '+
		'.chart-card { background: #ffffff; border-radius: 14px; padding: 26px; border: 1px solid #e0e6ed; box-shadow: 0 3px 15px rgba(0,0,0,0.08); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; } '+
		'.chart-card::after { content: ""; position: absolute; top: 0; left: 0; right: 0; bottom: 0; border-radius: 14px; box-shadow: 0 8px 30px rgba(0,0,0,0.15); opacity: 0; transition: opacity 0.3s ease; pointer-events: none; } '+
		'.chart-card:hover::after { opacity: 1; } '+
		'.chart-card:hover { transform: translateY(-4px); z-index: 1; } '+
		'.chart-card h4 { margin: 0 0 22px 0; text-align: center; font-size: 1.18em; font-weight: 600; color: #1e293b; letter-spacing: 0.4px; padding-bottom: 12px; border-bottom: 2px solid #e2e8f0; } '+
		'.l7-controls { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; margin-top: 24px; padding: 18px 24px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.06); } '+
		'.l7-controls-left, .l7-controls-right { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; } '+
		'.l7-controls label { font-weight: 600; color: #475569; font-size: 0.96em; } '+
		'.l7-controls select { padding: 8px 14px; border: 2px solid #cbd5e1; border-radius: 8px; background: white; font-size: 0.96em; cursor: pointer; transition: all 0.2s ease; font-weight: 500; } '+
		'.l7-controls select:hover { border-color: #3771c8; box-shadow: 0 0 0 3px rgba(55,113,200,0.12); } '+
		'.l7-controls select:focus { outline: none; border-color: #3771c8; box-shadow: 0 0 0 4px rgba(55,113,200,0.2); } '+
		'.l7-controls #last-updated { color: #64748b; font-size: 0.92em; font-weight: 500; padding: 6px 12px; background: white; border-radius: 6px; } '+
		'.l7-controls .cbi-button { padding: 10px 24px; border-radius: 8px; font-weight: 600; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: none; cursor: pointer; font-size: 0.96em; text-transform: uppercase; letter-spacing: 0.5px; } '+
		'.l7-controls .cbi-button-apply { background: linear-gradient(135deg, #3771c8 0%, #5e92f3 100%); color: white; box-shadow: 0 3px 12px rgba(55,113,200,0.35); } '+
		'.l7-controls .cbi-button-apply:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(55,113,200,0.45); } '+
		'.l7-controls .cbi-button-apply:active { transform: translateY(-1px); } '+
		'@media (max-width: 900px) { .kpi-row { grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 14px; } .line-chart-row { grid-template-columns: 1fr; gap: 20px; } .chart-grid { grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 18px; } } '+
		'@media (max-width: 768px) { h2 { font-size: 1.5em; } .kpi-row { grid-template-columns: repeat(2, 1fr); gap: 12px; } .kpi-card { padding: 18px 14px; } .kpi-card big { font-size: 1.8em; } .chart-grid { grid-template-columns: 1fr; gap: 16px; } .chart-card { padding: 20px; } .l7-controls { padding: 14px 16px; flex-direction: column; align-items: stretch; } .l7-controls-left, .l7-controls-right { width: 100%; justify-content: space-between; } } '+
		'@media (max-width: 480px) { .kpi-row { grid-template-columns: 1fr; } .line-chart-row { gap: 16px; } .chart-card h4 { font-size: 1.05em; } } '
		),
			E('script', { 'type': 'text/javascript', 'src': L.resource('echarts.min.js') }),

			E('h2', [ _('L7 Data Monitor') ]),
			E('div', { 'id': 'l7-error-message' }),
			tabContainer,
			controls
		]);

		ui.tabs.initTabGroup(tabContainer.childNodes);

		setTimeout(this.initializeUI.bind(this), 0);

		return node;
	},

	handleSave: null,
	handleSaveApply: null,
	handleReset: null
});