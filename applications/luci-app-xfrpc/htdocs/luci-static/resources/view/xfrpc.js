'use strict';
'require view';
'require ui';
'require form';
'require rpc';
'require dom';
'require tools.widgets as widgets';
'require tools.github as github';

const callServiceList = rpc.declare({
	object: 'service',
	method: 'list',
	params: ['name'],
	expect: { '': {} }
});

var callInstaLoader = rpc.declare({
	object: 'luci',
	method: 'callInstaLoader',
	params: ['action', 'param', 'name'],
	expect: { result : "OK" }
});


function getServiceStatus() {
	return L.resolveDefault(callServiceList('xfrpc'), {}).then(function (res) {
		var isRunning = false;
		try {
			isRunning = res['xfrpc']['instances']['instance1']['running'];
		} catch (e) { }
		return isRunning;
	});
}

function renderStatus(isRunning) {
	var renderHTML = "";
	var spanTemp = '<em><span style="color:%s"><strong>%s %s</strong></span></em>';

	if (isRunning) {
		renderHTML += String.format(spanTemp, 'green', _("xfrpc client"), _("running..."));
	} else {
		renderHTML += String.format(spanTemp, 'red', _("xfprc client"), _("not running..."));
	}

	return renderHTML;
}

function executePluginAction(id, ev) {
	var name = id;
	var selectedRow = ev.target.parentElement.parentElement.parentElement.parentElement;
	var pluginName = selectedRow.querySelector('td:nth-child(1)').innerText;
	var pluginAction = selectedRow.querySelector('td:nth-child(2)').innerText;
	var pluginParam = selectedRow.querySelector('td:nth-child(3)').innerText;
	console.log(name + " " + pluginName + " " + pluginAction + " " + pluginParam);
	if (pluginName == "instaloader") {
		if (pluginParam == "") {
			alert(_("please input profile url to download"));
			return;
		}
		if (pluginAction == "download") {
			alert(_("start download video"));
			callInstaLoader('download', pluginParam, name).then(function (res) {
				// parse json res
				var jsonRes = JSON.parse(res);
				if (jsonRes["status"] == "ok") {
					alert("start download video");
				} else {
					alert("download video failed");
				}
			});
		} else if (pluginAction == "stop") {
			alert(_("stop download video"));
			callInstaLoader('stop', '', name).then(function (res) {
				var jsonRes = JSON.parse(res);
				if (jsonRes["status"] == "ok") {
					alert("stop download video");
				} else {
					alert("stop download video failed");
				}
			});
		}
	} else if (pluginName == "youtubedl") {
		if (pluginParam == "") {
			alert(_("please input video url to download"));
			return;
		}
		if (pluginAction == "download") {
			alert(_("start download video"));
			callInstaLoader('download', pluginParam, name).then(function (res) {
				var jsonRes = JSON.parse(res);
				if (jsonRes["status"] == "ok") {
					alert("start download video");
				} else {
					alert("download video failed");
				}
			});
		}
	} else {
		alert(_("not support plugin"));
	}
}

/**
 * Add common proxy options (encryption, compression, start/end time) to a GridSection.
 * @param {Object} ss - The GridSection subsection
 * @param {Object} opts - Options: { visitor: true } for visitor sections (skip start/end time)
 */
function addCommonProxyOptions(ss, opts) {
	opts = opts || {};

	var o;

	o = ss.option(form.Flag, 'use_encryption', _('Use Encryption'),
		_('Enable encryption for this proxy. Traffic will be encrypted between frpc and frps.'));
	o.rmempty = false;
	o.default = '0';
	o.modalonly = true;

	o = ss.option(form.Flag, 'use_compression', _('Use Compression'),
		_('Enable compression for this proxy. Traffic will be compressed between frpc and frps.'));
	o.rmempty = false;
	o.default = '0';
	o.modalonly = true;

	if (!opts.visitor) {
		o = ss.option(form.ListValue, 'start_time', _('Start time'),
			_('Start time specifies the start time of the proxy service. 0 means no restriction.'));
		o.rmempty = false;
		o.mandatory = false;
		o.optional = false;
		o.default = '0';
		for (let i = 0; i <= 23; i++) {
			o.value(i.toString(), i.toString());
		}

		o = ss.option(form.ListValue, 'end_time', _('End time'),
			_('End time specifies the end time of the proxy service. 0 means no restriction.'));
		o.rmempty = false;
		o.mandatory = false;
		o.optional = false;
		o.default = '0';
		for (let i = 0; i <= 23; i++) {
			o.value(i.toString(), i.toString());
		}
		o.validate = function(section_id, value) {
			var start_time = this.map.lookupOption('start_time', section_id)[0].formvalue(section_id);
			if (parseInt(value) < parseInt(start_time)) {
				return _('End time must be greater than start time');
			}
			return true;
		};
	}
}

return view.extend({
	render: function() {
		var m, s, o, ss;

		m = new form.Map('xfrpc', _('xfrpc'));
		m.description = github.desc(
			'xfrpc is a c language frp client for frps.', 'liudf0716', 'xfrpc');

		s = m.section(form.NamedSection, '_status');
		s.anonymous = true;
		s.render = function (section_id) {
			L.Poll.add(function () {
				return L.resolveDefault(getServiceStatus()).then(function(res) {
					var view = document.getElementById("service_status");
					view.innerHTML = renderStatus(res);
				});
			});

			return E('div', { class: 'cbi-map' },
				E('fieldset', { class: 'cbi-section'}, [
					E('p', { id: 'service_status' },
						_('Collecting data ...'))
				])
			);
		};

		s = m.section(form.NamedSection, 'common', 'xfrpc');
		s.dynamic = true;

		// ---- Tab definitions ----
		s.tab('general', _('General Settings'));
		s.tab('transport', _('Transport Settings'));
		s.tab('tls', _('TLS Settings'));
		s.tab('oidc', _('OIDC Auth'));
		s.tab('tcp', _('TCP Proxy'));
		s.tab('http', _('HTTP Proxy'));
		s.tab('https', _('HTTPS Proxy'));
		s.tab('tcpmux', _('TCPMux Proxy'));
		s.tab('socks5', _('SOCKS5 Proxy'));
		s.tab('stcp', _('STCP Proxy'));
		s.tab('xtcp', _('XTCP Proxy'));
		s.tab('sudp', _('SUDP Proxy'));
		s.tab('stcp_visitor', _('STCP Visitor'));
		s.tab('xtcp_visitor', _('XTCP Visitor'));
		s.tab('iod', _('IOD Settings'));
		s.tab('plugin', _('Plugin Settings'));

		// ===== General Settings =====
		o = s.taboption('general', form.Flag, 'enabled', _('Enable'), _('Enable xfrpc service.'));
		o.rmempty = false;
		o.default = '1';

		o = s.taboption('general', form.Value, 'server_addr', _('Server address'),
			'%s <br /> %s'.format(_('Server address specifies the address of the server to connect to.'),
			_('By default, this value is "0.0.0.0".')));
		o.rmempty = false;
		o.datatype = 'or(host, ipaddr)';
		o.optional = false;

		o = s.taboption('general', form.Value, 'server_port', _('Server port'),
			'%s <br /> %s'.format(_('Server port specifies the port to connect to the server on.'),
			_('By default, this value is 7000.')));
		o.rmempty = false;
		o.datatype = 'port';
		o.optional = false;

		o = s.taboption('general', form.Value, 'token', _('Token'),
			'%s <br /> %s'.format(_('Token specifies the authorization token used to create keys to be \
			sent to the server. The server must have a matching token for authorization to succeed.'),
			_('By default, this value is "".')));
		o.rmempty = false;
		o.password = true;
		o.optional = false;

		o = s.taboption('general', form.ListValue, 'loglevel', _('Log level'),
			'%s <br /> %s'.format(_('LogLevel specifies the minimum log level. Valid values are "Debug", "Info", \
			"Notice", "Warning", "Error", "Critical", "Alert" and "Emergency".'),
			_('By default, this value is "Info".')));
		o.value(7, _('Debug'));
		o.value(6, _('Info'));
		o.value(5, _('Notice'));
		o.value(4, _('Warning'));
		o.value(3, _('Error'));
		o.value(2, _('Critical'));
		o.value(1, _('Alert'));
		o.value(0, _('Emergency'));
		o.default = '6';
		o.optional = false;

		// ===== Transport Settings =====
		o = s.taboption('transport', form.ListValue, 'protocol', _('Protocol'),
			_('Specifies the protocol used to connect to the server. Valid values are "tcp", "kcp" and "quic".'));
		o.value('tcp', 'TCP');
		o.value('kcp', 'KCP');
		o.value('quic', 'QUIC');
		o.default = 'tcp';
		o.rmempty = false;
		o.optional = false;

		o = s.taboption('transport', form.Flag, 'tcp_mux', _('TCP Mux'),
			_('Enable TCP multiplexing on the connection to frps. This reduces the number of connections.'));
		o.rmempty = false;
		o.default = '0';

		o = s.taboption('transport', form.Value, 'heartbeat_interval', _('Heartbeat interval'),
			_('Interval between sending heartbeats to the server, in seconds. By default, this value is 30.'));
		o.datatype = 'uinteger';
		o.rmempty = true;
		o.placeholder = '30';

		o = s.taboption('transport', form.Value, 'heartbeat_timeout', _('Heartbeat timeout'),
			_('Timeout for heartbeat response from the server, in seconds. By default, this value is 90.'));
		o.datatype = 'uinteger';
		o.rmempty = true;
		o.placeholder = '90';

		o = s.taboption('transport', form.Value, 'quic_bind_port', _('QUIC bind port'),
			_('Specifies the UDP port to bind for QUIC protocol. Only used when protocol is set to "quic".'));
		o.datatype = 'port';
		o.rmempty = true;
		o.depends('protocol', 'quic');

		// ===== TLS Settings =====
		o = s.taboption('tls', form.Flag, 'tls_enable', _('Enable TLS'),
			_('Enable TLS encryption for the connection to the server.'));
		o.rmempty = false;
		o.default = '0';

		o = s.taboption('tls', form.Value, 'tls_cert_file', _('TLS certificate file'),
			_('Path to the TLS client certificate file.'));
		o.rmempty = true;
		o.depends('tls_enable', '1');

		o = s.taboption('tls', form.Value, 'tls_key_file', _('TLS key file'),
			_('Path to the TLS client key file.'));
		o.rmempty = true;
		o.depends('tls_enable', '1');

		o = s.taboption('tls', form.Value, 'tls_trusted_ca_file', _('TLS trusted CA file'),
			_('Path to the trusted CA certificate file for verifying the server.'));
		o.rmempty = true;
		o.depends('tls_enable', '1');

		o = s.taboption('tls', form.Value, 'tls_server_name', _('TLS server name'),
			_('Specifies the server name for TLS SNI. Used to verify the server certificate.'));
		o.rmempty = true;
		o.datatype = 'hostname';
		o.depends('tls_enable', '1');

		// ===== OIDC Auth Settings =====
		o = s.taboption('oidc', form.ListValue, 'auth_method', _('Auth method'),
			_('Authentication method. Use "token" for simple token auth or "oidc" for OpenID Connect.'));
		o.value('token', _('Token'));
		o.value('oidc', 'OIDC');
		o.default = 'token';
		o.rmempty = false;

		o = s.taboption('oidc', form.Value, 'oidc_client_id', _('OIDC Client ID'),
			_('The client ID for OIDC authentication.'));
		o.rmempty = true;
		o.depends('auth_method', 'oidc');

		o = s.taboption('oidc', form.Value, 'oidc_client_secret', _('OIDC Client Secret'),
			_('The client secret for OIDC authentication.'));
		o.rmempty = true;
		o.password = true;
		o.depends('auth_method', 'oidc');

		o = s.taboption('oidc', form.Value, 'oidc_audience', _('OIDC Audience'),
			_('The audience for the OIDC token request.'));
		o.rmempty = true;
		o.depends('auth_method', 'oidc');

		o = s.taboption('oidc', form.Value, 'oidc_scope', _('OIDC Scope'),
			_('The scope for the OIDC token request. Multiple scopes can be separated by spaces.'));
		o.rmempty = true;
		o.depends('auth_method', 'oidc');

		o = s.taboption('oidc', form.Value, 'oidc_token_endpoint_url', _('OIDC Token Endpoint URL'),
			_('The URL of the OIDC token endpoint.'));
		o.rmempty = true;
		o.datatype = 'url';
		o.depends('auth_method', 'oidc');

		o = s.taboption('oidc', form.Value, 'oidc_trusted_ca_file', _('OIDC Trusted CA File'),
			_('Path to the trusted CA certificate file for OIDC token endpoint.'));
		o.rmempty = true;
		o.depends('auth_method', 'oidc');

		o = s.taboption('oidc', form.Flag, 'oidc_insecure_skip_verify', _('OIDC Insecure Skip Verify'),
			_('Skip TLS certificate verification for the OIDC token endpoint. Not recommended for production.'));
		o.rmempty = false;
		o.default = '0';
		o.depends('auth_method', 'oidc');

		// ===== TCP Proxy Settings =====
		o = s.taboption('tcp', form.SectionValue, '_tcp', form.GridSection, 'tcp');
		ss = o.subsection;
		ss.addremove = true;
		ss.nodescriptions = true;

		o = ss.option(form.Flag, 'enabled', _('Enable'), _('Enable this TCP proxy.'));
		o.rmempty = false;
		o.default = '1';

		o = ss.option(form.ListValue, 'service_type', _('Service Type'),
			_('For security, you can specify the service type to proxy to.'));
		o.rmempty = true;
		o.value('', _("Don't specify service type"));
		o.value('mstsc', 'MSTSC');
		o.value('ssh', 'SSH');
		o.value('telnet', 'Telnet');
		o.value('vnc', 'VNC');
		o.value('rdp', 'RDP');
		o.default = '';

		o = ss.option(form.Value, 'local_ip', _('Local IP'),
			_('Local IP specifies the IP address to proxy to.'));
		o.datatype = 'ip4addr';
		o.rmempty = false;
		o.mandatory = true;
		o.optional = false;

		o = ss.option(form.Value, 'local_port', _('Local port'),
			_('Local port specifies the port to proxy to.'));
		o.datatype = 'port';
		o.rmempty = false;
		o.optional = false;

		o = ss.option(form.Value, 'remote_port', _('Remote port'),
			_('Remote port specifies server-side port to proxy to.'));
		o.datatype = 'port';
		o.rmempty = false;
		o.optional = false;

		// Health check options for TCP
		o = ss.option(form.ListValue, 'health_check_type', _('Health check type'),
			_('Type of health check to perform. Valid values are "tcp" and "http".'));
		o.value('', _('Disabled'));
		o.value('tcp', 'TCP');
		o.value('http', 'HTTP');
		o.default = '';
		o.rmempty = true;
		o.modalonly = true;

		o = ss.option(form.Value, 'health_check_url', _('Health check URL'),
			_('URL path for HTTP health check. Only used when health check type is "http".'));
		o.rmempty = true;
		o.modalonly = true;
		o.depends('health_check_type', 'http');

		o = ss.option(form.Value, 'health_check_interval', _('Health check interval'),
			_('Interval between health checks, in seconds.'));
		o.datatype = 'uinteger';
		o.rmempty = true;
		o.placeholder = '10';
		o.modalonly = true;

		o = ss.option(form.Value, 'health_check_timeout', _('Health check timeout'),
			_('Timeout for health check, in seconds.'));
		o.datatype = 'uinteger';
		o.rmempty = true;
		o.placeholder = '3';
		o.modalonly = true;

		o = ss.option(form.Value, 'health_check_max_failed', _('Health check max failed'),
			_('Max number of consecutive failed health checks before marking the proxy as unavailable.'));
		o.datatype = 'uinteger';
		o.rmempty = true;
		o.placeholder = '1';
		o.modalonly = true;

		addCommonProxyOptions(ss);

		// ===== HTTP Proxy Settings =====
		o = s.taboption('http', form.SectionValue, '_http', form.GridSection, 'http');
		ss = o.subsection;
		ss.addremove = true;
		ss.nodescriptions = true;

		o = ss.option(form.Flag, 'enabled', _('Enable'), _('Enable this HTTP proxy.'));
		o.rmempty = false;
		o.default = '1';

		o = ss.option(form.Value, 'local_ip', _('Local IP'),
			_('Local IP specifies the IP address to proxy to.'));
		o.datatype = 'ip4addr';
		o.rmempty = false;
		o.optional = false;

		o = ss.option(form.Value, 'local_port', _('Local port'),
			_('Local port specifies the port to proxy to.'));
		o.datatype = 'port';
		o.optional = false;
		o.rmempty = false;

		o = ss.option(form.Flag, 'is_subdomain', _('Enable Subdomain'),
			_('Enable subdomain for http proxy'));
		o.rmempty = false;
		o.modalonly = true;
		o.optional = true;

		o = ss.option(form.Value, 'custom_domains', _('Custom Domains'),
			_('Custom domains for http proxy'));
		o.datatype = 'host';
		o.optional = false;
		o.depends('is_subdomain', '0');

		o = ss.option(form.Value, 'subdomain', _('Subdomain'),
			_('Specifies the subdomain for http proxy, only works when server support subdomain.'));
		o.datatype = 'string';
		o.optional = false;
		o.depends('is_subdomain', '1');

		o = ss.option(form.Value, 'locations', _('Locations'),
			_('URL routing paths, multiple paths separated by commas.'));
		o.rmempty = true;
		o.modalonly = true;

		o = ss.option(form.Value, 'host_header_rewrite', _('Host header rewrite'),
			_('Rewrite the HTTP Host header to the specified value.'));
		o.rmempty = true;
		o.modalonly = true;

		o = ss.option(form.Value, 'http_user', _('HTTP Basic Auth User'),
			_('Username for HTTP Basic Authentication on the proxy.'));
		o.rmempty = true;
		o.modalonly = true;

		o = ss.option(form.Value, 'http_password', _('HTTP Basic Auth Password'),
			_('Password for HTTP Basic Authentication on the proxy.'));
		o.rmempty = true;
		o.password = true;
		o.modalonly = true;

		o = ss.option(form.Value, 'request_headers', _('Request Headers'),
			_('Additional request headers, format: key1=val1,key2=val2'));
		o.rmempty = true;
		o.modalonly = true;

		o = ss.option(form.Value, 'response_headers', _('Response Headers'),
			_('Additional response headers, format: key1=val1,key2=val2'));
		o.rmempty = true;
		o.modalonly = true;

		addCommonProxyOptions(ss);

		// ===== HTTPS Proxy Settings =====
		o = s.taboption('https', form.SectionValue, '_https', form.GridSection, 'https');
		ss = o.subsection;
		ss.addremove = true;
		ss.nodescriptions = true;

		o = ss.option(form.Flag, 'enabled', _('Enable'), _('Enable this HTTPS proxy.'));
		o.rmempty = false;
		o.default = '1';

		o = ss.option(form.Value, 'local_ip', _('Local IP'),
			_('Local IP specifies the IP address to proxy to.'));
		o.datatype = 'ip4addr';
		o.rmempty = false;
		o.optional = false;

		o = ss.option(form.Value, 'local_port', _('Local port'),
			_('Local port specifies the port to proxy to.'));
		o.datatype = 'port';
		o.optional = false;
		o.rmempty = false;

		o = ss.option(form.Flag, 'is_subdomain', _('Enable Subdomain'),
			_('Enable subdomain for https proxy'));
		o.rmempty = false;
		o.modalonly = true;
		o.optional = true;

		o = ss.option(form.Value, 'custom_domains', _('Custom Domains'),
			_('Custom domains for https proxy'));
		o.datatype = 'host';
		o.optional = false;
		o.depends('is_subdomain', '0');

		o = ss.option(form.Value, 'subdomain', _('Subdomain'),
			_('Specifies the subdomain for https proxy, only works when server support subdomain.'));
		o.datatype = 'string';
		o.optional = false;
		o.depends('is_subdomain', '1');

		o = ss.option(form.Value, 'locations', _('Locations'),
			_('URL routing paths, multiple paths separated by commas.'));
		o.rmempty = true;
		o.modalonly = true;

		o = ss.option(form.Value, 'host_header_rewrite', _('Host header rewrite'),
			_('Rewrite the HTTP Host header to the specified value.'));
		o.rmempty = true;
		o.modalonly = true;

		o = ss.option(form.Value, 'http_user', _('HTTP Basic Auth User'),
			_('Username for HTTP Basic Authentication on the proxy.'));
		o.rmempty = true;
		o.modalonly = true;

		o = ss.option(form.Value, 'http_password', _('HTTP Basic Auth Password'),
			_('Password for HTTP Basic Authentication on the proxy.'));
		o.rmempty = true;
		o.password = true;
		o.modalonly = true;

		o = ss.option(form.Value, 'request_headers', _('Request Headers'),
			_('Additional request headers, format: key1=val1,key2=val2'));
		o.rmempty = true;
		o.modalonly = true;

		o = ss.option(form.Value, 'response_headers', _('Response Headers'),
			_('Additional response headers, format: key1=val1,key2=val2'));
		o.rmempty = true;
		o.modalonly = true;

		addCommonProxyOptions(ss);

		// ===== TCPMux Proxy Settings =====
		o = s.taboption('tcpmux', form.SectionValue, '_tcpmux', form.GridSection, 'tcpmux');
		ss = o.subsection;
		ss.addremove = true;
		ss.nodescriptions = true;

		o = ss.option(form.Flag, 'enabled', _('Enable'), _('Enable this TCPMux proxy.'));
		o.rmempty = false;
		o.default = '1';

		o = ss.option(form.Value, 'local_ip', _('Local IP'),
			_('Local IP specifies the IP address to proxy to.'));
		o.datatype = 'ip4addr';
		o.rmempty = false;
		o.optional = false;

		o = ss.option(form.Value, 'local_port', _('Local port'),
			_('Local port specifies the port to proxy to.'));
		o.datatype = 'port';
		o.rmempty = false;
		o.optional = false;

		o = ss.option(form.Value, 'remote_port', _('Remote port'),
			_('Remote port specifies server-side port to proxy to.'));
		o.datatype = 'port';
		o.rmempty = false;
		o.optional = false;

		o = ss.option(form.ListValue, 'multiplexer', _('Multiplexer'),
			_('Specifies the multiplexer type for TCPMux proxy.'));
		o.value('httpconnect', 'HTTP Connect');
		o.value('socks5', 'SOCKS5');
		o.value('raw', 'Raw');
		o.value('quic', 'QUIC');
		o.rmempty = true;

		o = ss.option(form.ListValue, 'service_type', _('Service Type'),
			_('For security, you can specify the service type to proxy to.'));
		o.rmempty = true;
		o.value('', _("Don't specify service type"));
		o.value('mstsc', 'MSTSC');
		o.value('ssh', 'SSH');
		o.value('telnet', 'Telnet');
		o.value('vnc', 'VNC');
		o.value('rdp', 'RDP');
		o.value('http', 'HTTP');
		o.value('https', 'HTTPS');
		o.default = '';

		o = ss.option(form.Value, 'custom_domains', _('Custom Domains'),
			_('Custom domains for TCPMux proxy.'));
		o.datatype = 'host';
		o.optional = false;

		addCommonProxyOptions(ss);

		// ===== SOCKS5 Proxy Settings =====
		o = s.taboption('socks5', form.SectionValue, '_socks5', form.GridSection, 'socks5');
		ss = o.subsection;
		ss.addremove = true;
		ss.nodescriptions = true;

		o = ss.option(form.Flag, 'enabled', _('Enable'), _('Enable this SOCKS5 proxy.'));
		o.rmempty = false;
		o.default = '1';

		o = ss.option(form.Value, 'remote_port', _('Remote port'),
			_('Remote port specifies server-side port to proxy to.'));
		o.optional = false;
		o.rmempty = false;
		o.datatype = 'port';

		addCommonProxyOptions(ss);

		// ===== STCP Proxy Settings =====
		o = s.taboption('stcp', form.SectionValue, '_stcp', form.GridSection, 'stcp');
		ss = o.subsection;
		ss.addremove = true;
		ss.nodescriptions = true;

		o = ss.option(form.Flag, 'enabled', _('Enable'), _('Enable this STCP proxy.'));
		o.rmempty = false;
		o.default = '1';

		o = ss.option(form.Value, 'local_ip', _('Local IP'),
			_('Local IP specifies the IP address to proxy to.'));
		o.datatype = 'ip4addr';
		o.rmempty = false;
		o.optional = false;

		o = ss.option(form.Value, 'local_port', _('Local port'),
			_('Local port specifies the port to proxy to.'));
		o.datatype = 'port';
		o.rmempty = false;
		o.optional = false;

		o = ss.option(form.Value, 'secret_key', _('Secret key'),
			_('Secret key for STCP authentication. Visitors must provide the same key to connect.'));
		o.rmempty = true;
		o.modalonly = true;

		o = ss.option(form.Value, 'allow_users', _('Allow users'),
			_('Comma-separated list of usernames allowed to connect. Empty means all users.'));
		o.rmempty = true;
		o.modalonly = true;

		addCommonProxyOptions(ss);

		// ===== XTCP Proxy Settings =====
		o = s.taboption('xtcp', form.SectionValue, '_xtcp', form.GridSection, 'xtcp');
		ss = o.subsection;
		ss.addremove = true;
		ss.nodescriptions = true;

		o = ss.option(form.Flag, 'enabled', _('Enable'), _('Enable this XTCP proxy.'));
		o.rmempty = false;
		o.default = '1';

		o = ss.option(form.Value, 'local_ip', _('Local IP'),
			_('Local IP specifies the IP address to proxy to.'));
		o.datatype = 'ip4addr';
		o.rmempty = false;
		o.optional = false;

		o = ss.option(form.Value, 'local_port', _('Local port'),
			_('Local port specifies the port to proxy to.'));
		o.datatype = 'port';
		o.rmempty = false;
		o.optional = false;

		o = ss.option(form.Value, 'secret_key', _('Secret key'),
			_('Secret key for XTCP authentication. Visitors must provide the same key to connect.'));
		o.rmempty = true;
		o.modalonly = true;

		o = ss.option(form.Value, 'allow_users', _('Allow users'),
			_('Comma-separated list of usernames allowed to connect. Empty means all users.'));
		o.rmempty = true;
		o.modalonly = true;

		addCommonProxyOptions(ss);

		// ===== SUDP Proxy Settings =====
		o = s.taboption('sudp', form.SectionValue, '_sudp', form.GridSection, 'sudp');
		ss = o.subsection;
		ss.addremove = true;
		ss.nodescriptions = true;

		o = ss.option(form.Flag, 'enabled', _('Enable'), _('Enable this SUDP proxy.'));
		o.rmempty = false;
		o.default = '1';

		o = ss.option(form.Value, 'local_ip', _('Local IP'),
			_('Local IP specifies the IP address to proxy to.'));
		o.datatype = 'ip4addr';
		o.rmempty = false;
		o.optional = false;

		o = ss.option(form.Value, 'local_port', _('Local port'),
			_('Local port specifies the port to proxy to.'));
		o.datatype = 'port';
		o.rmempty = false;
		o.optional = false;

		o = ss.option(form.Value, 'secret_key', _('Secret key'),
			_('Secret key for SUDP authentication.'));
		o.rmempty = true;
		o.modalonly = true;

		addCommonProxyOptions(ss);

		// ===== STCP Visitor Settings =====
		o = s.taboption('stcp_visitor', form.SectionValue, '_stcp_visitor', form.GridSection, 'stcp_visitor');
		ss = o.subsection;
		ss.addremove = true;
		ss.nodescriptions = true;

		o = ss.option(form.Flag, 'enabled', _('Enable'), _('Enable this STCP visitor.'));
		o.rmempty = false;
		o.default = '1';

		o = ss.option(form.Value, 'server_name', _('Server name'),
			_('The name of the STCP proxy on the server side to connect to.'));
		o.rmempty = false;
		o.optional = false;

		o = ss.option(form.Value, 'bind_addr', _('Bind address'),
			_('The local address to bind for the visitor.'));
		o.datatype = 'ipaddr';
		o.rmempty = false;
		o.optional = false;

		o = ss.option(form.Value, 'bind_port', _('Bind port'),
			_('The local port to bind for the visitor.'));
		o.datatype = 'port';
		o.rmempty = false;
		o.optional = false;

		o = ss.option(form.Value, 'secret_key', _('Secret key'),
			_('Secret key for STCP visitor authentication. Must match the STCP proxy secret key.'));
		o.rmempty = true;
		o.modalonly = true;

		o = ss.option(form.Value, 'fallback_to', _('Fallback to'),
			_('Fallback to another visitor when the connection fails.'));
		o.rmempty = true;
		o.modalonly = true;

		addCommonProxyOptions(ss, { visitor: true });

		// ===== XTCP Visitor Settings =====
		o = s.taboption('xtcp_visitor', form.SectionValue, '_xtcp_visitor', form.GridSection, 'xtcp_visitor');
		ss = o.subsection;
		ss.addremove = true;
		ss.nodescriptions = true;

		o = ss.option(form.Flag, 'enabled', _('Enable'), _('Enable this XTCP visitor.'));
		o.rmempty = false;
		o.default = '1';

		o = ss.option(form.Value, 'server_name', _('Server name'),
			_('The name of the XTCP proxy on the server side to connect to.'));
		o.rmempty = false;
		o.optional = false;

		o = ss.option(form.Value, 'bind_addr', _('Bind address'),
			_('The local address to bind for the visitor.'));
		o.datatype = 'ipaddr';
		o.rmempty = false;
		o.optional = false;

		o = ss.option(form.Value, 'bind_port', _('Bind port'),
			_('The local port to bind for the visitor.'));
		o.datatype = 'port';
		o.rmempty = false;
		o.optional = false;

		o = ss.option(form.Value, 'secret_key', _('Secret key'),
			_('Secret key for XTCP visitor authentication. Must match the XTCP proxy secret key.'));
		o.rmempty = true;
		o.modalonly = true;

		o = ss.option(form.Value, 'fallback_to', _('Fallback to'),
			_('Fallback to another visitor when the connection fails.'));
		o.rmempty = true;
		o.modalonly = true;

		addCommonProxyOptions(ss, { visitor: true });

		// ===== IOD Settings (legacy) =====
		o = s.taboption('iod', form.SectionValue, '_iod', form.GridSection, 'iod');
		ss = o.subsection;
		ss.addremove = true;
		ss.nodescriptions = true;

		o = ss.option(form.Flag, 'enabled', _('Enable'), _('Enable iod service.'));
		o.rmempty = false;
		o.default = '1';

		o = ss.option(form.Value, 'local_port', _('Local port'),
			_('Local port specifies the port to proxy to.'));
		o.datatype = 'port';
		o.rmempty = false;
		o.optional = false;

		o = ss.option(form.Value, 'remote_port', _('Remote Port'),
			_('Remote port specifies server-side port to proxy to.'));
		o.datatype = 'port';
		o.rmempty = false;
		o.optional = false;

		// ===== Plugin Settings =====
		o = s.taboption('plugin', form.SectionValue, '_plugin', form.GridSection, 'plugin');
		ss = o.subsection;
		ss.addremove = true;
		ss.nodescriptions = true;

		o = ss.option(form.ListValue, 'plugin_name', _('Plugin Name'),
			_('Specifies the name of remote xfrpc plugin.'));
		o.value('instaloader', _('instagram video downloader'));
		o.value('youtubedl', _('youtube video downloader'));
		o.optional = false;

		o = ss.option(form.ListValue, 'plugin_action', _('Plugin Action'),
			_('Specifies the action sending to remote xfrpc plugin.'));
		o.value('download', _('start download video'));
		o.value('stop', _('stop remote plugin service'));
		o.optional = false;

		o = ss.option(form.Value, 'plugin_param', _('Plugin Param'),
			_('Specifies the parameter sending to remote xfrpc plugin.'));
		o.rmempty = false;
		o.optional = true;
		o.depends('plugin_action', 'download');

		o = ss.option(form.Value, 'remote_port', _('Remote Port'),
			_('Remote port of plugin specifies the remote port of remote xfrpc plugin.'));
		o.datatype = 'port';
		o.rmempty = false;
		o.optional = false;

		ss.renderRowActions = function(section_id) {
			var tdEl = this.super('renderRowActions', [ section_id, _('Edit') ]);

			dom.content(tdEl.lastChild, [
				E('button', {
					'class': 'btn cbi-button cbi-button-next',
					'click': executePluginAction.bind(this, section_id),
					'title': _('Execute the plugin action'),
				}, _('Execute')),
				tdEl.lastChild.firstChild,
				tdEl.lastChild.lastChild
			]);

			return tdEl;
		};

		return m.render();
	}
});
