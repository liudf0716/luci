#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
小茶 AI 助手 (ClawWRT Copilot) 开发端端到端场景化自动化测试
======================================================
该测试脚本运行在开发机/CI流水线上，通过网络调用真机/虚拟机 (aw / chaWrt) 的 ubus/RPCD 接口，
模拟真实用户场景、小茶 AI 助手的工具链调用 (Tool Call) 契约及执行状态。

运行方式:
  python3 test_xiaocha_copilot.py [--host 192.168.8.1] [--user root]
"""

import argparse
import json
import subprocess
import sys

class XiaochaTester:
    def __init__(self, host="192.168.8.1", user="root"):
        self.host = host
        self.user = user
        self.passed = 0
        self.failed = 0

    def call_ubus(self, method, args=None):
        """通过 SSH 在远端路由器执行 ubus call luci.clawwrt <method>"""
        if args is None:
            args = {}
        payload = json.dumps(args)
        cmd = ["ssh", "-o", "StrictHostKeyChecking=no", f"{self.user}@{self.host}",
               f"ubus call luci.clawwrt {method} '{payload}'"]
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=15)
        if proc.returncode != 0:
            raise RuntimeError(f"ubus call error: {proc.stderr.strip()}")
        data = json.loads(proc.stdout) if proc.stdout.strip() else {}
        if isinstance(data, dict) and "result" in data:
            return data["result"]
        return data

    def test(self, name, check_fn):
        sys.stdout.write(f"  [测试] {name:<35} ... ")
        sys.stdout.flush()
        try:
            check_fn()
            print("\033[32m[PASS]\033[0m")
            self.passed += 1
        except Exception as e:
            print(f"\033[31m[FAIL]\033[0m ({e})")
            self.failed += 1

    def run_all_scenarios(self):
        print("=" * 65)
        print("🤖 小茶 AI 助手 (ClawWRT Copilot) 场景化与端到端自动化测试")
        print(f"目标路由器: {self.user}@{self.host}")
        print("=" * 65)

        # 场景 1: 用户询问“当前网络状况怎么样？有哪些设备在线？”
        print("\n【场景 1：全网拓扑感知与健康诊断】")
        def s1_summary():
            res = self.call_ubus("get_router_summary")
            assert "hostname" in res or "result" in res, "缺少主机名"
        self.test("系统综合概要遥测", s1_summary)

        def s1_clients():
            res = self.call_ubus("list_clients")
            assert "clients" in res or "result" in res, "客户端列表格式异常"
        self.test("局域网在线终端探测", s1_clients)

        def s1_services():
            res = self.call_ubus("get_services_status")
            assert "xkcptun" in res or "result" in res, "服务状态响应异常"
        self.test("核心服务运行矩阵体检", s1_services)

        # 场景 2: 用户要求“帮我给测试域名和手机做门户认证加白，不让它弹验证页面”
        print("\n【场景 2：智慧门禁与免认证控制 (apfree-wifidog)】")
        test_domain = "pytest.example.com"
        test_mac = "AA:BB:CC:DD:EE:88"
        def s2_auth():
            # 加白域名
            r1 = self.call_ubus("manage_portal_access", {"action": "add_domain", "domain": test_domain})
            assert r1.get("success") is True or r1.get("status") == "success"
            # 加白终端 MAC
            r2 = self.call_ubus("manage_portal_access", {"action": "add_whitelist", "mac": test_mac})
            assert r2.get("success") is True or r2.get("status") == "success"
            # 自动回滚清理
            self.call_ubus("manage_portal_access", {"action": "del_domain", "domain": test_domain})
            self.call_ubus("manage_portal_access", {"action": "del_whitelist", "mac": test_mac})
        self.test("域名与终端 MAC 动态加白与撤销", s2_auth)

        # 场景 3: 用户询问“家里NAS能从外面访问吗？穿透通不通？”
        print("\n【场景 3：内网穿透深度链路诊断与生命周期管理 (xfrpc)】")
        def s3_frp():
            res = self.call_ubus("get_penetration_status")
            assert res.get("service") == "xfrpc" or "service" in res.get("result", {}), "缺少穿透状态指标"
            rules = self.call_ubus("manage_penetration_proxy", {"action": "list"})
            assert rules.get("service") == "xfrpc" or "proxies" in rules, "缺少穿透规则集"
        self.test("穿透远端链路连接状态探测", s3_frp)

        def s3_frp_crud():
            rule_name = "py_test_frp"
            # 创建规则
            r = self.call_ubus("manage_penetration_proxy", {
                "action": "add", "rule_name": rule_name, "proxy_type": "tcp",
                "local_ip": "192.168.8.1", "local_port": "80", "remote_port": "28888"
            })
            assert r.get("success") is True, f"新增规则失败: {r}"
            # 停用
            self.call_ubus("manage_penetration_proxy", {"action": "disable", "rule_name": rule_name})
            # 启用
            self.call_ubus("manage_penetration_proxy", {"action": "enable", "rule_name": rule_name})
            # 删除回滚
            self.call_ubus("manage_penetration_proxy", {"action": "remove", "rule_name": rule_name})
        self.test("穿透映射规则生命周期(增/禁/启/删)", s3_frp_crud)

        # 场景 4: 用户抱怨“有人在下BT占满带宽，把这台电脑限速”
        print("\n【场景 4：L7 DPI 协议识别与 TC-eBPF 毫秒限速】")
        def s4_qos():
            # 遥测
            qos = self.call_ubus("get_qos_status")
            assert "running" in qos or "result" in qos
            # 限速
            r = self.call_ubus("set_qos_limit", {
                "target": "192.168.8.199", "dl_mbps": 50, "ul_mbps": 10
            })
            assert r.get("success") is True
            # 解除限速 (设为 0 即取消)
            self.call_ubus("set_qos_limit", {"target": "192.168.8.199", "dl_mbps": 0, "ul_mbps": 0})
        self.test("eBPF 终端动态限速与无损解除", s4_qos)

        # 场景 5: 用户要求“把海外服务器加速打开，并且把 github.com 加入智能分流”
        print("\n【场景 5：KCP 协议栈加速与 xdns-bpf 域名智能分流】")
        def s5_accel():
            # 遥测
            accel = self.call_ubus("get_service_detail", {"service": "xkcptun"})
            assert accel.get("service") == "xkcptun"
            # 隧道创建与回滚
            tunnel_name = "py_test_tunnel"
            r_add = self.call_ubus("manage_xkcptun_tunnel", {
                "action": "add", "tunnel_name": tunnel_name, "proto": "tcp",
                "local_port": "18998", "target_addr": "127.0.0.1", "target_port": "80"
            })
            assert r_add.get("success") is True
            self.call_ubus("manage_xkcptun_tunnel", {"action": "remove", "tunnel_name": tunnel_name})

            # 添加域名分流与回滚
            r_dns = self.call_ubus("manage_xdns_domain", {"action": "add", "domain": "pytest.openwrt.org"})
            assert r_dns.get("success") is True
            self.call_ubus("manage_xdns_domain", {"action": "del", "domain": "pytest.openwrt.org"})
        self.test("网络加速与域名智能分流闭环测试", s5_accel)

        # 场景 6: 用户要求“配置管理能让 AI 在路由器上免密登录的远程 Linux 服务器 (VPS)”
        print("\n【场景 6：远端免密服务器（VPS）密钥与服务器池生命周期】")
        def s6_ssh_key():
            res = self.call_ubus("get_router_ssh_key")
            assert "pubkey" in res
            assert "ssh-ed25519" in res["pubkey"] or "ssh-rsa" in res["pubkey"]
            assert "auth_cmd" in res and "authorized_keys" in res["auth_cmd"]
        self.test("路由器专属 Ed25519 SSH 密钥与一键授权命令", s6_ssh_key)

        def s6_vps_lifecycle():
            # 1. 添加测试服务器
            res_add = self.call_ubus("manage_vps_server", {
                "action": "add",
                "name": "自动化测试VPS",
                "host": "192.168.8.253",
                "port": "22",
                "user": "root"
            })
            assert res_add.get("success") is True
            vps_id = res_add.get("id")
            assert vps_id is not None

            # 2. 获取列表校验
            res_list = self.call_ubus("get_vps_servers")
            servers = res_list.get("servers", [])
            target = next((s for s in servers if s.get("id") == vps_id), None)
            assert target is not None
            assert target.get("name") == "自动化测试VPS"
            assert target.get("host") == "192.168.8.253"

            # 3. 移除测试服务器并清理
            res_del = self.call_ubus("manage_vps_server", {"action": "delete", "id": vps_id})
            assert res_del.get("success") is True

            # 4. 再次确认清理干净
            res_list_after = self.call_ubus("get_vps_servers")
            assert not any(s.get("id") == vps_id for s in res_list_after.get("servers", []))
        self.test("远程 VPS 服务器池 CRUD 与生命周期回滚", s6_vps_lifecycle)

        def s6_xkcptun_deploy_contract():
            # 校验参数防御与接口契约
            res = self.call_ubus("deploy_vps_xkcptun", {})
            assert res.get("success") is False, "缺少参数时应返回失败"
            assert "缺少 VPS IP 地址" in res.get("message", ""), f"提示信息不匹配: {res}"
        self.test("远程 VPS 一键部署 xkcptun (deb) 契约校验", s6_xkcptun_deploy_contract)

        def s6_uninstall_vps_service_contract():
            # 校验参数防御与服务卸载接口契约
            res = self.call_ubus("uninstall_vps_service", {})
            assert res.get("success") is False, "缺少主机或参数时应返回失败"
            assert "未找到匹配的 VPS 或缺少主机地址" in res.get("message", ""), f"提示信息不匹配: {res}"
        self.test("远程 VPS 一键卸载与环境清理契约校验", s6_uninstall_vps_service_contract)

        print("\n" + "=" * 65)
        print(f"自动化测试完成: 共 {self.passed + self.failed} 项, 通过 {self.passed} 项, 失败 {self.failed} 项")
        print("=" * 65)
        return self.failed == 0

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Xiaocha Copilot Automated Test")
    parser.add_argument("--host", default="192.168.8.1", help="Router IP address")
    parser.add_argument("--user", default="root", help="Router SSH user")
    args = parser.parse_args()

    tester = XiaochaTester(host=args.host, user=args.user)
    success = tester.run_all_scenarios()
    sys.exit(0 if success else 1)
