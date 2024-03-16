'use strict';
'require view';
'require ui';
'require form';
'require rpc';
'require fs';
'require tools.widgets as widgets';

var isReadonlyView = !L.hasViewPermission();

var mapdata = { view: {} };

return view.extend({
	render: function() {
		var m, s, o, ss;

		m = new form.JSONMap(mapdata, _('View SRT File'), _('View SRT file converted by whispercpp.'));
		m.readonly = isReadonlyView;

		s = m.section(form.NamedSection, 'view', _('View'));

		o = s.option(form.TextValue, 'viewlist');
        o.forceWrite = true;
        o.rows = 50;
        o.load = function(section_id) {
            return L.resolveDefault(fs.read('/tmp/output.wav.srt'), 'no result srt file');
        };

		return m.render();
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
