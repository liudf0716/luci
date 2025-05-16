'use strict';
'require view.alert-viewer.log-abstract as abc';

return abc.view.extend({
	viewName   : 'alert-viewer',
	title      : _('Alert Viewer'),
	autoRefresh: true,
	appPattern : '^',
	loggerTail : true,
});
