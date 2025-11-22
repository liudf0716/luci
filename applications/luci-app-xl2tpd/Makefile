# Copyright (C) 2024 OpenWrt.org
#
# This is free software, licensed under the GNU General Public License v2.

include $(TOPDIR)/rules.mk

PKG_LICENSE:=GPL-2.0-or-later
PKG_MAINTAINER:=OpenWrt Developers

LUCI_TITLE:=LuCI support for xl2tpd
LUCI_DESCRIPTION:=Configuration and status interface for xl2tpd L2TP daemon
LUCI_DEPENDS:=+xl2tpd

include ../../luci.mk

# call BuildPackage - OpenWrt buildroot signature
