'use strict';
'require view';
'require ui';
'require form';
'require rpc';
'require fs';
'require tools.widgets as widgets';

var isReadonlyView = !L.hasViewPermission();

var mapdata = { actions: {}};

return view.extend({
	load: function() {
		return Promise.all([
			L.resolveDefault(fs.stat('/tmp/output.wav.srt'), null),
		]);
	},

	uploadVideo: function(ev) {
		return ui.uploadFile('/tmp/video.mp4', ev.target.firstChild)
			.then(function(res){
				if (res.size > 5*1024*1024) {
					ui.addNotification(null, E('p', _('File size should be less than 5M')), 'error');
					return fs.remove('/tmp/video.mp4');
				}
				ui.addNotification(null, E('p', _('Upload video complete')), 'info');
			})
			.catch(function(e){
				ui.addNotification(null, E('p', _('Failed to upload video: %s').format(e)), 'error');
			});
	},

	processVideo: function(has_srt) {
	
		return fs.exec('/usr/bin/ffmpeg', 
			['-i', '/tmp/video.mp4', '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', '-y', '/tmp/output.wav'])
			.then(function(res){
				if (res.code !== 0) {
					ui.addNotification(null, E('p', _('Failed to process video')), 'error');
					return;
				}
				if (has_srt) {
					return fs.remove('/tmp/output.wav.srt')
						.then(function(res){
							return fs.exec('/usr/bin/whispercpp', 
								['-m', '/usr/share/whispercpp/model/ggml-tiny.en-q5_0.bin', '-osrt', '-f', '/tmp/output.wav'])
							.then(function(res){
								if (res.code !== 0) {
									ui.addNotification(null, E('p', _('Failed to convert audio')), 'error');
									return;
								}
								ui.addNotification(null, E('p', _('Convert video complete')), 'info');
							});
						})
						.catch(function(e){
							ui.addNotification(null, E('p', _('Failed to convert video: %s').format(e)), 'error');
						});
				} else {
					return fs.exec('/usr/bin/whispercpp', 
						['-m', '/usr/share/whispercpp/model/ggml-tiny.en-q5_0.bin', '-osrt', '-f', '/tmp/output.wav'])
					.then(function(res){
						if (res.code !== 0) {
							ui.addNotification(null, E('p', _('Failed to convert audio')), 'error');
							return;
						}
						ui.addNotification(null, E('p', _('Convert video complete')), 'info');
					})
					.catch(function(e){
						ui.addNotification(null, E('p', _('Failed to convert video: %s').format(e)), 'error');
					});
				}
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
		o.onclick = this.processVideo(has_srt);

		return m.render();
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
