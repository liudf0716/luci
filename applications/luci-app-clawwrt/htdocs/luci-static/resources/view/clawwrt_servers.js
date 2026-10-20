'use strict';
'require view';
'require rpc';
'require ui';
'require dom';

const callGetRouterSshKey = rpc.declare({
    object: 'luci.clawwrt',
    method: 'get_router_ssh_key',
    expect: { result: {} }
});

const callGetVpsServers = rpc.declare({
    object: 'luci.clawwrt',
    method: 'get_vps_servers',
    expect: { result: {} }
});

const callManageVpsServer = rpc.declare({
    object: 'luci.clawwrt',
    method: 'manage_vps_server',
    params: [ 'action', 'id', 'name', 'host', 'port', 'user' ],
    expect: { result: {} }
});

const callTestVpsServer = rpc.declare({
    object: 'luci.clawwrt',
    method: 'test_vps_server',
    params: [ 'id', 'host', 'port', 'user' ],
    expect: { result: {} }
});

const callDeployVpsFrps = rpc.declare({
    object: 'luci.clawwrt',
    method: 'deploy_vps_frps',
    params: [ 'vps_ip', 'vps_port', 'vps_user', 'bind_port', 'token', 'remote_web_port' ],
    expect: { result: {} }
});

const callDeployVpsXkcptun = rpc.declare({
    object: 'luci.clawwrt',
    method: 'deploy_vps_xkcptun',
    params: [ 'vps_ip', 'vps_port', 'vps_user', 'listen_port', 'key', 'mode', 'fec' ],
    expect: { result: {} }
});

const callUninstallVpsService = rpc.declare({
    object: 'luci.clawwrt',
    method: 'uninstall_vps_service',
    params: [ 'id', 'name', 'host', 'port', 'user', 'service' ],
    expect: { result: {} }
});

return view.extend({
    load: function() {
        return Promise.all([
            callGetRouterSshKey(),
            callGetVpsServers()
        ]);
    },

    render: function(data) {
        const keyInfo = data[0] || {};
        let currentKeyInfo = keyInfo;
        const serversData = data[1] || {};
        let serverList = serversData.servers || [];

        // Main Container
        const container = E('div', {
            'class': 'cbi-map clawwrt-servers-container',
            'style': 'max-width: 1080px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;'
        });

        // Styles
        const pageStyle = E('style', {}, `
            :root, .cbi-map.clawwrt-servers-container {
                --cws-bg-card: #ffffff;
                --cws-bg-secondary: #f8fafc;
                --cws-text-main: #0f172a;
                --cws-text-muted: #64748b;
                --cws-border: #e2e8f0;
                --cws-card-shadow: 0 4px 12px rgba(0,0,0,0.05);
                --cws-code-bg: #1e293b;
                --cws-code-text: #38bdf8;
            }

            @media (prefers-color-scheme: dark) {
                :root, .cbi-map.clawwrt-servers-container {
                    --cws-bg-card: #252526;
                    --cws-bg-secondary: #1e1e1e;
                    --cws-text-main: #cccccc;
                    --cws-text-muted: #94a3b8;
                    --cws-border: #3c3c3c;
                    --cws-card-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    --cws-code-bg: #18181b;
                    --cws-code-text: #38bdf8;
                }
            }

            body.dark, html[data-theme="dark"], .clawwrt-dark, [data-theme="dark"] .cbi-map.clawwrt-servers-container {
                --cws-bg-card: #252526;
                --cws-bg-secondary: #1e1e1e;
                --cws-text-main: #cccccc;
                --cws-text-muted: #94a3b8;
                --cws-border: #3c3c3c;
                --cws-card-shadow: 0 4px 12px rgba(0,0,0,0.3);
                --cws-code-bg: #18181b;
                --cws-code-text: #38bdf8;
            }

            .cws-card {
                background: var(--cws-bg-card);
                border: 1px solid var(--cws-border);
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: var(--cws-card-shadow);
            }

            .cws-badge {
                display: inline-flex;
                align-items: center;
                gap: 5px;
                padding: 3px 8px;
                border-radius: 6px;
                font-size: 11.5px;
                font-weight: 600;
            }
            .cws-badge-success { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }
            .cws-badge-warning { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }
            .cws-badge-danger  { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
            .cws-badge-neutral { background: rgba(100, 116, 139, 0.15); color: #94a3b8; border: 1px solid rgba(100, 116, 139, 0.3); }

            .cws-btn {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 7px 14px;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                border: 1px solid var(--cws-border);
                text-decoration: none;
                user-select: none;
            }
            .cws-btn-primary {
                background: #2563eb;
                color: #ffffff;
                border-color: #2563eb;
            }
            .cws-btn-primary:hover {
                background: #1d4ed8;
            }
            .cws-btn-secondary {
                background: var(--cws-bg-secondary);
                color: var(--cws-text-main);
            }
            .cws-btn-secondary:hover {
                border-color: #3b82f6;
            }
            .cws-btn-danger {
                background: rgba(239, 68, 68, 0.1);
                color: #ef4444;
                border-color: rgba(239, 68, 68, 0.3);
            }
            .cws-btn-danger:hover {
                background: #ef4444;
                color: #fff;
            }

            .cws-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 12px;
                font-size: 13px;
            }
            .cws-table th {
                text-align: left;
                padding: 10px 12px;
                color: var(--cws-text-muted);
                border-bottom: 1px solid var(--cws-border);
                font-weight: 600;
            }
            .cws-table td {
                padding: 12px;
                border-bottom: 1px solid var(--cws-border);
                color: var(--cws-text-main);
                vertical-align: middle;
            }
            .cws-table tr:hover td {
                background: var(--cws-bg-secondary);
            }

            .cws-code-box {
                background: var(--cws-code-bg);
                color: var(--cws-code-text);
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                font-size: 12px;
                padding: 12px 14px;
                border-radius: 8px;
                word-break: break-all;
                white-space: pre-wrap;
                line-height: 1.5;
                border: 1px solid var(--cws-border);
                margin: 8px 0;
            }
        `);
        container.appendChild(pageStyle);

        // Header Banner
        const header = E('div', {
            'style': 'display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: #fff; padding: 18px 24px; border-radius: 12px; margin-bottom: 18px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);'
        }, [
            E('div', { 'style': 'display: flex; align-items: center; gap: 14px;' }, [
                E('div', {
                    'style': 'width: 44px; height: 44px; border-radius: 10px; background: #3b82f6; display: flex; align-items: center; justify-content: center; font-size: 24px; box-shadow: 0 0 15px rgba(59,130,246,0.5);'
                }, '🖥️'),
                E('div', {}, [
                    E('div', { 'style': 'font-size: 20px; font-weight: 700; letter-spacing: -0.5px;' }, '远程免密服务器池 · Linux VPS'),
                    E('div', { 'style': 'font-size: 13px; color: #94a3b8; margin-top: 3px;' }, '配置并管理允许小茶 AI 助手免密 SSH 登录的云服务器，全自动接管内网穿透与网络加速服务端')
                ])
            ]),
            E('div', { 'style': 'display: flex; gap: 10px;' }, [
                E('a', {
                    'class': 'cws-btn cws-btn-secondary',
                    'href': L.url('admin/clawwrt/chat'),
                    'style': 'background: #334155; color: #f1f5f9; border: none;'
                }, '💬 返回 AI 对话'),
                E('button', {
                    'class': 'cws-btn cws-btn-secondary',
                    'style': 'background: #475569; color: #f1f5f9; border: none;',
                    'click': function() { refreshAll(); }
                }, '🔄 刷新状态')
            ])
        ]);
        container.appendChild(header);

        // Section 1: Router Public Key
        const keyCard = E('div', { 'class': 'cws-card' }, [
            E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;' }, [
                E('div', { 'style': 'font-size: 16px; font-weight: 700; color: var(--cws-text-main); display: flex; align-items: center; gap: 8px;' }, [
                    E('span', {}, '🔑'),
                    E('span', {}, '路由器专属 SSH 身份凭证 (Ed25519 椭圆曲线公钥)')
                ]),
                E('span', { 'class': 'cws-badge cws-badge-success' }, '🟢 本地就绪 · 高强度 Ed25519')
            ]),
            E('div', { 'style': 'font-size: 13px; color: var(--cws-text-muted); margin-bottom: 10px; line-height: 1.5;' },
                '小茶助手在连接远程 Linux 服务器时，使用路由器专属的非对称密钥进行身份认证。只需将下方的公钥或一键授权命令在您的远程服务器终端执行一次，即可建立免密授信。'
            ),
            E('div', { 'style': 'display: flex; flex-direction: column; gap: 10px;' }, [
                E('div', {}, [
                    E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;' }, [
                        E('div', { 'style': 'font-size: 12px; font-weight: 600; color: var(--cws-text-muted);' }, '🚀 推荐：一键授权命令（直接在 VPS 终端粘贴回车执行）:'),
                        E('span', { 'style': 'font-size: 11px; color: #3b82f6;' }, '指纹: ' + (keyInfo.fingerprint || 'Ed25519'))
                    ]),
                    E('div', {
                        'class': 'cws-code-box',
                        'id': 'auth-cmd-text',
                        'style': 'user-select: all; -webkit-user-select: all; cursor: text;',
                        'title': '点击可全选文本',
                        'click': function() {
                            var sel = window.getSelection();
                            var range = document.createRange();
                            range.selectNodeContents(this);
                            sel.removeAllRanges();
                            sel.addRange(range);
                        }
                    }, keyInfo.auth_cmd || '正在生成凭证...')
                ]),
                E('div', { 'style': 'display: flex; gap: 10px; align-items: center; flex-wrap: wrap;' }, [
                    E('button', {
                        'class': 'cws-btn cws-btn-primary',
                        'id': 'btn-copy-auth-cmd',
                        'click': function(e) {
                            var cmdEl = document.getElementById('auth-cmd-text');
                            var text = (currentKeyInfo && currentKeyInfo.auth_cmd) || (cmdEl ? cmdEl.innerText : '');
                            copyText(text, e.currentTarget || e.target, '已复制一键授权命令！');
                        }
                    }, '📋 复制一键授权命令'),
                    E('button', {
                        'class': 'cws-btn cws-btn-secondary',
                        'id': 'btn-copy-pubkey',
                        'click': function(e) {
                            var text = (currentKeyInfo && currentKeyInfo.pubkey) || '';
                            copyText(text, e.currentTarget || e.target, '已复制 Ed25519 公钥！');
                        }
                    }, '📋 仅复制公钥文本')
                ])
            ])
        ]);
        container.appendChild(keyCard);

        // Section 2: Add New Server
        const addCard = E('div', { 'class': 'cws-card' }, [
            E('div', { 'style': 'font-size: 16px; font-weight: 700; color: var(--cws-text-main); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;' }, [
                E('span', {}, '➕'),
                E('span', {}, '添加远程服务器 (VPS)')
            ]),
            E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-bottom: 16px;' }, [
                E('div', {}, [
                    E('label', { 'style': 'display: block; font-size: 12px; font-weight: 600; color: var(--cws-text-muted); margin-bottom: 6px;' }, '🏷️ 服务器别名 / 备注'),
                    E('input', {
                        'id': 'new-vps-name',
                        'type': 'text',
                        'placeholder': '例如：香港腾讯云、东京搬瓦工',
                        'style': 'width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--cws-border); background: var(--cws-bg-secondary); color: var(--cws-text-main); outline: none;'
                    })
                ]),
                E('div', {}, [
                    E('label', { 'style': 'display: block; font-size: 12px; font-weight: 600; color: var(--cws-text-muted); margin-bottom: 6px;' }, '🌐 服务器 IP 或域名 *'),
                    E('input', {
                        'id': 'new-vps-host',
                        'type': 'text',
                        'placeholder': '例如：43.154.20.10 或 vps.example.com',
                        'style': 'width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--cws-border); background: var(--cws-bg-secondary); color: var(--cws-text-main); outline: none;'
                    })
                ]),
                E('div', {}, [
                    E('label', { 'style': 'display: block; font-size: 12px; font-weight: 600; color: var(--cws-text-muted); margin-bottom: 6px;' }, '🔌 SSH 端口'),
                    E('input', {
                        'id': 'new-vps-port',
                        'type': 'number',
                        'value': '22',
                        'placeholder': '22',
                        'style': 'width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--cws-border); background: var(--cws-bg-secondary); color: var(--cws-text-main); outline: none;'
                    })
                ]),
                E('div', {}, [
                    E('label', { 'style': 'display: block; font-size: 12px; font-weight: 600; color: var(--cws-text-muted); margin-bottom: 6px;' }, '👤 登录用户名'),
                    E('input', {
                        'id': 'new-vps-user',
                        'type': 'text',
                        'value': 'root',
                        'placeholder': 'root (或具备sudo权限的用户)',
                        'style': 'width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--cws-border); background: var(--cws-bg-secondary); color: var(--cws-text-main); outline: none;'
                    })
                ])
            ]),
            E('div', { 'style': 'display: flex; gap: 10px; align-items: center;' }, [
                E('button', {
                    'id': 'btn-add-test',
                    'class': 'cws-btn cws-btn-primary',
                    'click': function() { addServer(true); }
                }, '⚡ 测试免密连接并保存'),
                E('button', {
                    'id': 'btn-add-save',
                    'class': 'cws-btn cws-btn-secondary',
                    'click': function() { addServer(false); }
                }, '💾 仅保存到服务器池')
            ]),
            E('div', { 'id': 'add-status-msg', 'style': 'margin-top: 10px; font-size: 12.5px; display: none;' })
        ]);
        container.appendChild(addCard);

        // Section 3: Server Pool Table
        const listCard = E('div', { 'class': 'cws-card' }, [
            E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;' }, [
                E('div', { 'style': 'font-size: 16px; font-weight: 700; color: var(--cws-text-main); display: flex; align-items: center; gap: 8px;' }, [
                    E('span', {}, '📋'),
                    E('span', {}, '已纳管的远程服务器池 (Server Pool)'),
                    E('span', { 'id': 'server-count-badge', 'class': 'cws-badge cws-badge-neutral' }, (serverList.length) + ' 台')
                ])
            ]),
            E('div', { 'id': 'server-list-container' }, [
                renderServerTable(serverList)
            ])
        ]);
        container.appendChild(listCard);

        // Section 4: AI Copilot Workflow Guidance
        const guideCard = E('div', { 'class': 'cws-card', 'style': 'background: linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(59,130,246,0.02) 100%);' }, [
            E('div', { 'style': 'font-size: 15px; font-weight: 700; color: #2563eb; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;' }, [
                E('span', {}, '🤖'),
                E('span', {}, '小茶 AI 助手如何使用这些服务器？')
            ]),
            E('div', { 'style': 'font-size: 13px; color: var(--cws-text-main); line-height: 1.6; margin-bottom: 10px;' },
                '当您在上方完成远程服务器的添加与免密授信后，小茶助手（ClawWRT Copilot）会自动将它们纳入可用集群。您可以直接在 AI 聊天对话框中下达自然语言指令：'
            ),
            E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px;' }, [
                renderPromptTip('🌐 自动内网穿透', '“帮我把这台路由器的 Web 80 端口穿透到 [香港腾讯云] 上”'),
                renderPromptTip('⚡ 部署服务端', '“在 [香港腾讯云] 上自动部署 frps 服务端并放行防火墙”'),
                renderPromptTip('📊 状态巡检', '“检查所有远程 VPS 的连接延迟与已部署服务状态”')
            ])
        ]);
        container.appendChild(guideCard);

        // Helper: Robust Copy Text (Supports both Secure HTTPS and Insecure HTTP context)
        function copyText(text, btnElement, successMsg) {
            if (!text || text.indexOf('正在生成') !== -1) {
                ui.addNotification(null, E('p', '公钥凭证尚未就绪，请稍候再试。'), 'warning');
                return;
            }

            var btn = (btnElement && btnElement.nodeType === 1) ? btnElement : null;
            if (btn && btn.tagName !== 'BUTTON' && btn.closest) {
                btn = btn.closest('button') || btn;
            }
            var origText = btn ? btn.innerText : '';

            var onCopySuccess = function() {
                if (btn) {
                    btn.innerText = '✅ ' + (successMsg || '复制成功！');
                    btn.style.setProperty('background', '#10b981', 'important');
                    btn.style.setProperty('color', '#ffffff', 'important');
                    btn.style.setProperty('border-color', '#10b981', 'important');
                    setTimeout(function() {
                        btn.innerText = origText;
                        btn.style.background = '';
                        btn.style.color = '';
                        btn.style.borderColor = '';
                    }, 2500);
                }
                ui.addNotification(null, E('p', successMsg || '已成功复制到剪贴板！'), 'info');
            };

            var execFallback = function() {
                var textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.setAttribute('readonly', '');
                textArea.style.position = 'fixed';
                textArea.style.left = '-9999px';
                textArea.style.top = '0';
                textArea.style.opacity = '0';
                textArea.style.pointerEvents = 'none';
                textArea.style.zIndex = '-1';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                textArea.setSelectionRange(0, textArea.value.length);
                var success = false;
                try {
                    success = document.execCommand('copy');
                } catch (e) {
                    success = false;
                }
                document.body.removeChild(textArea);

                if (success) {
                    onCopySuccess();
                } else {
                    ui.showModal('复制授权命令', [
                        E('p', '因浏览器 HTTP 环境限制自动写入，请直接全选并复制下方文本：'),
                        E('textarea', {
                            'class': 'cbi-input-textarea',
                            'style': 'width: 100%; height: 110px; font-family: monospace; font-size: 12px; margin-top: 8px;',
                            'readonly': 'readonly',
                            'click': function(ev) { ev.target.select(); }
                        }, text),
                        E('div', { 'class': 'right', 'style': 'margin-top: 12px;' }, [
                            E('button', {
                                'class': 'btn cbi-button-primary',
                                'click': ui.hideModal
                            }, '关闭')
                        ])
                    ]);
                }
            };

            if (window.isSecureContext && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                navigator.clipboard.writeText(text).then(onCopySuccess).catch(function() {
                    execFallback();
                });
            } else {
                execFallback();
            }
        }

        // Helper: Render Table
        function renderServerTable(list) {
            if (!list || list.length === 0) {
                return E('div', { 'style': 'padding: 30px; text-align: center; color: var(--cws-text-muted); font-size: 13px;' }, [
                    E('div', { 'style': 'font-size: 32px; margin-bottom: 8px;' }, '🍃'),
                    E('div', {}, '当前暂无纳管的远程服务器，请在上方添加您的第一台云服务器！')
                ]);
            }

            const tbody = E('tbody');
            list.forEach(srv => {
                const statusBadge = srv.status === 'connected' ?
                    E('span', { 'class': 'cws-badge cws-badge-success' }, '🟢 已连通 ' + (srv.rtt_ms ? `(${srv.rtt_ms})` : '')) :
                    (srv.status === 'failed' ?
                        E('span', { 'class': 'cws-badge cws-badge-danger', 'title': srv.message || '' }, '🔴 连接失败') :
                        E('span', { 'class': 'cws-badge cws-badge-neutral' }, '⚪ 待测试'));

                const sudoBadge = srv.user === 'root' ?
                    E('span', { 'class': 'cws-badge cws-badge-success' }, 'Root') :
                    (srv.has_sudo === '1' ?
                        E('span', { 'class': 'cws-badge cws-badge-success' }, srv.user + ' (免密Sudo)') :
                        E('span', { 'class': 'cws-badge cws-badge-warning', 'title': '需要输入密码sudo，建议配置NOPASSWD' }, srv.user + ' (需密码Sudo)'));

                const frpsBadge = srv.frps_status === 'running' ?
                    E('span', { 'class': 'cws-badge cws-badge-success' }, '🟢 运行中') :
                    (srv.frps_status === 'installed' ?
                        E('span', { 'class': 'cws-badge cws-badge-warning' }, '🟡 已安装未启动') :
                        E('span', { 'class': 'cws-badge cws-badge-neutral' }, '⚪ 未部署'));

                const xkcptunBadge = srv.xkcptun_status === 'running' ?
                    E('span', { 'class': 'cws-badge cws-badge-success' }, `🟢 运行中 (${srv.xkcptun_port || '9089'})`) :
                    (srv.xkcptun_status === 'installed' ?
                        E('span', { 'class': 'cws-badge cws-badge-warning' }, '🟡 已安装') :
                        E('span', { 'class': 'cws-badge cws-badge-neutral' }, '⚪ 未部署'));

                const tr = E('tr', {}, [
                    E('td', {}, [
                        E('div', { 'style': 'font-weight: 700; font-size: 14px;' }, srv.name || srv.host),
                        E('div', { 'style': 'font-size: 11.5px; color: var(--cws-text-muted); margin-top: 2px;' }, srv.last_check ? `上次检测: ${srv.last_check}` : '未检测')
                    ]),
                    E('td', {}, [
                        E('span', { 'style': 'font-family: monospace; font-size: 13px;' }, `${srv.host}:${srv.port}`)
                    ]),
                    E('td', {}, [ sudoBadge ]),
                    E('td', {}, [ statusBadge ]),
                    E('td', {}, [ frpsBadge ]),
                    E('td', {}, [ xkcptunBadge ]),
                    E('td', { 'style': 'text-align: right;' }, [
                        E('div', { 'style': 'display: inline-flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end;' }, [
                            E('button', {
                                'class': 'cws-btn cws-btn-secondary',
                                'title': '测试此服务器的免密 SSH 连接与运行状态',
                                'click': function(e) { testServer(srv.id, e.target); }
                            }, '⚡ 探测'),
                            E('button', {
                                'class': 'cws-btn cws-btn-secondary',
                                'title': '在此服务器上一键部署/更新 frps 内网穿透服务端',
                                'click': function() { openDeployModal(srv); }
                            }, '🌐 部署frps'),
                            (srv.frps_status === 'running' || srv.frps_status === 'installed') ? E('button', {
                                'class': 'cws-btn cws-btn-secondary',
                                'style': 'color: #f59e0b; border-color: rgba(245,158,11,0.4);',
                                'title': '在此服务器上停止并彻底卸载 frps 服务端',
                                'click': function(e) { uninstallService(srv, 'frps', e.target); }
                            }, '🛑 卸载frps') : null,
                            E('button', {
                                'class': 'cws-btn cws-btn-secondary',
                                'title': '在此服务器上一键通过 deb 安装部署 xkcptun 加速服务端',
                                'click': function() { openDeployXkcptunModal(srv); }
                            }, '🚀 部署加速(deb)'),
                            (srv.xkcptun_status === 'running' || srv.xkcptun_status === 'installed') ? E('button', {
                                'class': 'cws-btn cws-btn-secondary',
                                'style': 'color: #f59e0b; border-color: rgba(245,158,11,0.4);',
                                'title': '在此服务器上停止并彻底卸载 xkcptun 加速服务端 (deb)',
                                'click': function(e) { uninstallService(srv, 'xkcptun', e.target); }
                            }, '🛑 卸载加速') : null,
                            E('button', {
                                'class': 'cws-btn cws-btn-danger',
                                'title': '从服务器池中删除此服务器',
                                'click': function() { deleteServer(srv.id, srv.name); }
                            }, '🗑️')
                        ])
                    ])
                ]);
                tbody.appendChild(tr);
            });

            return E('div', { 'style': 'overflow-x: auto;' }, [
                E('table', { 'class': 'cws-table' }, [
                    E('thead', {}, [
                        E('tr', {}, [
                            E('th', {}, '服务器别名'),
                            E('th', {}, '主机与端口'),
                            E('th', {}, '登录身份'),
                            E('th', {}, '免密连通性'),
                            E('th', {}, 'frps 穿透'),
                            E('th', {}, 'xkcptun 加速 (deb)'),
                            E('th', { 'style': 'text-align: right;' }, '操作')
                        ])
                    ]),
                    tbody
                ])
            ]);
        }

        // Helper: Prompt Tip
        function renderPromptTip(title, prompt) {
            return E('div', {
                'style': 'background: var(--cws-bg-secondary); border: 1px solid var(--cws-border); border-radius: 8px; padding: 10px 12px;'
            }, [
                E('div', { 'style': 'font-size: 12px; font-weight: 700; color: var(--cws-text-muted); margin-bottom: 4px;' }, title),
                E('div', { 'style': 'font-size: 12.5px; color: var(--cws-text-main); font-style: italic;' }, prompt)
            ]);
        }

        // Actions: Add Server
        function addServer(runTest) {
            const name = (document.getElementById('new-vps-name').value || '').trim();
            const host = (document.getElementById('new-vps-host').value || '').trim();
            const port = (document.getElementById('new-vps-port').value || '22').trim();
            const user = (document.getElementById('new-vps-user').value || 'root').trim();
            const statusDiv = document.getElementById('add-status-msg');

            if (!host) {
                ui.addNotification(null, E('p', '请输入服务器 IP 或域名！'));
                return;
            }

            statusDiv.style.display = 'block';
            statusDiv.innerHTML = '<span style="color: #3b82f6;">正在保存服务器配置...</span>';

            callManageVpsServer('add', null, name, host, port, user).then(res => {
                if (res && res.success) {
                    const sid = res.id;
                    if (runTest) {
                        statusDiv.innerHTML = '<span style="color: #3b82f6;">已添加！正在发起免密 SSH 握手探测（最长 10 秒）...</span>';
                        callTestVpsServer(sid, host, port, user).then(tRes => {
                            if (tRes && tRes.connected) {
                                statusDiv.innerHTML = '<span style="color: #10b981; font-weight: 600;">🎉 验证成功！' + (tRes.message || '免密握手成功') + '</span>';
                            } else {
                                statusDiv.innerHTML = '<span style="color: #ef4444; font-weight: 600;">⚠️ 已添加，但免密测试失败: ' + ((tRes && tRes.message) || '连接超时') + '</span>';
                            }
                            refreshList();
                        });
                    } else {
                        statusDiv.innerHTML = '<span style="color: #10b981;">✅ 服务器已成功保存至服务器池！</span>';
                        refreshList();
                    }
                    // Reset inputs
                    document.getElementById('new-vps-name').value = '';
                    document.getElementById('new-vps-host').value = '';
                } else {
                    statusDiv.innerHTML = '<span style="color: #ef4444;">添加失败: ' + ((res && res.message) || '未知错误') + '</span>';
                }
            });
        }

        // Actions: Test Server
        function testServer(id, btn) {
            const orig = btn.innerText;
            btn.innerText = '⏳ 测试中...';
            btn.disabled = true;

            callTestVpsServer(id).then(res => {
                btn.innerText = orig;
                btn.disabled = false;
                if (res && res.connected) {
                    ui.addNotification(null, E('p', '🎉 探测成功！' + (res.message || '免密通道正常')));
                } else {
                    ui.addNotification(null, E('p', '⚠️ 探测失败: ' + ((res && res.message) || '无法连通')));
                }
                refreshList();
            }).catch(err => {
                btn.innerText = orig;
                btn.disabled = false;
                ui.addNotification(null, E('p', '测试出错: ' + err));
            });
        }

        // Actions: Delete Server
        function deleteServer(id, name) {
            if (!confirm(`确认要将服务器 [${name || id}] 从受信任服务器池中移除吗？`)) {
                return;
            }
            callManageVpsServer('delete', id).then(res => {
                if (res && res.success) {
                    ui.addNotification(null, E('p', '已成功移除该服务器。'));
                    refreshList();
                } else {
                    ui.addNotification(null, E('p', '删除失败: ' + ((res && res.message) || '未知错误')));
                }
            });
        }

        // Actions: Uninstall Service on VPS
        function uninstallService(srv, service, btn) {
            const svcTitle = service === 'xkcptun' ? 'xkcptun 弱网加速服务端 (deb)' : 'frps 内网穿透服务端';
            if (!confirm(`确认要在服务器 [${srv.name || srv.host}] 上彻底卸载 ${svcTitle} 并停用路由器本地客户端吗？\n\n此操作将停止远程 systemd 守护进程并清理相关配置。`)) {
                return;
            }
            const orig = btn.innerText;
            btn.innerText = '⏳ 卸载中...';
            btn.disabled = true;

            callUninstallVpsService(srv.id, srv.name, srv.host, srv.port, srv.user, service).then(res => {
                btn.innerText = orig;
                btn.disabled = false;
                if (res && res.success) {
                    ui.addNotification(null, E('p', '🎉 ' + (res.message || '卸载完成')));
                    refreshList();
                } else {
                    ui.addNotification(null, E('p', '⚠️ 卸载失败: ' + ((res && res.message) || '未知错误')));
                }
            }).catch(err => {
                btn.innerText = orig;
                btn.disabled = false;
                ui.addNotification(null, E('p', '卸载出错: ' + err));
            });
        }

        // Actions: Deploy Modal
        function openDeployModal(srv) {
            const defaultBindPort = 7001;
            const defaultWebPort = 18000;
            const autoToken = Math.random().toString(36).substring(2, 18);

            const modalContent = E('div', { 'style': 'padding: 10px;' }, [
                E('div', { 'style': 'font-size: 15px; font-weight: 700; margin-bottom: 8px;' }, `在 [${srv.name || srv.host}] 上自动部署 frps 服务端`),
                E('p', { 'style': 'font-size: 13px; color: var(--cws-text-muted); line-height: 1.5;' },
                    '小茶助手将通过已建立的免密 SSH 自动连接您的服务器，下载并安装最新版本 frps，配置 systemd 守护进程并自动启动放行。'
                ),
                E('div', { 'style': 'display: flex; flex-direction: column; gap: 10px; margin: 14px 0;' }, [
                    E('div', {}, [
                        E('label', { 'style': 'display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;' }, '穿透通信端口 (bind_port):'),
                        E('input', {
                            'id': 'm-bind-port',
                            'type': 'number',
                            'value': defaultBindPort,
                            'style': 'width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--cws-border);'
                        })
                    ]),
                    E('div', {}, [
                        E('label', { 'style': 'display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;' }, '预设远程 Web 映射起始端口:'),
                        E('input', {
                            'id': 'm-web-port',
                            'type': 'number',
                            'value': defaultWebPort,
                            'style': 'width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--cws-border);'
                        })
                    ]),
                    E('div', {}, [
                        E('label', { 'style': 'display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;' }, '穿透访问 Token 密钥:'),
                        E('input', {
                            'id': 'm-token',
                            'type': 'text',
                            'value': autoToken,
                            'style': 'width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--cws-border);'
                        })
                    ])
                ]),
                E('div', { 'id': 'm-deploy-status', 'style': 'font-size: 12.5px; margin-top: 10px;' }),
                E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px;' }, [
                    E('button', {
                        'class': 'cws-btn cws-btn-secondary',
                        'click': function() { ui.hideModal(); }
                    }, '取消'),
                    E('button', {
                        'id': 'btn-exec-deploy',
                        'class': 'cws-btn cws-btn-primary',
                        'click': function() {
                            const bPort = document.getElementById('m-bind-port').value;
                            const wPort = document.getElementById('m-web-port').value;
                            const tok = document.getElementById('m-token').value;
                            const statDiv = document.getElementById('m-deploy-status');
                            const execBtn = document.getElementById('btn-exec-deploy');

                            execBtn.disabled = true;
                            statDiv.innerHTML = '<span style="color: #3b82f6;">正在通过 SSH 登录服务器并自动化部署 frps 服务端（此过程大约需要 15-30 秒）...</span>';

                            callDeployVpsFrps(srv.host, srv.port, srv.user, bPort, tok, wPort).then(res => {
                                execBtn.disabled = false;
                                if (res && res.success) {
                                    statDiv.innerHTML = '<span style="color: #10b981; font-weight: 600;">🎉 部署成功！' + (res.message || '服务端已启动') + '</span>';
                                    setTimeout(() => {
                                        ui.hideModal();
                                        refreshList();
                                    }, 2000);
                                } else {
                                    statDiv.innerHTML = '<span style="color: #ef4444; font-weight: 600;">部署遇到错误: ' + ((res && res.message) || '未知失败') + '</span>';
                                }
                            }).catch(err => {
                                execBtn.disabled = false;
                                statDiv.innerHTML = '<span style="color: #ef4444;">请求出错: ' + err + '</span>';
                            });
                        }
                    }, '🚀 开始自动部署')
                ])
            ]);

            ui.showModal('一键部署 frps 服务端', modalContent);
        }

        // Actions: Deploy xkcptun (deb) Modal
        function openDeployXkcptunModal(srv) {
            const defaultPort = 9089;
            const autoKey = '7f7ac683d720e1437019692eadb0b811';

            const modalContent = E('div', { 'style': 'padding: 10px;' }, [
                E('div', { 'style': 'font-size: 15px; font-weight: 700; margin-bottom: 8px;' }, `在 [${srv.name || srv.host}] 上通过 deb 部署 xkcptun 服务端`),
                E('p', { 'style': 'font-size: 13px; color: var(--cws-text-muted); line-height: 1.5;' },
                    '小茶助手将通过免密 SSH 连接您的 Debian/Ubuntu VPS，自动拉取官方发布的 xkcptun-server deb 安装包，通过 dpkg 自动化安装、注册 systemd 守护服务并启动。同时路由器本地加速客户端将自动配置对端连通！'
                ),
                E('div', { 'style': 'display: flex; flex-direction: column; gap: 10px; margin: 14px 0;' }, [
                    E('div', {}, [
                        E('label', { 'style': 'display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;' }, 'KCP 服务端监听 UDP 端口 (listen_port):'),
                        E('input', {
                            'id': 'm-xkcp-port',
                            'type': 'number',
                            'value': defaultPort,
                            'style': 'width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--cws-border);'
                        })
                    ]),
                    E('div', {}, [
                        E('label', { 'style': 'display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;' }, '预共享认证密钥 (key):'),
                        E('input', {
                            'id': 'm-xkcp-key',
                            'type': 'text',
                            'value': autoKey,
                            'style': 'width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--cws-border); font-family: monospace;'
                        })
                    ]),
                    E('div', {}, [
                        E('label', { 'style': 'display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;' }, '加速模式 (mode):'),
                        E('select', {
                            'id': 'm-xkcp-mode',
                            'style': 'width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--cws-border);'
                        }, [
                            E('option', { 'value': 'fast3', 'selected': 'selected' }, 'fast3 (极速模式 - 适合抗高丢包)'),
                            E('option', { 'value': 'fast2' }, 'fast2 (进阶模式)'),
                            E('option', { 'value': 'fast' }, 'fast (快速模式)'),
                            E('option', { 'value': 'normal' }, 'normal (标准模式)')
                        ])
                    ]),
                    E('div', {}, [
                        E('label', { 'style': 'display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;' }, 'FEC 前向纠错:'),
                        E('select', {
                            'id': 'm-xkcp-fec',
                            'style': 'width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--cws-border);'
                        }, [
                            E('option', { 'value': '1', 'selected': 'selected' }, '开启 FEC (Reed-Solomon 10:3 冗余容错)'),
                            E('option', { 'value': '0' }, '关闭 FEC (节约流量)')
                        ])
                    ])
                ]),
                E('div', { 'id': 'm-xkcp-deploy-status', 'style': 'font-size: 12.5px; margin-top: 10px;' }),
                E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px;' }, [
                    E('button', {
                        'class': 'cws-btn cws-btn-secondary',
                        'click': function() { ui.hideModal(); }
                    }, '取消'),
                    E('button', {
                        'id': 'btn-exec-xkcp-deploy',
                        'class': 'cws-btn cws-btn-primary',
                        'click': function() {
                            const lPort = document.getElementById('m-xkcp-port').value;
                            const lKey = document.getElementById('m-xkcp-key').value;
                            const lMode = document.getElementById('m-xkcp-mode').value;
                            const lFec = document.getElementById('m-xkcp-fec').value;
                            const statDiv = document.getElementById('m-xkcp-deploy-status');
                            const execBtn = document.getElementById('btn-exec-xkcp-deploy');

                            execBtn.disabled = true;
                            statDiv.innerHTML = '<span style="color: #3b82f6;">正在通过 SSH 登录服务器，下载并安装 xkcptun-server deb 包（过程约 10~25 秒）...</span>';

                            callDeployVpsXkcptun(srv.host, srv.port, srv.user, lPort, lKey, lMode, lFec).then(res => {
                                execBtn.disabled = false;
                                if (res && res.success) {
                                    statDiv.innerHTML = '<span style="color: #10b981; font-weight: 600;">🎉 部署成功！' + (res.message || '服务端已启动') + '</span>';
                                    setTimeout(() => {
                                        ui.hideModal();
                                        refreshList();
                                    }, 2000);
                                } else {
                                    statDiv.innerHTML = '<span style="color: #ef4444; font-weight: 600;">部署遇到错误: ' + ((res && res.message) || '未知失败') + '</span>';
                                }
                            }).catch(err => {
                                execBtn.disabled = false;
                                statDiv.innerHTML = '<span style="color: #ef4444;">请求出错: ' + err + '</span>';
                            });
                        }
                    }, '🚀 一键安装部署 (deb)')
                ])
            ]);

            ui.showModal('一键部署 xkcptun 加速服务端 (deb)', modalContent);
        }

        // Helper: Refresh List
        function refreshList() {
            callGetVpsServers().then(res => {
                serverList = (res && res.servers) || [];
                const cont = document.getElementById('server-list-container');
                const badge = document.getElementById('server-count-badge');
                if (badge) badge.innerText = serverList.length + ' 台';
                if (cont) {
                    while (cont.firstChild) cont.removeChild(cont.firstChild);
                    cont.appendChild(renderServerTable(serverList));
                }
            });
        }

        // Helper: Refresh All
        function refreshAll() {
            callGetRouterSshKey().then(k => {
                currentKeyInfo = k || {};
                const cmdEl = document.getElementById('auth-cmd-text');
                if (cmdEl && k && k.auth_cmd) cmdEl.innerText = k.auth_cmd;
            });
            refreshList();
            ui.addNotification(null, E('p', '服务器池与密钥状态已刷新。'));
        }

        return container;
    },

    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
