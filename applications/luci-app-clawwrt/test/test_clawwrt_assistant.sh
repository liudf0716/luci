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

# ---------------------------------------------------------------------
# 1. 系统概况与客户端管理
# ---------------------------------------------------------------------
echo -e "\n${BOLD}${BLUE}【1. 系统概要、状态与终端设备检测】${NC}"
assert_ubus "系统概况" "获取路由器摘要遥测信息" "get_router_summary" "" "hostname" "chawrt"
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
assert_ubus "清空缓存" "清空内核已解析的动态劫持 IP 集合 (flush)" "manage_xdns_domain" '{"action":"clear_ips"}' "success" "true"
assert_ubus "重载规则" "从持久化规则文件重新装载分流域名至内核" "manage_xdns_domain" '{"action":"reload"}' "success" "true"

# ---------------------------------------------------------------------
# 7. 硬件加速与外围配置
# ---------------------------------------------------------------------
echo -e "\n${BOLD}${BLUE}【7. 硬件加速 (PPE) 与无线网络配置】${NC}"
assert_ubus "硬件加速" "获取 MediaTek PPE 硬件流表与加速状态" "get_hw_offload_status" "" "enabled" "true"
assert_ubus "无线状态" "获取当前 WiFi 频段、SSID 与安全状态" "get_wifi_info" "" "radios"
assert_ubus "SSH密钥" "获取路由器自动生成的穿透运维 SSH 公钥" "get_router_ssh_key" "" "pubkey"

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
