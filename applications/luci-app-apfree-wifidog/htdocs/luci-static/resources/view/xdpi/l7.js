'use strict';
'require view';
'require fs';
'require ui';
'require poll';
'require rpc';
'require dom';

var chartRegistry = {};

return view.extend({
	load: function() {
		return Promise.all([
			this.loadSIDData(),
			this.loadL7ProtoData()
		]);
	},

	loadSIDData: function() {
		return fs.exec_direct('/usr/bin/aw-bpfctl', ['sid', 'json'], 'json').then(function(result) {
			return result;
		}).catch(function(error) {
			console.error('Error loading SID data:', error);
			return { status: 'error', data: [] };
		});
	},

	loadL7ProtoData: function() {
		return fs.exec_direct('/usr/bin/aw-bpfctl', ['l7', 'json'], 'json').then(function(result) {
			return result;
		}).catch(function(error) {
			console.error('Error loading L7 protocol data:', error);
			return { status: 'error', data: [] };
		});
	},

	pie: function(id, data) {
		var total = data.reduce(function(n, d) { return n + d.value }, 0);

		data.sort(function(a, b) { return b.value - a.value });

		if (total === 0)
			data = [{
				value: 1,
				color: '#cccccc',
				label: [ _('no traffic') ]
			}];

		for (var i = 0; i < data.length; i++) {
			if (!data[i].color) {
				var hue = 120 / (data.length-1) * i;
				data[i].color = 'hsl(%u, 80%%, 50%%)'.format(hue);
				data[i].label.push(hue);
			}
		}

		var node = L.dom.elem(id) ? id : document.getElementById(id),
		    key = L.dom.elem(id) ? id.id : id,
		    ctx = node.getContext('2d');

		if (chartRegistry.hasOwnProperty(key))
			chartRegistry[key].destroy();

		chartRegistry[key] = new Chart(ctx).Doughnut(data, {
			segmentStrokeWidth: 1,
			percentageInnerCutout: 30
		});

		return chartRegistry[key];
	},

	kpi: function(id, val1, val2, val3) {
		var e = L.dom.elem(id) ? id : document.getElementById(id);

		if (val1 && val2 && val3)
			e.innerHTML = _('%s, %s and %s').format(val1, val2, val3);
		else if (val1 && val2)
			e.innerHTML = _('%s and %s').format(val1, val2);
		else if (val1)
			e.innerHTML = val1;

		e.parentNode.style.display = val1 ? 'list-item' : '';
	},

	renderSIDData: function(data) {
		var rows = [];
		var rxData = [], txData = [];
		var rx_total = 0, tx_total = 0;
		
		if (data && data.status === 'success' && data.data) {
			data.data.forEach(function(item) {
				rows.push([
					item.sid,
					item.domain,
					'%1024.2mB'.format(item.incoming.total_bytes),
					'%1024.2mB'.format(item.outgoing.total_bytes)
				]);

				rxData.push({
					value: item.incoming.total_bytes,
					label: [item.domain]
				});

				txData.push({
					value: item.outgoing.total_bytes,
					label: [item.domain]
				});

				rx_total += item.incoming.total_bytes;
				tx_total += item.outgoing.total_bytes;
			});
		}

		cbi_update_table('#sid-data', rows, E('em', _('No data recorded yet.')));

		this.pie('sid-rx-pie', rxData);
		this.pie('sid-tx-pie', txData);

		this.kpi('sid-rx-total', '%1024.2mB'.format(rx_total));
		this.kpi('sid-tx-total', '%1024.2mB'.format(tx_total));
		this.kpi('sid-total', '%u'.format(rows.length));
	},

	renderL7ProtoData: function(data) {
		var rows = [];
		
		if (data && data.status === 'success' && data.data) {
			data.data.forEach(function(item) {
				rows.push([
					item.id,
					item.domain,
					item.sid
				]);
			});
		}

		cbi_update_table('#l7proto-data', rows, E('em', _('No data recorded yet.')));
	},

	pollL7Data: function() {
		var self = this;
		
		// Load L7 protocol data once
		this.loadL7ProtoData().then(function(data) {
			self.renderL7ProtoData(data);
		});

		// Poll SID data every 5 seconds
		poll.add(function() {
			return self.loadSIDData().then(function(data) {
				self.renderSIDData(data);
			});
		}, 5);
	},

	render: function() {
		var self = this;

		var node = E([], [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('view/wifidogx.css') }),
			E('script', {
				'type': 'text/javascript',
				'src': L.resource('nlbw.chart.min.js')
			}),

			E('h2', [ _('L7 Data Monitor') ]),

			E('div', [
				E('div', { 'class': 'cbi-section', 'data-tab': 'sid', 'data-tab-title': _('L7 SID Data') }, [
					E('div', { 'class': 'head' }, [
						E('div', { 'class': 'pie' }, [
							E('label', [ _('Download / SID') ]),
							E('canvas', { 'id': 'sid-rx-pie', 'width': 200, 'height': 200 })
						]),

						E('div', { 'class': 'pie' }, [
							E('label', [ _('Upload / SID') ]),
							E('canvas', { 'id': 'sid-tx-pie', 'width': 200, 'height': 200 })
						]),

						E('div', { 'class': 'kpi' }, [
							E('ul', [
								E('li', _('<big id="sid-total">0</big> different SIDs')),
								E('li', _('<big id="sid-rx-total">0</big> total download')),
								E('li', _('<big id="sid-tx-total">0</big> total upload'))
							])
						])
					]),

					E('table', { 'class': 'table', 'id': 'sid-data' }, [
						E('tr', { 'class': 'tr table-titles' }, [
							E('th', { 'class': 'th left' }, [ _('SID') ]),
							E('th', { 'class': 'th left' }, [ _('Domain') ]),
							E('th', { 'class': 'th right' }, [ _('Incoming') ]),
							E('th', { 'class': 'th right' }, [ _('Outgoing') ])
						]),
						E('tr', { 'class': 'tr placeholder' }, [
							E('td', { 'class': 'td', 'colspan': '4' }, [
								E('em', { 'class': 'spinning' }, [ _('Collecting data...') ])
							])
						])
					])
				]),

				E('div', { 'class': 'cbi-section', 'data-tab': 'l7proto', 'data-tab-title': _('L7 Protocol Data') }, [
					E('table', { 'class': 'table', 'id': 'l7proto-data' }, [
						E('tr', { 'class': 'tr table-titles' }, [
							E('th', { 'class': 'th left' }, [ _('ID') ]),
							E('th', { 'class': 'th left' }, [ _('Domain') ]),
							E('th', { 'class': 'th right' }, [ _('SID') ])
						]),
						E('tr', { 'class': 'tr placeholder' }, [
							E('td', { 'class': 'td', 'colspan': '3' }, [
								E('em', { 'class': 'spinning' }, [ _('Collecting data...') ])
							])
						])
					])
				])
			])
		]);

		// Initialize tabs
		ui.tabs.initTabGroup(node.lastElementChild.childNodes);

		// Start polling
		this.pollL7Data();

		return node;
	},

	handleSave: null,
	handleSaveApply: null,
	handleReset: null
}); 