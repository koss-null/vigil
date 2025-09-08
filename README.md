# Vigil - Cluster System Monitor

![Vigil](https://img.shields.io/badge/Go-1.19%2B-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Status](https://img.shields.io/badge/Status-Development-yellow)

Vigil is a lightweight, self-hosted system monitoring solution for home servers and small clusters. It provides real-time monitoring of system resources across multiple Linux machines with a clean web interface.

## Features

- **Real-time System Monitoring**: CPU, memory, disk usage, and load averages
- **Multi-node Support**: Monitor multiple machines from a single dashboar (planned)d
- **Temperature Monitoring**: CPU and motherboard temperature sensors
- **Web Interface**: Responsive dashboard built with Tailwind CSS
- **Auto-discovery**: Automatic detection of nodes in local network (planned)
- **Service Management**: Control systemd services via web interface (planned)
- **Power Management**: Remote shutdown and reboot capabilities (planned)

## Architecture

Vigil consists of two main components:

1. **Server/Agent**: A Go application that collects system metrics and serves the web interface
2. **Web Dashboard**: A responsive frontend that displays system information in real-time

## Installation

### Prerequisites

- Go 1.19 or later
- Ubuntu/Debian-based systems
- System with systemd (for service management features)

### Building from Source

1. Clone the repository:
```bash
git clone https://github.com/your-username/vigil.git
cd vigil
```

2. Build the binary:
```bash
make build
```

3. Create the configuration file:
```bash
sudo mkdir -p /etc/vigil
sudo touch /etc/vigil/config.yaml
```
Default config is:
```yaml
server_address: ":6969"
discovery_port: 9069
poll_interval_seconds: 5
```

4. Edit the configuration file as needed:
```yaml
server_address: ":6969"
discovery_port: 9069
poll_interval_seconds: 5
allowed_nodes:
  - "192.168.1.*"
  - "10.0.0.*"
```

5. (Optional) Create a systemd service file for automatic startup:
```bash
sudo cp deployments/vigil.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable vigil.service
sudo systemctl start vigil.service
```

## Usage

### Running the Server

```bash
./build/vigil
```

The web interface will be available at `http://localhost:6969`.

### Adding Nodes (not implemented)

1. Install Vigil on each node you want to monitor
2. Ensure nodes are in the allowed networks in your configuration
3. Nodes should automatically appear in the dashboard

## API Endpoints

- `GET /api/system-info` - Get current system metrics
- `GET /api/nodes` - List discovered nodes (coming soon)
- `GET /api/services` - Manage system services (coming soon)

## Dependencies

### Backend
- [gopsutil](https://github.com/shirou/gopsutil) - System metrics collection
- [YAML](https://gopkg.in/yaml.v3) - Configuration parsing

### Frontend
- [Tailwind CSS](https://tailwindcss.com) - Styling framework
- Vanilla JavaScript - No external JS frameworks

## Development

### Adding New Metrics

1. Extend the `SystemInfo` struct in `internal/agent/agent.go`
2. Implement data collection in the `GetSystemInfo()` method
3. Update the API handlers to include the new data
4. Update the frontend to display the new metrics

### Building for Production

```bash
GOOS=linux GOARCH=amd64 go build -o vigil-linux-amd64 ./cmd/server
```
or just use `make build`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Roadmap

- [ ] Multi-node support and auto-discovery
- [ ] Systemd service management
- [ ] Remote power control (shutdown/reboot)
- [ ] Historical data and trends
- [ ] Alerting and notifications
- [ ] Authentication and authorization
- [ ] Plugin system for custom metrics

## Support

For support, please open an issue on GitHub or contact me.
