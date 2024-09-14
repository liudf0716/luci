'use strict';
'require view';
'require form';
'require uci';
'require fs';
'require validation';
'require tools.widgets as widgets';

return view.extend({
	load: function() {
		return L.resolveDefault(fs.exec_direct('/usr/libexec/nlbwmon-action', [ 'l7proto' ], 'json'), '{}');
	},

	render: function(data) {
		
		var node = E([], [
			E('h2', {}, _('L7 Protocol Support')),

			E('div', { 'class': 'table-wrapper' }, [
				E('table', { 'class': 'table', 'id': 'l7prot' }, [
					E('tr', { 'class': 'tr table-titles' }, [
						E('th', { 'class': 'th left' }, [ _('ID') ]),
						E('th', { 'class': 'th left' }, [ _('Name') ]),
						E('th', { 'class': 'th left' }, [ _('Description') ]),
					]),
					E('tr', { 'class': 'tr placeholder' }, [
						E('td', { 'class': 'td', 'colspan': '3' }, [
							E('em', { 'class': 'spinning' }, [ _('Collecting data...') ])
						])
					])
				])
			])

		]);

		var l7prot_tab = node.querySelector('#l7prot');
		var l7prot_data = data.l7_proto;
		if (l7prot_data != null) {
			var placeholder = l7prot_tab.querySelector('.placeholder');
			if (placeholder) {
				placeholder.remove();
			}
			for (var i = 0; i < l7prot_data.length; i++) {
				var name = l7prot_data[i].name;
				var id = l7prot_data[i].id;
				var description = l7prot_data[i].desc;

				var row = E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td left' }, [ i + 1]),
					E('td', { 'class': 'td left' }, [ name ]),
					E('td', { 'class': 'td left' }, [ description ])
				]);
				l7prot_tab.appendChild(row);
			}
		}
		
		return node;
	},

	handleSave: null,
	handleSaveApply: null,
	handleReset: null
});
