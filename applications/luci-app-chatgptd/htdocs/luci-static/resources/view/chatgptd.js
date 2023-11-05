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
		renderHTML += String.format(spanTemp, 'green', _("chatgptd插件"), _("运行中..."));
	} else {
		renderHTML += String.format(spanTemp, 'red', _("chatgptd插件"), _("停止运行..."));
	}

	return renderHTML;
}

function clearChatgptCookie() {
	window.localStorage.removeItem(Object.keys(window.localStorage).find(i=>i.startsWith('@@auth0spajs')));
	alert('清除成功');
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

		// add enabled option
		s = m.section(form.TypedSection, "chatgptd", _("配置"), _("是否启用chatgptd插件."));
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', _('启用'), _('启用或者禁用chatgptd插件.'));
		o.rmempty = false;


		// add form NamedSection to show some information to user
		// this section is not in chatgptd conf, so we need to add it manually
		s = m.section(form.TypedSection, "chatgptd", _("使用说明"), _("按照以下步骤使用chatgptd插件."));
		s = m.section(form.NamedSection, '_information');
		s.anonymous = true;
		s.render = function (section_id) {
			// the div is centered
			return E('div', { class: 'cbi-map', style: "text-align:center"},
				// add fieldset to show some information to user
				// and the fieldset is centered
				E('fieldset', { class: 'cbi-section'}, [
					// the content is centered
					E('a', { href: "https://sms-activate.org/cn", target: "_blank"}, [
						_('1. 点击本链接支付宝充值0.5美元，选择印度手机号收验证码激活'),
					]),
					E('br'),
					// add button to call a js function clearChatgptCookie
					// the button style color is red
					E('button', {
						'class': 'cbi-button cbi-button-apply',
						'click': clearChatgptCookie
					}, [
						_('注意：如果以前访问过chatgpt网站并被拒绝服务，请点击本按钮清空chatgpt缓存cookie')
					]),
					E('br'),
					E('a', { href: "https://openai.com", target: "_blank" }, [
						_('2. 点击本注册登录chatgpt账号'),
					]),
					E('br'),
					E('a', { href: "https://chat.openai.com", target: "_blank" }, [
						_('3. 点击本链接访问chatgpt服务'),
					]),
					E('br'),
					E('a', { href: "https://jq.qq.com/?_wv=1027&k=MAAHFqR1", target: "_blank" }, [
						_('4. 点击加入QQ群讨论如何使用'),
					]),
					E('br'),
					E('p', { style: "color:red" }, [
						_('5. 鼓励我们继续开发，一元两元都是爱'),
					]),
					E('br'),
					E('img', { src: "/luci-static/resources/view/alipay.png", width: "200", height: "200" }, [
						_('5. 鼓励我们继续开发'),
					]),
					E('br'),
					E('a', { href: "https://colab.research.google.com/", target: "_blank" }, [
						_('6. 点击本链接访问谷歌colab'),
					]),
					E('br'),
					E('a', { href: "https://dev.azure.com/liudf0716/chatgpt-tunnel/_build?definitionId=2&_a=summary", target: "_blank" }, [
						_('7. 点击本链接访问chatgpt-tunnel源码'),
					]),
				])
			);
		}
	
		return m.render();
	}
});
