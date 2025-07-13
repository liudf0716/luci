# LuCI Support for GPSD

This package provides a LuCI web interface for configuring GPSD (GPS daemon).

## Features

- Enable/disable GPSD service
- Configure GPS device path
- Set TCP port and listening options
- Real-time service status monitoring
- Advanced configuration options

## Dependencies

- **gpsd** package (contains the daemon, init script, and default configuration)
- **luci-base**

## Installation

1. Install the gpsd package first:
   ```
   opkg update
   opkg install gpsd
   ```

2. Install this LuCI app:
   ```
   opkg install luci-app-gpsd
   ```

## Package Responsibilities

- **gpsd package**: Provides the GPSD daemon, init script (`/etc/init.d/gpsd`), and default configuration file (`/etc/config/gpsd`)
- **luci-app-gpsd package**: Provides only the LuCI web interface for managing GPSD configuration

## Configuration

The web interface allows you to configure:
- GPS device path (e.g., /dev/ttyUSB0, /dev/ttyS1)
- TCP port (default: 2947)
- Global listening (allow remote connections)
- Additional GPSD command line options

## Usage

After installation, navigate to **Services → GPSD** in the LuCI web interface to configure your GPS daemon.

## Configuration File

The configuration is stored in `/etc/config/gpsd` with the following structure:
```
config gpsd 'core'
	option enabled '0'
	option device '/dev/ttyS1'
	option port '2947'
	option listen_globally '0'
```
- GPS hardware connected to the system
