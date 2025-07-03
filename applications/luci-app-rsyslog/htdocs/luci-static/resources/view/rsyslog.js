'use strict';
'require view';
'require form';
'require fs';
'require ui';
'require uci';

return view.extend({
	render: function() {
		var m, s, o;

		m = new form.Map('rsyslog', _('Rsyslog Configuration'), 
			_('Configure rsyslog server settings, remote logging, and log selectors.'));

		// Main syslog section
		s = m.section(form.TypedSection, 'syslog', _('General Settings'));
		s.anonymous = true;
		s.addremove = false;

		s.tab('general', _('General'));
		s.tab('network', _('Network'));
		s.tab('tls', _('TLS Settings'));
		s.tab('remote', _('Remote Server'));

		// General settings
		o = s.taboption('general', form.Flag, 'enabled', _('Enable Rsyslogd'),
			_('Enable or disable the rsyslogd system service'));
		o.default = '1';

		o = s.taboption('general', form.DynamicList, 'modules', _('Modules'),
			_('List of rsyslog modules to load'));
		o.default = ['imuxsock', 'imklog'];

		o = s.taboption('general', form.ListValue, 'default_template', _('Default Template'),
			_('Default message format template'));
		o.value('RSYSLOG_TraditionalFileFormat', _('Traditional File Format'));
		o.value('RSYSLOG_FileFormat', _('File Format'));
		o.value('RSYSLOG_ForwardFormat', _('Forward Format'));
		o.default = 'RSYSLOG_TraditionalFileFormat';

		// Network settings
		o = s.taboption('network', form.Flag, 'udp_input', _('Enable UDP Input'),
			_('Enable UDP syslog reception'));
		o.default = '1';

		o = s.taboption('network', form.Value, 'udp_input_port', _('UDP Port'),
			_('Port for UDP syslog reception'));
		o.datatype = 'port';
		o.default = '514';
		o.depends('udp_input', '1');

		o = s.taboption('network', form.Flag, 'tcp_input', _('Enable TCP Input'),
			_('Enable TCP syslog reception'));
		o.default = '0';

		o = s.taboption('network', form.Value, 'tcp_input_port', _('TCP Port'),
			_('Port for TCP syslog reception'));
		o.datatype = 'port';
		o.default = '514';
		o.depends('tcp_input', '1');

		// TLS Settings section
		s = m.section(form.TypedSection, 'tls_settings', _('TLS Settings'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'enabled', _('Enable TLS'),
			_('Enable TLS support for secure logging'));
		o.default = '0';

		o = s.option(form.ListValue, 'driver', _('TLS Driver'));
		o.value('ossl', _('OpenSSL'));
		o.value('gtls', _('GnuTLS'));
		o.default = 'ossl';
		o.depends('enabled', '1');

		o = s.option(form.Value, 'ca_file', _('CA Certificate File'),
			_('Path to CA certificate file'));
		o.default = '/etc/ssl/certs/rsyslog-ca.pem';
		o.depends('enabled', '1');

		o = s.option(form.FileUpload, 'ca_file_upload', _('Upload CA Certificate'),
			_('Upload CA certificate file (.pem, .crt, .cer)'));
		o.depends('enabled', '1');
		o.root_directory = '/etc/ssl/certs';
		o.enable_remove = true;
		o.enable_upload = true;
		o.upload_path = '/etc/ssl/certs/';
		o.file_extensions = ['.pem', '.crt', '.cer'];
		
		// Update ca_file path when file is uploaded
		o.write = function(section_id, formvalue) {
			if (formvalue && formvalue.length > 0) {
				var filename = formvalue;
				var full_path = '/etc/ssl/certs/' + filename;
				// Update the ca_file field with the uploaded file path
				uci.set('rsyslog', section_id, 'ca_file', full_path);
			}
		};

		// Remote Server section
		s = m.section(form.TypedSection, 'remote_server', _('Remote Server Settings'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'enabled', _('Enable Remote Logging'),
			_('Forward logs to remote syslog server'));
		o.default = '0';

		o = s.option(form.Value, 'server_ip', _('Server IP Address'),
			_('IP address of remote syslog server'));
		o.datatype = 'ipaddr';
		o.depends('enabled', '1');

		o = s.option(form.Value, 'server_port', _('Server Port'),
			_('Port of remote syslog server'));
		o.datatype = 'port';
		o.default = '6514';
		o.depends('enabled', '1');

		o = s.option(form.ListValue, 'protocol', _('Protocol'));
		o.value('tcp', _('TCP'));
		o.value('udp', _('UDP'));
		o.default = 'tcp';
		o.depends('enabled', '1');

		o = s.option(form.Flag, 'use_tls', _('Use TLS'),
			_('Use TLS encryption for remote logging'));
		o.default = '0';
		o.depends('enabled', '1');

		o = s.option(form.Value, 'source_selector', _('Source Selector'),
			_('Log selector pattern to forward to remote server'));
		o.default = '*.*';
		o.depends('enabled', '1');

		// Log Selectors section
		s = m.section(form.TableSection, 'selector', _('Log Selectors'),
			_('Configure log routing based on facility and priority levels'));
		s.anonymous = true;
		s.addremove = true;

		o = s.option(form.Value, 'source', _('Source Pattern'),
			_('Syslog facility and priority pattern (e.g., *.info, mail.*, authpriv.none)'));
		o.rmempty = false;
		o.placeholder = '*.info';

		o = s.option(form.Value, 'destination', _('Destination'),
			_('Log file path or action'));
		o.rmempty = false;
		o.placeholder = '/var/log/messages';

		return m.render();
	}
});
