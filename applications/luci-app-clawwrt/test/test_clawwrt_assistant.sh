#!/bin/sh
#
# Automated Test Suite for chaWrt Xiaocha AI Assistant (小茶AI助手自动化测试套件)
# Tests all RPCD backend methods, parameter validation, schema compliance, and auto-rollback.
#
# Copyright (C) 2026 Dengfeng Liu <liudf0716@gmail.com>
#

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
START_TIME=$(date +%s)

echo "======================================================================"
echo -e "${BOLD}${CYAN}🍵 chaWrt 小茶 AI 助手 (ClawWRT Copilot) 自动化功能与接口测试${NC}"
echo "======================================================================"
echo "执行时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "测试目标: RPCD 核心总线 luci.clawwrt & 底层核心服务驱动"
echo "----------------------------------------------------------------------"

assert_ubus() {
    local category="$1"
    local desc="$2"
    local method="$3"
    local params="$4"
    local check_field="$5"
    local expected_val="$6"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    printf "  [测试 %02d] %-12s : %-38s ... " "$TOTAL_TESTS" "$category" "$desc"

    local output
    if [ -n "$params" ]; then
        output=$(ubus call luci.clawwrt "$method" "$params" 2>/dev/null)
    else
        output=$(ubus call luci.clawwrt "$method" 2>/dev/null)
    fi

    if [ -z "$output" ]; then
        echo -e "${RED}[FAILED] (RPC无返回或报错)${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi

    if [ -n "$check_field" ]; then
        local actual_val
        actual_val=$(echo "$output" | jsonfilter -e "@.result.${check_field}" 2>/dev/null)
        if [ -z "$actual_val" ]; then
            actual_val=$(echo "$output" | jsonfilter -e "@.${check_field}" 2>/dev/null)
        fi

        if [ -n "$expected_val" ]; then
            if [ "$actual_val" != "$expected_val" ]; then
                echo -e "${RED}[FAILED] (${check_field} 期望: '$expected_val', 实际: '$actual_val')${NC}"
                FAILED_TESTS=$((FAILED_TESTS + 1))
                return 1
            fi
        else
            if [ -z "$actual_val" ]; then
                echo -e "${RED}[FAILED] (${check_field} 字段缺失)${NC}"
                FAILED_TESTS=$((FAILED_TESTS + 1))
                return 1
            fi
        fi
    fi

    echo -e "${GREEN}[PASS]${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    return 0
}

assert_secret_redacted() {
    local desc="$1"
    local package="$2"
    local real_key="$3"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    printf "  [测试 %02d] %-12s : %-38s ... " "$TOTAL_TESTS" "敏感脱敏" "$desc"

    local output
    output=$(ubus call luci.clawwrt uci_read "{\"package\":\"$package\"}" 2>/dev/null)
    if [ -z "$output" ]; then
        echo -e "${RED}[FAILED] (RPC无返回或报错)${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi

    if ! echo "$output" | grep -Fq '********'; then
        echo -e "${RED}[FAILED] (未找到脱敏掩码 ********)${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi

    if [ -n "$real_key" ] && echo "$output" | grep -Fq "$real_key"; then
        echo -e "${RED}[FAILED] (检测到真实密钥泄露!)${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi

    echo -e "${GREEN}[PASS]${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    return 0
}

# ---------------------------------------------------------------------
# 1. 系统概况与客户端管理
# ---------------------------------------------------------------------
echo -e "\n${BOLD}${BLUE}【1. 系统概要、状态与终端设备检测】${NC}"
expected_hostname=$(uci -q get system.@system[0].hostname || echo "chawrt")
assert_ubus "系统概况" "获取路由器摘要遥测信息" "get_router_summary" "" "hostname" "$expected_hostname"
assert_ubus "硬件温度" "获取芯片温度 (CPU/2.4G/5G)" "get_temperature" "" "cpu_temp"
assert_ubus "温度健康" "验证温度状态评估 (thermal_status)" "get_temperature" "" "thermal_status"
assert_ubus "系统状态" "获取 Copilot 进程及核心运行状态" "get_status" "" "running"
assert_ubus "终端拓扑" "获取局域网已连接客户端列表" "list_clients" "" "clients"
assert_ubus "服务矩阵" "获取五大核心服务聚合健康状态" "get_services_status" "" "xkcptun"
assert_ubus "网络诊断" "执行外网 DNS 解析与连通性探测" "run_diagnostics" '{"action":"ping","target":"114.114.114.114"}' "output"

# ---------------------------------------------------------------------
# 2. 门户认证 (wifidogx & apfree-wifidog)
# ---------------------------------------------------------------------
echo -e "\n${BOLD}${BLUE}【2. 门户认证 (wifidogx) 引擎与门禁权限测试】${NC}"
assert_ubus "门户服务" "获取门户认证状态与在线用户统计" "get_service_detail" '{"service":"wifidogx"}' "service" "wifidogx"
assert_ubus "门禁列表" "查询在线终端、黑白名单与免认证域名" "manage_portal_access" '{"action":"list"}' "status" "success"
assert_ubus "免认证域名" "动态添加免认证域名到信任白名单" "manage_portal_access" '{"action":"add_domain","domain":"autotest.example.com"}' "success" "true"
assert_ubus "免认证域名" "从免认证信任白名单中移除测试域名" "manage_portal_access" '{"action":"del_domain","domain":"autotest.example.com"}' "success" "true"
assert_ubus "白名单MAC" "添加终端 MAC 到免认证通行名单" "manage_portal_access" '{"action":"add_whitelist","mac":"00:11:22:33:44:55"}' "success" "true"
assert_ubus "白名单MAC" "从免认证通行名单中移除测试 MAC" "manage_portal_access" '{"action":"del_whitelist","mac":"00:11:22:33:44:55"}' "success" "true"

# ---------------------------------------------------------------------
# 3. 内网穿透 (xfrpc & frps)
# ---------------------------------------------------------------------
echo -e "\n${BOLD}${BLUE}【3. 内网穿透 (xfrpc) 连通性深度诊断与规则测试】${NC}"
assert_ubus "穿透状态" "深度检测 xfrpc 进程、套接字与远端连接" "get_penetration_status" "" "service" "xfrpc"
assert_ubus "规则列表" "列出所有穿透映射规则及公网访问直达URL" "manage_penetration_proxy" '{"action":"list"}' "service" "xfrpc"
assert_ubus "新增映射" "创建测试 TCP 端口映射规则" "manage_penetration_proxy" '{"action":"add","rule_name":"test_ci_rule","proxy_type":"tcp","local_port":"19999","remote_port":"29999"}' "success" "true"
assert_ubus "停用规则" "临时停用/禁用穿透映射规则" "manage_penetration_proxy" '{"action":"disable","rule_name":"test_ci_rule"}' "success" "true"
assert_ubus "启用规则" "重新启用穿透映射规则" "manage_penetration_proxy" '{"action":"enable","rule_name":"test_ci_rule"}' "success" "true"
assert_ubus "删除规则" "清理并删除测试穿透映射规则 (回滚)" "manage_penetration_proxy" '{"action":"remove","rule_name":"test_ci_rule"}' "success" "true"

# ---------------------------------------------------------------------
# 4. 智能流控与 L7 DPI (aw-bpf QoS)
# ---------------------------------------------------------------------
echo -e "\n${BOLD}${BLUE}【4. 内核 TC-eBPF 智能流控与 L7 DPI 协议遥测】${NC}"
assert_ubus "流控遥测" "获取各终端实时上下行速率及 QoS 规则" "get_qos_status" "" "running"
assert_ubus "L7排行榜" "查询应用协议实时流速 Top10 及高频域名" "get_l7_top" "" "top_l7_apps"
assert_ubus "智能限速" "向指定测试终端下发 eBPF 限速规则" "set_qos_limit" '{"target":"192.168.8.251","dl_mbps":50,"ul_mbps":10}' "success" "true"
assert_ubus "解除限速" "解除测试终端限速规则并清除内核限制 (回滚)" "set_qos_limit" '{"target":"192.168.8.251","dl_mbps":0,"ul_mbps":0}' "success" "true"

# ---------------------------------------------------------------------
# 5. 网络加速 (xkcptun)
# ---------------------------------------------------------------------
echo -e "\n${BOLD}${BLUE}【5. 网络加速 (xkcptun) 节点延迟、FEC与多隧道管理】${NC}"
assert_ubus "加速遥测" "获取节点延迟(ping_ms)、FEC模式与多隧道" "get_service_detail" '{"service":"xkcptun"}' "service" "xkcptun"
assert_ubus "全链路体检" "深度检测 eBPF 与 xkcptun 全链路健康度" "get_acceleration_status" "" "health" "healthy"
assert_ubus "隧道清单" "查询所有 KCP 加速隧道与实时活跃连接数" "manage_xkcptun_tunnel" '{"action":"list"}' "status" "success"
assert_ubus "新增隧道" "创建测试加速转发隧道 (端口 18999)" "manage_xkcptun_tunnel" '{"action":"add","tunnel_name":"ci_tunnel","proto":"tcp","local_port":"18999","target_addr":"127.0.0.1","target_port":"80"}' "success" "true"
assert_ubus "停用隧道" "停用测试加速隧道" "manage_xkcptun_tunnel" '{"action":"disable","tunnel_name":"ci_tunnel"}' "success" "true"
assert_ubus "启用隧道" "启用测试加速隧道" "manage_xkcptun_tunnel" '{"action":"enable","tunnel_name":"ci_tunnel"}' "success" "true"
assert_ubus "删除隧道" "清理测试加速隧道并恢复配置 (回滚)" "manage_xkcptun_tunnel" '{"action":"remove","tunnel_name":"ci_tunnel"}' "success" "true"

# ---------------------------------------------------------------------
# 6. 智能分流 (xdns-bpf)
# ---------------------------------------------------------------------
echo -e "\n${BOLD}${BLUE}【6. 智能分流 (xdns-bpf) eBPF 挂载、域名与动态 IP 缓存】${NC}"
assert_ubus "分流遥测" "获取 eBPF 拦截统计、动态 IP 表与活跃会话" "get_service_detail" '{"service":"xdns"}' "service" "xdns"
assert_ubus "域名全集" "查询内核加速域名列表及 Active 状态" "manage_xdns_domain" '{"action":"list"}' "status" "success"
assert_ubus "拦截统计" "获取实时拦截次数与转发计数" "manage_xdns_domain" '{"action":"stats"}' "status" "success"
assert_ubus "动态IP表" "获取内核动态劫持 IP 集合与 TTL 倒计时" "manage_xdns_domain" '{"action":"list_ips"}' "status" "success"
assert_ubus "活跃会话" "获取透明代理当前 TCP 活跃会话跟踪" "manage_xdns_domain" '{"action":"list_sessions"}' "status" "success"
assert_ubus "添加域名" "向内核 eBPF 分流表注入测试加速域名" "manage_xdns_domain" '{"action":"add","domain":"test-ci-xdns.org"}' "success" "true"
assert_ubus "删除域名" "从内核分流表中注销测试加速域名" "manage_xdns_domain" '{"action":"remove","domain":"test-ci-xdns.org"}' "success" "true"
assert_ubus "域名防御" "拒绝非法分流域名参数注入" "manage_xdns_domain" '{"action":"add","domain":"evil.com;reboot"}' "success" "false"
assert_ubus "添加静态IP" "向内核 eBPF 分流表注入测试静态重定向 IP" "manage_xdns_domain" '{"action":"add_ip","ip":"198.51.100.77"}' "success" "true"
assert_ubus "删除静态IP" "从内核分流表中注销测试静态重定向 IP" "manage_xdns_domain" '{"action":"remove_ip","ip":"198.51.100.77"}' "success" "true"
assert_ubus "IP格式防御" "拒绝非法 IPv4 格式注入" "manage_xdns_domain" '{"action":"add_ip","ip":"999.999.1.1;reboot"}' "success" "false"

# ---------------------------------------------------------------------
# 7. 硬件加速与外围配置
# ---------------------------------------------------------------------
echo -e "\n${BOLD}${BLUE}【7. 硬件加速 (PPE) 与无线网络及无缝漫游配置】${NC}"
assert_ubus "硬件加速" "获取 MediaTek PPE 硬件流表与加速状态" "get_hw_offload_status" "" "enabled" "true"
assert_ubus "无线状态" "获取当前 WiFi 频段、SSID 与安全状态" "get_wifi_info" "" "radios"
assert_ubus "无线漫游" "获取 802.11k/v/r 漫游及 usteer 调度状态" "get_wifi_roaming" "" "hostapd_supports_kvr" "true"
assert_ubus "漫游防御" "拒绝非法移动域参数格式 (非4位十六进制)" "set_wifi_roaming" '{"band":"all","mode":"full_kvr","mobility_domain":"xyz"}' "success" "false"
assert_ubus "Mesh状态" "获取 802.11s Mesh 组网拓扑与角色" "get_mesh_status" "" "role"
assert_ubus "SSH密钥" "获取路由器自动生成的穿透运维 SSH 公钥" "get_router_ssh_key" "" "pubkey"

# ---------------------------------------------------------------------
# 8. 安全沙箱、凭据脱敏与安全边界防御测试
# ---------------------------------------------------------------------
echo -e "\n${BOLD}${BLUE}【8. 安全沙箱、凭据脱敏与安全边界防御测试】${NC}"
assert_ubus "沙箱隔离" "uci_read 越权访问 dropbear 拦截" "uci_read" '{"package":"dropbear"}' "success" "false"
real_wifi_key=$(uci -q get wireless.@wifi-iface[0].key 2>/dev/null)
assert_secret_redacted "uci_read 密钥掩码脱敏且绝不泄露明文" "wireless" "$real_wifi_key"
assert_ubus "凭据保护" "uci_apply 阻止篡改 api_key" "uci_apply" '{"package":"clawwrt","section":"ai","option":"api_key","value":"hack"}' "success" "false"
assert_ubus "凭据保护" "uci_apply 阻止篡改 wireless key" "uci_apply" '{"package":"wireless","section":"wifnet0","option":"key","value":"hacked"}' "success" "false"
assert_ubus "凭据保护" "uci_apply 阻止篡改 xfrpc token" "uci_apply" '{"package":"xfrpc","section":"common","option":"token","value":"hacked"}' "success" "false"
assert_ubus "凭据保护" "uci_apply 阻止篡改 api_url 控制项" "uci_apply" '{"package":"clawwrt","section":"ai","option":"api_url","value":"http://127.1"}' "success" "false"
assert_ubus "服务防护" "uci_apply 阻止非白名单服务重载 (evil)" "uci_apply" '{"package":"clawwrt","section":"main","option":"log_level","value":"debug","reload_service":"evil"}' "success" "false"
assert_ubus "端口防御" "switch_acceleration_port 拒绝池外端口 0" "switch_acceleration_port" '{"new_port":"0"}' "success" "false"
assert_ubus "端口防御" "switch_acceleration_port 拒绝池外端口 1234" "switch_acceleration_port" '{"new_port":"1234"}' "success" "false"
assert_ubus "端口防御" "switch_acceleration_port 拒绝池外端口 99999" "switch_acceleration_port" '{"new_port":"99999"}' "success" "false"
assert_ubus "SSRF防御" "save_ai_settings 拒绝私网 IP (127.0.0.1)" "save_ai_settings" '{"api_url":"https://127.0.0.1/chat"}' "success" "false"
assert_ubus "SSRF防御" "save_ai_settings 拒绝短格式回环 (127.1)" "save_ai_settings" '{"api_url":"https://127.1/chat"}' "success" "false"
assert_ubus "SSRF防御" "save_ai_settings 拒绝十六进制回环 (0x7f000001)" "save_ai_settings" '{"api_url":"https://0x7f000001/chat"}' "success" "false"
assert_ubus "SSRF防御" "save_ai_settings 拒绝非 HTTPS 协议 (http://)" "save_ai_settings" '{"api_url":"http://api.deepseek.com/chat"}' "success" "false"
assert_ubus "参数安全" "run_diagnostics 拒绝 -f 标志参数注入" "run_diagnostics" '{"action":"ping","target":"-f"}' "success" "false"
assert_ubus "参数安全" "run_diagnostics 拒绝非法诊断动作 (exploit)" "run_diagnostics" '{"action":"exploit","target":"8.8.8.8"}' "success" "false"
assert_ubus "配对防御" "pair_mesh_node 拒绝公网节点 IP (8.8.8.8)" "pair_mesh_node" '{"target_ip":"8.8.8.8"}' "success" "false"
assert_ubus "配对防御" "pair_mesh_node 拒绝空密码安全降级" "pair_mesh_node" '{"target_ip":"192.168.8.199","password":""}' "success" "false"
# Backup AI settings if present
OLD_AI_KEY=$(uci -q get clawwrt.ai.api_key)
OLD_AI_MODEL=$(uci -q get clawwrt.ai.model)
OLD_AI_URL=$(uci -q get clawwrt.ai.api_url)

assert_ubus "运行模式" "设置小茶助手为专家模式" "set_ai_mode" '{"user_mode":"expert"}' "user_mode" "expert"
assert_ubus "运行模式" "获取小茶助手专家模式设置" "get_ai_settings" "" "user_mode" "expert"
assert_ubus "运行模式" "切换回小白模式" "set_ai_mode" '{"user_mode":"novice"}' "user_mode" "novice"

# Test set_ai_mode on empty/fresh configuration
uci -q delete clawwrt.ai && uci -q commit clawwrt
assert_ubus "模式空配置" "全新配置下初始化专家模式" "set_ai_mode" '{"user_mode":"expert"}' "user_mode" "expert"
assert_ubus "模式空配置" "空配置初始化后读取专家模式" "get_ai_settings" "" "user_mode" "expert"
assert_ubus "模式空配置" "切换回小白模式" "set_ai_mode" '{"user_mode":"novice"}' "user_mode" "novice"

# Restore original AI settings
if [ -n "$OLD_AI_KEY" ]; then
    uci -q set clawwrt.ai.api_key="$OLD_AI_KEY"
    [ -n "$OLD_AI_MODEL" ] && uci -q set clawwrt.ai.model="$OLD_AI_MODEL"
    [ -n "$OLD_AI_URL" ] && uci -q set clawwrt.ai.api_url="$OLD_AI_URL"
    uci -q commit clawwrt
fi

# ---------------------------------------------------------------------
# 9. 路由器全方位安全体检与 WAN 远程管理开关测试
# ---------------------------------------------------------------------
echo -e "\n${BOLD}${BLUE}【9. 路由器全方位安全体检与 WAN 远程管理开关测试】${NC}"
assert_ubus "安全体检" "执行路由器全方位安全基线体检" "get_security_check" "" "level"
assert_ubus "安全体检" "验证安全体检包含评分字段" "get_security_check" "" "score"
assert_ubus "WAN端口" "获取当前 WAN 远程管理端口放行状态" "manage_wan_access" '{"action":"get"}' "success" "true"

# Save original WAN access states
orig_ssh=$(ubus call luci.clawwrt manage_wan_access '{"action":"get"}' 2>/dev/null | jsonfilter -e '@.result.ssh' 2>/dev/null)
orig_http=$(ubus call luci.clawwrt manage_wan_access '{"action":"get"}' 2>/dev/null | jsonfilter -e '@.result.http' 2>/dev/null)
orig_https=$(ubus call luci.clawwrt manage_wan_access '{"action":"get"}' 2>/dev/null | jsonfilter -e '@.result.https' 2>/dev/null)

assert_ubus "WAN端口" "测试关闭 WAN 口 SSH 远程放行" "manage_wan_access" '{"action":"set","ssh":"0"}' "ssh" "false"
assert_ubus "WAN端口" "测试开启 WAN 口 SSH 远程放行" "manage_wan_access" '{"action":"set","ssh":"1"}' "ssh" "true"
assert_ubus "WAN防御" "拒绝非法端口开关参数注入 (non-boolean)" "manage_wan_access" '{"action":"set","ssh":"hack"}' "success" "false"

# Restore original states
[ "$orig_ssh" = "true" ] && r_ssh="1" || r_ssh="0"
[ "$orig_http" = "true" ] && r_http="1" || r_http="0"
[ "$orig_https" = "true" ] && r_https="1" || r_https="0"
ubus call luci.clawwrt manage_wan_access "{\"action\":\"set\",\"ssh\":\"$r_ssh\",\"http\":\"$r_http\",\"https\":\"$r_https\"}" >/dev/null 2>&1

# ---------------------------------------------------------------------
# 10. 内网穿透 (xfrpc) 全局服务停用与启动测试
# ---------------------------------------------------------------------
echo -e "\n${BOLD}${BLUE}【10. 内网穿透 (xfrpc) 全局服务停用与启动测试】${NC}"
assert_ubus "穿透总控" "停用内网穿透服务 (stop_service)" "manage_penetration_proxy" '{"action":"stop_service"}' "success" "true"
assert_ubus "穿透总控" "启动内网穿透服务 (start_service)" "manage_penetration_proxy" '{"action":"start_service"}' "success" "true"
assert_ubus "穿透总控" "别名参数停用内网穿透 (disable, rule: common)" "manage_penetration_proxy" '{"action":"disable","rule_name":"common"}' "success" "true"
assert_ubus "穿透总控" "别名参数启用内网穿透 (enable, rule: common)" "manage_penetration_proxy" '{"action":"enable","rule_name":"common"}' "success" "true"

# ---------------------------------------------------------------------
# 11. 网络加速 (xkcptun) UDP 端口跳跃与服务器 REDIRECT 规则校验测试
# ---------------------------------------------------------------------
echo -e "\n${BOLD}${BLUE}【11. 网络加速 (xkcptun) UDP 端口跳跃与服务器 REDIRECT 规则校验测试】${NC}"
orig_remote_port=$(uci -q get xkcptun.client.remote_port || echo 9089)
assert_ubus "端口跳跃" "随机切换端口 (自动命中重定向池)" "switch_acceleration_port" '{"new_port":"random"}' "verified_server_redirect" "true"
assert_ubus "端口跳跃" "切换回服务端原生主监听端口 9089" "switch_acceleration_port" '{"new_port":"9089"}' "target_type" "服务端主监听端口"
# 恢复原始端口
[ -n "$orig_remote_port" ] && ubus call luci.clawwrt switch_acceleration_port "{\"new_port\":\"$orig_remote_port\"}" >/dev/null 2>&1

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "----------------------------------------------------------------------"
echo -e "${BOLD}测试摘要报告:${NC}"
echo "  • 总测试项数: $TOTAL_TESTS"
echo -e "  • 成功通过项: ${GREEN}$PASSED_TESTS${NC}"
if [ "$FAILED_TESTS" -eq 0 ]; then
    echo -e "  • 失败项数量: ${GREEN}0 (全部通过)${NC}"
    echo -e "  • 测试用时  : ${DURATION} 秒"
    echo -e "\n${BOLD}${GREEN}🎉 恭喜！小茶 AI 助手所有核心工具链与底层服务测试 100% 验证通过！${NC}"
    echo "======================================================================"
    exit 0
else
    echo -e "  • 失败项数量: ${RED}$FAILED_TESTS${NC}"
    echo -e "  • 测试用时  : ${DURATION} 秒"
    echo -e "\n${BOLD}${RED}⚠️ 警告：检测到部分接口未通过测试，请查看上方失败详情。${NC}"
    echo "======================================================================"
    exit 1
fi
