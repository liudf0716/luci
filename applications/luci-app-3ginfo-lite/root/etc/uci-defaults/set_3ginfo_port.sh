#!/bin/sh
# Copyright 2020-2024 Rafał Wabik (IceG) - From eko.one.pl forum
# MIT License

chmod +x /usr/share/3ginfo-lite/3ginfo.sh 2>&1 &
chmod +x /usr/share/3ginfo-lite/detect.sh 2>&1 &
chmod +x /usr/share/3ginfo-lite/check.gcom 2>&1 &
chmod +x /usr/share/3ginfo-lite/info.gcom 2>&1 &
chmod +x /usr/share/3ginfo-lite/vendorproduct.gcom 2>&1 &
chmod +x /usr/share/3ginfo-lite/modem/hilink/alcatel_hilink.sh 2>&1 &
chmod +x /usr/share/3ginfo-lite/modem/hilink/huawei_hilink.sh 2>&1 &
chmod +x /usr/share/3ginfo-lite/modem/hilink/zte.sh 2>&1 &
chmod +x /etc/init.d/3ginfo 2>&1 &

# Create modemdefine config if it doesn't exist
if [ ! -f /etc/config/modemdefine ]; then
	uci set modemdefine.general=general
	uci set modemdefine.general.main_modem='/dev/ttyUSB1'
	uci set modemdefine.general.main_network='wan'
	uci add modemdefine modemdefine
	uci set modemdefine.@modemdefine[0].modem='/dev/ttyUSB1'
	uci set modemdefine.@modemdefine[0].comm_port='/dev/ttyUSB1'
	uci set modemdefine.@modemdefine[0].network='wan'
	uci commit modemdefine
fi

rm -rf /tmp/luci-indexcache 2>&1 &
rm -rf /tmp/luci-modulecache/ 2>&1 &

exit 0

