#
# (с) 2025 gSpot (https://github.com/gSpotx2f/luci-app-internet-detector)
#

include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI support for internet-detector
LUCI_DEPENDS:=+luaposix +libuci-lua
LUCI_PKGARCH:=all
PKG_VERSION:=1.0.1
PKG_RELEASE:=1

#include ../../luci.mk
include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
