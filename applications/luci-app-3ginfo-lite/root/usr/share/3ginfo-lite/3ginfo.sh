#!/bin/sh

#
# (c) 2010-2024 Cezary Jackiewicz <cezary@eko.one.pl>
#
# (c) 2021-2024 modified by Rafał Wabik - IceG - From eko.one.pl forum
#


band4g() {
# see https://en.wikipedia.org/wiki/LTE_frequency_bands
	echo -n "B${1}"
	case "${1}" in
		"1") echo " (2100 MHz)";;
		"2") echo " (1900 MHz)";;
		"3") echo " (1800 MHz)";;
		"4") echo " (1700 MHz)";;
		"5") echo " (850 MHz)";;
		"7") echo " (2600 MHz)";;
		"8") echo " (900 MHz)";;
		"11") echo " (1500 MHz)";;
		"12") echo " (700 MHz)";;
		"13") echo " (700 MHz)";;
		"14") echo " (700 MHz)";;
		"17") echo " (700 MHz)";;
		"18") echo " (850 MHz)";;
		"19") echo " (850 MHz)";;
		"20") echo " (800 MHz)";;
		"21") echo " (1500 MHz)";;
		"24") echo " (1600 MHz)";;
		"25") echo " (1900 MHz)";;
		"26") echo " (850 MHz)";;
		"28") echo " (700 MHz)";;
		"29") echo " (700 MHz)";;
		"30") echo " (2300 MHz)";;
		"31") echo " (450 MHz)";;
		"32") echo " (1500 MHz)";;
		"34") echo " (2000 MHz)";;
		"37") echo " (1900 MHz)";;
		"38") echo " (2600 MHz)";;
		"39") echo " (1900 MHz)";;
		"40") echo " (2300 MHz)";;
		"41") echo " (2500 MHz)";;
		"42") echo " (3500 MHz)";;
		"43") echo " (3700 MHz)";;
		"46") echo " (5200 MHz)";;
		"47") echo " (5900 MHz)";;
		"48") echo " (3500 MHz)";;
		"50") echo " (1500 MHz)";;
		"51") echo " (1500 MHz)";;
		"53") echo " (2400 MHz)";;
		"54") echo " (1600 MHz)";;
		"65") echo " (2100 MHz)";;
		"66") echo " (1700 MHz)";;
		"67") echo " (700 MHz)";;
		"69") echo " (2600 MHz)";;
		"70") echo " (1700 MHz)";;
		"71") echo " (600 MHz)";;
		"72") echo " (450 MHz)";;
		"73") echo " (450 MHz)";;
		"74") echo " (1500 MHz)";;
		"75") echo " (1500 MHz)";;
		"76") echo " (1500 MHz)";;
		"85") echo " (700 MHz)";;
		"87") echo " (410 MHz)";;
		"88") echo " (410 MHz)";;
		"103") echo " (700 MHz)";;
		"106") echo " (900 MHz)";;
		"*") echo "";;
	esac
}

band5g() {
# see https://en.wikipedia.org/wiki/5G_NR_frequency_bands
	echo -n "n${1}"
	case "${1}" in
		"1") echo " (2100 MHz)";;
		"2") echo " (1900 MHz)";;
		"3") echo " (1800 MHz)";;
		"5") echo " (850 MHz)";;
		"7") echo " (2600 MHz)";;
		"8") echo " (900 MHz)";;
		"12") echo " (700 MHz)";;
		"13") echo " (700 MHz)";;
		"14") echo " (700 MHz)";;
		"18") echo " (850 MHz)";;
		"20") echo " (800 MHz)";;
		"24") echo " (1600 MHz)";;
		"25") echo " (1900 MHz)";;
		"26") echo " (850 MHz)";;
		"28") echo " (700 MHz)";;
		"29") echo " (700 MHz)";;
		"30") echo " (2300 MHz)";;
		"34") echo " (2100 MHz)";;
		"38") echo " (2600 MHz)";;
		"39") echo " (1900 MHz)";;
		"40") echo " (2300 MHz)";;
		"41") echo " (2500 MHz)";;
		"46") echo " (5200 MHz)";;
		"47") echo " (5900 MHz)";;
		"48") echo " (3500 MHz)";;
		"50") echo " (1500 MHz)";;
		"51") echo " (1500 MHz)";;
		"53") echo " (2400 MHz)";;
		"54") echo " (1600 MHz)";;
		"65") echo " (2100 MHz)";;
		"66") echo " (1700/2100 MHz)";;
		"67") echo " (700 MHz)";;
		"70") echo " (2000 MHz)";;
		"71") echo " (600 MHz)";;
		"74") echo " (1500 MHz)";;
		"75") echo " (1500 MHz)";;
		"76") echo " (1500 MHz)";;
		"77") echo " (3700 MHz)";;
		"78") echo " (3500 MHz)";;
		"79") echo " (4700 MHz)";;
		"80") echo " (1800 MHz)";;
		"81") echo " (900 MHz)";;
		"82") echo " (800 MHz)";;
		"83") echo " (700 MHz)";;
		"84") echo " (2100 MHz)";;
		"85") echo " (700 MHz)";;
		"86") echo " (1700 MHz)";;
		"89") echo " (850 MHz)";;
		"90") echo " (2500 MHz)";;
		"91") echo " (800/1500 MHz)";;
		"92") echo " (800/1500 MHz)";;
		"93") echo " (900/1500 MHz)";;
		"94") echo " (900/1500 MHz)";;
		"95") echo " (2100 MHz)";;
		"96") echo " (6000 MHz)";;
		"97") echo " (2300 MHz)";;
		"98") echo " (1900 MHz)";;
		"99") echo " (1600 MHz)";;
		"100") echo " (900 MHz)";;
		"101") echo " (1900 MHz)";;
		"102") echo " (6200 MHz)";;
		"104") echo " (6700 MHz)";;
		"105") echo " (600 MHz)";;
		"106") echo " (900 MHz)";;
		"109") echo " (700/1500 MHz)";;
		"257") echo " (28 GHz)";;
		"258") echo " (26 GHz)";;
		"259") echo " (41 GHz)";;
		"260") echo " (39 GHz)";;
		"261") echo " (28 GHz)";;
		"262") echo " (47 GHz)";;
		"263") echo " (60 GHz)";;
		"*") echo "";;
	esac
}

getdevicevendorproduct() {
	devname="$(basename $1)"
	case "$devname" in
		'wwan'*'at'*)
			devpath="$(readlink -f /sys/class/wwan/$devname/device)"
			T=${devpath%/*/*/*}
			if [ -e $T/vendor ] && [ -e $T/device ]; then
				V=$(cat $T/vendor)
				D=$(cat $T/device)
				echo "pci/${V/0x/}${D/0x/}"
			fi
			;;
		'ttyACM'*)
			devpath="$(readlink -f /sys/class/tty/$devname/device)"
			T=${devpath%/*}
			echo "usb/$(cat $T/idVendor)$(cat $T/idProduct)"
			;;
		'tty'*)
			devpath="$(readlink -f /sys/class/tty/$devname/device)"
			T=${devpath%/*/*}
			echo "usb/$(cat $T/idVendor)$(cat $T/idProduct)"
			;;
		*)
			devpath="$(readlink -f /sys/class/usbmisc/$devname/device)"
			T=${devpath%/*}
			echo "usb/$(cat $T/idVendor)$(cat $T/idProduct)"
			;;
	esac
}

RES="/usr/share/3ginfo-lite"

DEVICE=$($RES/detect.sh)
if [ -z "$DEVICE" ]; then
	echo '{"error":"Device not found"}'
	exit 0
fi

O=""
if [ -e /usr/bin/sms_tool ]; then
	# Execute AT commands one by one and combine the results
	O="${O}$(sms_tool -D -d $DEVICE at "AT+CPIN?")"
	O="${O}$(sms_tool -D -d $DEVICE at "AT+CSQ")"
	O="${O}$(sms_tool -D -d $DEVICE at "AT^HCSQ?")"
	O="${O}$(sms_tool -D -d $DEVICE at "AT+COPS=3,0")"
	O="${O}$(sms_tool -D -d $DEVICE at "AT+COPS?")"
	O="${O}$(sms_tool -D -d $DEVICE at "AT+COPS=3,2")"
	O="${O}$(sms_tool -D -d $DEVICE at "AT+COPS?")"
	O="${O}$(sms_tool -D -d $DEVICE at "AT+C5GREG=2")"
	O="${O}$(sms_tool -D -d $DEVICE at "AT+C5GREG?")"
	O="${O}$(sms_tool -D -d $DEVICE at "AT^MONSC")"
else
	O=$(gcom -d $DEVICE -s $RES/info.gcom 2>/dev/null)
fi

getpath() {
	devname="$(basename $1)"
	case "$devname" in
	'wwan'*'at'*)
		devpath="$(readlink -f /sys/class/wwan/$devname/device)"
		P=${devpath%/*/*/*}
		;;
	'ttyACM'*)
		devpath="$(readlink -f /sys/class/tty/$devname/device)"
		P=${devpath%/*}
		;;
	'tty'*)
		devpath="$(readlink -f /sys/class/tty/$devname/device)"
		P=${devpath%/*/*}
		;;
	*)
		devpath="$(readlink -f /sys/class/usbmisc/$devname/device/)"
		P=${devpath%/*}
		;;
	esac
}

# --- modemdefine - WAN config ---
CONFIG=modemdefine
MODEMZ=$(uci show $CONFIG 2>/dev/null | grep -o "@modemdefine\[[0-9]*\]\.modem" | wc -l | xargs)
if [[ $MODEMZ -gt 1 ]]; then
	SEC=$(uci -q get modemdefine.@general[0].main_network)
fi
if [[ $MODEMZ -eq 0 ]]; then
	SEC=$(uci -q get 3ginfo.@3ginfo[0].network)
fi
if [[ $MODEMZ -eq 1 ]]; then
	SEC=$(uci -q get modemdefine.@modemdefine[0].network)
fi

if [ -z "$SEC" ]; then
	getpath $DEVICE
	PORIG=$P
	for DEV in /sys/class/tty/* /sys/class/usbmisc/*; do
		getpath "/dev/"${DEV##/*/}
		if [ "x$PORIG" == "x$P" ]; then
			SEC=$(uci show network | grep "/dev/"${DEV##/*/} | cut -f2 -d.)
			[ -n "$SEC" ] && break
		fi
	done
fi
# --- modemdefine config ---

CONN_TIME="-"
RX="-"
TX="-"

NETUP=$(ifstatus $SEC | grep "\"up\": true")
if [ -n "$NETUP" ]; then

		CT=$(uci -q -P /var/state/ get network.$SEC.connect_time)
		if [ -z $CT ]; then
			CT=$(ifstatus $SEC | awk -F[:,] '/uptime/ {print $2}' | xargs)
		else
			UPTIME=$(cut -d. -f1 /proc/uptime)
			CT=$((UPTIME-CT))
		fi
		if [ ! -z $CT ]; then

			D=$(expr $CT / 60 / 60 / 24)
			H=$(expr $CT / 60 / 60 % 24)
			M=$(expr $CT / 60 % 60)
			S=$(expr $CT % 60)
			CONN_TIME=$(printf "%dd, %02d:%02d:%02d" $D $H $M $S)
			CONN_TIME_SINCE=$(date "+%Y%m%d%H%M%S" -d "@$(($(date +%s) - CT))")
			
		fi
		
		IFACE=$(ifstatus $SEC | awk -F\" '/l3_device/ {print $4}')
		if [ -n "$IFACE" ]; then
			RX=$(ifconfig $IFACE | awk -F[\(\)] '/bytes/ {printf "%s",$2}')
			TX=$(ifconfig $IFACE | awk -F[\(\)] '/bytes/ {printf "%s",$4}')
		fi
fi

# CSQ
CSQ=$(echo "$O" | awk -F[,\ ] '/^\+CSQ/ {print $2}')

[ "x$CSQ" == "x" ] && CSQ=-1
if [ $CSQ -ge 0 -a $CSQ -le 31 ]; then
	CSQ_PER=$(($CSQ * 100/31))
else
	CSQ=""
	CSQ_PER=""
fi

# COPS numeric
# see https://mcc-mnc.com/
# Update: 28/04/2024 items: 2970
COPS=""
COPS_MCC=""
COPS_MNC=""
COPS_NUM=$(echo "$O" | awk -F[\"] '/^\+COPS:\s*.,2/ {print $2}')
if [ -n "$COPS_NUM" ]; then
	COPS_MCC=${COPS_NUM:0:3}
	COPS_MNC=${COPS_NUM:3:3}
fi

TCOPS=$(echo "$O" | awk -F[\"] '/^\+COPS:\s*.,0/ {print $2}')
[ "x$TCOPS" != "x" ] && COPS="$TCOPS"

if [ -z "$COPS" ]; then
	if [ -n "$COPS_NUM" ]; then
		COPS=$(awk -F[\;] '/^'$COPS_NUM';/ {print $3}' $RES/mccmnc.dat | xargs)
		LOC=$(awk -F[\;] '/^'$COPS_NUM';/ {print $2}' $RES/mccmnc.dat)
	fi
fi
[ -z "$COPS" ] && COPS=$COPS_NUM
case "$COPS" in
    *\ *) 
        COPS=$(echo "$COPS" | awk '{if(NF==2 && tolower($1)==tolower($2)){print $1}else{print $0}}')
        ;;
esac

isp=$(sms_tool -d "$DEVICE" at "AT+COPS?" | sed -n '2p' | cut -d '"' -f2 | tr -d '\r')
isp_num="$COPS_MCC $COPS_MNC"
isp_numws="$COPS_MCC$COPS_MNC"

case "$COPS" in
    *[!0-9]* | '')
	# Non-numeric characters or is blank
        ;;
    *) 
        if [ "$COPS" = "$isp_num" ] || [ "$COPS" = "$isp_numws" ]; then
            if [ -n "$isp" ]; then
                COPS=$(awk -F[\;] '/^'"$isp"';/ {print $3}' $RES/mccmnc.dat | xargs)
                LOC=$(awk -F[\;] '/^'"$isp"';/ {print $2}' $RES/mccmnc.dat)
            fi
        fi
	;;
esac

# operator location from temporary config
LOCATIONFILE=/tmp/location
if [ -e "$LOCATIONFILE" ]; then
	touch $LOCATIONFILE
	LOC=$(cat $LOCATIONFILE)
	if [ -n "$LOC" ]; then
		LOC=$(cat $LOCATIONFILE)
			if [[ $LOC == "-" ]]; then
				rm $LOCATIONFILE
				LOC=$(awk -F[\;] '/^'$COPS_NUM';/ {print $2}' $RES/mccmnc.dat)
				if [ -n "$LOC" ]; then
					echo "$LOC" > /tmp/location
				fi
			else
				LOC=$(awk -F[\;] '/^'$COPS_NUM';/ {print $2}' $RES/mccmnc.dat)
				if [ -n "$LOC" ]; then
					echo "$LOC" > /tmp/location
				fi
			fi
	fi
else
	case "$COPS_MCC$COPS_MNC" in
    		*[!0-9]* | '')
        	# Non-numeric characters or is blank
        	;;
    		*) 
        		if [ -n "$LOC" ]; then
            			LOC=$(awk -F[\;] '/^'"$COPS_MCC$COPS_MNC"';/ {print $2}' $RES/mccmnc.dat)
            			echo "$LOC" > /tmp/location
        		else
            			echo "-" > /tmp/location
        		fi
        	;;
	esac
fi

T=$(echo "$O" | awk -F[,\ ] '/^\+CPIN:/ {print $0;exit}' | xargs)
if [ -n "$T" ]; then
	[ "$T" == "+CPIN: READY" ] || REG=$(echo "$T" | cut -f2 -d: | xargs)
fi

T=$(echo "$O" | awk -F[,\ ] '/^\+CME ERROR:/ {print $0;exit}')
if [ -n "$T" ]; then
	case "$T" in
		"+CME ERROR: 10"*) REG="SIM not inserted";;
		"+CME ERROR: 11"*) REG="SIM PIN required";;
		"+CME ERROR: 12"*) REG="SIM PUK required";;
		"+CME ERROR: 13"*) REG="SIM failure";;
		"+CME ERROR: 14"*) REG="SIM busy";;
		"+CME ERROR: 15"*) REG="SIM wrong";;
		"+CME ERROR: 17"*) REG="SIM PIN2 required";;
		"+CME ERROR: 18"*) REG="SIM PUK2 required";;
		*) REG=$(echo "$T" | cut -f2 -d: | xargs);;
	esac
fi

# C5GREG
C5GREG=$(echo "$O" | grep -o "+C5GREG: [^[:cntrl:]]*" | head -1)
if [ -n "$C5GREG" ]; then
	# Parse the C5GREG response
	# Format: +C5GREG: <n>,<stat>[,[<tac>],[<ci>],[<AcT>],[<Allowed_NSSAI_length>],[<Allowed_NSSAI>]]
	STAT=$(echo "$C5GREG" | cut -d, -f2 | grep -o '[0-9]*')
	TAC=$(echo "$C5GREG" | cut -d, -f3 | tr -d '"' | xargs)
	CI=$(echo "$C5GREG" | cut -d, -f4 | tr -d '"' | xargs)
	ACT=$(echo "$C5GREG" | cut -d, -f5 | grep -o '[0-9]*')
	
	# Convert hex values to decimal if they exist
	if [ -n "$TAC" ] && [ "$TAC" != "" ]; then
		TAC_HEX=$TAC
		TAC_DEC=$(printf "%d" "0x$TAC" 2>/dev/null)
	else
		TAC_HEX="-"
		TAC_DEC="-"
	fi
	
	if [ -n "$CI" ] && [ "$CI" != "" ]; then
		CID_HEX=$CI
		CID_DEC=$(printf "%d" "0x$CI" 2>/dev/null)
	else
		CID_HEX="-"
		CID_DEC="-"
	fi
	
	# Set registration status
	case "$STAT" in
		0) REG="0";;
		1) REG="1";;
		2) REG="2";;
		3) REG="3";;
		5) REG="5";;
		8) REG="8";;
		*) REG="STAT";;
	esac
	
	# Set mode based on AcT
	if [ -n "$ACT" ]; then
		MODE_NUM=$ACT
		case "$ACT" in
			10) MODE="EUTRAN-5GC";;
			11) MODE="NR-5GC";;
			*) MODE="Unknown";;
		esac
	fi
fi

CONF_DEVICE=$(uci -q get 3ginfo.@3ginfo[0].device)
if echo "x$CONF_DEVICE" | grep -q "192.168."; then
	if grep -q "Vendor=1bbb" /sys/kernel/debug/usb/devices; then
		. $RES/modem/hilink/alcatel_hilink.sh $DEVICE
	fi
	if grep -q "Vendor=12d1" /sys/kernel/debug/usb/devices; then
		. $RES/modem/hilink/huawei_hilink.sh $DEVICE
	fi
	if grep -q "Vendor=19d2" /sys/kernel/debug/usb/devices; then
		. $RES/modem/hilink/zte.sh $DEVICE
	fi
	SEC=$(uci -q get 3ginfo.@3ginfo[0].network)
	SEC=${SEC:-wan}
else

if [ -e /usr/bin/sms_tool ]; then
	REGOK=0
	[ "x$REG" == "x1" ] || [ "x$REG" == "x5" ] || [ "x$REG" == "x8" ] && REGOK=1
	VIDPID=$(getdevicevendorproduct $DEVICE)
	if [ -e "$RES/modem/$VIDPID" ]; then
		case $(cat /tmp/sysinfo/board_name) in
			"zte,mf289f")
				. "$RES/modem/usb/19d21485"
				;;
			*)
				. "$RES/modem/$VIDPID"
				;;
		esac
	fi
fi

fi

# convert rsrp to signal
convert_rsrp_to_signal() {
	local rsrp=$1
	
	# Return early if rsrp is not provided
	[ -z "$rsrp" ] && echo "255" && return
	
	# Value out of range (too low)
	[ "$rsrp" -lt -140 ] && echo "0" && return
	
	# Value out of range (too high)
	[ "$rsrp" -ge -43 ] && echo "255" && return
	
	# Calculate signal strength on a scale from 0 to 97
	# Map -140 to 0 and -43 to 97 (linear mapping)
	local adjusted=$(( (rsrp + 140) * 97 / 97 ))
	
	# Ensure the result is within bounds
	[ "$adjusted" -lt 0 ] && adjusted=0
	[ "$adjusted" -gt 97 ] && adjusted=97
	
	echo "$adjusted"
}

# if no rssi, use rsrp to stand for signal
SIGNAL=""
if [ -z "$RSRP" ] || [ "$RSRP" = "-" ] || [ "$RSRP" = "0" ]; then
	if [ -n "$RSSI" ] && [ "$RSSI" != "-" ] && [ "$RSSI" != "0" ]; then
		SIGNAL="$RSSI"
	fi
else
	if [ -z "$RSSI" ] || [ "$RSSI" = "-" ] || [ "$RSSI" = "0" ]; then
		SIGNAL=$(convert_rsrp_to_signal "$RSRP")
	fi
fi

cat <<EOF
{
"conn_time":"$CONN_TIME",
"conn_time_sec":"$CT",
"conn_time_since":"$CONN_TIME_SINCE",
"rx":"$RX",
"tx":"$TX",
"modem":"$MODEL",
"mtemp":"$TEMP",
"firmware":"$FW",
"cport":"$DEVICE",
"protocol":"$PROTO",
"csq":"$CSQ",
"signal":"$SIGNAL",
"operator_name":"$COPS",
"operator_mcc":"$COPS_MCC",
"operator_mnc":"$COPS_MNC",
"location":"$LOC",
"mode":"$MODE",
"registration":"$REG",
"simslot":"$SSIM",
"imei":"$NR_IMEI",
"imsi":"$NR_IMSI",
"iccid":"$NR_ICCID",
"lac_dec":"$LAC_DEC",
"lac_hex":"$LAC_HEX",
"tac_dec":"$TAC_DEC",
"tac_hex":"$TAC_HEX",
"tac_h":"$T_HEX",
"tac_d":"$T_DEC",
"cid_dec":"$CID_DEC",
"cid_hex":"$CID_HEX",
"pci":"$PCI",
"earfcn":"$EARFCN",
"pband":"$PBAND",
"s1band":"$S1BAND",
"s1pci":"$S1PCI",
"s1earfcn":"$S1EARFCN",
"s2band":"$S2BAND",
"s2pci":"$S2PCI",
"s2earfcn":"$S2EARFCN",
"s3band":"$S3BAND",
"s3pci":"$S3PCI",
"s3earfcn":"$S3EARFCN",
"s4band":"$S4BAND",
"s4pci":"$S4PCI",
"s4earfcn":"$S4EARFCN",
"rsrp":"$RSRP",
"rsrq":"$RSRQ",
"rssi":"$RSSI",
"sinr":"$SINR"
}
EOF
exit 0
