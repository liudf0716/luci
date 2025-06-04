// SPDX: Apache-2.0
// Karl Palsson <karlp@etactica.com> 2021
'use strict';
'require form';
'require fs';
'require ui';
'require uci';
'require view';

var desc = _(""
    + "SNMPD is a master daemon/agent for SNMP, from the <a href='http://www.net-snmp.org'>"
    + "net-snmp project</a>. "
    + "Note, OpenWrt has mostly complete UCI support for snmpd, but this LuCI applet "
    + "only covers a few of those options. In particular, there is very little/no validation "
    + "or help. See /etc/config/snmpd for manual configuration."
);

return view.extend({
	handleDownload: function(ev) {
		return L.resolveDefault(fs.read_direct('/usr/share/snmp/mibs/DHLAB-MIB.txt'), null).then(function (res) {
			if (res) {
				var link = E('a', {
					'download': 'DHLAB-MIB.txt',
					'href': URL.createObjectURL(
						new Blob([ res ], { type: 'text/plain' })
					)
				});
				link.click();
				URL.revokeObjectURL(link.href);
			}
		}).catch(() => {
			ui.addNotification(null, E('p', {}, _('Download error') + ': ' + err.message));
		});
	},
	render: async function() {
		let m, s, o, t;

		m = new form.Map("snmpd", _("SNMPD"));

		s = m.section(form.TypedSection, "agent", _("Agent settings"));
		s.anonymous = true;
		o = s.option(form.Value, "agentaddress", _("The address the agent should listen on"),
			_("Eg: UDP:161, or UDP:10.5.4.3:161 to only listen on a given interface"));

		s = m.section(form.TypedSection, "agentx", _("AgentX settings"));
		s.anonymous = true;
		o = s.option(form.Value, "agentxsocket", _("The address the agent should allow AgentX connections to"),
			_("This is only necessary if you have subagents using the agentX "
			+ "socket protocol. Eg: /var/run/agentx.sock"));

		o = s.option(form.Button, 'dl_backup', _('DHLAB-MIB'));
		o.inputstyle = 'action important';
		o.inputtitle = _('Download');
		o.onclick = this.handleDownload;
		// s.addremove = true;

		// s = m.section(form.TypedSection, "com2sec", _("com2sec security"));
		// o = s.option(form.Value, "secname", "secname");
		// o = s.option(form.Value, "source", "source");
		// o = s.option(form.Value, "community", "community");

		// s = m.section(form.TypedSection, "group", "group", _("Groups help define access methods"));
		// s.addremove = true;
		// s.option(form.Value, "group", "group");
		// s.option(form.Value, "version", "version");
		// s.option(form.Value, "secname", "secname");

		// s = m.section(form.TypedSection, "access", "access");
		// s.option(form.Value, "group", "group");
		// s.option(form.Value, "context", "context");
		// s.option(form.Value, "version", "version");
		// s.option(form.Value, "level", "level");
		// s.option(form.Value, "prefix", "prefix");
		// s.option(form.Value, "read", "read");
		// s.option(form.Value, "write", "write");
		// s.option(form.Value, "notify", "notify");

		s = m.section(form.TypedSection, "system", _("System"), _("Values used in the MIB2 System tree"));
		s.anonymous = true;
		s.option(form.Value, "sysLocation", _("sys Location"));
		s.option(form.Value, "sysContact", _("Contact"));
		s.option(form.Value, "sysName", _("sysName"));

		// agentx 配置
		t = new form.Map("agentx");
		s = t.section(form.TypedSection, "trap", _("Trap settings"));
		s.anonymous = true;

		o = s.option(form.Value, "host", _("server Address"));
		o.datatype = "ip4addr";

		o = s.option(form.Value, "port", _("server Port"));
		o.datatype = "port";
		o.placeholder = 162;

		o = s.option(form.Value, "trap_interval", _("trap interval"), _("Time interval for continuous alarms"));
		o.datatype = "uinteger";
		o.placeholder = 600;

		o = s.option(form.Value, "check_interval", _("check interval"), _("Time interval for check task"));
		o.datatype = "uinteger";
		o.placeholder = 30;

		return Promise.all([m.render(), t.render()]).then(function(rendered) {
			const container = document.createElement('div');
			rendered.forEach(function(el) {
				container.appendChild(el);
			});

			return container;
		});
	}
});
