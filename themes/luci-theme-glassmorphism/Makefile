#
# Copyright (C) 2025 The LuCI Team <luci@lists.subsignal.org>
#
# This is free software, licensed under the Apache License, Version 2.0 .
#

include $(TOPDIR)/rules.mk

LUCI_TITLE:=Glassmorphism Theme
LUCI_DEPENDS:=+luci-base

PKG_LICENSE:=Apache-2.0

define Package/luci-theme-glassmorphism/postrm
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	uci -q delete luci.themes.Glassmorphism
	uci commit luci
}
endef

include ../../luci.mk

# call BuildPackage - ChaWrt buildroot signature