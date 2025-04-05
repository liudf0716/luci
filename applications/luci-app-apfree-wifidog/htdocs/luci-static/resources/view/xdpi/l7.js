'use strict';
'require view';
'require fs';
'require ui';
'require poll';

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
		});
	},

	loadL7ProtoData: function() {
		return fs.exec_direct('/usr/bin/aw-bpfctl', ['l7', 'json'], 'json').then(function(result) {
			return result;
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
		
		if (data && data.data) {
			data.data.forEach(function(item) {
				rows.push([
					item.sid,
					item.name,
					'%1024.2mB'.format(item.incoming),
					'%1024.2mB'.format(item.outgoing)
				]);

				rxData.push({
					value: item.incoming,
					label: [item.name]
				});

				txData.push({
					value: item.outgoing,
					label: [item.name]
				});

				rx_total += item.incoming;
				tx_total += item.outgoing;
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
		var rxData = [], txData = [];
		var rx_total = 0, tx_total = 0;
		
		if (data && data.data) {
			data.data.forEach(function(item) {
				rows.push([
					item.id,
					item.name,
					item.description,
					'%1024.2mB'.format(item.bytes)
				]);

				rxData.push({
					value: item.bytes,
					label: [item.name]
				});

				txData.push({
					value: item.bytes,
					label: [item.name]
				});

				rx_total += item.bytes;
				tx_total += item.bytes;
			});
		}

		cbi_update_table('#l7proto-data', rows, E('em', _('No data recorded yet.')));

		this.pie('l7proto-rx-pie', rxData);
		this.pie('l7proto-tx-pie', txData);

		this.kpi('l7proto-rx-total', '%1024.2mB'.format(rx_total));
		this.kpi('l7proto-tx-total', '%1024.2mB'.format(tx_total));
		this.kpi('l7proto-total', '%u'.format(rows.length));
	},

	render: function() {
		var self = this;
		var sidData = null;
		var l7ProtoData = null;

		// Create tabs
		var tabs = E('div', { 'class': 'cbi-section' }, [
			E('div', { 'class': 'cbi-section-descr' }, [
				E('ul', { 'class': 'cbi-tabmenu' }, [
					E('li', { 'class': 'cbi-tab', 'data-tab': 'sid' }, _('L7 SID Data')),
					E('li', { 'class': 'cbi-tab', 'data-tab': 'l7proto' }, _('L7 Protocol Data'))
				])
			])
		]);

		// SID Data Tab
		var sidTab = E('div', { 'class': 'cbi-section', 'data-tab': 'sid', 'data-tab-title': _('L7 SID Data') }, [
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
			E('div', { 'class': 'table-wrapper' }, [
				E('table', { 'class': 'table', 'id': 'sid-data' }, [
					E('tr', { 'class': 'tr table-titles' }, [
						E('th', { 'class': 'th left' }, [ _('SID') ]),
						E('th', { 'class': 'th left' }, [ _('Name') ]),
						E('th', { 'class': 'th right' }, [ _('Incoming') ]),
						E('th', { 'class': 'th right' }, [ _('Outgoing') ])
					]),
					E('tr', { 'class': 'tr placeholder' }, [
						E('td', { 'class': 'td', 'colspan': '4' }, [
							E('em', { 'class': 'spinning' }, [ _('Collecting data...') ])
						])
					])
				])
			])
		]);

		// L7 Protocol Data Tab
		var l7ProtoTab = E('div', { 'class': 'cbi-section', 'data-tab': 'l7proto', 'data-tab-title': _('L7 Protocol Data') }, [
			E('div', { 'class': 'head' }, [
				E('div', { 'class': 'pie' }, [
					E('label', [ _('Download / Protocol') ]),
					E('canvas', { 'id': 'l7proto-rx-pie', 'width': 200, 'height': 200 })
				]),
				E('div', { 'class': 'pie' }, [
					E('label', [ _('Upload / Protocol') ]),
					E('canvas', { 'id': 'l7proto-tx-pie', 'width': 200, 'height': 200 })
				]),
				E('div', { 'class': 'kpi' }, [
					E('ul', [
						E('li', _('<big id="l7proto-total">0</big> different protocols')),
						E('li', _('<big id="l7proto-rx-total">0</big> total download')),
						E('li', _('<big id="l7proto-tx-total">0</big> total upload'))
					])
				])
			]),
			E('div', { 'class': 'table-wrapper' }, [
				E('table', { 'class': 'table', 'id': 'l7proto-data' }, [
					E('tr', { 'class': 'tr table-titles' }, [
						E('th', { 'class': 'th left' }, [ _('ID') ]),
						E('th', { 'class': 'th left' }, [ _('Name') ]),
						E('th', { 'class': 'th left' }, [ _('Description') ]),
						E('th', { 'class': 'th right' }, [ _('Bytes') ])
					]),
					E('tr', { 'class': 'tr placeholder' }, [
						E('td', { 'class': 'td', 'colspan': '4' }, [
							E('em', { 'class': 'spinning' }, [ _('Collecting data...') ])
						])
					])
				])
			])
		]);

		// Add tabs to the page
		tabs.appendChild(sidTab);
		tabs.appendChild(l7ProtoTab);

		// Set up polling for SID data
		poll.add(function() {
			return self.loadSIDData().then(function(data) {
				self.renderSIDData(data);
			});
		}, 5);

		// Load L7 Protocol data once
		this.loadL7ProtoData().then(function(data) {
			self.renderL7ProtoData(data);
		});

		return tabs;
	},

	handleSave: null,
	handleSaveApply: null,
	handleReset: null
});