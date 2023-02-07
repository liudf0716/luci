'use strict';
'require view';
'require ui';
'require form';
'require rpc';
'require tools.widgets as widgets';

var callServiceList = rpc.declare({
	object: 'service',
	method: 'list',
	params: ['name'],
	expect: { '': {} }
});

function getServiceStatus() {
	return L.resolveDefault(callServiceList('chatgptd'), {}).then(function (res) {
		var isRunning = false;
		try {
			isRunning = res['chatgptd']['instances']['instance1']['running'];
		} catch (e) { }
		return isRunning;
	});
}

function renderStatus(isRunning) {
	var renderHTML = "";
	var spanTemp = '<em><span style="color:%s"><strong>%s %s</strong></span></em>';

	if (isRunning) {
		renderHTML += String.format(spanTemp, 'green', _("chatgptd插件"), _("RUNNING"));
	} else {
		renderHTML += String.format(spanTemp, 'red', _("chatgptd插件"), _("NOT RUNNING"));
	}

	return renderHTML;
}

return view.extend({
	render: function() {
		var m, s, o;

		m = new form.Map('chatgptd', _('chatgptd'));
		m.description = _("能访问chatgpt服务的功能插件.");

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
						_('加载中 ...'))
				])
			);
		}

		s = m.section(form.NamedSection, 'common', 'chatgptd');
		s.dynamic = true;

		// add tab
		s.tab('service', _('chatgpt服务'));
		s.tab('register', _('注册chatgpt账号助手'));

		// add bool option of enable to service tab
		o = s.taboption('service', form.Flag, 'enabled', _('启用chatgpt服务'));
		o.anonymous = true;
		o.optional = true;

		// add help information to register tab
		o = s.taboption('register', form.Value, 'virtual_sms', _('虚拟手机号注册'));
		o.rawhtml = true;
		o.value = '<a href="https://sms-activate.org/cn" target="_blank">支付宝充值0.5美元，选择印度手机号收验证码激活</a>';
		
		o = s.taboption('register', form.Value, 'register_chatgpt', _('注册登录'));
		o.rawhtml = true;
		o.value = '<a href="https://openai.com" target="_blank">注册登录chatgpt账号</a>';

		o = s.taboption('register', form.Value, 'visit_chatgpt', _('访问chatgpt服务'));
		o.rawhtml = true;
		o.value = '<a href="https://chat.openai.com" target="_blank">访问chatgpt服务</a>';

		// Donate addresss;
		s = m.section(form.TypedSection, "chatgptd", _("支持我们"), _("如果你喜欢这个服务，请给我买杯咖啡."));
		s.anonymous = true;
		// add contact information to s section
		o = s.option(form.Value, "donate", _("联系方式"));
		o.rawhtml = true;
		o.value = '<a href="https://jq.qq.com/?_wv=1027&k=MAAHFqR1" target="_blank">点击加入QQ群讨论</a>';
		// add picture to s section
		o = s.option(form.Value, "donate", _("支付宝"));
		o.rawhtml = true;
		o.value = '<img src="/luci-static/resources/view/chatgptd/alipay.png" width="200" height="200" />';
	
		return m.render();
	}
});
