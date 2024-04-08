'use strict';
'require view';
'require ui';
'require form';
'require rpc';
'require fs';
'require tools.widgets as widgets';

var isReadonlyView = !L.hasViewPermission();

var mapdata = { actions: {}};

var callWhipsercpp = rpc.declare({
	object: 'whispercpp',
	method: 'whispercpp',
	expect: { result: [] }
});

var callFfmpeg = rpc.declare({
	object: 'whispercpp',
	method: 'ffmpeg',
	expect: { result: [] }
});

var isFfmpegOrWhispercppRunning = rpc.declare({
	object: 'luci',
	method: 'isFfmpegOrWhispercppRunning',
	expect: { result: {} }
});

function getServiceStatus() {
	return L.resolveDefault(isFfmpegOrWhispercppRunning(), {}).then(function (res) {
		if (res['ffmpeg']) {
			return 'Converting ...';
		} else if (res['whispercpp']) {
			return 'Transcribe ...';
		} else {
			return 'Convert';
		}
		
	});
}

return view.extend({
	load: function() {
		return Promise.all([
			L.resolveDefault(fs.stat('/tmp/output.wav.srt'), null),
		]);
	},

	uploadVideo: function(ev) {
		return ui.uploadFile('/tmp/video.mp4', ev.target.firstChild)
			.then(function(res){
				if (res.size > 10*1024*1024) {
					ui.addNotification(null, E('p', _('File size should be less than 10M')), 'error');
					return fs.remove('/tmp/video.mp4');
				}
				ui.addNotification(null, E('p', _('Upload video complete')), 'info');
			})
			.catch(function(e){
				ui.addNotification(null, E('p', _('Failed to upload video: %s').format(e)), 'error');
			})
			.finally(L.bind(function(btn){
				btn.firstChild.data = _('Upload');
			}, this, ev.target));
	},

	processVideo: function(ev) {
		return fs.exec('/usr/bin/ffmpeg', ['-i', '/tmp/video.mp4', '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', '-y', '/tmp/output.wav']).then(function(res){
			return callWhipsercpp().then(function(res){
				return ev;
			});
		})
		.then(function(ev){
			L.Poll.add(function () {
				return L.resolveDefault(getServiceStatus()).then(function(res) {
					ev.target.firstChild.data = _(res);
					ev.target.firstChild.inputstyle = 'apply';
					if (res != 'Convert') {
						ev.target.disabled = true;
					} else {
						ev.target.disabled = false;
					}
				});
			});
		})
		.catch(function(e){
			ui.addNotification(null, E('p', _('Failed to convert video: %s').format(e)), 'error');
		});
	},
					

	render: function(stats) {
		var has_srt = stats[0]? true: false;
		var m, s, o, ss;

		m = new form.JSONMap(mapdata, _('Whispercpp Process'), _('Whisper is a general-purpose speech recognition model.'));
		m.readonly = isReadonlyView;

		s = m.section(form.NamedSection, 'actions', _('Actions'));
		
		o = s.option(form.SectionValue, 'actions', form.NamedSection, 'actions', 'actions', 
			_('Upload'), _('Click "Upload" to upload video file, file size should be less than 5M.'));
		ss = o.subsection;

		o = ss.option(form.Button, 'upload', _('Upload Video File'));
		o.inputstyle = 'action important';
		o.inputtitle = _('Upload');
		o.onclick = L.bind(this.uploadVideo, this);

		o = s.option(form.SectionValue, 'actions', form.NamedSection, 'actions', 'actions',
			_('Convert'), _('Click "Convert" to convert video file to SRT file.'));
		ss = o.subsection;

		o = ss.option(form.Button, 'convert', _('Convert Video to SRT File'));
		o.inputstyle = 'action important';
		o.inputtitle = _('Convert');
		o.onclick = L.bind(this.processVideo, this);

		return m.render();
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
