'use strict';

'require rpc';
'require ui';
'require uci';
'require form';
'require poll';
'require view';

const callGetServiceDetail = rpc.declare({
    object: 'luci.clawwrt',
    method: 'get_service_detail',
    params: [ 'service' ],
    expect: { result: {} }
});

const callSetServiceDetail = rpc.declare({
    object: 'luci.clawwrt',
    method: 'set_service_detail',
    params: [ 'service', 'enabled', 'server_addr', 'server_port', 'key', 'token', 'mode', 'gateway', 'disable_portal_auth', 'wired_passed', 'auth_server_mode', 'fec', 'sndwnd', 'rcvwnd', 'datashard', 'parityshard', 'xkcp_dns', 'xkcp_tcp', 'ifname' ],
    expect: { result: {} }
});

const callGetWifiInfo = rpc.declare({
    object: 'luci.clawwrt',
    method: 'get_wifi_info',
    expect: { result: {} }
});

const callSetWifiConfig = rpc.declare({
    object: 'luci.clawwrt',
    method: 'set_wifi_config',
    params: [ 'band', 'ssid', 'key', 'enabled' ],
    expect: { result: {} }
});


function normalizeApiUrl(url) {
    if (!url) return 'https://api.deepseek.com/chat/completions';
    let u = url.trim().replace(/\/+$/, '');
    if (u.endsWith('/chat/completions')) return u;
    if (u.endsWith('/v1')) return u + '/chat/completions';
    return u + '/chat/completions';
}

const callGetQosStatus = rpc.declare({
    object: 'luci.clawwrt',
    method: 'get_qos_status',
    expect: { result: {} }
});

const callSetQosLimit = rpc.declare({
    object: 'luci.clawwrt',
    method: 'set_qos_limit',
    params: [ 'target', 'dl_mbps', 'ul_mbps', 'weekdays', 'timestart', 'timestop' ],
    expect: { result: {} }
});

const callGetL7Top = rpc.declare({
    object: 'luci.clawwrt',
    method: 'get_l7_top',
    expect: { result: {} }
});

const callGetRouterSummary = rpc.declare({
    object: 'luci.clawwrt',
    method: 'get_router_summary',
    expect: { result: {} }
});

const callListClients = rpc.declare({
    object: 'luci.clawwrt',
    method: 'list_clients',
    expect: { result: {} }
});

const callGetServicesStatus = rpc.declare({
    object: 'luci.clawwrt',
    method: 'get_services_status',
    expect: { result: {} }
});

const callRunDiagnostics = rpc.declare({
    object: 'luci.clawwrt',
    method: 'run_diagnostics',
    params: [ 'action', 'target' ],
    expect: { result: {} }
});

const callUciRead = rpc.declare({
    object: 'luci.clawwrt',
    method: 'uci_read',
    params: [ 'package' ],
    expect: { result: {} }
});

const callUciApply = rpc.declare({
    object: 'luci.clawwrt',
    method: 'uci_apply',
    params: [ 'package', 'section', 'option', 'value', 'reload_service' ],
    expect: { result: {} }
});

const callGetAiSettings = rpc.declare({
    object: 'luci.clawwrt',
    method: 'get_ai_settings',
    expect: { result: {} }
});

const callSaveAiSettings = rpc.declare({
    object: 'luci.clawwrt',
    method: 'save_ai_settings',
    params: [ 'api_key', 'model', 'api_url', 'temperature' ],
    expect: { result: {} }
});

const callDeepseekProxy = rpc.declare({
    object: 'luci.clawwrt',
    method: 'call_deepseek',
    params: [ 'messages_json', 'tools_json' ],
    expect: { result: {} }
});

const callGetHwOffloadStatus = rpc.declare({
    object: 'luci.clawwrt',
    method: 'get_hw_offload_status',
    expect: { result: {} }
});

const callSetHwOffload = rpc.declare({
    object: 'luci.clawwrt',
    method: 'set_hw_offload',
    params: [ 'enabled', 'mode' ],
    expect: { result: {} }
});

const callGetRouterSshKey = rpc.declare({
    object: 'luci.clawwrt',
    method: 'get_router_ssh_key',
    expect: { result: {} }
});

const callTestVpsSsh = rpc.declare({
    object: 'luci.clawwrt',
    method: 'test_vps_ssh',
    params: [ 'vps_ip', 'vps_port', 'vps_user' ],
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

const callGetPenetrationStatus = rpc.declare({
    object: 'luci.clawwrt',
    method: 'get_penetration_status',
    expect: { result: {} }
});

const callManageXdnsDomain = rpc.declare({
    object: 'luci.clawwrt',
    method: 'manage_xdns_domain',
    params: [ 'action', 'domain' ],
    expect: { result: {} }
});

const callManagePortalAccess = rpc.declare({
    object: 'luci.clawwrt',
    method: 'manage_portal_access',
    params: [ 'action', 'mac', 'domain', 'target', 'feature', 'value' ],
    expect: { result: {} }
});

const callManagePortalWhitelist = rpc.declare({
    object: 'luci.clawwrt',
    method: 'manage_portal_whitelist',
    params: [ 'action', 'mac' ],
    expect: { result: {} }
});

const callManagePenetrationProxy = rpc.declare({
    object: 'luci.clawwrt',
    method: 'manage_penetration_proxy',
    params: [ 'action', 'rule_name', 'proxy_type', 'local_ip', 'local_port', 'remote_port', 'subdomain', 'custom_domains', 'use_encryption', 'use_compression' ],
    expect: { result: {} }
});

const callManageXkcptunTunnel = rpc.declare({
    object: 'luci.clawwrt',
    method: 'manage_xkcptun_tunnel',
    params: [ 'action', 'tunnel_name', 'proto', 'proxy_type', 'local_port', 'local_interface', 'target_addr', 'target_port', 'enabled' ],
    expect: { result: {} }
});

const routerTools = [
    {
        type: 'function',
        function: {
            name: 'get_penetration_status',
            description: '深度检测内网穿透（xfrpc）的真实运行状况与连通性：不仅检测客户端进程是否存活，还会通过底层网络套接字检测是否真正与远端 frps 服务端建立了 ESTABLISHED 状态的连接、套接字状态（如 SYN_SENT 握手超时、断开等）、内核实时日志报错、当前生效的穿透映射规则及对应的公网访问链接',
            parameters: { type: 'object', properties: {} }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_router_summary',
            description: '获取当前路由器的系统负载、内存剩余、WAN/LAN IP、硬件型号、内核版本等基础信息',
            parameters: { type: 'object', properties: {} }
        }
    },
    {
        type: 'function',
        function: {
            name: 'list_clients',
            description: '列出当前连接到路由器的所有终端设备列表（包括主机名、IP地址、MAC地址）',
            parameters: { type: 'object', properties: {} }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_services_status',
            description: '检查路由器的核心服务运行状态，包括：wifidogx (门户认证与云端连接), xkcptun (网络加速与活跃连接数), xfrpc (内网穿透与连通性), xdns (智能分流与eBPF挂载), firewall (防火墙)',
            parameters: { type: 'object', properties: {} }
        }
    },
    {
        type: 'function',
        function: {
            name: 'run_diagnostics',
            description: '在路由器本地执行网络诊断，如 ping 测试外网延迟与丢包率，或 nslookup 域名解析测试',
            parameters: {
                type: 'object',
                properties: {
                    action: { type: 'string', enum: ['ping', 'nslookup', 'route'], description: '诊断动作类型' },
                    target: { type: 'string', description: '测试目标，如 223.5.5.5 或 github.com' }
                },
                required: ['action']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'uci_read',
            description: '读取指定的路由器 UCI 配置文件内容（如 xkcptun, xfrpc, xdns, network, firewall）',
            parameters: {
                type: 'object',
                properties: {
                    package: { type: 'string', description: '配置包名称，如 xkcptun, xfrpc, xdns, network, firewall' }
                },
                required: ['package']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'propose_uci_change',
            description: '向用户提议修改某项配置，前端将渲染可视化对比卡片让用户点击确认授权，不会私自直接修改',
            parameters: {
                type: 'object',
                properties: {
                    package: { type: 'string', description: '配置包名，如 xkcptun, xfrpc, xdns, network, firewall' },
                    section: { type: 'string', description: '节区名，如 common 或 main' },
                    option: { type: 'string', description: '选项名，如 enabled, server_addr, local_port' },
                    value: { type: 'string', description: '要修改的新值' },
                    reload_service: { type: 'string', description: '修改后需要重载的服务名称，如 xkcptun, xfrpc, xdns, firewall' },
                    explanation: { type: 'string', description: '本次修改的目的与预期效果说明' }
                },
                required: ['package', 'section', 'option', 'value', 'explanation']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_service_detail',
            description: '获取路由器具体核心服务的详细配置与深层运行遥测指标：服务包括 wifidogx (门户认证与在线用户), xfrpc (内网穿透与连通性), xkcptun (网络加速：包含加速节点往返延迟 ping_ms、FEC 抗丢包模式、窗口大小、所有加速隧道列表及其端口/转发目标与活跃连接数), xdns (智能分流：包含内核 TC-eBPF 挂载状态、DNS 拦截/代理统计、已学习的动态劫持 IP 表及其 TTL 过期时间、当前活跃透明代理 TCP 会话、加速域名表及内核激活状态), ipsec (StrongSwan VPN)',
            parameters: {
                type: 'object',
                properties: {
                    service: { type: 'string', enum: ['wifidogx', 'xfrpc', 'xkcptun', 'xdns', 'ipsec'], description: '服务名称' }
                },
                required: ['service']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'propose_service_config',
            description: '向用户提议修改具体服务的运行参数或开关，前端将渲染可视化配置授权卡片让用户点击确认，不会私自直接修改',
            parameters: {
                type: 'object',
                properties: {
                    service: { type: 'string', enum: ['wifidogx', 'xfrpc', 'xkcptun', 'xdns', 'ipsec'], description: '服务名称' },
                    enabled: { type: 'string', enum: ['0', '1'], description: '是否启用服务 (1启用, 0停用)' },
                    server_addr: { type: 'string', description: '服务器地址 (用于 xfrpc / xkcptun)' },
                    server_port: { type: 'string', description: '服务器端口 (用于 xfrpc / xkcptun)' },
                    key: { type: 'string', description: '加速密钥或 IPsec 预共享密钥' },
                    token: { type: 'string', description: '认证 Token (用于 xfrpc)' },
                    mode: { type: 'string', description: '加速模式 (用于 xkcptun, 如 fast3, fast2, normal)' },
                    fec: { type: 'string', enum: ['0', '1'], description: '是否开启前向纠错 FEC 抗丢包 (用于 xkcptun)' },
                    sndwnd: { type: 'string', description: '发送窗口大小 (用于 xkcptun, 如 1024, 2048, 4096)' },
                    rcvwnd: { type: 'string', description: '接收窗口大小 (用于 xkcptun, 如 1024, 2048, 4096)' },
                    datashard: { type: 'string', description: 'FEC 数据分片数 (用于 xkcptun, 如 10)' },
                    parityshard: { type: 'string', description: 'FEC 校验分片数 (用于 xkcptun, 如 3)' },
                    xkcp_dns: { type: 'string', description: 'DNS 加速重定向端点 (用于 xdns, 如 192.168.8.1:5353)' },
                    xkcp_tcp: { type: 'string', description: 'TCP 加速重定向透明代理端点 (用于 xdns, 如 192.168.8.1:12345)' },
                    gateway: { type: 'string', description: '对端网关 IP/域名 (用于 ipsec)' },
                    disable_portal_auth: { type: 'string', enum: ['0', '1'], description: '是否免认证直通 (用于 wifidogx)' },
                    wired_passed: { type: 'string', enum: ['0', '1'], description: '有线设备是否免认证 (用于 wifidogx)' },
                    auth_server_mode: { type: 'string', enum: ['cloud', 'local'], description: '认证模式 (用于 wifidogx: cloud 云端认证, local 本地认证)' },
                    explanation: { type: 'string', description: '修改原因与影响说明' }
                },
                required: ['service', 'explanation']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'manage_xdns_domain',
            description: '管理内核 eBPF 智能分流（xdns）：查看所有加速域名及内核激活状态（action: "list"）；新增分流加速域名（action: "add"）；删除分流加速域名（action: "remove"）；清空内核动态分流 IP 缓存（action: "clear_ips"）；从持久化文件全量重载规则至内核并重置缓存（action: "reload"）；查看当前内核动态劫持加速 IP 表及过期时间（action: "list_ips"）；查看当前活跃透明代理 TCP 会话（action: "list_sessions"）；获取实时拦截与分流统计数据（action: "stats"）。注意：查询类操作（list/list_ips/list_sessions/stats）直接执行返回，配置变更类操作（add/remove/clear_ips/reload）将渲染可视化卡片供用户授权确认。',
            parameters: {
                type: 'object',
                properties: {
                    action: { 
                        type: 'string', 
                        enum: ['list', 'add', 'remove', 'clear_ips', 'reload', 'list_ips', 'list_sessions', 'stats'], 
                        description: '操作类型：list(查看所有加速域名及内核状态), add(添加域名), remove(删除域名), clear_ips(清空动态分流IP缓存), reload(重载分流规则并清缓存), list_ips(查看动态劫持IP列表), list_sessions(查看活跃透明代理TCP会话), stats(拦截统计)' 
                    },
                    domain: { type: 'string', description: '要添加或删除的域名，如 claude.ai 或 gemini.google.com（add 或 remove 时必填）' },
                    explanation: { type: 'string', description: '操作原因与影响说明（对查询操作可选）' }
                },
                required: ['action']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'manage_xkcptun_tunnel',
            description: '管理网络加速（xkcptun）的具体传输隧道：支持列出所有加速隧道、运行协议与实时活跃连接数（action: "list"）；新增或修改加速隧道（action: "add"，可配置透明代理 redir、端口转发 forward、SOCKS5 等代理类型，指定本地端口 local_port 与目标地址 target_addr:target_port）；启用隧道（action: "enable"）；临时停用/禁用隧道（action: "disable"）；删除加速隧道（action: "remove"）。注意：添加、修改、启停或删除操作属于配置变更，前端将渲染可视化卡片供用户授权确认。',
            parameters: {
                type: 'object',
                properties: {
                    action: { type: 'string', enum: ['list', 'add', 'remove', 'enable', 'disable'], description: '操作类型：list(查看所有隧道), add(新增/修改隧道), remove(删除隧道), enable(启用隧道), disable(禁用隧道)' },
                    tunnel_name: { type: 'string', description: '隧道名称（如 redir_tunnel, dns_tunnel, ssh_tunnel, game_tunnel）' },
                    proto: { type: 'string', enum: ['tcp', 'udp'], description: '传输协议，默认为 tcp' },
                    proxy_type: { type: 'string', enum: ['redir', 'forward', 'socks5'], description: '代理类型：redir(透明代理重定向), forward(端口转发), socks5(SOCKS5服务)' },
                    local_port: { type: 'string', description: '本地监听端口，如 12345, 5353, 8022' },
                    local_interface: { type: 'string', description: '本地监听网卡接口，默认为 any 或 br-lan' },
                    target_addr: { type: 'string', description: '转发目标 IP/域名（forward 代理模式必填，如 8.8.8.8 或 127.0.0.1）' },
                    target_port: { type: 'string', description: '转发目标端口（forward 代理模式必填，如 53 或 27334）' },
                    explanation: { type: 'string', description: '操作的原因与影响说明' }
                },
                required: ['action']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'manage_portal_access',
            description: '管理门户认证（wifidogx / apfree-wifidog）的核心功能：查看在线认证用户列表与黑白名单（action: "list"）；添加免认证白名单 MAC（action: "add_whitelist"）；移除免认证白名单 MAC（action: "del_whitelist"）；将终端 MAC 加入黑名单拉黑并立即强制阻断（action: "add_blacklist"）；将终端移除黑名单（action: "del_blacklist"）；将指定终端强制踢下线并清除认证状态（action: "kick_client"，参数 target 为 MAC 或 IP）；添加免认证放行域名或通配符域名（action: "add_domain"，如 *.apple.com 或 qq.com）；删除免认证放行域名（action: "del_domain"）。注意：除了 list 以外的操作均需渲染交互卡片供用户点击确认授权。',
            parameters: {
                type: 'object',
                properties: {
                    action: { 
                        type: 'string', 
                        enum: ['list', 'add_whitelist', 'del_whitelist', 'add_blacklist', 'del_blacklist', 'kick_client', 'add_domain', 'del_domain'], 
                        description: '操作类型：list(查看在线用户及黑白名单/域名), add_whitelist(添加免认证白名单), del_whitelist(移除白名单), add_blacklist(拉黑终端并阻断), del_blacklist(解除拉黑), kick_client(踢下线重认证), add_domain(放行免认证域名/通配符域名), del_domain(移除放行域名)' 
                    },
                    mac: { type: 'string', description: '终端设备的 MAC 地址（用于白名单或黑名单操作，如 aa:bb:cc:dd:ee:ff）' },
                    target: { type: 'string', description: '操作目标终端的 MAC 或 IP 地址（用于 kick_client 强制踢下线）' },
                    domain: { type: 'string', description: '放行免认证域名或通配符域名（如 www.apple.com 或 *.apple.com）' },
                    explanation: { type: 'string', description: '向用户通俗解释本次调整的目的与影响' }
                },
                required: ['action']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'manage_portal_whitelist',
            description: '管理门户认证（wifidogx）的免认证终端 MAC 白名单。白名单内的手机或电脑无需进行网页登录即可直接上网。支持列出所有白名单 MAC（action: "list"）；或者添加终端 MAC（action: "add"）或删除终端 MAC（action: "remove"）。注意：添加或删除操作属于配置变更，前端将渲染可视化卡片供用户点击确认授权。',
            parameters: {
                type: 'object',
                properties: {
                    action: { type: 'string', enum: ['list', 'add', 'remove'], description: '操作类型：list(查看白名单), add(添加白名单), remove(删除白名单)' },
                    mac: { type: 'string', description: '终端的 MAC 地址，格式形如 aa:bb:cc:dd:ee:ff（add 或 remove 时必填）' },
                    explanation: { type: 'string', description: '添加或删除的原因说明（对 list 可选）' }
                },
                required: ['action']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'manage_penetration_proxy',
            description: '管理内网穿透（xfrpc）的具体端口映射规则：支持列出所有映射规则（action: "list"）；新增或修改映射规则（action: "add"，可将局域网内任意 IP:端口通过 TCP/UDP/HTTP/HTTPS/SOCKS5 映射到公网远程端口、自定义域名 custom_domains 或远程子域名 subdomain）；临时停用/禁用规则（action: "disable"）；重新启用规则（action: "enable"）；删除映射规则（action: "remove"）。注意：添加、修改、启停或删除操作属于配置变更，前端将渲染可视化卡片供用户确认。',
            parameters: {
                type: 'object',
                properties: {
                    action: { type: 'string', enum: ['list', 'add', 'remove', 'enable', 'disable'], description: '操作类型：list(查看所有规则), add(新增/修改规则), remove(删除规则), enable(启用规则), disable(禁用规则)' },
                    rule_name: { type: 'string', description: '规则名称（英文数字下划线，如 aw_ssh, nas_web, game_udp）' },
                    proxy_type: { type: 'string', enum: ['tcp', 'udp', 'http', 'https', 'socks5'], description: '协议类型，默认为 tcp' },
                    local_ip: { type: 'string', description: '局域网目标设备 IP，默认 127.0.0.1' },
                    local_port: { type: 'string', description: '本地服务端口，如 22, 80, 8080, 53（socks5 代理可不填）' },
                    remote_port: { type: 'string', description: '公网远程端口（TCP/UDP/SOCKS5 映射必填，如 18022）' },
                    subdomain: { type: 'string', description: '远程子域名（HTTP/HTTPS 映射可选，如 router）' },
                    custom_domains: { type: 'string', description: '自定义域名（HTTP/HTTPS 映射可选，如 nas.example.com，多个用空格分隔）' },
                    use_encryption: { type: 'boolean', description: '是否对传输流量启用加密' },
                    use_compression: { type: 'boolean', description: '是否对传输流量启用压缩' },
                    explanation: { type: 'string', description: '操作的原因与影响说明' }
                },
                required: ['action']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_wifi_info',
            description: '获取当前路由器的无线 WiFi 状态、频段 (2.4G/5G)、SSID 名称和密码',
            parameters: { type: 'object', properties: {} }
        }
    },
    {
        type: 'function',
        function: {
            name: 'propose_wifi_config',
            description: '向用户提议修改 WiFi 无线网络配置（名称或密码），前端将渲染授权卡片供用户确认，不会私自直接修改',
            parameters: {
                type: 'object',
                properties: {
                    band: { type: 'string', enum: ['all', '2g', '5g'], description: '要修改的频段，默认为 all (双频同步修改)' },
                    ssid: { type: 'string', description: '新 WiFi 名称 (SSID)' },
                    key: { type: 'string', description: '新 WiFi 密码 (至少8位)' },
                    explanation: { type: 'string', description: '修改原因说明' }
                },
                required: ['explanation']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_qos_status',
            description: '查询路由器当前基于内核 eBPF 的实时设备流量与智能流控状态：包括各连接设备的实时下行/上行速率（以 Mbps 及 MB/s 呈现）、MAC 地址、主机名、累计上下行流量、当前限速规则（Mbps）及定时限速时段，以及 eBPF 引擎运行状态、FastPath 硬件加速与 xDPI L7 识别状态',
            parameters: { type: 'object', properties: {} }
        }
    },
    {
        type: 'function',
        function: {
            name: 'propose_qos_limit',
            description: '向用户提议对指定设备设置或解除基于内核 eBPF 的智能流控限速规则（支持按 IP、MAC 或 "all" 全局限速，支持限制下行/上行带宽，支持定时限速时段如 weekdays/timestart/timestop，输入 0 表示解除限速）。前端将渲染流控确认卡片供用户授权确认，不可私自直接修改',
            parameters: {
                type: 'object',
                properties: {
                    target: { type: 'string', description: '目标设备的 IP 地址（如 192.168.8.141）、MAC 地址（如 c2:5f:a4:5c:c9:8f）或 "all"（全网所有设备）' },
                    hostname: { type: 'string', description: '设备主机名（如已知）' },
                    dl_mbps: { type: 'integer', description: '允许的最大下行/下载速率（Mbps），0 代表不限速/解除限速' },
                    ul_mbps: { type: 'integer', description: '允许的最大上行/上传速率（Mbps），0 代表不限速/解除限速' },
                    weekdays: { type: 'string', description: '可选：生效星期，如 "Mon,Tue,Wed,Thu,Fri" 或 "1-5" 或 "workdays"' },
                    timestart: { type: 'string', description: '可选：每天生效开始时间，如 "21:00"' },
                    timestop: { type: 'string', description: '可选：每天生效结束时间，如 "23:00"' },
                    explanation: { type: 'string', description: '流控限制或调整的原因说明' }
                },
                required: ['target', 'explanation']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_l7_top',
            description: '查询路由器基于内核 eBPF DPI 统计的：1. L7 应用协议实时流速 Top 10 排行榜（含中文说明，如 SSH 远程管理、HTTP 网页、WebRTC 实时通话、微信、DNS 等即时流速与累计流量）；2. 全网即时流速 Top 10 服务/域名（含中文名称，如 Google、B站、ChatGPT、X/推特等）；3. 高频访问域名 Top 10（含中文名称及访问次数）',
            parameters: { type: 'object', properties: {} }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_hw_offload_status',
            description: '查询路由器硬件加速（MediaTek PPE 芯片级硬件 NAT 转发加速 / flow offload 硬件流表分流）的实时开关状态、内核流表运行状态及当前活跃加速流统计',
            parameters: { type: 'object', properties: {} }
        }
    },
    {
        type: 'function',
        function: {
            name: 'propose_hw_offload',
            description: '向用户提议开启或关闭路由器的硬件加速（MediaTek PPE 硬件 NAT 流分流）。前端将渲染硬件加速授权卡片供用户点击确认，不会私自直接修改',
            parameters: {
                type: 'object',
                properties: {
                    enabled: { type: 'string', enum: ['0', '1'], description: '是否开启硬件加速 (1开启, 0关闭)' },
                    mode: { type: 'string', enum: ['hw', 'sw', 'off'], description: '加速模式：hw(开启硬件加速), sw(仅软件加速), off(完全关闭加速)' },
                    explanation: { type: 'string', description: '开启或关闭硬件加速的原因与影响说明（例如：开启可显著降低千兆转发时的 CPU 占用；关闭可让所有流量走标准协议栈便于精确排障等）' }
                },
                required: ['enabled', 'explanation']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_router_ssh_key',
            description: '查询本台路由器的专属 SSH 免密公钥，并生成在用户 VPS 上执行的一键授权命令',
            parameters: { type: 'object', properties: {} }
        }
    },
    {
        type: 'function',
        function: {
            name: 'propose_vps_penetration',
            description: '向用户提议使用 SSH 免密登录自动在用户自有的 Linux VPS 上部署 frps 服务端，并自动配置路由器客户端 xfrpc 建立双端穿透隧道。前端将渲染免密授权与部署卡片供用户确认，不可私自直接修改',
            parameters: {
                type: 'object',
                properties: {
                    vps_ip: { type: 'string', description: '用户提供的云服务器 (VPS) 公网 IP 地址' },
                    vps_user: { type: 'string', description: 'VPS 的登录用户名，如 root, ubuntu, debian, ec2-user 等，默认为 root' },
                    vps_port: { type: 'string', description: 'VPS 的 SSH 端口，默认为 22' },
                    remote_web_port: { type: 'string', description: '穿透后在外网访问路由器 Web 界面的远程端口，默认 18000' },
                    explanation: { type: 'string', description: '部署方案与影响说明' }
                },
                required: ['explanation']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'propose_vps_xkcptun',
            description: '向用户提议使用 SSH 免密登录自动在用户自有的 Linux VPS 上通过官方 deb 软件包安装部署 xkcptun 服务端 (xkcp_server)，并自动配置路由器客户端 xkcptun 建立弱网加速。前端将渲染免密授权与部署卡片供用户确认，不可私自直接修改',
            parameters: {
                type: 'object',
                properties: {
                    vps_ip: { type: 'string', description: '用户提供的云服务器 (VPS) 公网 IP 地址' },
                    vps_user: { type: 'string', description: 'VPS 的登录用户名，如 root, ubuntu, debian 等，默认为 root' },
                    vps_port: { type: 'string', description: 'VPS 的 SSH 端口，默认为 22' },
                    listen_port: { type: 'string', description: 'xkcptun 服务端监听的 UDP 端口，默认 9089' },
                    mode: { type: 'string', description: '加速模式 (fast3 / fast2 / fast / normal)，默认 fast3' },
                    explanation: { type: 'string', description: '部署方案与影响说明' }
                },
                required: ['explanation']
            }
        }
    }

];

const systemPrompt = `你是一个专业的 OpenWrt / chaWrt 路由器专属 AI 助手——「小茶助手」🍵（运行于 chaWrt 路由器本地）。你的名字源于 chaWrt 中的 cha（茶），寓意让网络管理如烹茶品茗般从容自然、清爽高效。
你的首要核心职责是帮助普通用户实时排查和确保路由器能否正常上网，解答网络故障，管理连接设备，让用户无需理解复杂的网络协议与 LuCI 表单。
你可以使用提供的工具直接在路由器本地查询状态、列出连接设备、测试网络连通性、查看配置。

工作原则：
1. 【只读操作自主执行】：当用户询问是否能正常上网、网络是否卡顿、连了哪些设备、或者排查故障时，自主调用工具获取事实数据，结论先行，不要胡乱猜测。
2. 【配置修改强安全原则】：凡涉及修改路由器配置、WiFi、流控限速、开关硬件加速或在 VPS 上部署穿透服务端的意图，必须通过提议工具（propose_uci_change, propose_service_config, propose_wifi_config, propose_qos_limit, propose_hw_offload, propose_vps_penetration）生成提议卡片，向用户通俗解释修改目的与影响，由用户在界面中点击确认授权。严禁在未经用户确认时宣称已完成修改！
3. 【核心扩展服务与流控能力】：
   - 内网穿透与 VPS 自动化部署 (xfrpc & frps)：纯 C 高性能穿透，支持常规开启/关闭与参数配置；特别支持通过 get_penetration_status 深度检测穿透真实运行状况（绝不能只看 xfrpc 进程是否运行，必须检查 xfrpc 是否真正与远端 frps 建立了 ESTABLISHED 状态的连接、是否发生握手超时或鉴权失败，并列出各代理规则的公网访问 URL）；支持通过 manage_penetration_proxy 管理具体端口映射规则（查询列表 action: "list"、新增/修改 TCP/UDP/HTTP/HTTPS/SOCKS5 规则 action: "add"、启用规则 action: "enable"、临时禁用规则 action: "disable"、删除规则 action: "remove"，支持自定义域名 custom_domains 与远程子域名 subdomain，支持启用加密与压缩）；特别支持通过 SSH 免密公钥方式在用户云服务器 (VPS) 上全自动部署与配置 frps 服务端 (propose_vps_penetration) 与查询路由器公钥 (get_router_ssh_key)，实现双端一键拉通；
   - 硬件加速 (MediaTek PPE / Flow Offloading)：支持实时查询硬件加速状态 (get_hw_offload_status)，支持提议开启或关闭硬件加速 (propose_hw_offload)；基于芯片级 PPE 硬件网络处理单元，千兆转发 CPU 占用接近 0%，并结合 chaWrt 独家 Selective PPE 机制与 eBPF 智能流控无缝协同；
   - chaWrt eBPF 智能流控与 DPI (aw-bpf)：基于 Linux 内核 TC-eBPF 硬件级调度与 L7 深度报文检测。支持实时查看局域网各设备上下行速率（以 Mbps 及 MB/s 双单位展示）、MAC 地址、主机名、累计总流量、限速状态与定时生效时段 (get_qos_status)；查询 L7 应用协议与服务的实时流速 Top 10 排行榜及高频域名 (get_l7_top)；对指定终端设备（支持按 IP、MAC 或 "all" 全网设备）设置或解除流控限速（输入 0 代表解除限速），支持灵活配置定时生效时段 (propose_qos_limit)；
   - 门户认证 (wifidogx & apfree-wifidog)：企业级/热点强制网页认证门户，深度集成 apfree-wifidog C 引擎内核；支持开启/关闭、免认证直通 (disable_portal_auth)、有线网口直接放行 (wired_passed)、防私接检测 (enable_anti_nat)；支持查询云端 WebSocket/MQTT 连接状态、认证服务器地址与当前实时在线认证用户列表（包含终端 MAC、IP、主机名及剩余有效时间）(get_service_detail('wifidogx') 或 manage_portal_access('list'))；支持全能门禁管理 (manage_portal_access)：一键强制踢终端下线断网 (kick_client)、终端黑名单拉黑并即时阻断 (add_blacklist / del_blacklist)、终端 MAC 免认证白名单放行 (add_whitelist / del_whitelist)、免认证域名及通配符域名放行 (add_domain / del_domain)；
   - 网络加速 (xkcptun)：纯 C 抗丢包加速引擎，支持开启/关闭、配置加速节点 (remote_addr)、端口 (remote_port)、模式 (mode)、密钥 (key)、前向纠错 (fec)、发送/接收窗口 (sndwnd/rcvwnd)；支持深度检测与实时测量节点 RTT 往返延迟 (ping_ms)、查看所有活跃加速隧道与实时加速连接目标 (get_service_detail('xkcptun'))；支持通过 manage_xkcptun_tunnel 管理具体加速隧道（查询列表 action: "list"、新增/修改 action: "add"、启用 action: "enable"、停用 action: "disable"、删除 action: "remove"，支持 transparent redir 与 forward 端口转发等各种端口与目标）；
   - 智能分流 (xdns)：基于 Linux 内核 TC-eBPF 动态智能分流，在 br-lan 网卡挂载 TC ingress pref 5 与 egress pref 10 双向探针，自动拦截分流域名并重定向至 xkcptun 隧道；支持查询当前 DNS 拦截数、代理数、学习应答数与 TCP 代理连接数、内核动态劫持 IP 表及活跃会话 (get_service_detail('xdns'))；支持全能分流管理 (manage_xdns_domain)：查询加速域名及内核状态 (action: "list")、添加域名 (action: "add")、删除域名 (action: "remove")、清空内核动态 IP 缓存 (action: "clear_ips")、重载规则文件 (action: "reload")、查看内核劫持 IP 列表 (action: "list_ips")、查看活跃代理会话 (action: "list_sessions")、统计数据 (action: "stats")；
   - StrongSwan IPsec VPN (ipsec)：企业级加密隧道，支持开启/关闭、配置对端网关 (gateway) 与预共享密钥 (key)；
   - 无线 WiFi 托管：支持查询与修改 WiFi 名称密码 (get_wifi_info, propose_wifi_config)。

4. 【操作与输出规范】：
   - 当用户查询上述任何服务、硬件加速、设备流量速率或公钥状态时，优先调用真实接口（get_services_status, get_penetration_status, get_router_ssh_key, get_hw_offload_status, get_service_detail, get_wifi_info, get_qos_status, get_l7_top）获取底层数据；
   - 当用户询问各设备当前网速、谁在下载、谁在占用带宽、限速规则时，调用 get_qos_status，输出清晰格式化的设备速率与限速明细；
   - 当用户提出对设备进行限速、调整限速或解除限速时，主动调用 propose_qos_limit 生成流控确认卡片（支持 target 为 IP、MAC 或 "all"，支持限制下行/上行带宽 dl_mbps/ul_mbps，支持定时时段）；
   - 当用户询问内网穿透状态、穿透是否正常、xfrpc 是否连上了服务端、测试穿透等问题时，主动调用 get_penetration_status 获取全量事实数据，严禁仅看进程存在就草率得出正常结论！必须向用户详细汇报：1. xfrpc 客户端进程运行状态；2. 与远端 frps 服务端的真实套接字连接状态 (ESTABLISHED / SYN_SENT 握手超时 / 断开)；3. 最新日志中的异常或诊断建议；4. 各映射规则的外网访问直达链接；
   - 当用户提出希望在自己的 VPS 上配置/部署内网穿透服务端时，主动调用 propose_vps_penetration 生成免密向导卡片（参数包含 vps_ip, vps_user, vps_port, remote_web_port），引导用户在 VPS 终端执行一行授权命令后全自动一键部署；
   - 当用户提出希望在自己的 VPS 上配置/安装/部署网络加速服务端（xkcptun server）时，主动调用 propose_vps_xkcptun 生成免密向导卡片（参数包含 vps_ip, vps_user, vps_port, listen_port, mode），引导用户在 VPS 终端执行授权后全自动通过 deb 包一键安装并自动配置路由器客户端连通；
   - 当用户询问网络加速状态、节点延迟、KCP 连接或加速隧道时，调用 get_service_detail('xkcptun') 或 manage_xkcptun_tunnel('list')；
   - 当用户询问或需要管理加速隧道时，调用 manage_xkcptun_tunnel（支持 list, add, remove, enable, disable）；
   - 当用户询问智能分流、拦截统计、分流域名、动态劫持 IP 或活跃代理会话时，调用 get_service_detail('xdns') 或 manage_xdns_domain；
   - 当用户需要添加/删除分流域名、清空分流 IP 缓存或重载规则时，调用 manage_xdns_domain；
   - 当用户询问门户认证状态、在线用户、踢人下线或管理黑白名单与免认证域名时，调用 get_service_detail('wifidogx') 或 manage_portal_access；
   - 当用户询问或需要管理内网穿透端口映射规则时，调用 manage_penetration_proxy（支持 list, add, remove, enable, disable）；
   - 【极其重要的域名与应用中文展示要求】：当用户询问应用/域名排行或即时流速（get_l7_top）时，用户非常关心实时流速以及域名对应的中文名称！底层数据已通过 cn_name 提供了准确的中文名称。在输出时，务必在 Markdown 表格中把【中文服务名】清晰展示出来（例如：“谷歌搜索 (google.com)”、“哔哩哔哩/B站 (bilibili.com)”、“X / 原Twitter (x.com)”、“OpenAI ChatGPT (chatgpt.com)”、“字节跳动火山引擎 (volces.com)” 等），严禁只给出一堆生硬的纯英文域名，确保非技术用户也能一眼看懂各应用和网站的中文身份！
   - 表格形式规范：
     ①【L7 应用协议实时流速排行榜 Top 10】（应用协议、中文说明、即时总流速、下行流速、上行流速、累计总流量）；
     ②【实时高流速服务与域名 Top 10】（服务/域名、中文说明、类型、实时流速、累计流量）；
     ③【高频访问域名 Top 10】（域名、中文名称、访问频次）；
   - 凡涉及 VPS 部署、开启/关闭硬件加速、设置/解除限速、修改 WiFi 或服务参数、添加/删除分流域名、添加/删除白名单 MAC、新增/停用/启用/删除穿透规则，必须通过对应的提议/管理工具生成可视化卡片供用户点击确认！
5. 【回答风格】：亲切自然、通俗易懂，结论先行，再提供结构清晰的 Markdown 表格说明或建议。`;

var marked = (function(){var exports={};var __exports=exports;var module={exports};
"use strict";var G=Object.defineProperty;var Re=Object.getOwnPropertyDescriptor;var Te=Object.getOwnPropertyNames;var Oe=Object.prototype.hasOwnProperty;var we=(l,e)=>{for(var t in e)G(l,t,{get:e[t],enumerable:!0})},ye=(l,e,t,n)=>{if(e&&typeof e=="object"||typeof e=="function")for(let r of Te(e))!Oe.call(l,r)&&r!==t&&G(l,r,{get:()=>e[r],enumerable:!(n=Re(e,r))||n.enumerable});return l};var Pe=l=>ye(G({},"__esModule",{value:!0}),l);var xt={};we(xt,{Hooks:()=>P,Lexer:()=>x,Marked:()=>A,Parser:()=>b,Renderer:()=>y,TextRenderer:()=>S,Tokenizer:()=>w,defaults:()=>R,getDefaults:()=>_,lexer:()=>mt,marked:()=>g,options:()=>pt,parse:()=>gt,parseInline:()=>dt,parser:()=>ft,setOptions:()=>ct,use:()=>ht,walkTokens:()=>kt});module.exports=Pe(xt);function _(){return{async:!1,breaks:!1,extensions:null,gfm:!0,hooks:null,pedantic:!1,renderer:null,silent:!1,tokenizer:null,walkTokens:null}}var R=_();function N(l){R=l}var L={exec:()=>null};function k(l,e=""){let t=typeof l=="string"?l:l.source,n={replace:(r,i)=>{let s=typeof i=="string"?i:i.source;return s=s.replace(m.caret,"$1"),t=t.replace(r,s),n},getRegex:()=>new RegExp(t,e)};return n}var Se=(()=>{try{return!!new RegExp("(?<=1)(?<!1)")}catch{return!1}})(),m={codeRemoveIndent:/^(?: {1,4}| {0,3}\t)/gm,outputLinkReplace:/\\([\[\]])/g,indentCodeCompensation:/^(\s+)(?:```)/,beginningSpace:/^\s+/,endingHash:/#$/,startingSpaceChar:/^ /,endingSpaceChar:/ $/,nonSpaceChar:/[^ ]/,newLineCharGlobal:/\n/g,tabCharGlobal:/\t/g,multipleSpaceGlobal:/\s+/g,blankLine:/^[ \t]*$/,doubleBlankLine:/\n[ \t]*\n[ \t]*$/,blockquoteStart:/^ {0,3}>/,blockquoteSetextReplace:/\n {0,3}((?:=+|-+) *)(?=\n|$)/g,blockquoteSetextReplace2:/^ {0,3}>[ \t]?/gm,listReplaceNesting:/^ {1,4}(?=( {4})*[^ ])/g,listIsTask:/^\[[ xX]\] +\S/,listReplaceTask:/^\[[ xX]\] +/,listTaskCheckbox:/\[[ xX]\]/,anyLine:/\n.*\n/,hrefBrackets:/^<(.*)>$/,tableDelimiter:/[:|]/,tableAlignChars:/^\||\| *$/g,tableRowBlankLine:/\n[ \t]*$/,tableAlignRight:/^ *-+: *$/,tableAlignCenter:/^ *:-+: *$/,tableAlignLeft:/^ *:-+ *$/,startATag:/^<a /i,endATag:/^<\/a>/i,startPreScriptTag:/^<(pre|code|kbd|script)(\s|>)/i,endPreScriptTag:/^<\/(pre|code|kbd|script)(\s|>)/i,startAngleBracket:/^</,endAngleBracket:/>$/,pedanticHrefTitle:/^([^'"]*[^\s])\s+(['"])(.*)\2/,unicodeAlphaNumeric:/[\p{L}\p{N}]/u,escapeTest:/[&<>"']/,escapeReplace:/[&<>"']/g,escapeTestNoEncode:/[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,escapeReplaceNoEncode:/[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,caret:/(^|[^\[])\^/g,percentDecode:/%25/g,findPipe:/\|/g,splitPipe:/ \|/,slashPipe:/\\\|/g,carriageReturn:/\r\n|\r/g,spaceLine:/^ +$/gm,notSpaceStart:/^\S*/,endingNewline:/\n$/,listItemRegex:l=>new RegExp(`^( {0,3}${l})((?:[	 ][^\\n]*)?(?:\\n|$))`),nextBulletRegex:l=>new RegExp(`^ {0,${Math.min(3,l-1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`),hrRegex:l=>new RegExp(`^ {0,${Math.min(3,l-1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`),fencesBeginRegex:l=>new RegExp(`^ {0,${Math.min(3,l-1)}}(?:\`\`\`|~~~)`),headingBeginRegex:l=>new RegExp(`^ {0,${Math.min(3,l-1)}}#`),htmlBeginRegex:l=>new RegExp(`^ {0,${Math.min(3,l-1)}}<(?:[a-z].*>|!--)`,"i"),blockquoteBeginRegex:l=>new RegExp(`^ {0,${Math.min(3,l-1)}}>`)},$e=/^(?:[ \t]*(?:\n|$))+/,_e=/^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/,Le=/^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/,B=/^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/,Me=/^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,j=/ {0,3}(?:[*+-]|\d{1,9}[.)])/,ie=/^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/,oe=k(ie).replace(/bull/g,j).replace(/blockCode/g,/(?: {4}| {0,3}\t)/).replace(/fences/g,/ {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g,/ {0,3}>/).replace(/heading/g,/ {0,3}#{1,6}/).replace(/html/g,/ {0,3}<[^\n>]+>\n/).replace(/\|table/g,"").getRegex(),ze=k(ie).replace(/bull/g,j).replace(/blockCode/g,/(?: {4}| {0,3}\t)/).replace(/fences/g,/ {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g,/ {0,3}>/).replace(/heading/g,/ {0,3}#{1,6}/).replace(/html/g,/ {0,3}<[^\n>]+>\n/).replace(/table/g,/ {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(),F=/^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/,Ee=/^[^\n]+/,U=/(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/,Ie=k(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label",U).replace("title",/(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(),Ae=k(/^(bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g,j).getRegex(),v="address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul",K=/<!--(?:-?>|[\s\S]*?(?:-->|$))/,Ce=k("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))","i").replace("comment",K).replace("tag",v).replace("attribute",/ +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(),ae=k(F).replace("hr",B).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("|lheading","").replace("|table","").replace("blockquote"," {0,3}>").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",v).getRegex(),Be=k(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph",ae).getRegex(),W={blockquote:Be,code:_e,def:Ie,fences:Le,heading:Me,hr:B,html:Ce,lheading:oe,list:Ae,newline:$e,paragraph:ae,table:L,text:Ee},re=k("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr",B).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("blockquote"," {0,3}>").replace("code","(?: {4}| {0,3}	)[^\\n]").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",v).getRegex(),De={...W,lheading:ze,table:re,paragraph:k(F).replace("hr",B).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("|lheading","").replace("table",re).replace("blockquote"," {0,3}>").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",v).getRegex()},qe={...W,html:k(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment",K).replace(/tag/g,"(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),def:/^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,heading:/^(#{1,6})(.*)(?:\n+|$)/,fences:L,lheading:/^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,paragraph:k(F).replace("hr",B).replace("heading",` *#{1,6} *[^
]`).replace("lheading",oe).replace("|table","").replace("blockquote"," {0,3}>").replace("|fences","").replace("|list","").replace("|html","").replace("|tag","").getRegex()},ve=/^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,He=/^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,le=/^( {2,}|\\)\n(?!\s*$)/,Ze=/^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/,z=/[\p{P}\p{S}]/u,H=/[\s\p{P}\p{S}]/u,X=/[^\s\p{P}\p{S}]/u,Ge=k(/^((?![*_])punctSpace)/,"u").replace(/punctSpace/g,H).getRegex(),ue=/(?!~)[\p{P}\p{S}]/u,Ne=/(?!~)[\s\p{P}\p{S}]/u,Qe=/(?:[^\s\p{P}\p{S}]|~)/u,je=k(/link|precode-code|html/,"g").replace("link",/\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace("precode-",Se?"(?<!`)()":"(^^|[^`])").replace("code",/(?<b>`+)[^`]+\k<b>(?!`)/).replace("html",/<(?! )[^<>]*?>/).getRegex(),pe=/^(?:\*+(?:((?!\*)punct)|([^\s*]))?)|^_+(?:((?!_)punct)|([^\s_]))?/,Fe=k(pe,"u").replace(/punct/g,z).getRegex(),Ue=k(pe,"u").replace(/punct/g,ue).getRegex(),ce="^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)",Ke=k(ce,"gu").replace(/notPunctSpace/g,X).replace(/punctSpace/g,H).replace(/punct/g,z).getRegex(),We=k(ce,"gu").replace(/notPunctSpace/g,Qe).replace(/punctSpace/g,Ne).replace(/punct/g,ue).getRegex(),Xe=k("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)","gu").replace(/notPunctSpace/g,X).replace(/punctSpace/g,H).replace(/punct/g,z).getRegex(),Je=k(/^~~?(?:((?!~)punct)|[^\s~])/,"u").replace(/punct/g,z).getRegex(),Ve="^[^~]+(?=[^~])|(?!~)punct(~~?)(?=[\\s]|$)|notPunctSpace(~~?)(?!~)(?=punctSpace|$)|(?!~)punctSpace(~~?)(?=notPunctSpace)|[\\s](~~?)(?!~)(?=punct)|(?!~)punct(~~?)(?!~)(?=punct)|notPunctSpace(~~?)(?=notPunctSpace)",Ye=k(Ve,"gu").replace(/notPunctSpace/g,X).replace(/punctSpace/g,H).replace(/punct/g,z).getRegex(),et=k(/\\(punct)/,"gu").replace(/punct/g,z).getRegex(),tt=k(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme",/[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email",/[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(),nt=k(K).replace("(?:-->|$)","-->").getRegex(),rt=k("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment",nt).replace("attribute",/\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(),q=/(?:\[(?:\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\])|[^\[\]\\`])*?/,st=k(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]+(?:\n[ \t]*)?|\n[ \t]*)(title))?\s*\)/).replace("label",q).replace("href",/<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title",/"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(),he=k(/^!?\[(label)\]\[(ref)\]/).replace("label",q).replace("ref",U).getRegex(),ke=k(/^!?\[(ref)\](?:\[\])?/).replace("ref",U).getRegex(),it=k("reflink|nolink(?!\\()","g").replace("reflink",he).replace("nolink",ke).getRegex(),se=/[hH][tT][tT][pP][sS]?|[fF][tT][pP]/,J={_backpedal:L,anyPunctuation:et,autolink:tt,blockSkip:je,br:le,code:He,del:L,delLDelim:L,delRDelim:L,emStrongLDelim:Fe,emStrongRDelimAst:Ke,emStrongRDelimUnd:Xe,escape:ve,link:st,nolink:ke,punctuation:Ge,reflink:he,reflinkSearch:it,tag:rt,text:Ze,url:L},ot={...J,link:k(/^!?\[(label)\]\((.*?)\)/).replace("label",q).getRegex(),reflink:k(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label",q).getRegex()},Q={...J,emStrongRDelimAst:We,emStrongLDelim:Ue,delLDelim:Je,delRDelim:Ye,url:k(/^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace("protocol",se).replace("email",/[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),_backpedal:/(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,del:/^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/,text:k(/^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/).replace("protocol",se).getRegex()},at={...Q,br:k(le).replace("{2,}","*").getRegex(),text:k(Q.text).replace("\\b_","\\b_| {2,}\\n").replace(/\{2,\}/g,"*").getRegex()},D={normal:W,gfm:De,pedantic:qe},E={normal:J,gfm:Q,breaks:at,pedantic:ot};var lt={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"},de=l=>lt[l];function O(l,e){if(e){if(m.escapeTest.test(l))return l.replace(m.escapeReplace,de)}else if(m.escapeTestNoEncode.test(l))return l.replace(m.escapeReplaceNoEncode,de);return l}function V(l){try{l=encodeURI(l).replace(m.percentDecode,"%")}catch{return null}return l}function Y(l,e){let t=l.replace(m.findPipe,(i,s,a)=>{let o=!1,u=s;for(;--u>=0&&a[u]==="\\";)o=!o;return o?"|":" |"}),n=t.split(m.splitPipe),r=0;if(n[0].trim()||n.shift(),n.length>0&&!n.at(-1)?.trim()&&n.pop(),e)if(n.length>e)n.splice(e);else for(;n.length<e;)n.push("");for(;r<n.length;r++)n[r]=n[r].trim().replace(m.slashPipe,"|");return n}function I(l,e,t){let n=l.length;if(n===0)return"";let r=0;for(;r<n;){let i=l.charAt(n-r-1);if(i===e&&!t)r++;else if(i!==e&&t)r++;else break}return l.slice(0,n-r)}function ge(l,e){if(l.indexOf(e[1])===-1)return-1;let t=0;for(let n=0;n<l.length;n++)if(l[n]==="\\")n++;else if(l[n]===e[0])t++;else if(l[n]===e[1]&&(t--,t<0))return n;return t>0?-2:-1}function fe(l,e=0){let t=e,n="";for(let r of l)if(r==="	"){let i=4-t%4;n+=" ".repeat(i),t+=i}else n+=r,t++;return n}function me(l,e,t,n,r){let i=e.href,s=e.title||null,a=l[1].replace(r.other.outputLinkReplace,"$1");n.state.inLink=!0;let o={type:l[0].charAt(0)==="!"?"image":"link",raw:t,href:i,title:s,text:a,tokens:n.inlineTokens(a)};return n.state.inLink=!1,o}function ut(l,e,t){let n=l.match(t.other.indentCodeCompensation);if(n===null)return e;let r=n[1];return e.split(`
`).map(i=>{let s=i.match(t.other.beginningSpace);if(s===null)return i;let[a]=s;return a.length>=r.length?i.slice(r.length):i}).join(`
`)}var w=class{options;rules;lexer;constructor(e){this.options=e||R}space(e){let t=this.rules.block.newline.exec(e);if(t&&t[0].length>0)return{type:"space",raw:t[0]}}code(e){let t=this.rules.block.code.exec(e);if(t){let n=t[0].replace(this.rules.other.codeRemoveIndent,"");return{type:"code",raw:t[0],codeBlockStyle:"indented",text:this.options.pedantic?n:I(n,`
`)}}}fences(e){let t=this.rules.block.fences.exec(e);if(t){let n=t[0],r=ut(n,t[3]||"",this.rules);return{type:"code",raw:n,lang:t[2]?t[2].trim().replace(this.rules.inline.anyPunctuation,"$1"):t[2],text:r}}}heading(e){let t=this.rules.block.heading.exec(e);if(t){let n=t[2].trim();if(this.rules.other.endingHash.test(n)){let r=I(n,"#");(this.options.pedantic||!r||this.rules.other.endingSpaceChar.test(r))&&(n=r.trim())}return{type:"heading",raw:t[0],depth:t[1].length,text:n,tokens:this.lexer.inline(n)}}}hr(e){let t=this.rules.block.hr.exec(e);if(t)return{type:"hr",raw:I(t[0],`
`)}}blockquote(e){let t=this.rules.block.blockquote.exec(e);if(t){let n=I(t[0],`
`).split(`
`),r="",i="",s=[];for(;n.length>0;){let a=!1,o=[],u;for(u=0;u<n.length;u++)if(this.rules.other.blockquoteStart.test(n[u]))o.push(n[u]),a=!0;else if(!a)o.push(n[u]);else break;n=n.slice(u);let p=o.join(`
`),c=p.replace(this.rules.other.blockquoteSetextReplace,`
    $1`).replace(this.rules.other.blockquoteSetextReplace2,"");r=r?`${r}
${p}`:p,i=i?`${i}
${c}`:c;let d=this.lexer.state.top;if(this.lexer.state.top=!0,this.lexer.blockTokens(c,s,!0),this.lexer.state.top=d,n.length===0)break;let h=s.at(-1);if(h?.type==="code")break;if(h?.type==="blockquote"){let T=h,f=T.raw+`
`+n.join(`
`),$=this.blockquote(f);s[s.length-1]=$,r=r.substring(0,r.length-T.raw.length)+$.raw,i=i.substring(0,i.length-T.text.length)+$.text;break}else if(h?.type==="list"){let T=h,f=T.raw+`
`+n.join(`
`),$=this.list(f);s[s.length-1]=$,r=r.substring(0,r.length-h.raw.length)+$.raw,i=i.substring(0,i.length-T.raw.length)+$.raw,n=f.substring(s.at(-1).raw.length).split(`
`);continue}}return{type:"blockquote",raw:r,tokens:s,text:i}}}list(e){let t=this.rules.block.list.exec(e);if(t){let n=t[1].trim(),r=n.length>1,i={type:"list",raw:"",ordered:r,start:r?+n.slice(0,-1):"",loose:!1,items:[]};n=r?`\\d{1,9}\\${n.slice(-1)}`:`\\${n}`,this.options.pedantic&&(n=r?n:"[*+-]");let s=this.rules.other.listItemRegex(n),a=!1;for(;e;){let u=!1,p="",c="";if(!(t=s.exec(e))||this.rules.block.hr.test(e))break;p=t[0],e=e.substring(p.length);let d=fe(t[2].split(`
`,1)[0],t[1].length),h=e.split(`
`,1)[0],T=!d.trim(),f=0;if(this.options.pedantic?(f=2,c=d.trimStart()):T?f=t[1].length+1:(f=d.search(this.rules.other.nonSpaceChar),f=f>4?1:f,c=d.slice(f),f+=t[1].length),T&&this.rules.other.blankLine.test(h)&&(p+=h+`
`,e=e.substring(h.length+1),u=!0),!u){let $=this.rules.other.nextBulletRegex(f),ee=this.rules.other.hrRegex(f),te=this.rules.other.fencesBeginRegex(f),ne=this.rules.other.headingBeginRegex(f),xe=this.rules.other.htmlBeginRegex(f),be=this.rules.other.blockquoteBeginRegex(f);for(;e;){let Z=e.split(`
`,1)[0],C;if(h=Z,this.options.pedantic?(h=h.replace(this.rules.other.listReplaceNesting,"  "),C=h):C=h.replace(this.rules.other.tabCharGlobal,"    "),te.test(h)||ne.test(h)||xe.test(h)||be.test(h)||$.test(h)||ee.test(h))break;if(C.search(this.rules.other.nonSpaceChar)>=f||!h.trim())c+=`
`+C.slice(f);else{if(T||d.replace(this.rules.other.tabCharGlobal,"    ").search(this.rules.other.nonSpaceChar)>=4||te.test(d)||ne.test(d)||ee.test(d))break;c+=`
`+h}T=!h.trim(),p+=Z+`
`,e=e.substring(Z.length+1),d=C.slice(f)}}i.loose||(a?i.loose=!0:this.rules.other.doubleBlankLine.test(p)&&(a=!0)),i.items.push({type:"list_item",raw:p,task:!!this.options.gfm&&this.rules.other.listIsTask.test(c),loose:!1,text:c,tokens:[]}),i.raw+=p}let o=i.items.at(-1);if(o)o.raw=o.raw.trimEnd(),o.text=o.text.trimEnd();else return;i.raw=i.raw.trimEnd();for(let u of i.items){if(this.lexer.state.top=!1,u.tokens=this.lexer.blockTokens(u.text,[]),u.task){if(u.text=u.text.replace(this.rules.other.listReplaceTask,""),u.tokens[0]?.type==="text"||u.tokens[0]?.type==="paragraph"){u.tokens[0].raw=u.tokens[0].raw.replace(this.rules.other.listReplaceTask,""),u.tokens[0].text=u.tokens[0].text.replace(this.rules.other.listReplaceTask,"");for(let c=this.lexer.inlineQueue.length-1;c>=0;c--)if(this.rules.other.listIsTask.test(this.lexer.inlineQueue[c].src)){this.lexer.inlineQueue[c].src=this.lexer.inlineQueue[c].src.replace(this.rules.other.listReplaceTask,"");break}}let p=this.rules.other.listTaskCheckbox.exec(u.raw);if(p){let c={type:"checkbox",raw:p[0]+" ",checked:p[0]!=="[ ]"};u.checked=c.checked,i.loose?u.tokens[0]&&["paragraph","text"].includes(u.tokens[0].type)&&"tokens"in u.tokens[0]&&u.tokens[0].tokens?(u.tokens[0].raw=c.raw+u.tokens[0].raw,u.tokens[0].text=c.raw+u.tokens[0].text,u.tokens[0].tokens.unshift(c)):u.tokens.unshift({type:"paragraph",raw:c.raw,text:c.raw,tokens:[c]}):u.tokens.unshift(c)}}if(!i.loose){let p=u.tokens.filter(d=>d.type==="space"),c=p.length>0&&p.some(d=>this.rules.other.anyLine.test(d.raw));i.loose=c}}if(i.loose)for(let u of i.items){u.loose=!0;for(let p of u.tokens)p.type==="text"&&(p.type="paragraph")}return i}}html(e){let t=this.rules.block.html.exec(e);if(t)return{type:"html",block:!0,raw:t[0],pre:t[1]==="pre"||t[1]==="script"||t[1]==="style",text:t[0]}}def(e){let t=this.rules.block.def.exec(e);if(t){let n=t[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal," "),r=t[2]?t[2].replace(this.rules.other.hrefBrackets,"$1").replace(this.rules.inline.anyPunctuation,"$1"):"",i=t[3]?t[3].substring(1,t[3].length-1).replace(this.rules.inline.anyPunctuation,"$1"):t[3];return{type:"def",tag:n,raw:t[0],href:r,title:i}}}table(e){let t=this.rules.block.table.exec(e);if(!t||!this.rules.other.tableDelimiter.test(t[2]))return;let n=Y(t[1]),r=t[2].replace(this.rules.other.tableAlignChars,"").split("|"),i=t[3]?.trim()?t[3].replace(this.rules.other.tableRowBlankLine,"").split(`
`):[],s={type:"table",raw:t[0],header:[],align:[],rows:[]};if(n.length===r.length){for(let a of r)this.rules.other.tableAlignRight.test(a)?s.align.push("right"):this.rules.other.tableAlignCenter.test(a)?s.align.push("center"):this.rules.other.tableAlignLeft.test(a)?s.align.push("left"):s.align.push(null);for(let a=0;a<n.length;a++)s.header.push({text:n[a],tokens:this.lexer.inline(n[a]),header:!0,align:s.align[a]});for(let a of i)s.rows.push(Y(a,s.header.length).map((o,u)=>({text:o,tokens:this.lexer.inline(o),header:!1,align:s.align[u]})));return s}}lheading(e){let t=this.rules.block.lheading.exec(e);if(t){let n=t[1].trim();return{type:"heading",raw:t[0],depth:t[2].charAt(0)==="="?1:2,text:n,tokens:this.lexer.inline(n)}}}paragraph(e){let t=this.rules.block.paragraph.exec(e);if(t){let n=t[1].charAt(t[1].length-1)===`
`?t[1].slice(0,-1):t[1];return{type:"paragraph",raw:t[0],text:n,tokens:this.lexer.inline(n)}}}text(e){let t=this.rules.block.text.exec(e);if(t)return{type:"text",raw:t[0],text:t[0],tokens:this.lexer.inline(t[0])}}escape(e){let t=this.rules.inline.escape.exec(e);if(t)return{type:"escape",raw:t[0],text:t[1]}}tag(e){let t=this.rules.inline.tag.exec(e);if(t)return!this.lexer.state.inLink&&this.rules.other.startATag.test(t[0])?this.lexer.state.inLink=!0:this.lexer.state.inLink&&this.rules.other.endATag.test(t[0])&&(this.lexer.state.inLink=!1),!this.lexer.state.inRawBlock&&this.rules.other.startPreScriptTag.test(t[0])?this.lexer.state.inRawBlock=!0:this.lexer.state.inRawBlock&&this.rules.other.endPreScriptTag.test(t[0])&&(this.lexer.state.inRawBlock=!1),{type:"html",raw:t[0],inLink:this.lexer.state.inLink,inRawBlock:this.lexer.state.inRawBlock,block:!1,text:t[0]}}link(e){let t=this.rules.inline.link.exec(e);if(t){let n=t[2].trim();if(!this.options.pedantic&&this.rules.other.startAngleBracket.test(n)){if(!this.rules.other.endAngleBracket.test(n))return;let s=I(n.slice(0,-1),"\\");if((n.length-s.length)%2===0)return}else{let s=ge(t[2],"()");if(s===-2)return;if(s>-1){let o=(t[0].indexOf("!")===0?5:4)+t[1].length+s;t[2]=t[2].substring(0,s),t[0]=t[0].substring(0,o).trim(),t[3]=""}}let r=t[2],i="";if(this.options.pedantic){let s=this.rules.other.pedanticHrefTitle.exec(r);s&&(r=s[1],i=s[3])}else i=t[3]?t[3].slice(1,-1):"";return r=r.trim(),this.rules.other.startAngleBracket.test(r)&&(this.options.pedantic&&!this.rules.other.endAngleBracket.test(n)?r=r.slice(1):r=r.slice(1,-1)),me(t,{href:r&&r.replace(this.rules.inline.anyPunctuation,"$1"),title:i&&i.replace(this.rules.inline.anyPunctuation,"$1")},t[0],this.lexer,this.rules)}}reflink(e,t){let n;if((n=this.rules.inline.reflink.exec(e))||(n=this.rules.inline.nolink.exec(e))){let r=(n[2]||n[1]).replace(this.rules.other.multipleSpaceGlobal," "),i=t[r.toLowerCase()];if(!i){let s=n[0].charAt(0);return{type:"text",raw:s,text:s}}return me(n,i,n[0],this.lexer,this.rules)}}emStrong(e,t,n=""){let r=this.rules.inline.emStrongLDelim.exec(e);if(!r||!r[1]&&!r[2]&&!r[3]&&!r[4]||r[4]&&n.match(this.rules.other.unicodeAlphaNumeric))return;if(!(r[1]||r[3]||"")||!n||this.rules.inline.punctuation.exec(n)){let s=[...r[0]].length-1,a,o,u=s,p=0,c=r[0][0]==="*"?this.rules.inline.emStrongRDelimAst:this.rules.inline.emStrongRDelimUnd;for(c.lastIndex=0,t=t.slice(-1*e.length+s);(r=c.exec(t))!=null;){if(a=r[1]||r[2]||r[3]||r[4]||r[5]||r[6],!a)continue;if(o=[...a].length,r[3]||r[4]){u+=o;continue}else if((r[5]||r[6])&&s%3&&!((s+o)%3)){p+=o;continue}if(u-=o,u>0)continue;o=Math.min(o,o+u+p);let d=[...r[0]][0].length,h=e.slice(0,s+r.index+d+o);if(Math.min(s,o)%2){let f=h.slice(1,-1);return{type:"em",raw:h,text:f,tokens:this.lexer.inlineTokens(f)}}let T=h.slice(2,-2);return{type:"strong",raw:h,text:T,tokens:this.lexer.inlineTokens(T)}}}}codespan(e){let t=this.rules.inline.code.exec(e);if(t){let n=t[2].replace(this.rules.other.newLineCharGlobal," "),r=this.rules.other.nonSpaceChar.test(n),i=this.rules.other.startingSpaceChar.test(n)&&this.rules.other.endingSpaceChar.test(n);return r&&i&&(n=n.substring(1,n.length-1)),{type:"codespan",raw:t[0],text:n}}}br(e){let t=this.rules.inline.br.exec(e);if(t)return{type:"br",raw:t[0]}}del(e,t,n=""){let r=this.rules.inline.delLDelim.exec(e);if(!r)return;if(!(r[1]||"")||!n||this.rules.inline.punctuation.exec(n)){let s=[...r[0]].length-1,a,o,u=s,p=this.rules.inline.delRDelim;for(p.lastIndex=0,t=t.slice(-1*e.length+s);(r=p.exec(t))!=null;){if(a=r[1]||r[2]||r[3]||r[4]||r[5]||r[6],!a||(o=[...a].length,o!==s))continue;if(r[3]||r[4]){u+=o;continue}if(u-=o,u>0)continue;o=Math.min(o,o+u);let c=[...r[0]][0].length,d=e.slice(0,s+r.index+c+o),h=d.slice(s,-s);return{type:"del",raw:d,text:h,tokens:this.lexer.inlineTokens(h)}}}}autolink(e){let t=this.rules.inline.autolink.exec(e);if(t){let n,r;return t[2]==="@"?(n=t[1],r="mailto:"+n):(n=t[1],r=n),{type:"link",raw:t[0],text:n,href:r,tokens:[{type:"text",raw:n,text:n}]}}}url(e){let t;if(t=this.rules.inline.url.exec(e)){let n,r;if(t[2]==="@")n=t[0],r="mailto:"+n;else{let i;do i=t[0],t[0]=this.rules.inline._backpedal.exec(t[0])?.[0]??"";while(i!==t[0]);n=t[0],t[1]==="www."?r="http://"+t[0]:r=t[0]}return{type:"link",raw:t[0],text:n,href:r,tokens:[{type:"text",raw:n,text:n}]}}}inlineText(e){let t=this.rules.inline.text.exec(e);if(t){let n=this.lexer.state.inRawBlock;return{type:"text",raw:t[0],text:t[0],escaped:n}}}};var x=class l{tokens;options;state;inlineQueue;tokenizer;constructor(e){this.tokens=[],this.tokens.links=Object.create(null),this.options=e||R,this.options.tokenizer=this.options.tokenizer||new w,this.tokenizer=this.options.tokenizer,this.tokenizer.options=this.options,this.tokenizer.lexer=this,this.inlineQueue=[],this.state={inLink:!1,inRawBlock:!1,top:!0};let t={other:m,block:D.normal,inline:E.normal};this.options.pedantic?(t.block=D.pedantic,t.inline=E.pedantic):this.options.gfm&&(t.block=D.gfm,this.options.breaks?t.inline=E.breaks:t.inline=E.gfm),this.tokenizer.rules=t}static get rules(){return{block:D,inline:E}}static lex(e,t){return new l(t).lex(e)}static lexInline(e,t){return new l(t).inlineTokens(e)}lex(e){e=e.replace(m.carriageReturn,`
`),this.blockTokens(e,this.tokens);for(let t=0;t<this.inlineQueue.length;t++){let n=this.inlineQueue[t];this.inlineTokens(n.src,n.tokens)}return this.inlineQueue=[],this.tokens}blockTokens(e,t=[],n=!1){for(this.tokenizer.lexer=this,this.options.pedantic&&(e=e.replace(m.tabCharGlobal,"    ").replace(m.spaceLine,""));e;){let r;if(this.options.extensions?.block?.some(s=>(r=s.call({lexer:this},e,t))?(e=e.substring(r.raw.length),t.push(r),!0):!1))continue;if(r=this.tokenizer.space(e)){e=e.substring(r.raw.length);let s=t.at(-1);r.raw.length===1&&s!==void 0?s.raw+=`
`:t.push(r);continue}if(r=this.tokenizer.code(e)){e=e.substring(r.raw.length);let s=t.at(-1);s?.type==="paragraph"||s?.type==="text"?(s.raw+=(s.raw.endsWith(`
`)?"":`
`)+r.raw,s.text+=`
`+r.text,this.inlineQueue.at(-1).src=s.text):t.push(r);continue}if(r=this.tokenizer.fences(e)){e=e.substring(r.raw.length),t.push(r);continue}if(r=this.tokenizer.heading(e)){e=e.substring(r.raw.length),t.push(r);continue}if(r=this.tokenizer.hr(e)){e=e.substring(r.raw.length),t.push(r);continue}if(r=this.tokenizer.blockquote(e)){e=e.substring(r.raw.length),t.push(r);continue}if(r=this.tokenizer.list(e)){e=e.substring(r.raw.length),t.push(r);continue}if(r=this.tokenizer.html(e)){e=e.substring(r.raw.length),t.push(r);continue}if(r=this.tokenizer.def(e)){e=e.substring(r.raw.length);let s=t.at(-1);s?.type==="paragraph"||s?.type==="text"?(s.raw+=(s.raw.endsWith(`
`)?"":`
`)+r.raw,s.text+=`
`+r.raw,this.inlineQueue.at(-1).src=s.text):this.tokens.links[r.tag]||(this.tokens.links[r.tag]={href:r.href,title:r.title},t.push(r));continue}if(r=this.tokenizer.table(e)){e=e.substring(r.raw.length),t.push(r);continue}if(r=this.tokenizer.lheading(e)){e=e.substring(r.raw.length),t.push(r);continue}let i=e;if(this.options.extensions?.startBlock){let s=1/0,a=e.slice(1),o;this.options.extensions.startBlock.forEach(u=>{o=u.call({lexer:this},a),typeof o=="number"&&o>=0&&(s=Math.min(s,o))}),s<1/0&&s>=0&&(i=e.substring(0,s+1))}if(this.state.top&&(r=this.tokenizer.paragraph(i))){let s=t.at(-1);n&&s?.type==="paragraph"?(s.raw+=(s.raw.endsWith(`
`)?"":`
`)+r.raw,s.text+=`
`+r.text,this.inlineQueue.pop(),this.inlineQueue.at(-1).src=s.text):t.push(r),n=i.length!==e.length,e=e.substring(r.raw.length);continue}if(r=this.tokenizer.text(e)){e=e.substring(r.raw.length);let s=t.at(-1);s?.type==="text"?(s.raw+=(s.raw.endsWith(`
`)?"":`
`)+r.raw,s.text+=`
`+r.text,this.inlineQueue.pop(),this.inlineQueue.at(-1).src=s.text):t.push(r);continue}if(e){let s="Infinite loop on byte: "+e.charCodeAt(0);if(this.options.silent){console.error(s);break}else throw new Error(s)}}return this.state.top=!0,t}inline(e,t=[]){return this.inlineQueue.push({src:e,tokens:t}),t}inlineTokens(e,t=[]){this.tokenizer.lexer=this;let n=e,r=null;if(this.tokens.links){let o=Object.keys(this.tokens.links);if(o.length>0)for(;(r=this.tokenizer.rules.inline.reflinkSearch.exec(n))!=null;)o.includes(r[0].slice(r[0].lastIndexOf("[")+1,-1))&&(n=n.slice(0,r.index)+"["+"a".repeat(r[0].length-2)+"]"+n.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex))}for(;(r=this.tokenizer.rules.inline.anyPunctuation.exec(n))!=null;)n=n.slice(0,r.index)+"++"+n.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);let i;for(;(r=this.tokenizer.rules.inline.blockSkip.exec(n))!=null;)i=r[2]?r[2].length:0,n=n.slice(0,r.index+i)+"["+"a".repeat(r[0].length-i-2)+"]"+n.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);n=this.options.hooks?.emStrongMask?.call({lexer:this},n)??n;let s=!1,a="";for(;e;){s||(a=""),s=!1;let o;if(this.options.extensions?.inline?.some(p=>(o=p.call({lexer:this},e,t))?(e=e.substring(o.raw.length),t.push(o),!0):!1))continue;if(o=this.tokenizer.escape(e)){e=e.substring(o.raw.length),t.push(o);continue}if(o=this.tokenizer.tag(e)){e=e.substring(o.raw.length),t.push(o);continue}if(o=this.tokenizer.link(e)){e=e.substring(o.raw.length),t.push(o);continue}if(o=this.tokenizer.reflink(e,this.tokens.links)){e=e.substring(o.raw.length);let p=t.at(-1);o.type==="text"&&p?.type==="text"?(p.raw+=o.raw,p.text+=o.text):t.push(o);continue}if(o=this.tokenizer.emStrong(e,n,a)){e=e.substring(o.raw.length),t.push(o);continue}if(o=this.tokenizer.codespan(e)){e=e.substring(o.raw.length),t.push(o);continue}if(o=this.tokenizer.br(e)){e=e.substring(o.raw.length),t.push(o);continue}if(o=this.tokenizer.del(e,n,a)){e=e.substring(o.raw.length),t.push(o);continue}if(o=this.tokenizer.autolink(e)){e=e.substring(o.raw.length),t.push(o);continue}if(!this.state.inLink&&(o=this.tokenizer.url(e))){e=e.substring(o.raw.length),t.push(o);continue}let u=e;if(this.options.extensions?.startInline){let p=1/0,c=e.slice(1),d;this.options.extensions.startInline.forEach(h=>{d=h.call({lexer:this},c),typeof d=="number"&&d>=0&&(p=Math.min(p,d))}),p<1/0&&p>=0&&(u=e.substring(0,p+1))}if(o=this.tokenizer.inlineText(u)){e=e.substring(o.raw.length),o.raw.slice(-1)!=="_"&&(a=o.raw.slice(-1)),s=!0;let p=t.at(-1);p?.type==="text"?(p.raw+=o.raw,p.text+=o.text):t.push(o);continue}if(e){let p="Infinite loop on byte: "+e.charCodeAt(0);if(this.options.silent){console.error(p);break}else throw new Error(p)}}return t}};var y=class{options;parser;constructor(e){this.options=e||R}space(e){return""}code({text:e,lang:t,escaped:n}){let r=(t||"").match(m.notSpaceStart)?.[0],i=e.replace(m.endingNewline,"")+`
`;return r?'<pre><code class="language-'+O(r)+'">'+(n?i:O(i,!0))+`</code></pre>
`:"<pre><code>"+(n?i:O(i,!0))+`</code></pre>
`}blockquote({tokens:e}){return`<blockquote>
${this.parser.parse(e)}</blockquote>
`}html({text:e}){return e}def(e){return""}heading({tokens:e,depth:t}){return`<h${t}>${this.parser.parseInline(e)}</h${t}>
`}hr(e){return`<hr>
`}list(e){let t=e.ordered,n=e.start,r="";for(let a=0;a<e.items.length;a++){let o=e.items[a];r+=this.listitem(o)}let i=t?"ol":"ul",s=t&&n!==1?' start="'+n+'"':"";return"<"+i+s+`>
`+r+"</"+i+`>
`}listitem(e){return`<li>${this.parser.parse(e.tokens)}</li>
`}checkbox({checked:e}){return"<input "+(e?'checked="" ':"")+'disabled="" type="checkbox"> '}paragraph({tokens:e}){return`<p>${this.parser.parseInline(e)}</p>
`}table(e){let t="",n="";for(let i=0;i<e.header.length;i++)n+=this.tablecell(e.header[i]);t+=this.tablerow({text:n});let r="";for(let i=0;i<e.rows.length;i++){let s=e.rows[i];n="";for(let a=0;a<s.length;a++)n+=this.tablecell(s[a]);r+=this.tablerow({text:n})}return r&&(r=`<tbody>${r}</tbody>`),`<table>
<thead>
`+t+`</thead>
`+r+`</table>
`}tablerow({text:e}){return`<tr>
${e}</tr>
`}tablecell(e){let t=this.parser.parseInline(e.tokens),n=e.header?"th":"td";return(e.align?`<${n} align="${e.align}">`:`<${n}>`)+t+`</${n}>
`}strong({tokens:e}){return`<strong>${this.parser.parseInline(e)}</strong>`}em({tokens:e}){return`<em>${this.parser.parseInline(e)}</em>`}codespan({text:e}){return`<code>${O(e,!0)}</code>`}br(e){return"<br>"}del({tokens:e}){return`<del>${this.parser.parseInline(e)}</del>`}link({href:e,title:t,tokens:n}){let r=this.parser.parseInline(n),i=V(e);if(i===null)return r;e=i;let s='<a href="'+e+'"';return t&&(s+=' title="'+O(t)+'"'),s+=">"+r+"</a>",s}image({href:e,title:t,text:n,tokens:r}){r&&(n=this.parser.parseInline(r,this.parser.textRenderer));let i=V(e);if(i===null)return O(n);e=i;let s=`<img src="${e}" alt="${O(n)}"`;return t&&(s+=` title="${O(t)}"`),s+=">",s}text(e){return"tokens"in e&&e.tokens?this.parser.parseInline(e.tokens):"escaped"in e&&e.escaped?e.text:O(e.text)}};var S=class{strong({text:e}){return e}em({text:e}){return e}codespan({text:e}){return e}del({text:e}){return e}html({text:e}){return e}text({text:e}){return e}link({text:e}){return""+e}image({text:e}){return""+e}br(){return""}checkbox({raw:e}){return e}};var b=class l{options;renderer;textRenderer;constructor(e){this.options=e||R,this.options.renderer=this.options.renderer||new y,this.renderer=this.options.renderer,this.renderer.options=this.options,this.renderer.parser=this,this.textRenderer=new S}static parse(e,t){return new l(t).parse(e)}static parseInline(e,t){return new l(t).parseInline(e)}parse(e){this.renderer.parser=this;let t="";for(let n=0;n<e.length;n++){let r=e[n];if(this.options.extensions?.renderers?.[r.type]){let s=r,a=this.options.extensions.renderers[s.type].call({parser:this},s);if(a!==!1||!["space","hr","heading","code","table","blockquote","list","html","def","paragraph","text"].includes(s.type)){t+=a||"";continue}}let i=r;switch(i.type){case"space":{t+=this.renderer.space(i);break}case"hr":{t+=this.renderer.hr(i);break}case"heading":{t+=this.renderer.heading(i);break}case"code":{t+=this.renderer.code(i);break}case"table":{t+=this.renderer.table(i);break}case"blockquote":{t+=this.renderer.blockquote(i);break}case"list":{t+=this.renderer.list(i);break}case"checkbox":{t+=this.renderer.checkbox(i);break}case"html":{t+=this.renderer.html(i);break}case"def":{t+=this.renderer.def(i);break}case"paragraph":{t+=this.renderer.paragraph(i);break}case"text":{t+=this.renderer.text(i);break}default:{let s='Token with "'+i.type+'" type was not found.';if(this.options.silent)return console.error(s),"";throw new Error(s)}}}return t}parseInline(e,t=this.renderer){this.renderer.parser=this;let n="";for(let r=0;r<e.length;r++){let i=e[r];if(this.options.extensions?.renderers?.[i.type]){let a=this.options.extensions.renderers[i.type].call({parser:this},i);if(a!==!1||!["escape","html","link","image","strong","em","codespan","br","del","text"].includes(i.type)){n+=a||"";continue}}let s=i;switch(s.type){case"escape":{n+=t.text(s);break}case"html":{n+=t.html(s);break}case"link":{n+=t.link(s);break}case"image":{n+=t.image(s);break}case"checkbox":{n+=t.checkbox(s);break}case"strong":{n+=t.strong(s);break}case"em":{n+=t.em(s);break}case"codespan":{n+=t.codespan(s);break}case"br":{n+=t.br(s);break}case"del":{n+=t.del(s);break}case"text":{n+=t.text(s);break}default:{let a='Token with "'+s.type+'" type was not found.';if(this.options.silent)return console.error(a),"";throw new Error(a)}}}return n}};var P=class{options;block;constructor(e){this.options=e||R}static passThroughHooks=new Set(["preprocess","postprocess","processAllTokens","emStrongMask"]);static passThroughHooksRespectAsync=new Set(["preprocess","postprocess","processAllTokens"]);preprocess(e){return e}postprocess(e){return e}processAllTokens(e){return e}emStrongMask(e){return e}provideLexer(){return this.block?x.lex:x.lexInline}provideParser(){return this.block?b.parse:b.parseInline}};var A=class{defaults=_();options=this.setOptions;parse=this.parseMarkdown(!0);parseInline=this.parseMarkdown(!1);Parser=b;Renderer=y;TextRenderer=S;Lexer=x;Tokenizer=w;Hooks=P;constructor(...e){this.use(...e)}walkTokens(e,t){let n=[];for(let r of e)switch(n=n.concat(t.call(this,r)),r.type){case"table":{let i=r;for(let s of i.header)n=n.concat(this.walkTokens(s.tokens,t));for(let s of i.rows)for(let a of s)n=n.concat(this.walkTokens(a.tokens,t));break}case"list":{let i=r;n=n.concat(this.walkTokens(i.items,t));break}default:{let i=r;this.defaults.extensions?.childTokens?.[i.type]?this.defaults.extensions.childTokens[i.type].forEach(s=>{let a=i[s].flat(1/0);n=n.concat(this.walkTokens(a,t))}):i.tokens&&(n=n.concat(this.walkTokens(i.tokens,t)))}}return n}use(...e){let t=this.defaults.extensions||{renderers:{},childTokens:{}};return e.forEach(n=>{let r={...n};if(r.async=this.defaults.async||r.async||!1,n.extensions&&(n.extensions.forEach(i=>{if(!i.name)throw new Error("extension name required");if("renderer"in i){let s=t.renderers[i.name];s?t.renderers[i.name]=function(...a){let o=i.renderer.apply(this,a);return o===!1&&(o=s.apply(this,a)),o}:t.renderers[i.name]=i.renderer}if("tokenizer"in i){if(!i.level||i.level!=="block"&&i.level!=="inline")throw new Error("extension level must be 'block' or 'inline'");let s=t[i.level];s?s.unshift(i.tokenizer):t[i.level]=[i.tokenizer],i.start&&(i.level==="block"?t.startBlock?t.startBlock.push(i.start):t.startBlock=[i.start]:i.level==="inline"&&(t.startInline?t.startInline.push(i.start):t.startInline=[i.start]))}"childTokens"in i&&i.childTokens&&(t.childTokens[i.name]=i.childTokens)}),r.extensions=t),n.renderer){let i=this.defaults.renderer||new y(this.defaults);for(let s in n.renderer){if(!(s in i))throw new Error(`renderer '${s}' does not exist`);if(["options","parser"].includes(s))continue;let a=s,o=n.renderer[a],u=i[a];i[a]=(...p)=>{let c=o.apply(i,p);return c===!1&&(c=u.apply(i,p)),c||""}}r.renderer=i}if(n.tokenizer){let i=this.defaults.tokenizer||new w(this.defaults);for(let s in n.tokenizer){if(!(s in i))throw new Error(`tokenizer '${s}' does not exist`);if(["options","rules","lexer"].includes(s))continue;let a=s,o=n.tokenizer[a],u=i[a];i[a]=(...p)=>{let c=o.apply(i,p);return c===!1&&(c=u.apply(i,p)),c}}r.tokenizer=i}if(n.hooks){let i=this.defaults.hooks||new P;for(let s in n.hooks){if(!(s in i))throw new Error(`hook '${s}' does not exist`);if(["options","block"].includes(s))continue;let a=s,o=n.hooks[a],u=i[a];P.passThroughHooks.has(s)?i[a]=p=>{if(this.defaults.async&&P.passThroughHooksRespectAsync.has(s))return(async()=>{let d=await o.call(i,p);return u.call(i,d)})();let c=o.call(i,p);return u.call(i,c)}:i[a]=(...p)=>{if(this.defaults.async)return(async()=>{let d=await o.apply(i,p);return d===!1&&(d=await u.apply(i,p)),d})();let c=o.apply(i,p);return c===!1&&(c=u.apply(i,p)),c}}r.hooks=i}if(n.walkTokens){let i=this.defaults.walkTokens,s=n.walkTokens;r.walkTokens=function(a){let o=[];return o.push(s.call(this,a)),i&&(o=o.concat(i.call(this,a))),o}}this.defaults={...this.defaults,...r}}),this}setOptions(e){return this.defaults={...this.defaults,...e},this}lexer(e,t){return x.lex(e,t??this.defaults)}parser(e,t){return b.parse(e,t??this.defaults)}parseMarkdown(e){return(n,r)=>{let i={...r},s={...this.defaults,...i},a=this.onError(!!s.silent,!!s.async);if(this.defaults.async===!0&&i.async===!1)return a(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));if(typeof n>"u"||n===null)return a(new Error("marked(): input parameter is undefined or null"));if(typeof n!="string")return a(new Error("marked(): input parameter is of type "+Object.prototype.toString.call(n)+", string expected"));if(s.hooks&&(s.hooks.options=s,s.hooks.block=e),s.async)return(async()=>{let o=s.hooks?await s.hooks.preprocess(n):n,p=await(s.hooks?await s.hooks.provideLexer():e?x.lex:x.lexInline)(o,s),c=s.hooks?await s.hooks.processAllTokens(p):p;s.walkTokens&&await Promise.all(this.walkTokens(c,s.walkTokens));let h=await(s.hooks?await s.hooks.provideParser():e?b.parse:b.parseInline)(c,s);return s.hooks?await s.hooks.postprocess(h):h})().catch(a);try{s.hooks&&(n=s.hooks.preprocess(n));let u=(s.hooks?s.hooks.provideLexer():e?x.lex:x.lexInline)(n,s);s.hooks&&(u=s.hooks.processAllTokens(u)),s.walkTokens&&this.walkTokens(u,s.walkTokens);let c=(s.hooks?s.hooks.provideParser():e?b.parse:b.parseInline)(u,s);return s.hooks&&(c=s.hooks.postprocess(c)),c}catch(o){return a(o)}}}onError(e,t){return n=>{if(n.message+=`
Please report this to https://github.com/markedjs/marked.`,e){let r="<p>An error occurred:</p><pre>"+O(n.message+"",!0)+"</pre>";return t?Promise.resolve(r):r}if(t)return Promise.reject(n);throw n}}};var M=new A;function g(l,e){return M.parse(l,e)}g.options=g.setOptions=function(l){return M.setOptions(l),g.defaults=M.defaults,N(g.defaults),g};g.getDefaults=_;g.defaults=R;g.use=function(...l){return M.use(...l),g.defaults=M.defaults,N(g.defaults),g};g.walkTokens=function(l,e){return M.walkTokens(l,e)};g.parseInline=M.parseInline;g.Parser=b;g.parser=b.parse;g.Renderer=y;g.TextRenderer=S;g.Lexer=x;g.lexer=x.lex;g.Tokenizer=w;g.Hooks=P;g.parse=g;var pt=g.options,ct=g.setOptions,ht=g.use,kt=g.walkTokens,dt=g.parseInline,gt=g,ft=b.parse,mt=x.lex;

if(__exports != exports)module.exports = exports;return module.exports})();

return view.extend({
    render: function() {
        let aiConfig = {
            apiKey: localStorage.getItem('chawrt_deepseek_key') || '',
            apiUrl: 'https://api.deepseek.com/chat/completions',
            model: 'deepseek-flash',
            temperature: 0.3
        };

        let messages = [
            { role: 'system', content: systemPrompt }
        ];

        // Container
        const container = E('div', {
            'class': 'cbi-map clawwrt-container',
            'style': 'max-width: 1080px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;'
        });

        // Top Header
        const header = E('div', {
            'style': 'display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: #fff; padding: 18px 24px; border-radius: 12px; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);'
        }, [
            E('div', { 'style': 'display: flex; align-items: center; gap: 14px;' }, [
                E('div', {
                    'style': 'width: 44px; height: 44px; border-radius: 10px; background: #3b82f6; display: flex; align-items: center; justify-content: center; font-size: 24px; box-shadow: 0 0 15px rgba(59,130,246,0.5);'
                }, '🍵'),
                E('div', {}, [
                    E('div', { 'style': 'font-size: 20px; font-weight: 700; letter-spacing: -0.5px;' }, '小茶助手 · chaWrt'),
                    E('div', { 'style': 'font-size: 13px; color: #94a3b8; display: flex; align-items: center; gap: 8px;' }, [
                        E('span', {
                            'id': 'ai-status-pill',
                            'style': 'display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #10b981;'
                        }),
                        E('span', { 'id': 'ai-status-text' }, '本地就绪 · DeepSeek-V4 (Flash) 驱动')
                    ])
                ])
            ]),
            E('div', { 'style': 'display: flex; gap: 10px;' }, [
                E('button', {
                    'class': 'btn cbi-button cbi-button-neutral',
                    'style': 'background: #334155; color: #f1f5f9; border: none; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 13px;',
                    'click': function() { openSettingsModal(); }
                }, '⚙️ 设置 API Key'),
                E('button', {
                    'class': 'btn cbi-button cbi-button-reset',
                    'style': 'background: #475569; color: #f1f5f9; border: none; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 13px;',
                    'click': function() { resetChat(); }
                }, '🧹 清空对话')
            ])
        ]);

        // Metrics Bar: Focused on real-time Internet Connectivity & Status
        const metricsBar = E('div', {
            'id': 'metrics-bar',
            'style': 'display: grid; grid-template-columns: minmax(320px, 2fr) repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 16px;'
        }, [
            // Card 1: Main Internet Status Card (Highlighted, Big Status)
            E('div', {
                'id': 'metric-internet',
                'class': 'metric-tile',
                'style': 'background: var(--cw-bg-card); border: 1px solid var(--cw-border); border-radius: 12px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; box-shadow: var(--cw-card-shadow); transition: all 0.3s ease;'
            }, [
                E('div', {}, [
                    E('div', { 'style': 'font-size: 12px; color: #64748b; font-weight: 600; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;' }, [
                        E('span', {}, '🌐'),
                        E('span', {}, '外网上网状态 (实时)')
                    ]),
                    E('div', {
                        'id': 'net-status-title',
                        'style': 'font-size: 17px; font-weight: 800; color: var(--cw-text-main); display: flex; align-items: center; gap: 8px;'
                    }, [
                        E('span', {
                            'id': 'net-status-dot',
                            'style': 'display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #94a3b8; transition: all 0.3s;'
                        }),
                        E('span', { 'id': 'net-status-text' }, '正在检测网络连通性...')
                    ]),
                    E('div', {
                        'id': 'net-status-desc',
                        'style': 'font-size: 12px; color: var(--cw-text-muted); margin-top: 4px;'
                    }, '正在通过本地链路探测外网响应与 DNS...')
                ]),
                E('button', {
                    'id': 'btn-refresh-net',
                    'class': 'btn cbi-button',
                    'style': 'background: var(--cw-bg-secondary); color: var(--cw-text-main); border: 1px solid var(--cw-border); padding: 6px 12px; border-radius: 8px; font-size: 12px; cursor: pointer; white-space: nowrap;',
                    'click': function() { refreshMetrics(true); }
                }, '🔄 重新测速')
            ]),
            // Card 2: LAN & Connected Clients
            renderMetricCard('📱 在线终端设备', '检测中...', '网关: 192.168.8.1', 'devices'),
            // Card 3: Router Health & Hardware
            renderMetricCard('🖥️ 路由器硬件与负载', '加载中...', 'CPU: - | 内存: -', 'hardware')
        ]);

        // Chat Box
        const chatWindow = E('div', {
            'id': 'chat-window',
            'style': 'background: var(--cw-bg-chat); border: 1px solid var(--cw-border); border-radius: 12px; height: 500px; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.06);'
        });

        // Categorized Quick Action Cards
        const quickCategories = [
            {
                id: 'popular',
                name: '🔥 常用精选',
                cards: [
                    { label: '📊 路由器健康体检', query: '对这台路由器进行健康巡检，汇报系统负载、内存剩余、开机时长与网络状态' },
                    { label: '🌐 测试外网连通与延迟', query: '帮我全面测试路由器当前能否正常上网，检测外网延迟、丢包率与 DNS 解析情况' },
                    { label: '📱 查看当前连接设备', query: '当前局域网连接了哪些手机、电脑或终端？列出它们的 IP、MAC 和主机名' },
                    { label: '🔍 穿透连通性深度检测', query: '帮我深度检测内网穿透当前是否正常运行，检查 xfrpc 是否已经真正连上了远端 frps 服务端，查看连接套接字、日志与公网访问链接' },
                    { label: '⚡ 硬件加速状态', query: '查看当前路由器的硬件加速（MediaTek PPE 硬件流量分流）运行状态与硬件流表' },
                    { label: '🚀 实时流量与流控', query: '查看当前局域网各终端设备的实时上下行网速与智能流控限速状态' },
                    { label: '🔀 智能分流与加速域名', query: '查看智能分流 xdns 的运行状态、eBPF 拦截统计、动态劫持 IP 以及当前分流加速的域名列表' },
                    { label: '🛡️ 门户认证与白名单', query: '查看当前门户认证 wifidogx 的运行状态、云端连接、在线用户及免认证 MAC 白名单' }
                ]
            },
            {
                id: 'diagnostics',
                name: '🌐 诊断与终端',
                cards: [
                    { label: '📊 路由器健康体检', query: '对这台路由器进行健康巡检，汇报系统负载、内存剩余、开机时长与网络状态' },
                    { label: '🌐 测试外网连通与延迟', query: '帮我全面测试路由器当前能否正常上网，检测外网延迟、丢包率与 DNS 解析情况' },
                    { label: '🛠️ 为什么部分网页打不开？', query: '如果遇到部分网页打不开或网络卡顿，请帮我排查原因并给出排查建议' },
                    { label: '📱 查看当前连接设备', query: '当前局域网连接了哪些手机、电脑或终端？列出它们的 IP、MAC 和主机名' },
                    { label: '📶 查看当前 WiFi 密码', query: '查看当前路由器的 WiFi 名称与密码配置' },
                    { label: '🔧 修改 WiFi 密码', query: '帮我把 WiFi 密码修改为 12345678' }
                ]
            },
            {
                id: 'qos_ppe',
                name: '🚀 流控与硬件加速',
                cards: [
                    { label: '⚡ 硬件加速状态', query: '查看当前路由器的硬件加速（MediaTek PPE 硬件流量分流）运行状态与硬件流表' },
                    { label: '🚀 开启硬件加速', query: '帮我开启路由器的硬件加速功能，提升千兆转发吞吐并降低 CPU 占用' },
                    { label: '🛑 关闭硬件加速', query: '帮我关闭硬件加速功能，让所有流量走标准协议栈与 eBPF 处理' },
                    { label: '🚀 实时流量与流控', query: '查看当前局域网各终端设备的实时上下行网速与智能流控限速状态' },
                    { label: '📊 Top 10 应用与流速排行', query: '查看当前路由器各 L7 应用协议的实时流速排行榜（如 SSH、HTTP、WebRTC、微信等）以及访问最多的域名 Top 10' },
                    { label: '🛑 设备智能限速', query: '帮我把当前占用带宽的主机设置智能限速' }
                ]
            },
            {
                id: 'accel_divert',
                name: '⚡ 网络加速与分流',
                cards: [
                    { label: '⚡ 网络加速与隧道', query: '查看网络加速 xkcptun 当前连接的加速节点、模式、往返延迟以及所有活跃加速隧道与连接' },
                    { label: '🚀 VPS 安装 xkcptun 服务端 (deb)', query: '我想在我的远程 Linux VPS 上通过官方 deb 包自动安装并部署 xkcptun 加速服务端，并建立网络加速' },
                    { label: '🔀 智能分流与加速域名', query: '查看智能分流 xdns 的运行状态、eBPF 拦截统计、动态劫持 IP 以及当前分流加速的域名列表' },
                    { label: '➕ 分流添加域名', query: '帮我把 claude.ai 添加到智能分流加速域名名单中' },
                    { label: '🔄 刷新分流与重载', query: '帮我清空内核 eBPF 动态分流 IP 缓存并重新加载分流域名规则' },
                    { label: '📈 分流拦截与统计', query: '查看当前智能分流 xdns 的实时 DNS 拦截与数据包转发统计' },
                    { label: '🔍 透明代理活跃会话', query: '查看当前智能分流透明代理重定向的所有活跃 TCP 会话跟踪' }
                ]
            },
            {
                id: 'penetration',
                name: '🌍 内网穿透与远程',
                cards: [
                    { label: '🔍 穿透连通性深度检测', query: '帮我深度检测内网穿透当前是否正常运行，检查 xfrpc 是否已经真正连上了远端 frps 服务端，查看连接套接字、日志与公网访问链接' },
                    { label: '🖥️ 纳管远程免密服务器', query: '查看已纳管的远程免密服务器（VPS）列表与连通性状态，并指导我如何添加新的 VPS' },
                    { label: '🔑 查看路由器 SSH 公钥', query: '查看路由器专属的 SSH 免密公钥与一键授权命令' },
                    { label: '🌐 VPS 一键内网穿透', query: '我想把这台路由器穿透到我自己的 VPS 上，请帮我通过 SSH 免密方式在 VPS 上自动部署服务端并连通' },
                    { label: '📋 穿透映射规则清单', query: '查看当前配置的所有内网穿透映射规则及对应的公网访问链接' },
                    { label: '➕ 新建内网穿透映射', query: '帮我新增一条内网穿透映射规则，将本地 80 端口映射到公网' },
                    { label: '🔐 IPsec VPN 状态', query: '查看 StrongSwan IPsec VPN 的配置与对端网关' }
                ]
            },
            {
                id: 'portal',
                name: '🛡️ 门户认证与门禁',
                cards: [
                    { label: '🛡️ 门户认证与白名单', query: '查看当前门户认证 wifidogx 的运行状态、云端连接、在线用户及免认证 MAC 白名单' },
                    { label: '🚪 门禁规则与在线终端', query: '查询当前门户认证在线认证客户端、黑白名单与免认证放行域名' },
                    { label: '➕ 免认证放行域名', query: '帮我把 autoupdate.example.com 添加到门户免认证放行域名中' },
                    { label: '➕ 添加免认证 MAC', query: '帮我把 MAC 地址 00:11:22:33:44:55 添加到免认证通行白名单中' }
                ]
            }
        ];

        let currentCategory = localStorage.getItem('clawwrt_quick_category') || 'popular';
        let isChipsCollapsed = localStorage.getItem('clawwrt_quick_collapsed') === 'true';

        const categoryTabsContainer = E('div', {
            'class': 'quick-cat-tabs-bar',
            'style': 'display: flex; gap: 6px; align-items: center; overflow-x: auto; -webkit-overflow-scrolling: touch; padding: 2px 0;'
        });

        const chipsDeck = E('div', {
            'id': 'quick-chips-deck',
            'style': 'display: flex; flex-wrap: wrap; gap: 8px;'
        });

        const toggleBtn = E('button', {
            'class': 'quick-toggle-btn',
            'type': 'button',
            'style': 'background: transparent; border: none; color: var(--cw-text-muted); font-size: 11px; cursor: pointer; padding: 3px 6px; border-radius: 4px; white-space: nowrap; user-select: none;',
            'click': function(e) {
                e.stopPropagation();
                isChipsCollapsed = !isChipsCollapsed;
                localStorage.setItem('clawwrt_quick_collapsed', isChipsCollapsed ? 'true' : 'false');
                updateChipsVisibility();
            }
        });

        function updateChipsVisibility() {
            if (isChipsCollapsed) {
                chipsDeck.style.display = 'none';
                toggleBtn.textContent = '展开卡片 ▾';
                toggleBtn.title = '展开快捷指令卡片';
            } else {
                chipsDeck.style.display = 'flex';
                toggleBtn.textContent = '收起卡片 ▴';
                toggleBtn.title = '折叠快捷指令卡片';
            }
        }

        function renderCategoryDeck(catId) {
            currentCategory = catId;
            localStorage.setItem('clawwrt_quick_category', catId);

            const tabs = categoryTabsContainer.querySelectorAll('.quick-cat-tab');
            tabs.forEach(tab => {
                if (tab.getAttribute('data-cat-id') === catId) {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });

            while (chipsDeck.firstChild) {
                chipsDeck.removeChild(chipsDeck.firstChild);
            }

            const cat = quickCategories.find(c => c.id === catId) || quickCategories[0];
            cat.cards.forEach(card => {
                chipsDeck.appendChild(renderChip(card.label, card.query));
            });

            if (isChipsCollapsed) {
                isChipsCollapsed = false;
                localStorage.setItem('clawwrt_quick_collapsed', 'false');
                updateChipsVisibility();
            }
        }

        quickCategories.forEach(cat => {
            const tabBtn = E('button', {
                'class': 'quick-cat-tab' + (cat.id === currentCategory ? ' active' : ''),
                'type': 'button',
                'data-cat-id': cat.id,
                'click': function(e) {
                    e.preventDefault();
                    renderCategoryDeck(cat.id);
                }
            }, cat.name);
            categoryTabsContainer.appendChild(tabBtn);
        });

        renderCategoryDeck(currentCategory);
        updateChipsVisibility();

        // Quick action chips container
        const quickChips = E('div', {
            'id': 'quick-chips',
            'style': 'display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;'
        }, [
            E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; gap: 8px; border-bottom: 1px dashed var(--cw-border); padding-bottom: 6px;' }, [
                categoryTabsContainer,
                toggleBtn
            ]),
            chipsDeck
        ]);

        // Input Area
        const inputArea = E('div', {
            'style': 'background: var(--cw-bg-card); border: 1px solid var(--cw-border); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 8px; box-shadow: var(--cw-card-shadow);'
        }, [
            quickChips,
            E('div', { 'style': 'display: flex; gap: 10px; align-items: flex-end;' }, [
                E('textarea', {
                    'id': 'chat-input',
                    'placeholder': '用自然语言对路由器下达指令（如：“帮我测试外网延迟”、“开启透明代理”...）回车发送',
                    'style': 'flex: 1; border: none; resize: none; outline: none; font-size: 14px; min-height: 48px; max-height: 120px; line-height: 1.5; font-family: inherit; background: transparent; color: var(--cw-input-text);',
                    'keydown': function(e) {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                        }
                    }
                }),
                E('button', {
                    'id': 'send-btn',
                    'class': 'btn cbi-button cbi-button-apply',
                    'style': 'padding: 10px 22px; font-size: 14px; font-weight: 600; border-radius: 8px; background: #2563eb; color: #fff; cursor: pointer; transition: background 0.2s;',
                    'click': function() { sendMessage(); }
                }, '发送 ➔')
            ])
        ]);

        
        // Inject Enhanced Markdown CSS
        const mdStyle = E('style', {}, `
            /* Xiaocha Assistant - Adaptive Dark & Light Theme System */
            :root, .cbi-map.clawwrt-container {
                --cw-bg-page: #f8fafc;
                --cw-bg-card: #ffffff;
                --cw-bg-secondary: #f1f5f9;
                --cw-bg-subtle: #f8fafc;
                --cw-bg-chat: #ffffff;
                --cw-bg-ai-msg: #ffffff;
                --cw-text-main: #0f172a;
                --cw-text-muted: #64748b;
                --cw-text-sub: #475569;
                --cw-border: #e2e8f0;
                --cw-border-strong: #cbd5e1;
                --cw-input-bg: #ffffff;
                --cw-input-text: #0f172a;
                --cw-chip-bg: #eff6ff;
                --cw-chip-text: #1d4ed8;
                --cw-chip-border: #bfdbfe;
                --cw-chip-hover-bg: #dbeafe;
                --cw-code-bg: #1e293b;
                --cw-code-text: #f8fafc;
                --cw-inline-code-bg: rgba(15, 23, 42, 0.08);
                --cw-inline-code-text: #0f172a;
                --cw-table-bg: #ffffff;
                --cw-table-th-bg: #f1f5f9;
                --cw-table-tr-alt: #f8fafc;
                --cw-table-tr-hover: #eff6ff;
                --cw-blockquote-bg: #eff6ff;
                --cw-blockquote-text: #1e40af;
                --cw-blockquote-border: #3b82f6;
                --cw-card-shadow: 0 2px 6px rgba(0,0,0,0.03);
                --cw-header-bg: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                --cw-modal-bg: #ffffff;
                --cw-modal-text: #0f172a;
            }

            @media (prefers-color-scheme: dark) {
                :root, .cbi-map.clawwrt-container {
                    --cw-bg-page: #1e1e1e;
                    --cw-bg-card: #252526;
                    --cw-bg-secondary: #2d2d30;
                    --cw-bg-subtle: #1e1e1e;
                    --cw-bg-chat: #1e1e1e;
                    --cw-bg-ai-msg: #252526;
                    --cw-text-main: #cccccc;
                    --cw-text-muted: #94a3b8;
                    --cw-text-sub: #cbd5e1;
                    --cw-border: #3c3c3c;
                    --cw-border-strong: #4a4a4f;
                    --cw-input-bg: #1e1e1e;
                    --cw-input-text: #cccccc;
                    --cw-chip-bg: #2d2d30;
                    --cw-chip-text: #93c5fd;
                    --cw-chip-border: #3c3c3c;
                    --cw-chip-hover-bg: #3b4252;
                    --cw-code-bg: #18181b;
                    --cw-code-text: #38bdf8;
                    --cw-inline-code-bg: rgba(255, 255, 255, 0.12);
                    --cw-inline-code-text: #38bdf8;
                    --cw-table-bg: #252526;
                    --cw-table-th-bg: #2d2d30;
                    --cw-table-tr-alt: #1e1e1e;
                    --cw-table-tr-hover: #333338;
                    --cw-blockquote-bg: rgba(59, 130, 246, 0.15);
                    --cw-blockquote-text: #93c5fd;
                    --cw-blockquote-border: #3b82f6;
                    --cw-card-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    --cw-header-bg: linear-gradient(135deg, #18181b 0%, #09090b 100%);
                    --cw-modal-bg: #252526;
                    --cw-modal-text: #cccccc;
                }
            }

            body.dark, html[data-theme="dark"], .clawwrt-dark, [data-theme="dark"] .cbi-map.clawwrt-container, body.dark .cbi-map.clawwrt-container {
                --cw-bg-page: #1e1e1e;
                --cw-bg-card: #252526;
                --cw-bg-secondary: #2d2d30;
                --cw-bg-subtle: #1e1e1e;
                --cw-bg-chat: #1e1e1e;
                --cw-bg-ai-msg: #252526;
                --cw-text-main: #cccccc;
                --cw-text-muted: #94a3b8;
                --cw-text-sub: #cbd5e1;
                --cw-border: #3c3c3c;
                --cw-border-strong: #4a4a4f;
                --cw-input-bg: #1e1e1e;
                --cw-input-text: #cccccc;
                --cw-chip-bg: #2d2d30;
                --cw-chip-text: #93c5fd;
                --cw-chip-border: #3c3c3c;
                --cw-chip-hover-bg: #3b4252;
                --cw-code-bg: #18181b;
                --cw-code-text: #38bdf8;
                --cw-inline-code-bg: rgba(255, 255, 255, 0.12);
                --cw-inline-code-text: #38bdf8;
                --cw-table-bg: #252526;
                --cw-table-th-bg: #2d2d30;
                --cw-table-tr-alt: #1e1e1e;
                --cw-table-tr-hover: #333338;
                --cw-blockquote-bg: rgba(59, 130, 246, 0.15);
                --cw-blockquote-text: #93c5fd;
                --cw-blockquote-border: #3b82f6;
                --cw-card-shadow: 0 4px 12px rgba(0,0,0,0.3);
                --cw-header-bg: linear-gradient(135deg, #18181b 0%, #09090b 100%);
                --cw-modal-bg: #252526;
                --cw-modal-text: #cccccc;
            }

            .chat-bubble { max-width: 85%; padding: 12px 16px; border-radius: 12px; font-size: 14px; line-height: 1.6; word-break: break-word; }
            .chat-bubble.assistant-bubble { background: var(--cw-bg-ai-msg); color: var(--cw-text-main); border: 1px solid var(--cw-border); border-top-left-radius: 2px; box-shadow: var(--cw-card-shadow); }
            .chat-bubble.user-bubble { background: #2563eb; color: #ffffff; border-top-right-radius: 2px; box-shadow: 0 2px 6px rgba(37,99,235,0.2); }
            .chat-bubble.user-bubble * { color: #ffffff !important; }
            
            /* Table Styling */
            .chat-bubble table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; background: var(--cw-table-bg); border: 1px solid var(--cw-border); border-radius: 8px; overflow: hidden; box-shadow: var(--cw-card-shadow); }
            .chat-bubble th { background: var(--cw-table-th-bg); color: var(--cw-text-main); font-weight: 700; text-align: left; padding: 10px 14px; border-bottom: 2px solid var(--cw-border); border-right: 1px solid var(--cw-border); }
            .chat-bubble th:last-child { border-right: none; }
            .chat-bubble td { padding: 9px 14px; border-bottom: 1px solid var(--cw-border); border-right: 1px solid var(--cw-border); color: var(--cw-text-main); }
            .chat-bubble td:last-child { border-right: none; }
            .chat-bubble tr:last-child td { border-bottom: none; }
            .chat-bubble tr:nth-child(even) td { background: var(--cw-table-tr-alt); }
            .chat-bubble tr:hover td { background: var(--cw-table-tr-hover); }
            
            /* Code & Block */
            .chat-bubble pre { background: var(--cw-code-bg); color: var(--cw-code-text); padding: 12px 16px; border-radius: 8px; overflow-x: auto; margin: 10px 0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12.5px; line-height: 1.5; border: 1px solid var(--cw-border); }
            .chat-bubble code { background: var(--cw-inline-code-bg); color: var(--cw-inline-code-text); padding: 2px 6px; border-radius: 4px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 88%; }
            .chat-bubble pre code { background: transparent; color: inherit; padding: 0; font-size: inherit; }
            
            /* Lists & Typography */
            .chat-bubble ul, .chat-bubble ol { margin: 8px 0; padding-left: 22px; }
            .chat-bubble li { margin: 4px 0; }
            .chat-bubble blockquote { border-left: 4px solid var(--cw-blockquote-border); margin: 10px 0; padding: 8px 14px; background: var(--cw-blockquote-bg); color: var(--cw-blockquote-text); border-radius: 0 8px 8px 0; }
            .chat-bubble h1, .chat-bubble h2, .chat-bubble h3, .chat-bubble h4 { color: var(--cw-text-main); margin: 14px 0 6px 0; font-weight: 700; }
            .chat-bubble h1 { font-size: 17px; border-bottom: 1px solid var(--cw-border); padding-bottom: 4px; }
            .chat-bubble h2 { font-size: 15px; }
            .chat-bubble h3 { font-size: 14px; }
            .chat-bubble p { margin: 6px 0; }
            .chat-bubble p:first-child { margin-top: 0; }
            .chat-bubble p:last-child { margin-bottom: 0; }
            .chat-bubble hr { border: none; border-top: 1px solid var(--cw-border); margin: 12px 0; }
            .chat-bubble a { color: #60a5fa; text-decoration: underline; }

            .quick-cat-tabs-bar::-webkit-scrollbar { height: 3px; }
            .quick-cat-tabs-bar::-webkit-scrollbar-thumb { background: var(--cw-border); border-radius: 3px; }

            .quick-cat-tab {
                background: var(--cw-bg-secondary);
                color: var(--cw-text-muted);
                border: 1px solid var(--cw-border);
                border-radius: 6px;
                padding: 3px 9px;
                font-size: 11.5px;
                cursor: pointer;
                transition: all 0.2s;
                white-space: nowrap;
                user-select: none;
                font-weight: 500;
                line-height: 1.4;
            }
            .quick-cat-tab:hover {
                color: var(--cw-text-main);
                border-color: #3b82f6;
                background: var(--cw-chip-hover-bg);
            }
            .quick-cat-tab.active {
                background: #2563eb !important;
                border-color: #2563eb !important;
                color: #ffffff !important;
                font-weight: 600;
                box-shadow: 0 2px 6px rgba(37,99,235,0.25);
            }
            .quick-toggle-btn:hover {
                color: #3b82f6 !important;
            }

            .quick-chip-item:hover {
                background: var(--cw-chip-hover-bg) !important;
                border-color: #3b82f6 !important;
            }

            /* Custom Modal Styles for Dark Mode Compatibility */
            .clawwrt-dark-modal {
                background: var(--cw-modal-bg) !important;
                color: var(--cw-modal-text) !important;
                border: 1px solid var(--cw-border) !important;
            }
        `);
        container.appendChild(mdStyle);

        container.appendChild(header);
        container.appendChild(metricsBar);
        container.appendChild(chatWindow);
        container.appendChild(inputArea);

        // Helper: Metric Card
        function renderMetricCard(title, val1, val2, type) {
            return E('div', {
                'class': 'metric-tile metric-tile-sub metric-tile-' + type,
                'style': 'background: var(--cw-bg-card); border: 1px solid var(--cw-border); border-radius: 12px; padding: 14px 18px; box-shadow: var(--cw-card-shadow); display: flex; flex-direction: column; justify-content: center;'
            }, [
                E('div', { 'style': 'font-size: 12px; color: var(--cw-text-muted); font-weight: 600;' }, title),
                E('div', { 'class': 'metric-val1', 'style': 'font-size: 16px; font-weight: 700; color: var(--cw-text-main); margin: 4px 0;' }, val1),
                E('div', { 'class': 'metric-val2', 'style': 'font-size: 12px; color: var(--cw-text-muted);' }, val2)
            ]);
        }

        // Helper: Chip
        function renderChip(label, query) {
            return E('div', {
                'class': 'quick-chip-item', 'style': 'background: var(--cw-chip-bg); color: var(--cw-chip-text); border: 1px solid var(--cw-chip-border); border-radius: 20px; padding: 5px 12px; font-size: 12px; cursor: pointer; transition: all 0.2s; user-select: none;',
                'click': function() {
                    const input = document.getElementById('chat-input');
                    if (input) {
                        input.value = query;
                        sendMessage();
                    }
                }
            }, label);
        }

        // Chat History Persistence (localStorage)
        let chatHistory = [];
        try {
            const savedHistory = localStorage.getItem('chawrt_chat_history');
            if (savedHistory) {
                chatHistory = JSON.parse(savedHistory) || [];
            }
        } catch (e) {
            chatHistory = [];
        }

        function saveHistory(role, content) {
            try {
                chatHistory.push({ role: role, content: content });
                if (chatHistory.length > 50) {
                    chatHistory = chatHistory.slice(-50);
                }
                localStorage.setItem('chawrt_chat_history', JSON.stringify(chatHistory));
            } catch (e) {}
        }

        // Append initial greeting
        function appendGreeting(saveToStorage) {
            const greetingText = `👋 **您好！我是您的路由器「小茶助手」🍵。**\n\n取名源自 **chaWrt** 的「茶」字，寓意让网络运维如烹茶品茗般从容轻松。\n\n我已为您实时监控当前路由器的**外网上网状态**、**在线设备连接**与**系统健康状况**。当您遇到上不了网、网络卡顿，或者想查看连接设备与配置时，都可以直接在下方用日常口语吩咐我，无需去翻找复杂的 LuCI 菜单！\n\n您可以点击下方的快捷指令或直接提问开始体验：`;
            appendMessage('assistant', greetingText, saveToStorage);
        }

        // Append Message to Chat Window
        function appendMessage(role, text, shouldSave) {
            const isUser = (role === 'user');
            const wrapper = E('div', {
                'style': `display: flex; gap: 12px; ${isUser ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}`
            });

            const avatar = E('div', {
                'style': `width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 18px; ${isUser ? 'background: #3b82f6; color: white; order: 2;' : 'background: #0f172a; color: white;'}`
            }, isUser ? '👤' : '🍵');

            const bubble = E('div', {
                'class': 'chat-bubble ' + (isUser ? 'user-bubble' : 'assistant-bubble'),
                'style': `max-width: 80%; padding: 12px 16px; border-radius: 12px; font-size: 14px; line-height: 1.6; word-break: break-word; ${isUser ? 'background: #2563eb; color: #ffffff; border-top-right-radius: 2px;' : 'background: var(--cw-bg-ai-msg); color: var(--cw-text-main); border-top-left-radius: 2px; border: 1px solid var(--cw-border);'}`
            });

            bubble.innerHTML = formatMarkdown(text);

            wrapper.appendChild(avatar);
            wrapper.appendChild(bubble);
            chatWindow.appendChild(wrapper);
            chatWindow.scrollTop = chatWindow.scrollHeight;

            if (shouldSave !== false) {
                saveHistory(role, text);
            }

            return bubble;
        }

        // Restore History on View Load
        function restoreChatHistory() {
            chatWindow.innerHTML = '';
            if (chatHistory && chatHistory.length > 0) {
                chatHistory.forEach(item => {
                    appendMessage(item.role, item.content, false);
                    if (item.role === 'user' || item.role === 'assistant') {
                        messages.push({ role: item.role, content: item.content });
                    }
                });
            } else {
                appendGreeting(true);
            }
        }

        // Tool status indicator (Clear observability of luci.clawwrt ubus calls)
        function appendToolIndicator(toolName, argSummary) {
            const label = argSummary ? `${toolName}(${argSummary})` : toolName;
            const indicator = E('div', {
                'class': 'tool-call-indicator',
                'style': 'display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--cw-text-muted); background: var(--cw-bg-secondary); padding: 8px 14px; border-radius: 8px; border: 1px solid var(--cw-border); margin: 4px 0; width: fit-content; max-width: 90%;'
            }, [
                E('div', { 'class': 'indicator-header', 'style': 'display: flex; align-items: center; gap: 8px;' }, [
                    E('span', { 'style': 'font-size: 14px;' }, '⚙️'),
                    E('span', { 'class': 'indicator-text' }, `执行系统总线调用: ubus call luci.clawwrt ${label}`)
                ])
            ]);
            chatWindow.appendChild(indicator);
            chatWindow.scrollTop = chatWindow.scrollHeight;
            return indicator;
        }

        // Append Diff proposal card
        function appendDiffCard(param) {
            const card = E('div', {
                'style': 'background: var(--cw-bg-card); border: 2px solid #f59e0b; border-radius: 10px; padding: 14px 18px; margin: 10px 0; color: var(--cw-text-main); box-shadow: var(--cw-card-shadow); font-size: 13px;'
            }, [
                E('div', { 'style': 'font-weight: 700; font-size: 14px; margin-bottom: 6px; color: #b45309; display: flex; align-items: center; gap: 6px;' }, [
                    '🛡️ 待确认配置修改提案 (Human-in-the-Loop)'
                ]),
                E('div', { 'style': 'margin-bottom: 8px;' }, `说明: ${param.explanation || '用户请求修改配置'}`),
                E('div', { 'style': 'background: var(--cw-bg-subtle); border: 1px solid var(--cw-border); padding: 8px 12px; border-radius: 6px; font-family: monospace; font-size: 12px; margin-bottom: 12px; color: var(--cw-text-main);' }, [
                    E('div', {}, `配置文件: ${param.package}.${param.section}.${param.option}`),
                    E('div', { 'style': 'color: #15803d; font-weight: 700;' }, `目标新值: "${param.value}"`),
                    param.reload_service ? E('div', { 'style': 'color: #6b7280;' }, `生效动作: 重载服务 [${param.reload_service}]`) : ''
                ]),
                E('div', { 'style': 'display: flex; gap: 10px;' }, [
                    E('button', {
                        'class': 'btn cbi-button cbi-button-apply',
                        'style': 'background: #16a34a; color: #fff; border: none; padding: 6px 16px; border-radius: 6px; cursor: pointer; font-size: 12px;',
                        'click': function(ev) {
                            const btn = ev.target;
                            btn.disabled = true;
                            btn.innerText = '正在应用...';
                            callUciApply(param.package, param.section, param.option, param.value, param.reload_service).then(res => {
                                btn.innerText = '✅ 已成功应用并生效';
                                btn.style.background = '#4b5563';
                                appendMessage('assistant', `✅ 已经成功将配置 \`${param.package}.${param.section}.${param.option} = ${param.value}\` 应用至路由器${param.reload_service ? '，并已重载 ' + param.reload_service + ' 服务' : ''}！`);
                                refreshMetrics();
                            }).catch(err => {
                                btn.innerText = '❌ 写入失败';
                                appendMessage('assistant', `❌ 配置写入失败: ${err.message}`);
                            });
                        }
                    }, '✅ 授权并立即应用'),
                    E('button', {
                        'class': 'btn cbi-button cbi-button-reset',
                        'style': 'background: var(--cw-bg-secondary); color: var(--cw-text-main); border: 1px solid var(--cw-border); padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px;',
                        'click': function(ev) {
                            card.remove();
                            appendMessage('assistant', '已取消本次配置修改提案。路由器设置未发生变化。');
                        }
                    }, '❌ 取消')
                ])
            ]);
            chatWindow.appendChild(card);
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }

        
        // Append WiFi Configuration Card (Rich Interactive Widget)
        
        // Append Core Service Configuration Card
        function appendServiceCard(param) {
            const svcNames = {
                'wifidogx': { name: '门户认证 (wifidogx)', icon: '🛡️', color: '#0284c7' },
                'xfrpc': { name: '内网穿透 (xfrpc)', icon: '🔗', color: '#7c3aed' },
                'xkcptun': { name: '网络加速 (xkcptun)', icon: '⚡', color: '#ea580c' },
                'xdns': { name: '智能分流 (xdns)', icon: '🔀', color: '#059669' },
                'ipsec': { name: 'StrongSwan IPsec VPN', icon: '🔐', color: '#dc2626' }
            };

            const svcInfo = svcNames[param.service] || { name: param.service, icon: '⚙️', color: '#2563eb' };
            const card = E('div', {
                'class': 'service-config-card',
                'style': `background: var(--cw-bg-card); border: 2px solid ${svcInfo.color}; border-radius: 12px; padding: 16px 20px; margin: 12px 0; box-shadow: var(--cw-card-shadow);`
            }, [
                E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;' }, [
                    E('div', { 'style': `font-weight: 700; font-size: 15px; color: #0f172a; display: flex; align-items: center; gap: 8px;` }, [
                        E('span', { 'style': 'font-size: 18px;' }, svcInfo.icon),
                        E('span', {}, svcInfo.name)
                    ]),
                    E('span', { 'style': `background: #f1f5f9; color: ${svcInfo.color}; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 700; border: 1px solid #cbd5e1;` }, param.action_title || '配置变更')
                ]),
                E('div', { 'style': 'font-size: 13px; color: #475569; margin-bottom: 12px;' }, param.explanation || '用户请求修改该服务配置。'),
                
                // Parameter Overview Table
                E('div', { 'style': 'background: var(--cw-bg-subtle); border: 1px solid var(--cw-border); border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; font-size: 13px; color: var(--cw-text-main);' }, [
                    param.enabled !== undefined ? E('div', { 'style': 'margin-bottom: 4px;' }, [
                        E('strong', {}, '服务状态：'),
                        param.enabled === '1' ? E('span', { 'style': 'color: #16a34a; font-weight: 700;' }, '🟢 开启服务') : E('span', { 'style': 'color: #dc2626; font-weight: 700;' }, '🔴 关闭服务')
                    ]) : '',
                    param.server_addr ? E('div', { 'style': 'margin-bottom: 4px;' }, [E('strong', {}, '服务器地址：'), E('code', {}, param.server_addr)]) : '',
                    param.server_port ? E('div', { 'style': 'margin-bottom: 4px;' }, [E('strong', {}, '服务器端口：'), E('code', {}, param.server_port)]) : '',
                    param.token ? E('div', { 'style': 'margin-bottom: 4px;' }, [E('strong', {}, '认证 Token：'), E('code', {}, param.token)]) : '',
                    param.key ? E('div', { 'style': 'margin-bottom: 4px;' }, [E('strong', {}, '密钥 Key：'), E('code', {}, param.key)]) : '',
                    param.mode ? E('div', { 'style': 'margin-bottom: 4px;' }, [E('strong', {}, '运行模式：'), E('span', {}, param.mode)]) : '',
                    param.fec !== undefined ? E('div', { 'style': 'margin-bottom: 4px;' }, [E('strong', {}, 'FEC 抗丢包：'), param.fec === '1' ? '已开启 FEC (前向纠错)' : '已关闭 FEC']) : '',
                    param.sndwnd ? E('div', { 'style': 'margin-bottom: 4px;' }, [E('strong', {}, '发送/接收窗口：'), `${param.sndwnd} / ${param.rcvwnd || param.sndwnd}`]) : '',
                    param.datashard ? E('div', { 'style': 'margin-bottom: 4px;' }, [E('strong', {}, 'FEC 分片比例：'), `${param.datashard} 数据 + ${param.parityshard || 3} 冗余`]) : '',
                    param.xkcp_dns ? E('div', { 'style': 'margin-bottom: 4px;' }, [E('strong', {}, 'DNS 加速端点：'), E('code', {}, param.xkcp_dns)]) : '',
                    param.xkcp_tcp ? E('div', { 'style': 'margin-bottom: 4px;' }, [E('strong', {}, 'TCP 加速端点：'), E('code', {}, param.xkcp_tcp)]) : '',
                    param.gateway ? E('div', { 'style': 'margin-bottom: 4px;' }, [E('strong', {}, '对端网关：'), E('code', {}, param.gateway)]) : '',
                    param.disable_portal_auth !== undefined ? E('div', { 'style': 'margin-bottom: 4px;' }, [E('strong', {}, '免认证直通：'), param.disable_portal_auth === '1' ? '已开启免认证' : '已关闭 (强制认证)']) : '',
                    param.wired_passed !== undefined ? E('div', { 'style': 'margin-bottom: 4px;' }, [E('strong', {}, '有线免认证：'), param.wired_passed === '1' ? '有线免认证' : '有线也需认证']) : '',
                    param.auth_server_mode ? E('div', { 'style': 'margin-bottom: 4px;' }, [E('strong', {}, '认证模式：'), E('span', {}, param.auth_server_mode === 'cloud' ? '云端认证 (Cloud)' : '本地认证 (Local)')]) : ''
                ]),

                // Action Buttons
                E('div', { 'style': 'display: flex; gap: 10px;' }, [
                    E('button', {
                        'class': 'btn cbi-button cbi-button-apply',
                        'style': `background: ${svcInfo.color}; color: #fff; border: none; padding: 8px 20px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;`,
                        'click': function(ev) {
                            const btn = ev.target;
                            btn.disabled = true;
                            btn.innerText = '⏳ 正在写入配置并重启服务...';
                            
                            callSetServiceDetail(
                                param.service,
                                param.enabled,
                                param.server_addr,
                                param.server_port,
                                param.key,
                                param.token,
                                param.mode,
                                param.gateway,
                                param.disable_portal_auth,
                                param.wired_passed,
                                param.auth_server_mode,
                                param.fec,
                                param.sndwnd,
                                param.rcvwnd,
                                param.datashard,
                                param.parityshard,
                                param.xkcp_dns,
                                param.xkcp_tcp,
                                param.ifname
                            ).then(res => {
                                if (res && res.success) {
                                    btn.innerText = '✅ 配置已生效';
                                    btn.style.background = '#16a34a';
                                    appendMessage('assistant', `🎉 **[${svcInfo.name}] 配置已成功更新并生效！**\n\n${res.message || '服务已完成重载运行。'}`);
                                } else {
                                    btn.innerText = '❌ 执行失败: ' + (res.message || '未知错误');
                                    btn.style.background = '#dc2626';
                                }
                            }).catch(err => {
                                btn.innerText = '❌ 写入失败';
                                appendMessage('assistant', `❌ 服务配置写入失败: ${err.message}`);
                            });
                        }
                    }, '✅ 确认并立即应用'),
                    E('button', {
                        'class': 'btn cbi-button cbi-button-reset',
                        'style': 'background: var(--cw-bg-secondary); color: var(--cw-text-main); border: 1px solid var(--cw-border); padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px;',
                        'click': function() {
                            card.remove();
                            appendMessage('assistant', `已取消对 [${svcInfo.name}] 的修改提案。服务保持原配置运行。`);
                        }
                    }, '❌ 取消')
                ])
            ]);

            chatWindow.appendChild(card);
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }

        function appendXdnsDomainCard(param) {
            const isAdd = (param.action === 'add');
            const isDel = (param.action === 'remove' || param.action === 'del');
            const isClearIps = (param.action === 'clear_ips' || param.action === 'flush');
            const isReload = (param.action === 'reload');

            let actionText = '智能分流规则调整';
            let actionColor = '#059669';
            let confirmBtnText = '✅ 确认操作';
            let targetLabel = '目标域名：';
            let targetVal = param.domain || '全量规则';
            let detailDesc = '';

            if (isAdd) {
                actionText = '新增加速分流域名';
                actionColor = '#059669';
                confirmBtnText = '✅ 确认添加到分流表';
                detailDesc = '确认后将立即注入内核 eBPF 动态分流表，该域名的后续 DNS 与 TCP 流量将走抗丢包加速通道。';
            } else if (isDel) {
                actionText = '移除加速域名';
                actionColor = '#dc2626';
                confirmBtnText = '🗑️ 确认移除该域名';
                detailDesc = '确认后将从内核分流表及规则文件中移除，恢复标准直连。';
            } else if (isClearIps) {
                actionText = '清空内核分流 IP 缓存';
                actionColor = '#d97706';
                confirmBtnText = '🧹 确认清空 IP 缓存';
                targetLabel = '清理范围：';
                targetVal = '内核 eBPF 动态劫持 IP 集合 (xdns_ip_set)';
                detailDesc = '清空当前内核中所有已解析学习的劫持 IP 映射，后续访问将重新触发分流 DNS 解析。';
            } else if (isReload) {
                actionText = '重载分流域名规则';
                actionColor = '#2563eb';
                confirmBtnText = '🔄 确认重载规则';
                targetLabel = '规则来源：';
                targetVal = '/etc/xdns/proxy_domains.txt';
                detailDesc = '从持久化规则文件全量重新加载所有域名至内核 eBPF 表，并清除历史动态 IP 缓存。';
            }

            const card = E('div', {
                'class': 'xdns-domain-card',
                'style': `background: var(--cw-bg-card); border: 2px solid ${actionColor}; border-radius: 12px; padding: 16px 20px; margin: 12px 0; box-shadow: var(--cw-card-shadow);`
            }, [
                E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;' }, [
                    E('div', { 'style': 'font-weight: 700; font-size: 15px; color: #0f172a; display: flex; align-items: center; gap: 8px;' }, [
                        E('span', { 'style': 'font-size: 18px;' }, '🔀'),
                        E('span', {}, '智能分流 (xdns) 规则调整')
                    ]),
                    E('span', { 'style': `background: #f1f5f9; color: ${actionColor}; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 700; border: 1px solid #cbd5e1;` }, actionText)
                ]),
                E('div', { 'style': 'font-size: 13px; color: #475569; margin-bottom: 12px;' }, param.explanation || `用户请求${actionText}。`),
                E('div', { 'style': 'background: var(--cw-bg-subtle); border: 1px solid var(--cw-border); border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; font-size: 13px; color: var(--cw-text-main);' }, [
                    E('div', { 'style': 'margin-bottom: 4px;' }, [
                        E('strong', {}, targetLabel),
                        E('code', { 'style': 'font-weight: 700; font-size: 14px; color: #0284c7;' }, targetVal)
                    ]),
                    E('div', { 'style': 'font-size: 12px; color: var(--cw-text-muted);' }, detailDesc)
                ]),
                E('div', { 'style': 'display: flex; gap: 10px;' }, [
                    E('button', {
                        'class': 'btn cbi-button cbi-button-apply',
                        'style': `background: ${actionColor}; color: #fff; border: none; padding: 8px 20px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;`,
                        'click': function(ev) {
                            const btn = ev.target;
                            btn.disabled = true;
                            btn.innerText = '⏳ 正在提交内核生效...';
                            callManageXdnsDomain(param.action, param.domain || '').then(res => {
                                if (res && res.success) {
                                    btn.innerText = '✅ 操作已生效';
                                    btn.style.background = '#16a34a';
                                    appendMessage('assistant', `🎉 **智能分流管理操作成功！**\n\n• **目标**：\`${targetVal}\`\n• **动作**：${actionText}\n• **结果**：${res.message || '内核与持久化配置已同步更新。'}\n• **当前加速域名总数**：${res.total_domains !== undefined ? res.total_domains : '已更新'}`);
                                } else {
                                    btn.innerText = '❌ 执行失败: ' + (res.message || '未知错误');
                                    btn.style.background = '#dc2626';
                                }
                            }).catch(err => {
                                btn.innerText = '❌ 写入失败';
                                appendMessage('assistant', `❌ 智能分流操作失败: ${err.message}`);
                            });
                        }
                    }, confirmBtnText),
                    E('button', {
                        'class': 'btn cbi-button cbi-button-reset',
                        'style': 'background: var(--cw-bg-secondary); color: var(--cw-text-main); border: 1px solid var(--cw-border); padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px;',
                        'click': function() {
                            card.remove();
                            appendMessage('assistant', `已取消对 [${targetVal}] 的${actionText}提案。`);
                        }
                    }, '❌ 取消')
                ])
            ]);
            chatWindow.appendChild(card);
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }

        function appendXkcptunTunnelCard(param) {
            const isAdd = (param.action === 'add' || param.action === 'set');
            const isDel = (param.action === 'remove' || param.action === 'del');
            const isEnable = (param.action === 'enable');
            const isDisable = (param.action === 'disable');

            let actionText = '管理加速隧道';
            let actionColor = '#ea580c';
            let confirmBtnText = '✅ 确认操作';
            let icon = '⚡';

            if (isAdd) {
                actionText = '新增/修改加速隧道';
                actionColor = '#ea580c';
                confirmBtnText = '✅ 确认添加并应用';
                icon = '➕';
            } else if (isDel) {
                actionText = '删除网络加速隧道';
                actionColor = '#dc2626';
                confirmBtnText = '🗑️ 确认删除该隧道';
                icon = '🗑️';
            } else if (isEnable) {
                actionText = '启用加速隧道';
                actionColor = '#16a34a';
                confirmBtnText = '▶️ 确认启用隧道';
                icon = '▶️';
            } else if (isDisable) {
                actionText = '停用加速隧道';
                actionColor = '#d97706';
                confirmBtnText = '⏸️ 确认停用隧道';
                icon = '⏸️';
            }

            const card = E('div', {
                'class': 'xkcptun-tunnel-card',
                'style': `background: var(--cw-bg-card); border: 2px solid ${actionColor}; border-radius: 12px; padding: 16px 20px; margin: 12px 0; box-shadow: var(--cw-card-shadow);`
            }, [
                E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;' }, [
                    E('div', { 'style': 'font-weight: 700; font-size: 15px; color: #0f172a; display: flex; align-items: center; gap: 8px;' }, [
                        E('span', { 'style': 'font-size: 18px;' }, icon),
                        E('span', {}, '网络加速 (xkcptun) 隧道变更')
                    ]),
                    E('span', { 'style': `background: #f1f5f9; color: ${actionColor}; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 700; border: 1px solid #cbd5e1;` }, actionText)
                ]),
                E('div', { 'style': 'font-size: 13px; color: #475569; margin-bottom: 12px;' }, param.explanation || `用户请求${actionText}。`),
                E('div', { 'style': 'background: var(--cw-bg-subtle); border: 1px solid var(--cw-border); border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; font-size: 13px; color: var(--cw-text-main);' }, [
                    E('div', { 'style': 'margin-bottom: 4px;' }, [E('strong', {}, '隧道名称：'), E('code', {}, param.tunnel_name || '新隧道')]),
                    param.proto ? E('div', { 'style': 'margin-bottom: 4px;' }, [E('strong', {}, '协议类型：'), E('span', { 'style': 'text-transform: uppercase; font-weight: 700;' }, param.proto)]) : '',
                    param.proxy_type ? E('div', { 'style': 'margin-bottom: 4px;' }, [E('strong', {}, '代理类型：'), E('span', {}, param.proxy_type === 'redir' ? '透明代理 (redir)' : '端口转发 (forward)')]) : '',
                    param.local_port ? E('div', { 'style': 'margin-bottom: 4px;' }, [E('strong', {}, '本地监听端口：'), E('code', {}, param.local_port)]) : '',
                    param.target_addr ? E('div', { 'style': 'margin-bottom: 4px;' }, [E('strong', {}, '转发目标地址：'), E('code', { 'color': '#ea580c', 'font-weight': 700 }, `${param.target_addr}:${param.target_port || ''}`)]) : ''
                ]),
                E('div', { 'style': 'display: flex; gap: 10px;' }, [
                    E('button', {
                        'class': 'btn cbi-button cbi-button-apply',
                        'style': `background: ${actionColor}; color: #fff; border: none; padding: 8px 20px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;`,
                        'click': function(ev) {
                            const btn = ev.target;
                            btn.disabled = true;
                            btn.innerText = '⏳ 正在提交并重启 xkcptun...';
                            callManageXkcptunTunnel(
                                param.action,
                                param.tunnel_name,
                                param.proto,
                                param.proxy_type,
                                param.local_port,
                                param.local_interface,
                                param.target_addr,
                                param.target_port,
                                param.enabled
                            ).then(res => {
                                if (res && res.success) {
                                    btn.innerText = '✅ 操作已生效';
                                    btn.style.background = '#16a34a';
                                    appendMessage('assistant', `🎉 **网络加速隧道调整成功！**\n\n• **隧道**：\`${param.tunnel_name}\`\n• **动作**：${actionText}\n• **结果**：${res.message || '服务配置已更新并重启生效。'}`);
                                } else {
                                    btn.innerText = '❌ 执行失败: ' + (res.message || '未知错误');
                                    btn.style.background = '#dc2626';
                                }
                            }).catch(err => {
                                btn.innerText = '❌ 写入失败';
                                appendMessage('assistant', `❌ 加速隧道操作失败: ${err.message}`);
                            });
                        }
                    }, confirmBtnText),
                    E('button', {
                        'class': 'btn cbi-button cbi-button-reset',
                        'style': 'background: var(--cw-bg-secondary); color: var(--cw-text-main); border: 1px solid var(--cw-border); padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px;',
                        'click': function() {
                            card.remove();
                            appendMessage('assistant', `已取消对加速隧道 [${param.tunnel_name || '未指定'}] 的操作提案。`);
                        }
                    }, '❌ 取消')
                ])
            ]);
            chatWindow.appendChild(card);
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }

        function appendPortalAccessCard(param) {
            let actionText = '调整门禁设置';
            let actionColor = '#0284c7';
            let icon = '🛡️';
            let targetLabel = '目标对象：';
            let targetVal = param.mac || param.target || param.domain || '未指定';
            let impactDesc = '将更新热点门户通行规则。';

            switch (param.action) {
                case 'add_whitelist':
                case 'add':
                    actionText = '加入免认证白名单';
                    actionColor = '#0284c7';
                    icon = '🛡️';
                    targetLabel = '终端 MAC 地址：';
                    impactDesc = '加入白名单后，该终端在连接热点 WiFi 时直接放行外网，无需通过 Web 网页认证。';
                    break;
                case 'del_whitelist':
                case 'remove':
                case 'del':
                    actionText = '移出免认证白名单';
                    actionColor = '#dc2626';
                    icon = '🛡️';
                    targetLabel = '终端 MAC 地址：';
                    impactDesc = '移出白名单后，该终端连接 WiFi 将恢复强制认证页面。';
                    break;
                case 'add_blacklist':
                    actionText = '拉黑终端并即时阻断';
                    actionColor = '#dc2626';
                    icon = '🚫';
                    targetLabel = '拉黑 MAC 地址：';
                    impactDesc = '拉黑后将立即将该设备踢下线，且防火墙直接阻断其上网数据包，彻底禁止接入！';
                    break;
                case 'del_blacklist':
                    actionText = '解除终端黑名单';
                    actionColor = '#16a34a';
                    icon = '✅';
                    targetLabel = '解除 MAC 地址：';
                    impactDesc = '从黑名单中解除后，该设备可重新通过网页认证上网。';
                    break;
                case 'kick_client':
                    actionText = '强制踢下线并清除认证';
                    actionColor = '#ea580c';
                    icon = '⚡';
                    targetLabel = '下线目标 (MAC/IP)：';
                    impactDesc = '执行后该设备将被立即踢掉，所有活跃 TCP 会话全部中断，必须重新登录网页认证。';
                    break;
                case 'add_domain':
                    actionText = '放行免认证信任域名';
                    actionColor = '#8b5cf6';
                    icon = '🌐';
                    targetLabel = '放行域名：';
                    impactDesc = '放行后所有连接热点的设备在认证前即可免登录直接访问该域名及其子域。';
                    break;
                case 'del_domain':
                    actionText = '取消域名免认证放行';
                    actionColor = '#dc2626';
                    icon = '🌐';
                    targetLabel = '移除域名：';
                    impactDesc = '取消放行后，访问该域名需先通过门户网页认证。';
                    break;
            }

            const card = E('div', {
                'class': 'portal-access-card',
                'style': `background: var(--cw-bg-card); border: 2px solid ${actionColor}; border-radius: 12px; padding: 16px 20px; margin: 12px 0; box-shadow: var(--cw-card-shadow);`
            }, [
                E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;' }, [
                    E('div', { 'style': 'font-weight: 700; font-size: 15px; color: #0f172a; display: flex; align-items: center; gap: 8px;' }, [
                        E('span', { 'style': 'font-size: 18px;' }, icon),
                        E('span', {}, '门户认证 (wifidogx) 门禁操作提案')
                    ]),
                    E('span', { 'style': `background: #f1f5f9; color: ${actionColor}; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 700; border: 1px solid #cbd5e1;` }, actionText)
                ]),
                E('div', { 'style': 'font-size: 13px; color: #475569; margin-bottom: 12px;' }, param.explanation || `用户请求${actionText}。`),
                E('div', { 'style': 'background: var(--cw-bg-subtle); border: 1px solid var(--cw-border); border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; font-size: 13px; color: var(--cw-text-main);' }, [
                    E('div', { 'style': 'margin-bottom: 4px;' }, [
                        E('strong', {}, targetLabel),
                        E('code', { 'style': 'font-weight: 700; font-size: 14px; color: #7c3aed;' }, targetVal)
                    ]),
                    E('div', { 'style': 'font-size: 12px; color: var(--cw-text-muted);' }, impactDesc)
                ]),
                E('div', { 'style': 'display: flex; gap: 10px;' }, [
                    E('button', {
                        'class': 'btn cbi-button cbi-button-apply',
                        'style': `background: ${actionColor}; color: #fff; border: none; padding: 8px 20px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;`,
                        'click': function(ev) {
                            const btn = ev.target;
                            btn.disabled = true;
                            btn.innerText = '⏳ 正在下发门户指令并热重载...';
                            callManagePortalAccess(param.action, param.mac || '', param.domain || '', param.target || '', '', '').then(res => {
                                if (res && res.success) {
                                    btn.innerText = '✅ 操作已执行生效';
                                    btn.style.background = '#16a34a';
                                    appendMessage('assistant', `🎉 **门户认证管理操作成功！**\n\n• **目标**：\`${targetVal}\`\n• **动作**：${actionText}\n• **结果**：${res.message || '指令已成功下发生效。'}`);
                                } else {
                                    btn.innerText = '❌ 执行失败: ' + (res.message || '未知错误');
                                    btn.style.background = '#dc2626';
                                }
                            }).catch(err => {
                                btn.innerText = '❌ 操作失败';
                                appendMessage('assistant', `❌ 门户管理操作失败: ${err.message}`);
                            });
                        }
                    }, `✅ 确认${actionText}`),
                    E('button', {
                        'class': 'btn cbi-button cbi-button-reset',
                        'style': 'background: var(--cw-bg-secondary); color: var(--cw-text-main); border: 1px solid var(--cw-border); padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px;',
                        'click': function() {
                            card.remove();
                            appendMessage('assistant', `已取消对 [${targetVal}] 的${actionText}操作。`);
                        }
                    }, '❌ 取消')
                ])
            ]);
            chatWindow.appendChild(card);
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }

        function appendPortalWhitelistCard(param) {
            appendPortalAccessCard(param);
        }

        function appendPenetrationProxyCard(param) {
            const isAdd = (param.action === 'add' || param.action === 'set');
            const isDel = (param.action === 'remove' || param.action === 'del');
            const isEnable = (param.action === 'enable');
            const isDisable = (param.action === 'disable');

            let actionText = '管理穿透规则';
            let actionColor = '#7c3aed';
            let confirmBtnText = '✅ 确认操作';
            let icon = '🔗';

            if (isAdd) {
                actionText = '新增/修改穿透映射';
                actionColor = '#7c3aed';
                confirmBtnText = '✅ 确认添加并应用';
                icon = '➕';
            } else if (isDel) {
                actionText = '删除穿透映射规则';
                actionColor = '#dc2626';
                confirmBtnText = '🗑️ 确认删除该规则';
                icon = '🗑️';
            } else if (isEnable) {
                actionText = '启用穿透映射规则';
                actionColor = '#16a34a';
                confirmBtnText = '▶️ 确认启用规则';
                icon = '▶️';
            } else if (isDisable) {
                actionText = '停用穿透映射规则';
                actionColor = '#d97706';
                confirmBtnText = '⏸️ 确认停用规则';
                icon = '⏸️';
            }

            const card = E('div', {
                'class': 'penetration-proxy-card',
                'style': `background: var(--cw-bg-card); border: 2px solid ${actionColor}; border-radius: 12px; padding: 16px 20px; margin: 12px 0; box-shadow: var(--cw-card-shadow);`
            }, [
                E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;' }, [
                    E('div', { 'style': 'font-weight: 700; font-size: 15px; color: #0f172a; display: flex; align-items: center; gap: 8px;' }, [
                        E('span', { 'style': 'font-size: 18px;' }, icon),
                        E('span', {}, '内网穿透 (xfrpc) 规则变更')
                    ]),
                    E('span', { 'style': `background: #f1f5f9; color: ${actionColor}; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 700; border: 1px solid #cbd5e1;` }, actionText)
                ]),
                E('div', { 'style': 'font-size: 13px; color: #475569; margin-bottom: 12px;' }, param.explanation || `用户请求${actionText}。`),
                E('div', { 'style': 'background: var(--cw-bg-subtle); border: 1px solid var(--cw-border); border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; font-size: 13px; color: var(--cw-text-main);' }, [
                    E('div', { 'style': 'margin-bottom: 4px;' }, [E('strong', {}, '规则名称：'), E('code', {}, param.rule_name || '新规则')]),
                    param.proxy_type ? E('div', { 'style': 'margin-bottom: 4px;' }, [E('strong', {}, '协议类型：'), E('span', { 'style': 'text-transform: uppercase; font-weight: 700;' }, param.proxy_type)]) : '',
                    param.local_port ? E('div', { 'style': 'margin-bottom: 4px;' }, [E('strong', {}, '本地目标：'), E('code', {}, `${param.local_ip || '127.0.0.1'}:${param.local_port}`)]) : '',
                    param.remote_port ? E('div', { 'style': 'margin-bottom: 4px;' }, [E('strong', {}, '公网远程端口：'), E('code', { 'style': 'color: #7c3aed; font-weight: 700;' }, param.remote_port)]) : '',
                    param.custom_domains ? E('div', { 'style': 'margin-bottom: 4px;' }, [E('strong', {}, '自定义域名：'), E('code', { 'style': 'color: #0284c7; font-weight: 700;' }, param.custom_domains)]) : '',
                    param.subdomain ? E('div', { 'style': 'margin-bottom: 4px;' }, [E('strong', {}, '远程子域名：'), E('code', {}, param.subdomain)]) : '',
                    (param.use_encryption || param.use_compression) ? E('div', { 'style': 'margin-top: 6px; display: flex; gap: 6px;' }, [
                        param.use_encryption ? E('span', { 'style': 'background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;' }, '🔒 已启用传输加密') : '',
                        param.use_compression ? E('span', { 'style': 'background: #ecfdf5; color: #065f46; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;' }, '🗜️ 已启用数据压缩') : ''
                    ]) : ''
                ]),
                E('div', { 'style': 'display: flex; gap: 10px;' }, [
                    E('button', {
                        'class': 'btn cbi-button cbi-button-apply',
                        'style': `background: ${actionColor}; color: #fff; border: none; padding: 8px 20px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;`,
                        'click': function(ev) {
                            const btn = ev.target;
                            btn.disabled = true;
                            btn.innerText = '⏳ 正在保存配置并重启穿透...';
                            callManagePenetrationProxy(
                                param.action,
                                param.rule_name,
                                param.proxy_type || 'tcp',
                                param.local_ip || '127.0.0.1',
                                param.local_port,
                                param.remote_port,
                                param.subdomain,
                                param.custom_domains,
                                param.use_encryption ? '1' : '0',
                                param.use_compression ? '1' : '0'
                            ).then(res => {
                                if (res && res.success) {
                                    btn.innerText = '✅ 穿透规则已生效';
                                    btn.style.background = '#16a34a';
                                    appendMessage('assistant', `🎉 **内网穿透规则已成功应用！**\n\n• **规则名称**：\`${param.rule_name}\`\n• **动作**：${actionText}\n• **结果**：${res.message || '服务已重载运行。'}`);
                                } else {
                                    btn.innerText = '❌ 执行失败: ' + (res.message || '未知错误');
                                    btn.style.background = '#dc2626';
                                }
                            }).catch(err => {
                                btn.innerText = '❌ 写入失败';
                                appendMessage('assistant', `❌ 穿透规则更新失败: ${err.message}`);
                            });
                        }
                    }, confirmBtnText),
                    E('button', {
                        'class': 'btn cbi-button cbi-button-reset',
                        'style': 'background: var(--cw-bg-secondary); color: var(--cw-text-main); border: 1px solid var(--cw-border); padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px;',
                        'click': function() {
                            card.remove();
                            appendMessage('assistant', `已取消对穿透规则 [${param.rule_name}] 的操作。现有规则保持原样运行。`);
                        }
                    }, '❌ 取消')
                ])
            ]);
            chatWindow.appendChild(card);
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }

        function appendWifiCard(param) {
            const bandLabel = (param.band === '2g') ? '2.4G 专属' : (param.band === '5g') ? '5G 专属' : '双频同步 (2.4G + 5G)';
            
            const card = E('div', {
                'class': 'wifi-config-card',
                'style': 'background: var(--cw-bg-card); border: 2px solid #2563eb; border-radius: 12px; padding: 16px 20px; margin: 12px 0; box-shadow: var(--cw-card-shadow);'
            }, [
                E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;' }, [
                    E('div', { 'style': 'font-weight: 700; font-size: 15px; color: #1e3a8a; display: flex; align-items: center; gap: 8px;' }, [
                        E('span', { 'style': 'font-size: 18px;' }, '📶'),
                        E('span', {}, 'WiFi 无线网络变更授权')
                    ]),
                    E('span', { 'style': 'background: #dbeafe; color: #1d4ed8; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;' }, bandLabel)
                ]),
                E('div', { 'style': 'font-size: 13px; color: var(--cw-text-sub); margin-bottom: 12px;' }, param.explanation || '用户请求修改当前无线网络配置。'),
                
                // Form Fields
                E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;' }, [
                    E('div', {}, [
                        E('label', { 'style': 'display: block; font-size: 12px; font-weight: 600; color: var(--cw-text-main); margin-bottom: 4px;' }, 'WiFi 名称 (SSID):'),
                        E('input', {
                            'id': 'wifi-card-ssid',
                            'type': 'text',
                            'class': 'cbi-input-text',
                            'style': 'width: 100%; border: 1px solid var(--cw-border); background: var(--cw-input-bg); color: var(--cw-input-text); border-radius: 6px; padding: 6px 10px; font-size: 13px;',
                            'value': param.ssid || ''
                        })
                    ]),
                    E('div', {}, [
                        E('label', { 'style': 'display: block; font-size: 12px; font-weight: 600; color: var(--cw-text-main); margin-bottom: 4px;' }, 'WiFi 密码 (至少8位):'),
                        E('input', {
                            'id': 'wifi-card-key',
                            'type': 'text',
                            'class': 'cbi-input-text',
                            'style': 'width: 100%; border: 1px solid var(--cw-border); background: var(--cw-input-bg); color: var(--cw-input-text); border-radius: 6px; padding: 6px 10px; font-size: 13px; font-family: monospace;',
                            'value': param.key || ''
                        })
                    ])
                ]),
                
                // Friendly Note
                E('div', {
                    'style': 'background: var(--cw-bg-subtle); border-left: 4px solid #f59e0b; padding: 8px 12px; font-size: 12px; color: #d97706; border-radius: 0 6px 6px 0; margin-bottom: 14px;'
                }, '⚠️ 提示：点击应用后无线网卡将重新广播，已连接的手机/电脑将短暂断开并需使用新密码重新连接。有线网口不受影响。'),
                
                // Action Buttons
                E('div', { 'style': 'display: flex; gap: 10px;' }, [
                    E('button', {
                        'class': 'btn cbi-button cbi-button-apply',
                        'style': 'background: #2563eb; color: #fff; border: none; padding: 8px 20px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;',
                        'click': function(ev) {
                            const btn = ev.target;
                            const curSsid = card.querySelector('#wifi-card-ssid').value.trim();
                            const curKey = card.querySelector('#wifi-card-key').value.trim();
                            
                            if (curKey && curKey.length < 8) {
                                alert('WiFi 密码长度不能少于 8 位！');
                                return;
                            }
                            
                            btn.disabled = true;
                            btn.innerText = '⏳ 正在写入配置并重新发射 WiFi...';
                            
                            callSetWifiConfig(param.band || 'all', curSsid, curKey, param.enabled || '1').then(res => {
                                if (res && res.success) {
                                    btn.innerText = '✅ WiFi 已生效并成功广播';
                                    btn.style.background = '#16a34a';
                                    card.style.borderColor = '#16a34a';
                                    appendMessage('assistant', `🎉 **WiFi 配置修改成功并已立即生效！**\n\n• **频段**：${bandLabel}\n• **WiFi 名称**：\`${curSsid || '保持原样'}\`\n• **WiFi 密码**：\`${curKey || '保持原样'}\`\n\n无线网卡已重新加载，请在手机或电脑的 WiFi 列表中选择新热点并连接。`);
                                } else {
                                    btn.innerText = '❌ 修改失败: ' + (res.message || '未知错误');
                                    btn.style.background = '#dc2626';
                                }
                            }).catch(err => {
                                btn.innerText = '❌ 写入失败';
                                appendMessage('assistant', `❌ WiFi 配置写入失败: ${err.message}`);
                            });
                        }
                    }, '✅ 确认并立即应用'),
                    E('button', {
                        'class': 'btn cbi-button cbi-button-reset',
                        'style': 'background: var(--cw-bg-secondary); color: var(--cw-text-main); border: 1px solid var(--cw-border); padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px;',
                        'click': function() {
                            card.remove();
                            appendMessage('assistant', '已取消本次 WiFi 配置变更。现有 WiFi 正常运行中。');
                        }
                    }, '❌ 取消')
                ])
            ]);
            
            chatWindow.appendChild(card);
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }

        function appendQosCard(param) {
            const targetIp = param.target || '';
            const isAll = (targetIp === 'all');
            const hostName = isAll ? '全网所有在线设备 (全局)' : (param.hostname || '终端设备');
            const defaultDl = (param.dl_mbps !== undefined && param.dl_mbps !== null) ? parseInt(param.dl_mbps) : 10;
            const defaultUl = (param.ul_mbps !== undefined && param.ul_mbps !== null) ? parseInt(param.ul_mbps) : 2;
            const hasTime = (param.weekdays || param.timestart || param.timestop);
            
            const card = E('div', {
                'class': 'qos-config-card',
                'style': 'background: var(--cw-bg-card); border: 2px solid #0284c7; border-radius: 12px; padding: 16px 20px; margin: 12px 0; box-shadow: var(--cw-card-shadow);'
            }, [
                E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;' }, [
                    E('div', { 'style': 'font-weight: 700; font-size: 15px; color: #0369a1; display: flex; align-items: center; gap: 8px;' }, [
                        E('span', { 'style': 'font-size: 18px;' }, '⚡'),
                        E('span', {}, 'eBPF 智能流控与限速授权')
                    ]),
                    E('span', { 'style': 'background: #e0f2fe; color: #0284c7; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;' }, '内核硬件加速 TC-eBPF')
                ]),
                E('div', { 'style': 'font-size: 13px; color: var(--cw-text-sub); margin-bottom: 12px;' }, [
                    E('span', {}, param.explanation || '用户请求对指定设备设置智能流控限速规则。'),
                    E('div', { 'style': 'margin-top: 6px; font-weight: 600; color: var(--cw-text-main);' }, [
                        E('span', {}, `目标终端：${hostName} `),
                        E('code', { 'style': 'background: var(--cw-bg-secondary); padding: 2px 6px; border-radius: 4px; color: var(--cw-text-main); border: 1px solid var(--cw-border);' }, targetIp)
                    ]),
                    hasTime ? E('div', { 'style': 'margin-top: 6px; font-size: 12px; color: #0284c7; font-weight: 600;' }, [
                        E('span', {}, '⏰ 定时规则：'),
                        E('span', { 'style': 'background: #e0f2fe; padding: 2px 8px; border-radius: 4px;' }, `${param.weekdays || '每天'} ${param.timestart || '00:00'} ~ ${param.timestop || '23:59'}`)
                    ]) : ''
                ]),
                
                // Form Fields
                E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;' }, [
                    E('div', {}, [
                        E('label', { 'style': 'display: block; font-size: 12px; font-weight: 600; color: var(--cw-text-main); margin-bottom: 4px;' }, '下行限速 (下载带宽 Mbps，0为不限速):'),
                        E('input', {
                            'id': 'qos-card-dl',
                            'type': 'number',
                            'min': '0',
                            'class': 'cbi-input-text',
                            'style': 'width: 100%; border: 1px solid var(--cw-border); background: var(--cw-input-bg); color: var(--cw-input-text); border-radius: 6px; padding: 6px 10px; font-size: 13px;',
                            'value': defaultDl
                        })
                    ]),
                    E('div', {}, [
                        E('label', { 'style': 'display: block; font-size: 12px; font-weight: 600; color: var(--cw-text-main); margin-bottom: 4px;' }, '上行限速 (上传带宽 Mbps，0为不限速):'),
                        E('input', {
                            'id': 'qos-card-ul',
                            'type': 'number',
                            'min': '0',
                            'class': 'cbi-input-text',
                            'style': 'width: 100%; border: 1px solid var(--cw-border); background: var(--cw-input-bg); color: var(--cw-input-text); border-radius: 6px; padding: 6px 10px; font-size: 13px;',
                            'value': defaultUl
                        })
                    ])
                ]),

                // Quick Presets
                E('div', { 'style': 'display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px;' }, [
                    E('span', { 'style': 'font-size: 12px; color: var(--cw-text-muted); line-height: 24px;' }, '快捷预设：'),
                    E('button', {
                        'type': 'button',
                        'style': 'background: var(--cw-bg-secondary); color: var(--cw-text-main); border: 1px solid var(--cw-border); border-radius: 4px; padding: 2px 8px; font-size: 11px; cursor: pointer;',
                        'click': function() {
                            card.querySelector('#qos-card-dl').value = 0;
                            card.querySelector('#qos-card-ul').value = 0;
                        }
                    }, '🚀 解除限速 (0/0)'),
                    E('button', {
                        'type': 'button',
                        'style': 'background: var(--cw-bg-secondary); color: var(--cw-text-main); border: 1px solid var(--cw-border); border-radius: 4px; padding: 2px 8px; font-size: 11px; cursor: pointer;',
                        'click': function() {
                            card.querySelector('#qos-card-dl').value = 50;
                            card.querySelector('#qos-card-ul').value = 20;
                        }
                    }, '🎮 游戏电竞 (50M/20M)'),
                    E('button', {
                        'type': 'button',
                        'style': 'background: var(--cw-bg-secondary); color: var(--cw-text-main); border: 1px solid var(--cw-border); border-radius: 4px; padding: 2px 8px; font-size: 11px; cursor: pointer;',
                        'click': function() {
                            card.querySelector('#qos-card-dl').value = 20;
                            card.querySelector('#qos-card-ul').value = 5;
                        }
                    }, '📺 追剧视频 (20M/5M)'),
                    E('button', {
                        'type': 'button',
                        'style': 'background: var(--cw-bg-secondary); color: var(--cw-text-main); border: 1px solid var(--cw-border); border-radius: 4px; padding: 2px 8px; font-size: 11px; cursor: pointer;',
                        'click': function() {
                            card.querySelector('#qos-card-dl').value = 5;
                            card.querySelector('#qos-card-ul').value = 1;
                        }
                    }, '🐢 严格限制 (5M/1M)')
                ]),
                
                // Technical Note
                E('div', {
                    'style': 'background: var(--cw-bg-subtle); border-left: 4px solid #0284c7; padding: 8px 12px; font-size: 12px; color: #38bdf8; border-radius: 0 6px 6px 0; margin-bottom: 14px;'
                }, '⚡ chaWrt 智能流控采用 Linux 内核 TC eBPF 引擎，由 BPF Map 直接控制网络包调度，纳秒级生效且与 MediaTek PPE 硬件加速 Selective 联动。'),
                
                // Action Buttons
                E('div', { 'style': 'display: flex; gap: 10px;' }, [
                    E('button', {
                        'class': 'btn cbi-button cbi-button-apply',
                        'style': 'background: #0284c7; color: #fff; border: none; padding: 8px 20px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;',
                        'click': function(ev) {
                            const btn = ev.target;
                            const dlVal = parseInt(card.querySelector('#qos-card-dl').value) || 0;
                            const ulVal = parseInt(card.querySelector('#qos-card-ul').value) || 0;
                            
                            btn.disabled = true;
                            btn.innerText = '⏳ 正在下发 eBPF 规则...';
                            
                            callSetQosLimit(targetIp, dlVal, ulVal, param.weekdays, param.timestart, param.timestop).then(res => {
                                if (res && res.success) {
                                    btn.innerText = '✅ eBPF 限速已在内核生效';
                                    btn.style.background = '#16a34a';
                                    card.style.borderColor = '#16a34a';
                                    const actionText = (dlVal === 0 && ulVal === 0) 
                                        ? `🎉 **已成功解除设备 ${targetIp} 的流控限制！**\n\n该设备现已恢复全速网络吞吐。`
                                        : `🎉 **设备 ${targetIp} eBPF 智能流控已立即生效！**\n\n• **目标设备**：\`${targetIp}\` (${hostName})\n• **下行限速**：\`${dlVal} Mbps\`\n• **上行限速**：\`${ulVal} Mbps\`${param.weekdays ? `\n• **生效星期**：\`${param.weekdays}\`` : ''}${param.timestart ? `\n• **生效时段**：\`${param.timestart} ~ ${param.timestop}\`` : ''}\n\n内核 TC eBPF 模块已纳秒级更新流量调度策略。`;
                                    appendMessage('assistant', actionText);
                                } else {
                                    btn.innerText = '❌ 下发失败: ' + (res.message || '未知错误');
                                    btn.style.background = '#dc2626';
                                }
                            }).catch(err => {
                                btn.innerText = '❌ 写入失败';
                                appendMessage('assistant', `❌ eBPF 流控下发失败: ${err.message}`);
                            });
                        }
                    }, '✅ 确认并立即下发内核限速'),
                    E('button', {
                        'class': 'btn cbi-button cbi-button-reset',
                        'style': 'background: var(--cw-bg-secondary); color: var(--cw-text-main); border: 1px solid var(--cw-border); padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px;',
                        'click': function() {
                            card.remove();
                            appendMessage('assistant', `已取消对设备 [${targetIp}] 的流控限速提案。保持现有速率运行。`);
                        }
                    }, '❌ 取消')
                ])
            ]);
            
            chatWindow.appendChild(card);
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }

        // Append Hardware Acceleration Interactive Proposal Card
        function appendHwOffloadCard(param) {
            const isEnable = (param.enabled === '1' || param.enabled === true || param.mode === 'hw');
            const targetMode = param.mode || (isEnable ? 'hw' : 'off');
            const cardColor = isEnable ? '#16a34a' : '#d97706';
            const icon = isEnable ? '🚀' : '🛑';
            const title = isEnable ? '开启硬件加速 (MediaTek PPE 硬件 NAT 流分流)' : '关闭硬件加速 (标准协议栈转发)';

            const card = E('div', {
                'class': 'hwoffload-config-card',
                'style': `background: var(--cw-bg-card); border: 2px solid ${cardColor}; border-radius: 12px; padding: 16px 20px; margin: 12px 0; box-shadow: var(--cw-card-shadow);`
            }, [
                E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid var(--cw-border); padding-bottom: 8px;' }, [
                    E('div', { 'style': `font-weight: 700; font-size: 15px; color: var(--cw-text-main); display: flex; align-items: center; gap: 8px;` }, [
                        E('span', { 'style': 'font-size: 18px;' }, icon),
                        E('span', {}, title)
                    ]),
                    E('span', { 'style': `background: var(--cw-bg-secondary); color: ${cardColor}; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 700; border: 1px solid var(--cw-border);` }, isEnable ? '性能提升 · CPU 零负载' : '协议栈直通 · 便于排障')
                ]),
                E('div', { 'style': 'font-size: 13px; color: var(--cw-text-sub); margin-bottom: 12px; line-height: 1.5;' }, param.explanation || '用户请求调整路由器的硬件加速运行模式。'),

                // Parameter Overview Table
                E('div', { 'style': 'background: var(--cw-bg-subtle); border: 1px solid var(--cw-border); border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; font-size: 13px; color: var(--cw-text-main);' }, [
                    E('div', { 'style': 'margin-bottom: 6px; display: flex; justify-content: space-between;' }, [
                        E('span', { 'style': 'color: var(--cw-text-muted);' }, '目标动作：'),
                        isEnable
                            ? E('strong', { 'style': 'color: #16a34a;' }, '🟢 开启芯片级硬件加速 (MediaTek PPE)')
                            : E('strong', { 'style': 'color: #d97706;' }, '🛑 关闭硬件加速 (转为 Linux 标准协议栈)')
                    ]),
                    E('div', { 'style': 'margin-bottom: 6px; display: flex; justify-content: space-between;' }, [
                        E('span', { 'style': 'color: var(--cw-text-muted);' }, '底层机制：'),
                        E('span', {}, 'nftables flowtable offload 硬件流表分流')
                    ]),
                    E('div', { 'style': 'display: flex; justify-content: space-between;' }, [
                        E('span', { 'style': 'color: var(--cw-text-muted);' }, 'eBPF 协同机制：'),
                        E('span', { 'style': 'color: #0284c7; font-weight: 600;' }, 'chaWrt 独家 Selective PPE (限速主机走 eBPF，普通流量走硬件直通)')
                    ])
                ]),

                // Action Buttons
                E('div', { 'style': 'display: flex; gap: 10px;' }, [
                    E('button', {
                        'class': 'btn cbi-button cbi-button-apply',
                        'style': `background: ${cardColor}; color: #fff; border: none; padding: 8px 20px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;`,
                        'click': function(ev) {
                            const btn = ev.target;
                            btn.disabled = true;
                            btn.innerText = '⏳ 正在重载防火墙与流表规则...';

                            callSetHwOffload(isEnable ? '1' : '0', targetMode).then(res => {
                                if (res && res.success) {
                                    btn.innerText = '✅ 设置已生效';
                                    btn.style.background = '#16a34a';
                                    appendMessage('assistant', `🎉 **硬件加速已成功${isEnable ? '开启' : '关闭'}！**\n\n${res.message || '防火墙及硬件流表规则已重载生效。'}`);
                                    refreshMetrics(false);
                                } else {
                                    btn.innerText = '❌ 执行失败: ' + ((res && res.message) || '未知错误');
                                    btn.style.background = '#dc2626';
                                }
                            }).catch(err => {
                                btn.innerText = '❌ 写入失败';
                                appendMessage('assistant', `❌ 硬件加速配置失败: ${err.message}`);
                            });
                        }
                    }, isEnable ? '🚀 确认开启硬件加速' : '🛑 确认关闭硬件加速'),
                    E('button', {
                        'class': 'btn cbi-button cbi-button-reset',
                        'style': 'background: var(--cw-bg-secondary); color: var(--cw-text-main); border: 1px solid var(--cw-border); padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px;',
                        'click': function() {
                            card.remove();
                            appendMessage('assistant', '已取消硬件加速调整提案，保持当前配置运行。');
                        }
                    }, '❌ 取消')
                ])
            ]);

            chatWindow.appendChild(card);
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }

        // Append VPS Penetration Deployment Card (SSH Passwordless Automation)
        function appendVpsPenetrationCard(param) {
            const vpsIp = param.vps_ip || '';
            const vpsUser = param.vps_user || 'root';
            const vpsPort = param.vps_port || '22';
            const webPort = param.remote_web_port || '18000';

            const card = E('div', {
                'class': 'vps-penetration-card',
                'style': 'background: var(--cw-bg-card); border: 2px solid #7c3aed; border-radius: 12px; padding: 18px 20px; margin: 12px 0; box-shadow: var(--cw-card-shadow);'
            }, [
                E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid var(--cw-border); padding-bottom: 8px;' }, [
                    E('div', { 'style': 'font-weight: 700; font-size: 15px; color: var(--cw-text-main); display: flex; align-items: center; gap: 8px;' }, [
                        E('span', { 'style': 'font-size: 18px;' }, '🌐'),
                        E('span', {}, 'VPS 内网穿透一键部署 (SSH 免密自动化)')
                    ]),
                    E('span', { 'style': 'background: var(--cw-bg-secondary); color: #7c3aed; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 700; border: 1px solid var(--cw-border);' }, '🔐 纯公钥免密 · 零密码泄露')
                ]),
                E('div', { 'style': 'font-size: 13px; color: var(--cw-text-sub); margin-bottom: 14px; line-height: 1.5;' }, param.explanation || '用户请求通过 SSH 免密方式在云服务器 (VPS) 上全自动部署 frps 服务端并与路由器客户端 xfrpc 连通。'),

                // Step 1: VPS Authorization Command
                E('div', { 'style': 'background: var(--cw-bg-subtle); border: 1px solid var(--cw-border); border-radius: 8px; padding: 12px 14px; margin-bottom: 14px;' }, [
                    E('div', { 'style': 'font-weight: 700; font-size: 13px; color: var(--cw-text-main); margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;' }, [
                        E('span', {}, '第 1 步：在 VPS 终端执行免密授权命令'),
                        E('span', { 'id': 'vps-key-loading', 'style': 'font-size: 11px; color: var(--cw-text-muted); font-weight: normal;' }, '正在获取路由器公钥...')
                    ]),
                    E('div', { 'style': 'font-size: 12px; color: var(--cw-text-muted); margin-bottom: 6px;' }, '说明：请先通过 SSH 登录您的 VPS 终端（无论当前是 root 还是 ubuntu / debian 用户），粘贴并执行下方的一行授权命令即可：'),
                    E('div', { 'style': 'display: flex; gap: 8px; align-items: center;' }, [
                        E('textarea', {
                            'id': 'vps-auth-cmd',
                            'readonly': 'readonly',
                            'style': 'flex: 1; height: 52px; font-family: monospace; font-size: 11px; background: var(--cw-input-bg); color: var(--cw-input-text); border: 1px solid var(--cw-border); border-radius: 6px; padding: 6px 10px; resize: none; outline: none;',
                            'value': '正在生成路由器专属 Ed25519 密钥...'
                        }),
                        E('button', {
                            'type': 'button',
                            'id': 'btn-copy-auth-cmd',
                            'class': 'btn cbi-button',
                            'style': 'background: #7c3aed; color: #fff; border: none; padding: 8px 14px; border-radius: 6px; font-size: 12px; cursor: pointer; white-space: nowrap; font-weight: 600;',
                            'click': function(ev) {
                                const ta = card.querySelector('#vps-auth-cmd');
                                if (ta && ta.value) {
                                    if (navigator.clipboard && navigator.clipboard.writeText) {
                                        navigator.clipboard.writeText(ta.value);
                                    } else {
                                        ta.select();
                                        document.execCommand('copy');
                                    }
                                    ev.target.innerText = '✅ 已复制授权命令！';
                                    setTimeout(() => { ev.target.innerText = '📋 复制命令'; }, 3000);
                                }
                            }
                        }, '📋 复制命令')
                    ]),
                    E('div', { 'style': 'font-size: 11px; color: var(--cw-text-muted); margin-top: 6px; line-height: 1.4;' }, '💡 提示：该命令将公钥添加至您在 VPS 当前登录用户的 ~/.ssh/authorized_keys。若您当前登录的是 ubuntu、debian 等非 root 用户，请在第 2 步中将【SSH 用户名】填写为您登录的用户名（支持免密 sudo 自动部署）。')
                ]),

                // Step 2: VPS Connection & Proxy Parameters
                E('div', { 'style': 'background: var(--cw-bg-subtle); border: 1px solid var(--cw-border); border-radius: 8px; padding: 12px 14px; margin-bottom: 14px;' }, [
                    E('div', { 'style': 'font-weight: 700; font-size: 13px; color: var(--cw-text-main); margin-bottom: 8px;' }, '第 2 步：填写 VPS 连接与穿透参数'),
                    E('div', { 'style': 'display: grid; grid-template-columns: 1.8fr 1.2fr 1fr 1fr; gap: 10px;' }, [
                        E('div', {}, [
                            E('label', { 'style': 'display: block; font-size: 12px; font-weight: 600; color: var(--cw-text-main); margin-bottom: 4px;' }, 'VPS 公网 IP 地址:'),
                            E('input', {
                                'id': 'vps-input-ip',
                                'type': 'text',
                                'class': 'cbi-input-text',
                                'style': 'width: 100%; border: 1px solid var(--cw-border); background: var(--cw-input-bg); color: var(--cw-input-text); border-radius: 6px; padding: 6px 10px; font-size: 13px;',
                                'placeholder': '例如: 47.98.123.45',
                                'value': vpsIp
                            })
                        ]),
                        E('div', {}, [
                            E('label', { 'style': 'display: block; font-size: 12px; font-weight: 600; color: var(--cw-text-main); margin-bottom: 4px;' }, 'SSH 用户名:'),
                            E('input', {
                                'id': 'vps-input-user',
                                'type': 'text',
                                'class': 'cbi-input-text',
                                'style': 'width: 100%; border: 1px solid var(--cw-border); background: var(--cw-input-bg); color: var(--cw-input-text); border-radius: 6px; padding: 6px 10px; font-size: 13px;',
                                'placeholder': '如 root 或 ubuntu',
                                'value': vpsUser
                            })
                        ]),
                        E('div', {}, [
                            E('label', { 'style': 'display: block; font-size: 12px; font-weight: 600; color: var(--cw-text-main); margin-bottom: 4px;' }, 'SSH 端口:'),
                            E('input', {
                                'id': 'vps-input-port',
                                'type': 'number',
                                'class': 'cbi-input-text',
                                'style': 'width: 100%; border: 1px solid var(--cw-border); background: var(--cw-input-bg); color: var(--cw-input-text); border-radius: 6px; padding: 6px 10px; font-size: 13px;',
                                'value': vpsPort
                            })
                        ]),
                        E('div', {}, [
                            E('label', { 'style': 'display: block; font-size: 12px; font-weight: 600; color: var(--cw-text-main); margin-bottom: 4px;' }, '外网 Web 端口:'),
                            E('input', {
                                'id': 'vps-input-web-port',
                                'type': 'number',
                                'class': 'cbi-input-text',
                                'style': 'width: 100%; border: 1px solid var(--cw-border); background: var(--cw-input-bg); color: var(--cw-input-text); border-radius: 6px; padding: 6px 10px; font-size: 13px;',
                                'value': webPort
                            })
                        ])
                    ]),
                    E('div', { 'style': 'font-size: 11px; color: var(--cw-text-muted); margin-top: 8px; line-height: 1.4;' }, '⚡ 国内 VPS 下载加速：系统已自动内置 ghproxy.cn、gh-proxy.com 等国内高速镜像节点（秒级下载，自动容灾回退）。若您的 VPS 处于严格隔离的纯内网环境，亦可在 VPS 手动将 frps 放置在 /usr/local/bin/frps，部署时将自动检测并跳过下载。')
                ]),

                // Status Div for feedback
                E('div', {
                    'id': 'vps-status-div',
                    'style': 'display: none; padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 14px; line-height: 1.5;'
                }),

                // Step 3: Action Buttons
                E('div', { 'style': 'display: flex; gap: 10px; flex-wrap: wrap;' }, [
                    E('button', {
                        'id': 'btn-vps-test',
                        'type': 'button',
                        'class': 'btn cbi-button',
                        'style': 'background: var(--cw-bg-secondary); color: var(--cw-text-main); border: 1px solid var(--cw-border); padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;',
                        'click': function(ev) {
                            const btn = ev.target;
                            const ip = (card.querySelector('#vps-input-ip').value || '').trim();
                            const user = (card.querySelector('#vps-input-user').value || 'root').trim();
                            const port = (card.querySelector('#vps-input-port').value || '22').trim();
                            const statusDiv = card.querySelector('#vps-status-div');

                            if (!ip) {
                                alert('请先输入 VPS 公网 IP 地址！');
                                return;
                            }

                            btn.disabled = true;
                            btn.innerText = '⏳ 正在测试免密连接...';
                            statusDiv.style.display = 'block';
                            statusDiv.style.background = 'var(--cw-bg-subtle)';
                            statusDiv.style.border = '1px solid var(--cw-border)';
                            statusDiv.style.color = 'var(--cw-text-main)';
                            statusDiv.innerText = `正在向 ${user}@${ip}:${port} 发起 SSH 握手探测...`;

                            callTestVpsSsh(ip, port, user).then(res => {
                                btn.disabled = false;
                                btn.innerText = '🔍 测试免密连接';
                                if (res && res.connected) {
                                    if (res.sudo_ok === false) {
                                        statusDiv.style.background = '#fefce8';
                                        statusDiv.style.border = '1px solid #fef08a';
                                        statusDiv.style.color = '#854d0e';
                                        statusDiv.innerHTML = `⚠️ <strong>免密连接成功（用户: ${user}），但检测到该用户执行 sudo 需要密码！</strong><br><span style="font-size: 12px;">自动部署服务端需要管理员提权。请在 VPS 终端执行免密提权配置：<code>echo '$USER ALL=(ALL) NOPASSWD:ALL' | sudo tee /etc/sudoers.d/$USER</code>，或者改用 root 用户。</span>`;
                                    } else {
                                        statusDiv.style.background = '#f0fdf4';
                                        statusDiv.style.border = '1px solid #bbf7d0';
                                        statusDiv.style.color = '#15803d';
                                        statusDiv.innerHTML = `🎉 <strong>免密连接与管理员权限检查通过！</strong><br><span style="font-size: 12px;">已成功通过 Ed25519 公钥握手 VPS (${user}@${ip}:${port})，可以开始一键自动部署服务端。</span>`;
                                    }
                                } else {
                                    statusDiv.style.background = '#fef2f2';
                                    statusDiv.style.border = '1px solid #fecaca';
                                    statusDiv.style.color = '#991b1b';
                                    statusDiv.innerHTML = `❌ <strong>连接失败：</strong>${(res && res.message) || '未知错误'}<br><span style="font-size: 12px; color: #b91c1c;">提示：请确保在 VPS 终端执行授权命令时的用户与填写的【SSH 用户名】一致，且安全组已放行 SSH 端口。</span>`;
                                }
                            }).catch(err => {
                                btn.disabled = false;
                                btn.innerText = '🔍 测试免密连接';
                                statusDiv.style.background = '#fef2f2';
                                statusDiv.style.border = '1px solid #fecaca';
                                statusDiv.style.color = '#991b1b';
                                statusDiv.innerHTML = `❌ <strong>测试异常：</strong>${err.message}`;
                            });
                        }
                    }, '🔍 测试免密连接'),

                    E('button', {
                        'id': 'btn-vps-deploy',
                        'type': 'button',
                        'class': 'btn cbi-button cbi-button-apply',
                        'style': 'background: #7c3aed; color: #fff; border: none; padding: 8px 20px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;',
                        'click': function(ev) {
                            const btn = ev.target;
                            const ip = (card.querySelector('#vps-input-ip').value || '').trim();
                            const user = (card.querySelector('#vps-input-user').value || 'root').trim();
                            const port = (card.querySelector('#vps-input-port').value || '22').trim();
                            const webP = (card.querySelector('#vps-input-web-port').value || '18000').trim();
                            const statusDiv = card.querySelector('#vps-status-div');

                            if (!ip) {
                                alert('请先输入 VPS 公网 IP 地址！');
                                return;
                            }

                            btn.disabled = true;
                            btn.innerText = '⏳ 正在远程部署 frps 并配置路由器 (约 15~30 秒)...';
                            statusDiv.style.display = 'block';
                            statusDiv.style.background = '#eff6ff';
                            statusDiv.style.border = '1px solid #bfdbfe';
                            statusDiv.style.color = '#1e40af';
                            statusDiv.innerHTML = `⏳ 正在连接 VPS (${user}@${ip}) 下载安装 frps、生成配置、创建 systemd 服务并启动路由器 xfrpc...`;

                            callDeployVpsFrps(ip, port, user, '7001', '', webP).then(res => {
                                if (res && res.success) {
                                    btn.innerText = '✅ 部署完成并已连通！';
                                    btn.style.background = '#16a34a';
                                    card.style.borderColor = '#16a34a';
                                    statusDiv.style.background = '#f0fdf4';
                                    statusDiv.style.border = '1px solid #bbf7d0';
                                    statusDiv.style.color = '#15803d';
                                    statusDiv.innerHTML = `🎉 <strong>双端部署成功！</strong><br>公网访问链接：<a href="${res.web_url}" target="_blank" style="color: #15803d; font-weight: 700; text-decoration: underline;">${res.web_url}</a>`;

                                    appendMessage('assistant', `🎉 **VPS 内网穿透已成功自动部署并连通！**\n\n• **云端服务器**：\`${res.vps_user || user}@${res.vps_ip}:${res.server_port}\` (frps 已注册为 systemd 系统自启服务)\n• **公网 Web 访问**：[${res.web_url}](${res.web_url})\n• **路由器客户端**：\`xfrpc\` 已自动同步配置并完成握手连接。\n\n您现在可以在任何外网设备通过上述网址直接访问本路由器的 LuCI 管理后台！`);
                                } else {
                                    btn.disabled = false;
                                    btn.innerText = '🚀 一键自动部署服务端并拉通穿透';
                                    statusDiv.style.background = '#fef2f2';
                                    statusDiv.style.border = '1px solid #fecaca';
                                    statusDiv.style.color = '#991b1b';
                                    statusDiv.innerHTML = `❌ <strong>部署失败：</strong>${(res && res.message) || '未知错误'}`;
                                }
                            }).catch(err => {
                                btn.disabled = false;
                                btn.innerText = '🚀 一键自动部署服务端并拉通穿透';
                                statusDiv.style.background = '#fef2f2';
                                statusDiv.style.border = '1px solid #fecaca';
                                statusDiv.style.color = '#991b1b';
                                statusDiv.innerHTML = `❌ <strong>部署过程发生异常：</strong>${err.message}`;
                            });
                        }
                    }, '🚀 一键自动部署服务端并拉通穿透'),

                    E('button', {
                        'type': 'button',
                        'class': 'btn cbi-button cbi-button-reset',
                        'style': 'background: var(--cw-bg-secondary); color: var(--cw-text-main); border: 1px solid var(--cw-border); padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px;',
                        'click': function() {
                            card.remove();
                            appendMessage('assistant', '已取消 VPS 内网穿透自动部署向导。');
                        }
                    }, '❌ 取消')
                ])
            ]);

            // Automatically load router public key on card render
            callGetRouterSshKey().then(res => {
                if (res && res.auth_cmd) {
                    const ta = card.querySelector('#vps-auth-cmd');
                    const loadingSpan = card.querySelector('#vps-key-loading');
                    if (ta) ta.value = res.auth_cmd;
                    if (loadingSpan) loadingSpan.innerText = '已就绪 (Ed25519 椭圆曲线公钥)';
                }
            }).catch(e => {
                const loadingSpan = card.querySelector('#vps-key-loading');
                if (loadingSpan) loadingSpan.innerText = '公钥获取失败';
            });

            chatWindow.appendChild(card);
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }

        // Append VPS xkcptun Deployment Card (SSH Passwordless deb Package Automation)
        function appendVpsXkcptunCard(param) {
            const vpsIp = param.vps_ip || '';
            const vpsUser = param.vps_user || 'root';
            const vpsPort = param.vps_port || '22';
            const listenPort = param.listen_port || '9089';
            const mode = param.mode || 'fast3';

            const card = E('div', {
                'class': 'vps-xkcptun-card',
                'style': 'background: var(--cw-bg-card); border: 2px solid #3b82f6; border-radius: 12px; padding: 18px 20px; margin: 12px 0; box-shadow: var(--cw-card-shadow);'
            }, [
                E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid var(--cw-border); padding-bottom: 8px;' }, [
                    E('div', { 'style': 'font-weight: 700; font-size: 15px; color: var(--cw-text-main); display: flex; align-items: center; gap: 8px;' }, [
                        E('span', { 'style': 'font-size: 18px;' }, '⚡'),
                        E('span', {}, 'VPS 网络加速服务端一键安装 (xkcptun deb 自动化)')
                    ]),
                    E('span', { 'style': 'background: rgba(59,130,246,0.15); color: #3b82f6; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 700; border: 1px solid rgba(59,130,246,0.3);' }, '📦 官方 deb 包 · systemd 守护')
                ]),
                E('div', { 'style': 'font-size: 13px; color: var(--cw-text-sub); margin-bottom: 14px; line-height: 1.5;' }, param.explanation || '通过 SSH 免密在远端 Debian/Ubuntu VPS 上自动拉取官方 xkcptun-server deb 安装包，全自动部署服务端并同步配置路由器加速客户端。'),

                // Step 1: VPS Authorization Command
                E('div', { 'style': 'background: var(--cw-bg-subtle); border: 1px solid var(--cw-border); border-radius: 8px; padding: 12px 14px; margin-bottom: 14px;' }, [
                    E('div', { 'style': 'font-weight: 700; font-size: 13px; color: var(--cw-text-main); margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;' }, [
                        E('span', {}, '第 1 步：在 VPS 终端执行免密授权命令 (如已授权可直接跳过)'),
                        E('span', { 'id': 'xkcp-vps-key-loading', 'style': 'font-size: 11px; color: var(--cw-text-muted); font-weight: normal;' }, '正在获取路由器公钥...')
                    ]),
                    E('div', { 'style': 'font-size: 12px; color: var(--cw-text-muted); margin-bottom: 6px;' }, '说明：请先通过 SSH 登录您的 VPS 终端，粘贴并执行下方一行授权命令：'),
                    E('div', { 'style': 'display: flex; gap: 8px; align-items: center;' }, [
                        E('textarea', {
                            'id': 'xkcp-vps-auth-cmd',
                            'readonly': 'readonly',
                            'style': 'flex: 1; height: 52px; font-family: monospace; font-size: 11px; background: var(--cw-input-bg); color: var(--cw-input-text); border: 1px solid var(--cw-border); border-radius: 6px; padding: 6px 10px; resize: none; outline: none;',
                            'value': '正在生成路由器专属 Ed25519 密钥...'
                        }),
                        E('button', {
                            'type': 'button',
                            'id': 'btn-xkcp-copy-auth-cmd',
                            'class': 'btn cbi-button',
                            'style': 'background: #3b82f6; color: #fff; border: none; padding: 8px 14px; border-radius: 6px; font-size: 12px; cursor: pointer; white-space: nowrap; font-weight: 600;',
                            'click': function(ev) {
                                const ta = card.querySelector('#xkcp-vps-auth-cmd');
                                if (ta && ta.value) {
                                    if (window.isSecureContext && navigator.clipboard && navigator.clipboard.writeText) {
                                        navigator.clipboard.writeText(ta.value);
                                    } else {
                                        ta.select();
                                        document.execCommand('copy');
                                    }
                                    ev.target.innerText = '✅ 已复制授权命令！';
                                    setTimeout(() => { ev.target.innerText = '📋 复制授权命令'; }, 2000);
                                }
                            }
                        }, '📋 复制授权命令')
                    ])
                ]),

                // Step 2: VPS Server Connection Parameters
                E('div', { 'style': 'background: var(--cw-bg-subtle); border: 1px solid var(--cw-border); border-radius: 8px; padding: 12px 14px; margin-bottom: 14px;' }, [
                    E('div', { 'style': 'font-weight: 700; font-size: 13px; color: var(--cw-text-main); margin-bottom: 10px;' }, '第 2 步：核对远端服务器与加速配置'),
                    E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px;' }, [
                        E('div', {}, [
                            E('label', { 'style': 'display: block; font-size: 11.5px; color: var(--cw-text-muted); margin-bottom: 3px;' }, 'VPS 公网 IP:'),
                            E('input', {
                                'id': 'xkcp-vps-input-ip',
                                'type': 'text',
                                'value': vpsIp,
                                'placeholder': '如 43.159.xx.xx',
                                'style': 'width: 100%; padding: 6px 10px; font-size: 12px; border-radius: 5px; border: 1px solid var(--cw-border); background: var(--cw-input-bg); color: var(--cw-input-text);'
                            })
                        ]),
                        E('div', {}, [
                            E('label', { 'style': 'display: block; font-size: 11.5px; color: var(--cw-text-muted); margin-bottom: 3px;' }, 'SSH 用户名:'),
                            E('input', {
                                'id': 'xkcp-vps-input-user',
                                'type': 'text',
                                'value': vpsUser,
                                'style': 'width: 100%; padding: 6px 10px; font-size: 12px; border-radius: 5px; border: 1px solid var(--cw-border); background: var(--cw-input-bg); color: var(--cw-input-text);'
                            })
                        ]),
                        E('div', {}, [
                            E('label', { 'style': 'display: block; font-size: 11.5px; color: var(--cw-text-muted); margin-bottom: 3px;' }, 'SSH 端口:'),
                            E('input', {
                                'id': 'xkcp-vps-input-port',
                                'type': 'number',
                                'value': vpsPort,
                                'style': 'width: 100%; padding: 6px 10px; font-size: 12px; border-radius: 5px; border: 1px solid var(--cw-border); background: var(--cw-input-bg); color: var(--cw-input-text);'
                            })
                        ]),
                        E('div', {}, [
                            E('label', { 'style': 'display: block; font-size: 11.5px; color: var(--cw-text-muted); margin-bottom: 3px;' }, 'KCP 服务端 UDP 端口:'),
                            E('input', {
                                'id': 'xkcp-vps-input-lport',
                                'type': 'number',
                                'value': listenPort,
                                'style': 'width: 100%; padding: 6px 10px; font-size: 12px; border-radius: 5px; border: 1px solid var(--cw-border); background: var(--cw-input-bg); color: var(--cw-input-text);'
                            })
                        ]),
                        E('div', {}, [
                            E('label', { 'style': 'display: block; font-size: 11.5px; color: var(--cw-text-muted); margin-bottom: 3px;' }, '加速模式:'),
                            E('select', {
                                'id': 'xkcp-vps-input-mode',
                                'style': 'width: 100%; padding: 6px 10px; font-size: 12px; border-radius: 5px; border: 1px solid var(--cw-border); background: var(--cw-input-bg); color: var(--cw-input-text);'
                            }, [
                                E('option', { 'value': 'fast3', 'selected': mode === 'fast3' ? 'selected' : undefined }, 'fast3 (极速抗高丢包)'),
                                E('option', { 'value': 'fast2', 'selected': mode === 'fast2' ? 'selected' : undefined }, 'fast2 (进阶模式)'),
                                E('option', { 'value': 'fast', 'selected': mode === 'fast' ? 'selected' : undefined }, 'fast (快速模式)')
                            ])
                        ]),
                        E('div', {}, [
                            E('label', { 'style': 'display: block; font-size: 11.5px; color: var(--cw-text-muted); margin-bottom: 3px;' }, '预共享认证密钥 (Key):'),
                            E('input', {
                                'id': 'xkcp-vps-input-key',
                                'type': 'text',
                                'value': '7f7ac683d720e1437019692eadb0b811',
                                'style': 'width: 100%; padding: 6px 10px; font-size: 12px; border-radius: 5px; border: 1px solid var(--cw-border); background: var(--cw-input-bg); color: var(--cw-input-text); font-family: monospace;'
                            })
                        ])
                    ])
                ]),

                // Status message div
                E('div', {
                    'id': 'xkcp-vps-status-div',
                    'style': 'display: none; padding: 10px 14px; border-radius: 8px; margin-bottom: 12px; font-size: 12.5px; line-height: 1.5;'
                }),

                // Actions buttons
                E('div', { 'style': 'display: flex; gap: 10px; align-items: center; justify-content: flex-end;' }, [
                    E('button', {
                        'id': 'btn-xkcp-vps-test',
                        'type': 'button',
                        'class': 'btn cbi-button',
                        'style': 'background: var(--cw-bg-secondary); color: var(--cw-text-main); border: 1px solid var(--cw-border); padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px;',
                        'click': function(ev) {
                            const btn = ev.target;
                            const ip = (card.querySelector('#xkcp-vps-input-ip').value || '').trim();
                            const user = (card.querySelector('#xkcp-vps-input-user').value || 'root').trim();
                            const port = (card.querySelector('#xkcp-vps-input-port').value || '22').trim();
                            const statusDiv = card.querySelector('#xkcp-vps-status-div');

                            if (!ip) {
                                alert('请先输入 VPS 公网 IP 地址！');
                                return;
                            }

                            btn.disabled = true;
                            btn.innerText = '正在握手探测...';
                            statusDiv.style.display = 'block';
                            statusDiv.style.background = '#eff6ff';
                            statusDiv.style.border = '1px solid #bfdbfe';
                            statusDiv.style.color = '#1e40af';
                            statusDiv.innerHTML = `正在尝试通过 Ed25519 密钥连接 ${user}@${ip}:${port} 并探测权限与环境...`;

                            callTestVpsSsh(ip, port, user).then(res => {
                                btn.disabled = false;
                                btn.innerText = '🔍 测试免密连接';
                                if (res && res.connected) {
                                    statusDiv.style.background = '#f0fdf4';
                                    statusDiv.style.border = '1px solid #bbf7d0';
                                    statusDiv.style.color = '#15803d';
                                    statusDiv.innerHTML = `🎉 <strong>免密连接与管理员权限检查通过！</strong><br><span style="font-size: 12px;">已成功通过 Ed25519 公钥握手 VPS (${user}@${ip}:${port})，随时可以点击右侧一键部署。</span>`;
                                } else {
                                    statusDiv.style.background = '#fef2f2';
                                    statusDiv.style.border = '1px solid #fecaca';
                                    statusDiv.style.color = '#991b1b';
                                    statusDiv.innerHTML = `❌ <strong>连接失败：</strong>${(res && res.message) || '未知错误'}`;
                                }
                            }).catch(err => {
                                btn.disabled = false;
                                btn.innerText = '🔍 测试免密连接';
                                statusDiv.style.background = '#fef2f2';
                                statusDiv.style.border = '1px solid #fecaca';
                                statusDiv.style.color = '#991b1b';
                                statusDiv.innerHTML = `❌ <strong>测试异常：</strong>${err.message}`;
                            });
                        }
                    }, '🔍 测试免密连接'),

                    E('button', {
                        'id': 'btn-xkcp-vps-deploy',
                        'type': 'button',
                        'class': 'btn cbi-button cbi-button-apply',
                        'style': 'background: #2563eb; color: #fff; border: none; padding: 8px 20px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;',
                        'click': function(ev) {
                            const btn = ev.target;
                            const ip = (card.querySelector('#xkcp-vps-input-ip').value || '').trim();
                            const user = (card.querySelector('#xkcp-vps-input-user').value || 'root').trim();
                            const port = (card.querySelector('#xkcp-vps-input-port').value || '22').trim();
                            const lPort = (card.querySelector('#xkcp-vps-input-lport').value || '9089').trim();
                            const lMode = (card.querySelector('#xkcp-vps-input-mode').value || 'fast3').trim();
                            const lKey = (card.querySelector('#xkcp-vps-input-key').value || '7f7ac683d720e1437019692eadb0b811').trim();
                            const statusDiv = card.querySelector('#xkcp-vps-status-div');

                            if (!ip) {
                                alert('请先输入 VPS 公网 IP 地址！');
                                return;
                            }

                            btn.disabled = true;
                            btn.innerText = '⏳ 正在远程通过 deb 安装部署 (约 15~30 秒)...';
                            statusDiv.style.display = 'block';
                            statusDiv.style.background = '#eff6ff';
                            statusDiv.style.border = '1px solid #bfdbfe';
                            statusDiv.style.color = '#1e40af';
                            statusDiv.innerHTML = `⏳ 正在连接 VPS (${user}@${ip}) 下载并安装 xkcptun-server deb 软件包、写入 systemd 服务并启动路由器加速客户端...`;

                            callDeployVpsXkcptun(ip, port, user, lPort, lKey, lMode, '1').then(res => {
                                if (res && res.success) {
                                    btn.innerText = '✅ 部署完成并已连通！';
                                    btn.style.background = '#16a34a';
                                    card.style.borderColor = '#16a34a';
                                    statusDiv.style.background = '#f0fdf4';
                                    statusDiv.style.border = '1px solid #bbf7d0';
                                    statusDiv.style.color = '#15803d';
                                    statusDiv.innerHTML = `🎉 <strong>双端加速部署成功！</strong><br>KCP 加速服务器：<code>${ip}:${lPort}/udp</code> (模式: ${lMode})，路由器客户端已自动拉通。`;

                                    appendMessage('assistant', `🎉 **VPS xkcptun 网络加速服务端 (deb) 已成功自动部署并启动！**\n\n• **云端服务器**：\`${res.vps_user || user}@${res.vps_ip}:${res.listen_port}/udp\` (xkcp_server 已通过 deb 安装并注册为 systemd 系统自启服务)\n• **加速模式**：\`${res.mode || lMode}\` (FEC 容错: 开启)\n• **路由器客户端**：\`xkcptun\` 已自动配置对应远端 IP、端口与认证密钥并启动连接！\n\n您现在可以在「网络加速与分流」中享受极速抗丢包网络加速。`);
                                } else {
                                    btn.disabled = false;
                                    btn.innerText = '🚀 一键安装部署 (deb)';
                                    statusDiv.style.background = '#fef2f2';
                                    statusDiv.style.border = '1px solid #fecaca';
                                    statusDiv.style.color = '#991b1b';
                                    statusDiv.innerHTML = `❌ <strong>部署失败：</strong>${(res && res.message) || '未知错误'}`;
                                }
                            }).catch(err => {
                                btn.disabled = false;
                                btn.innerText = '🚀 一键安装部署 (deb)';
                                statusDiv.style.background = '#fef2f2';
                                statusDiv.style.border = '1px solid #fecaca';
                                statusDiv.style.color = '#991b1b';
                                statusDiv.innerHTML = `❌ <strong>执行异常：</strong>${err.message}`;
                            });
                        }
                    }, '🚀 一键安装部署 (deb)'),

                    E('button', {
                        'type': 'button',
                        'class': 'btn cbi-button cbi-button-reset',
                        'style': 'background: var(--cw-bg-secondary); color: var(--cw-text-main); border: 1px solid var(--cw-border); padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px;',
                        'click': function() {
                            card.remove();
                            appendMessage('assistant', '已取消 VPS xkcptun 网络加速自动部署向导。');
                        }
                    }, '❌ 取消')
                ])
            ]);

            callGetRouterSshKey().then(res => {
                if (res && res.auth_cmd) {
                    const ta = card.querySelector('#xkcp-vps-auth-cmd');
                    const loadingSpan = card.querySelector('#xkcp-vps-key-loading');
                    if (ta) ta.value = res.auth_cmd;
                    if (loadingSpan) loadingSpan.innerText = '已就绪 (Ed25519 椭圆曲线公钥)';
                }
            }).catch(e => {
                const loadingSpan = card.querySelector('#xkcp-vps-key-loading');
                if (loadingSpan) loadingSpan.innerText = '公钥获取失败';
            });

            chatWindow.appendChild(card);
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }

        // Send Message & Tool Calling Loop
        async function sendMessage() {
            const input = document.getElementById('chat-input');
            const sendBtn = document.getElementById('send-btn');
            if (!input || !input.value.trim()) return;

            const userText = input.value.trim();
            input.value = '';
            appendMessage('user', userText);
            messages.push({ role: 'user', content: userText });

            if (sendBtn) {
                sendBtn.disabled = true;
                sendBtn.innerText = '思考中...';
            }

            try {
                await processAgentTurn();
            } catch (err) {
                appendMessage('assistant', `⚠️ **AI 处理出错**: ${err.message}\n\n*提示: 请点击右上角【设置 API Key】检查 DeepSeek Key 是否正确配置，或检查路由器外网连通性。*`);
            } finally {
                if (sendBtn) {
                    sendBtn.disabled = false;
                    sendBtn.innerText = '发送 ➔';
                }
            }
        }

        async function processAgentTurn() {
            // Check API Key
            if (!aiConfig.apiKey) {
                const aiSettings = await callGetAiSettings();
                if (aiSettings && aiSettings.has_key) {
                    // router has key configured, we can use proxy or ask for local key
                } else {
                    appendMessage('assistant', `💡 **尚未配置 DeepSeek API Key**\n\n请点击右上角的 **【⚙️ 设置 API Key】** 按钮输入您的 DeepSeek API Key（以 \`sk-\` 开头）。所有对话均直接与官方 API 安全连接，系统状态均在本地毫秒级执行。`);
                    openSettingsModal();
                    return;
                }
            }

            let loopCount = 0;
            const maxLoops = 5;

            while (loopCount < maxLoops) {
                loopCount++;

                // Prepare request body
                const requestPayload = {
                    model: aiConfig.model || 'deepseek-flash',
                    messages: messages,
                    tools: routerTools,
                    temperature: parseFloat(aiConfig.temperature) || 0.3
                };

                let responseData;

                // Try browser direct fetch first
                if (aiConfig.apiKey) {
                    const targetUrl = normalizeApiUrl(aiConfig.apiUrl);
                    const res = await fetch(targetUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${aiConfig.apiKey}`
                        },
                        body: JSON.stringify(requestPayload)
                    });

                    if (!res.ok) {
                        const errBody = await res.text();
                        throw new Error(`HTTP ${res.status}: ${errBody}`);
                    }
                    responseData = await res.json();
                } else {
                    // Fallback to router proxy
                    const resProxy = await callDeepseekProxy(JSON.stringify(messages), JSON.stringify(routerTools));
                    if (resProxy.error || !resProxy.response) {
                        throw new Error(resProxy.message || 'Router backend failed to call DeepSeek');
                    }
                    responseData = JSON.parse(resProxy.response);
                }

                const choice = responseData.choices[0];
                const assistantMsg = choice.message;
                messages.push(assistantMsg);

                // Check for Tool Calls
                if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
                    for (const toolCall of assistantMsg.tool_calls) {
                        const fnName = toolCall.function.name;
                        let fnArgs = {};
                        try {
                            fnArgs = JSON.parse(toolCall.function.arguments);
                        } catch (e) {}

                        const argSummary = fnArgs.domain || fnArgs.mac || fnArgs.rule_name || fnArgs.vps_ip || fnArgs.service || fnArgs.action || fnArgs.package || fnArgs.mode || (fnArgs.enabled !== undefined ? (fnArgs.enabled === '1' ? '开启' : '关闭') : '') || '';
                        const indicator = appendToolIndicator(fnName, argSummary);
                        let toolResult = {};

                        try {
                            if (fnName === 'get_penetration_status') {
                                toolResult = await callGetPenetrationStatus();
                            } else if (fnName === 'get_router_summary') {
                                toolResult = await callGetRouterSummary();
                            } else if (fnName === 'list_clients') {
                                toolResult = await callListClients();
                            } else if (fnName === 'get_services_status') {
                                toolResult = await callGetServicesStatus();
                            } else if (fnName === 'get_service_detail') {
                                toolResult = await callGetServiceDetail(fnArgs.service);
                            } else if (fnName === 'propose_service_config') {
                                appendServiceCard(fnArgs);
                                toolResult = { status: 'proposed_to_user', message: 'Service configuration card rendered. Waiting for user authorization.' };
                            } else if (fnName === 'manage_xdns_domain') {
                                if (['list', 'list_ips', 'list_sessions', 'stats'].indexOf(fnArgs.action) !== -1) {
                                    toolResult = await callManageXdnsDomain(fnArgs.action, fnArgs.domain || '');
                                } else {
                                    appendXdnsDomainCard(fnArgs);
                                    toolResult = { status: 'proposed_to_user', message: 'Smart DNS domain modification card rendered in UI. Waiting for user authorization.' };
                                }
                            } else if (fnName === 'manage_xkcptun_tunnel') {
                                if (fnArgs.action === 'list') {
                                    toolResult = await callManageXkcptunTunnel('list', '', '', '', '', '', '', '', '');
                                } else {
                                    appendXkcptunTunnelCard(fnArgs);
                                    toolResult = { status: 'proposed_to_user', message: 'KCP acceleration tunnel proposal card rendered in UI. Waiting for user authorization.' };
                                }
                            } else if (fnName === 'manage_portal_access' || fnName === 'manage_portal_whitelist') {
                                if (fnArgs.action === 'list') {
                                    toolResult = await callManagePortalAccess('list', '', '', '', '', '');
                                } else {
                                    appendPortalAccessCard(fnArgs);
                                    toolResult = { status: 'proposed_to_user', message: 'Portal access modification card rendered in UI. Waiting for user authorization.' };
                                }
                            } else if (fnName === 'manage_penetration_proxy') {
                                if (fnArgs.action === 'list') {
                                    toolResult = await callManagePenetrationProxy('list');
                                } else {
                                    appendPenetrationProxyCard(fnArgs);
                                    toolResult = { status: 'proposed_to_user', message: 'Penetration proxy rule card rendered in UI. Waiting for user authorization.' };
                                }
                            } else if (fnName === 'get_qos_status') {
                                toolResult = await callGetQosStatus();
                            } else if (fnName === 'propose_qos_limit') {
                                appendQosCard(fnArgs);
                                toolResult = { status: 'proposed_to_user', message: 'QoS limit proposal card rendered. Waiting for user authorization.' };
                            } else if (fnName === 'get_l7_top') {
                                toolResult = await callGetL7Top();
                            } else if (fnName === 'get_wifi_info') {
                                toolResult = await callGetWifiInfo();
                            } else if (fnName === 'propose_wifi_config') {
                                appendWifiCard(fnArgs);
                                toolResult = { status: 'proposed_to_user', message: 'WiFi configuration card rendered in UI. Waiting for user authorization.' };
                            } else if (fnName === 'run_diagnostics') {
                                toolResult = await callRunDiagnostics(fnArgs.action, fnArgs.target);
                            } else if (fnName === 'uci_read') {
                                toolResult = await callUciRead(fnArgs.package);
                            } else if (fnName === 'propose_uci_change') {
                                appendDiffCard(fnArgs);
                                toolResult = { status: 'proposed_to_user', message: 'Proposal card rendered. Awaiting user click to apply.' };
                            } else if (fnName === 'get_hw_offload_status') {
                                toolResult = await callGetHwOffloadStatus();
                            } else if (fnName === 'propose_hw_offload') {
                                appendHwOffloadCard(fnArgs);
                                toolResult = { status: 'proposed_to_user', message: 'Hardware acceleration card rendered in UI. Waiting for user authorization.' };
                            } else if (fnName === 'get_router_ssh_key') {
                                toolResult = await callGetRouterSshKey();
                            } else if (fnName === 'propose_vps_penetration') {
                                appendVpsPenetrationCard(fnArgs);
                                toolResult = { status: 'proposed_to_user', message: 'VPS penetration deployment card rendered in UI. Awaiting user authorization and execution.' };
                            } else if (fnName === 'propose_vps_xkcptun') {
                                appendVpsXkcptunCard(fnArgs);
                                toolResult = { status: 'proposed_to_user', message: 'VPS xkcptun acceleration deployment card rendered in UI. Awaiting user authorization and execution.' };
                            } else {
                                toolResult = { error: `Unknown tool: ${fnName}` };
                            }
                        } catch (toolErr) {
                            toolResult = { error: toolErr.message };
                        }

                        const header = indicator.querySelector('.indicator-header');
                        if (header) {
                            header.innerHTML = `✅ <span style="color: #15803d; font-weight: 600;">已通过 luci.clawwrt 成功获取事实数据</span> <code style="font-size: 11px; background: #e2e8f0; padding: 1px 5px; border-radius: 3px;">ubus: ${fnName}</code>`;
                        }
                        
                        // Collapsible JSON raw result details
                        const details = E('details', { 'style': 'margin-top: 4px; font-size: 11px; color: #64748b; cursor: pointer;' }, [
                            E('summary', { 'style': 'outline: none;' }, '查看底层返回真实 JSON 数据'),
                            E('pre', { 'style': 'background: #1e293b; color: #38bdf8; padding: 8px; border-radius: 6px; margin-top: 4px; overflow-x: auto; font-size: 11px;' }, JSON.stringify(toolResult, null, 2))
                        ]);
                        indicator.appendChild(details);

                        messages.push({
                            role: 'tool',
                            tool_call_id: toolCall.id,
                            content: JSON.stringify(toolResult)
                        });
                    }
                    // Loop continues so DeepSeek can synthesize the tool result into natural language
                } else {
                    // Final text response
                    if (assistantMsg.content) {
                        appendMessage('assistant', assistantMsg.content);
                    }
                    break;
                }
            }
        }

        // Markdown Formatter (Powered by Marked.js for full GFM tables, code blocks, lists)
        function formatMarkdown(text) {
            if (!text) return '';
            try {
                if (typeof marked !== 'undefined' && marked && marked.parse) {
                    return marked.parse(text);
                }
            } catch (e) {
                console.error('Marked error:', e);
            }
            return text.replace(/\n/g, '<br>');
        }

        // Refresh Metrics
        function refreshMetrics(isManual) {
            const btn = document.getElementById('btn-refresh-net');
            if (btn && isManual) btn.innerText = '⏳ 探测中...';

            callGetRouterSummary().then(sum => {
                if (btn) btn.innerText = '🔄 重新测速';
                if (!sum) return;

                const netCard = document.getElementById('metric-internet');
                const netDot = document.getElementById('net-status-dot');
                const netTitle = document.getElementById('net-status-text');
                const netDesc = document.getElementById('net-status-desc');

                if (netCard && netDot && netTitle && netDesc) {
                    if (sum.online && sum.dns_ok) {
                        netCard.style.borderColor = '#86efac';
                        netCard.style.background = '#f0fdf4';
                        netDot.style.background = '#16a34a';
                        netDot.style.boxShadow = '0 0 10px rgba(22, 163, 74, 0.7)';
                        netTitle.innerHTML = '<span style="color: #15803d;">🟢 正常上网 · 互联网畅通</span>';
                        netDesc.innerText = `外网延迟: ${sum.latency || '< 10ms'} · DNS 解析: 正常 · WAN: ${sum.wan_ip || '已连接'}`;
                    } else if (sum.online && !sum.dns_ok) {
                        netCard.style.borderColor = '#fde047';
                        netCard.style.background = '#fefce8';
                        netDot.style.background = '#ca8a04';
                        netDot.style.boxShadow = '0 0 10px rgba(202, 138, 4, 0.7)';
                        netTitle.innerHTML = '<span style="color: #a16207;">🟡 IP 可通，但 DNS 异常</span>';
                        netDesc.innerText = `外网 IP 正常 (${sum.wan_ip})，但域名解析失败，请检查 DNS 配置`;
                    } else {
                        netCard.style.borderColor = '#fca5a5';
                        netCard.style.background = '#fef2f2';
                        netDot.style.background = '#dc2626';
                        netDot.style.boxShadow = '0 0 10px rgba(220, 38, 38, 0.7)';
                        netTitle.innerHTML = '<span style="color: #b91c1c;">🔴 无法上网 · 互联网已断开</span>';
                        netDesc.innerText = '外网链路不可达，请检查网线插口或宽带拨号状态';
                    }
                }

                const tiles = metricsBar.querySelectorAll('.metric-tile-sub');
                if (tiles.length >= 2) {
                    // Devices
                    tiles[0].querySelector('.metric-val1').innerText = `${sum.client_count || 0} 台设备在线`;
                    tiles[0].querySelector('.metric-val2').innerText = `网关: ${sum.lan_ip || '192.168.8.1'}`;

                    // Hardware
                    const memUsed = sum.mem_total_kb ? Math.round((sum.mem_total_kb - sum.mem_free_kb) / sum.mem_total_kb * 100) : 0;
                    tiles[1].querySelector('.metric-val1').innerText = `${sum.board_model || 'chaWrt'}`;
                    const hwBadge = sum.hw_accel ? '⚡开启' : '关闭';
                    tiles[1].querySelector('.metric-val2').innerText = `CPU 负载: ${sum.cpu_load || '0.00'} | 内存: ${memUsed}% | 硬件加速: ${hwBadge}`;
                }
            }).catch(e => {
                if (btn) btn.innerText = '🔄 重新测速';
            });
        }

        // Settings Modal
        function openSettingsModal() {
            callGetAiSettings().then(saved => {
                const currentKey = localStorage.getItem('chawrt_deepseek_key') || '';

                const keyInput = E('input', {
                    'type': 'password',
                    'class': 'cbi-input-text',
                    'style': 'width: 100%; margin-top: 6px; font-family: monospace;',
                    'placeholder': saved && saved.has_key ? '已配置 (留空表示保持现有密钥)' : 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
                    'value': currentKey
                });

                let currentModel = (saved && saved.model) || aiConfig.model || 'deepseek-flash';
                if (currentModel !== 'deepseek-v4-pro') {
                    currentModel = 'deepseek-flash';
                }
                const modelSelect = E('select', {
                    'class': 'cbi-input-select',
                    'style': 'width: 100%; margin-top: 6px;'
                }, [
                    E('option', { 'value': 'deepseek-flash', 'selected': (currentModel === 'deepseek-flash') ? '' : null }, 'deepseek-flash (DeepSeek-V4.1 Flash 推荐 · 毫秒级极速响应/1M上下文)'),
                    E('option', { 'value': 'deepseek-v4-pro', 'selected': (currentModel === 'deepseek-v4-pro') ? '' : null }, 'deepseek-v4-pro (DeepSeek-V4 Pro 深度长链逻辑与高阶推理)')
                ]);
                modelSelect.value = currentModel;

                const urlInput = E('input', {
                    'type': 'text',
                    'class': 'cbi-input-text',
                    'style': 'width: 100%; margin-top: 6px;',
                    'placeholder': 'https://api.deepseek.com',
                    'value': aiConfig.apiUrl || 'https://api.deepseek.com/chat/completions'
                });

                const testResultDiv = E('div', {
                    'id': 'api-test-result',
                    'style': 'display: none; padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-top: 14px; line-height: 1.5;'
                });

                const content = E('div', {}, [
                    E('div', { 'style': 'background: var(--cw-bg-subtle); border: 1px solid var(--cw-border); border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; font-size: 12px; color: var(--cw-text-main);' }, [
                        E('strong', {}, '📌 官方文档规范提示 (参考 api-docs.deepseek.com)：'),
                        E('div', { 'style': 'margin-top: 4px;' }, [
                            '1. API Key 请在 ',
                            E('a', { 'href': 'https://platform.deepseek.com/api_keys', 'target': '_blank', 'style': 'color: #2563eb; text-decoration: underline;' }, 'DeepSeek 开放平台控制台'),
                            ' 申请，格式通常为 ',
                            E('code', { 'style': 'background: #dcfce7; padding: 1px 4px; border-radius: 4px;' }, 'sk-...'),
                            '；'
                        ]),
                        E('div', { 'style': 'margin-top: 2px;' }, '2. 官方接口地址：https://api.deepseek.com（会自动补齐 /chat/completions）；'),
                        E('div', { 'style': 'margin-top: 2px;' }, '3. 请求采用 Bearer Token 规范认证，所有交互均从本地直连，无第三方中转。')
                    ]),
                    E('div', { 'style': 'margin-bottom: 12px;' }, [
                        E('label', { 'style': 'font-weight: 600; font-size: 13px; color: var(--cw-text-main);' }, 'DeepSeek API Key (密钥):'),
                        keyInput
                    ]),
                    E('div', { 'style': 'margin-bottom: 12px;' }, [
                        E('label', { 'style': 'font-weight: 600; font-size: 13px; color: var(--cw-text-main);' }, '模型选择 (Model):'),
                        modelSelect
                    ]),
                    E('div', { 'style': 'margin-bottom: 12px;' }, [
                        E('label', { 'style': 'font-weight: 600; font-size: 13px; color: var(--cw-text-main);' }, 'Base URL / 端点地址:'),
                        urlInput
                    ]),
                    testResultDiv
                ]);

                ui.showModal('⚙️ 配置小茶助手 (DeepSeek AI 官方规范)', [
                    content,
                    E('div', { 'class': 'right', 'style': 'margin-top: 18px; display: flex; justify-content: space-between; align-items: center;' }, [
                        E('button', {
                            'class': 'btn cbi-button',
                            'style': 'background: var(--cw-bg-secondary); color: var(--cw-text-main); border: 1px solid var(--cw-border); padding: 7px 14px; border-radius: 6px; font-size: 12px; cursor: pointer;',
                            'click': async function(ev) {
                                const btn = ev.target;
                                const testKey = keyInput.value.trim() || localStorage.getItem('chawrt_deepseek_key') || '';
                                const testUrl = normalizeApiUrl(urlInput.value.trim() || 'https://api.deepseek.com');
                                const testModel = modelSelect.value;

                                if (!testKey && (!saved || !saved.has_key)) {
                                    testResultDiv.style.display = 'block';
                                    testResultDiv.style.background = '#fef2f2';
                                    testResultDiv.style.border = '1px solid #fecaca';
                                    testResultDiv.style.color = '#991b1b';
                                    testResultDiv.innerHTML = '❌ 请先输入 API Key 再进行测试！';
                                    return;
                                }

                                btn.disabled = true;
                                btn.innerText = '⏳ 测试连通中...';
                                testResultDiv.style.display = 'block';
                                testResultDiv.style.background = '#f8fafc';
                                testResultDiv.style.border = '1px solid #e2e8f0';
                                testResultDiv.style.color = '#475569';
                                testResultDiv.innerHTML = '正在向 DeepSeek 官方发送探针测试包...';

                                const tStart = Date.now();
                                try {
                                    const testPayload = {
                                        model: testModel,
                                        messages: [{ role: 'user', content: 'hi' }],
                                        max_tokens: 5,
                                        stream: false
                                    };

                                    let testResp;
                                    if (testKey) {
                                        testResp = await fetch(testUrl, {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${testKey}`
                                            },
                                            body: JSON.stringify(testPayload)
                                        });
                                    } else {
                                        // use router proxy
                                        const resProxy = await callDeepseekProxy(JSON.stringify([{ role: 'user', content: 'hi' }]), null);
                                        if (resProxy.http_code === 200) {
                                            testResp = { ok: true, status: 200 };
                                        } else {
                                            testResp = { ok: false, status: resProxy.http_code, text: async () => resProxy.response || resProxy.message };
                                        }
                                    }

                                    const tElapsed = Date.now() - tStart;
                                    if (testResp.ok) {
                                        testResultDiv.style.background = '#f0fdf4';
                                        testResultDiv.style.border = '1px solid #bbf7d0';
                                        testResultDiv.style.color = '#15803d';
                                        testResultDiv.innerHTML = `🎉 <strong>连接成功！API Key 认证通过</strong><br><span style="font-size: 12px; color: #166534;">响应延迟: ${tElapsed} ms · 模型 [${testModel}] 正常可用</span>`;
                                    } else {
                                        let errDetail = '';
                                        try {
                                            const errJson = await testResp.json();
                                            errDetail = errJson.error ? (errJson.error.message || JSON.stringify(errJson.error)) : JSON.stringify(errJson);
                                        } catch(e) {
                                            errDetail = (await testResp.text()) || `HTTP ${testResp.status}`;
                                        }

                                        testResultDiv.style.background = '#fef2f2';
                                        testResultDiv.style.border = '1px solid #fecaca';
                                        testResultDiv.style.color = '#991b1b';

                                        if (testResp.status === 401) {
                                            testResultDiv.innerHTML = `❌ <strong>认证失败 (HTTP 401)：</strong><br>API Key 不正确或已过期失效，请检查是否完整复制了 sk- 字符串。`;
                                        } else if (testResp.status === 402) {
                                            testResultDiv.innerHTML = `❌ <strong>余额不足 (HTTP 402)：</strong><br>您的 DeepSeek 账户余额不足或欠费，请前往 platform.deepseek.com 充值。`;
                                        } else {
                                            testResultDiv.innerHTML = `❌ <strong>调用失败 (HTTP ${testResp.status})：</strong><br>${errDetail}`;
                                        }
                                    }
                                } catch (netErr) {
                                    testResultDiv.style.background = '#fef2f2';
                                    testResultDiv.style.border = '1px solid #fecaca';
                                    testResultDiv.style.color = '#991b1b';
                                    testResultDiv.innerHTML = `❌ <strong>网络连接异常：</strong><br>${netErr.message}（请确认路由器是否能正常访问外网）`;
                                } finally {
                                    btn.disabled = false;
                                    btn.innerText = '🧪 测试连通性';
                                }
                            }
                        }, '🧪 测试连通性'),
                        E('div', { 'style': 'display: flex; gap: 10px;' }, [
                            E('button', {
                                'class': 'btn cbi-button cbi-button-reset',
                                'click': ui.hideModal
                            }, '取消'),
                            E('button', {
                                'class': 'btn cbi-button cbi-button-apply',
                                'style': 'background: #2563eb; color: #fff;',
                                'click': function() {
                                    const newKey = keyInput.value.trim();
                                    if (newKey) {
                                        localStorage.setItem('chawrt_deepseek_key', newKey);
                                        aiConfig.apiKey = newKey;
                                    }
                                    aiConfig.model = modelSelect.value;
                                    aiConfig.apiUrl = normalizeApiUrl(urlInput.value.trim() || 'https://api.deepseek.com');

                                    callSaveAiSettings(newKey, aiConfig.model, aiConfig.apiUrl, "0.3").then(() => {
                                        ui.addNotification(null, E('p', '✅ DeepSeek AI 设置已保存成功！'), 'info');
                                        ui.hideModal();
                                        const statusText = document.getElementById('ai-status-text');
                                        if (statusText) statusText.innerText = `就绪 · ${aiConfig.model}`;
                                    });
                                }
                            }, '保存配置')
                        ])
                    ])
                ]);
            });
        }
        // Reset Chat
        function resetChat() {
            chatWindow.innerHTML = '';
            chatHistory = [];
            try {
                localStorage.removeItem('chawrt_chat_history');
            } catch (e) {}
            messages = [{ role: 'system', content: systemPrompt }];
            appendGreeting(true);
        }


        // Auto-detect and sync Dark / Light theme with system & LuCI Argon theme
        function detectAndApplyTheme() {
            let isDark = false;
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                isDark = true;
            }
            if (document.body.classList.contains('dark') || document.documentElement.getAttribute('data-theme') === 'dark') {
                isDark = true;
            }
            try {
                const bg = window.getComputedStyle(document.body).backgroundColor;
                if (bg) {
                    const rgb = bg.match(/\d+/g);
                    if (rgb && rgb.length >= 3) {
                        const lum = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
                        if (lum < 110) isDark = true;
                    }
                }
            } catch(e) {}

            if (isDark) {
                container.classList.add('clawwrt-dark');
            } else {
                container.classList.remove('clawwrt-dark');
            }
        }
        detectAndApplyTheme();
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', detectAndApplyTheme);
        }
        if (window.MutationObserver) {
            const obs = new MutationObserver(detectAndApplyTheme);
            obs.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });
            obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
        }

        // Initialize
        restoreChatHistory();
        refreshMetrics();
        window.setInterval(function() {
            refreshMetrics();
        }, 15000);
        callGetAiSettings().then(cfg => {
            if (cfg) {
                if (cfg.model) {
                    aiConfig.model = cfg.model;
                    const statusText = document.getElementById('ai-status-text');
                    if (statusText) statusText.innerText = `就绪 · ${cfg.model}`;
                }
                if (cfg.api_url) aiConfig.apiUrl = cfg.api_url;
            }
        });

        return container;
    },
    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
