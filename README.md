# Daikin Cloud Prometheus Exporter

A Prometheus exporter that collects data from Daikin Cloud API and exposes it as metrics for monitoring and alerting.

## 🏠 Overview

This application connects to the Daikin Cloud API to fetch real-time data from your Daikin HVAC devices and exposes it as Prometheus metrics. 
It provides comprehensive monitoring of temperature, humidity, power consumption, and device status.

## ✨ Features

- **Real-time HVAC monitoring** - Temperature, humidity, and device status
- **Energy consumption tracking** - Daily, weekly, and monthly power usage
- **Prometheus metrics** - Standard format for integration with monitoring systems
- **Rate limit compliant** - Respects Daikin's 200 API calls per day limit
- **Health checks** - Built-in endpoint for service monitoring
- **Graceful shutdown** - Proper cleanup on service termination
- **Docker support** - Ready for containerized deployment

## 📊 Exported Metrics

| Metric Name | Type | Description | Labels |
|-------------|------|-------------|--------|
| `daikin_room_temperature_celsius` | Gauge | Room temperature in Celsius | device_id, device_model, device_name, control_id |
| `daikin_room_humidity_percent` | Gauge | Room humidity percentage | device_id, device_model, device_name, control_id |
| `daikin_outdoor_temperature_celsius` | Gauge | Outdoor temperature in Celsius | device_id, device_model, device_name, control_id |
| `daikin_target_temperature_celsius` | Gauge | Target temperature setting | device_id, device_model, device_name, control_id, mode |
| `daikin_device_online` | Gauge | Device online status (1=online, 0=offline) | device_id, device_model |
| `daikin_device_power_on` | Gauge | Device power status (1=on, 0=off) | device_id, device_model, device_name, control_id, mode |
| `daikin_powerful_mode` | Gauge | Powerful mode status | device_id, device_model, device_name, control_id |
| `daikin_error_state` | Gauge | Device error state | device_id, device_model, device_name, control_id |
| `daikin_warning_state` | Gauge | Device warning state | device_id, device_model, device_name, control_id |
| `daikin_consumption_today_kwh` | Gauge | Today's energy consumption in kWh | device_id, device_model, device_name, control_id |
| `daikin_consumption_week_kwh` | Gauge | This week's energy consumption in kWh | device_id, device_model, device_name, control_id |
| `daikin_consumption_month_kwh` | Gauge | This month's energy consumption in kWh | device_id, device_model, device_name, control_id |
| `daikin_data_updates_total` | Counter | Total number of API calls made | status |

## 🛠️ Tech Stack

- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript development
- **[Node.js](https://nodejs.org/)** - JavaScript runtime
- **[Express](https://expressjs.com/)** - Web framework for HTTP endpoints
- **[prom-client](https://github.com/siimon/prom-client)** - Prometheus metrics library
- **[daikin-controller-cloud](https://github.com/Apollon77/daikin-controller-cloud)** - Daikin Cloud API client
- **[tsx](https://github.com/esbuild-kit/tsx)** - TypeScript execution environment

## 🚀 Quick Start

### Prerequisites

1. **Daikin Developer Account**: Register at [developer.cloud.daikineurope.com](https://developer.cloud.daikineurope.com)
2. **OIDC Credentials**: Create an application and get your client ID and secret
3. **Node.js**: Version 18 or higher
4. **ppnpm**: Package manager (or pnpm/yarn)

### Installation

```bash
# Clone the repository
git clone https://github.com/emmekappa/daikin_cloud_exporter.git
cd daikin_cloud_exporter

# Install dependencies
ppnpm install

# Setup environment variables
cp .env.example .env
# Edit .env with your Daikin OIDC credentials
```

### Configuration

Edit the `.env` file with your credentials:

```env
# Daikin OIDC Client Credentials
oidc_client_id=your_daikin_oidc_client_id_here
oidc_client_secret=your_daikin_oidc_client_secret_here

# Monitoring Configuration (8 minutes = 480 seconds)
# This respects the 200 API calls/day limit (~180 calls + 20 for testing)
UPDATE_INTERVAL=480

# Prometheus Exporter Port
PROMETHEUS_PORT=3001
```

### Running the Application

**Development mode:**
```bash
pnpm start
# or
pnpm run run
```

**Production (compiled):**
```bash
pnpm run build
pnpm start
```

**Docker:**
```bash
# Build image
pnpm run docker:build

# Run container
pnpm run docker:run
```

## 📡 API Endpoints

- **Metrics**: `http://localhost:3001/metrics` - Prometheus metrics endpoint
- **Health Check**: `http://localhost:3001/health` - Service health status

## 🔧 Project Structure

```
src/
├── index.ts                      # Application entry point
├── daikin_monitoring_service.ts  # Main service orchestrator
├── daikin_prometheus_exporter.ts # Prometheus metrics exporter
├── daikin_data_parser.ts         # Daikin API response parser
└── daikin_integration_example.ts # Usage example (legacy)

cert/                             # SSL certificates for OIDC flow
├── cert.key                      # Private key
├── cert.pem                      # Certificate
└── generate.sh                   # Certificate generation script
```

## ⚙️ Configuration Options

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `oidc_client_id` | - | Daikin OIDC Client ID (required) |
| `oidc_client_secret` | - | Daikin OIDC Client Secret (required) |
| `UPDATE_INTERVAL` | 480 | Data fetch interval in seconds |
| `PROMETHEUS_PORT` | 3001 | Port for Prometheus metrics server |

## 🐳 Docker Deployment

The application includes Docker support:

```bash
# Build the image
docker build -t daikin-prometheus-exporter .

# Run with environment file
docker run -p 3001:3001 --env-file .env daikin-prometheus-exporter

# Or with environment variables
docker run -p 3001:3001 \
  -e oidc_client_id=your_client_id \
  -e oidc_client_secret=your_secret \
  daikin-prometheus-exporter
```

## 📊 Monitoring Setup

### Prometheus Configuration

Add this job to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'daikin-exporter'
    static_configs:
      - targets: ['localhost:3001']
    scrape_interval: 60s
```

### Grafana Dashboard

Create dashboards using the exported metrics to visualize:
- Temperature trends over time
- Energy consumption patterns
- Device status and uptime
- HVAC efficiency metrics

## 🚨 Rate Limiting

Daikin Cloud API has a limit of **200 calls per day**. The default configuration uses 8-minute intervals (480 seconds) which results in approximately 180 automatic calls per day, leaving 20 calls for testing and manual operations.

To adjust the frequency, modify the `UPDATE_INTERVAL` environment variable:
- More frequent: Lower interval (use sparingly)
- Less frequent: Higher interval (more API calls available for testing)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Daikin Developer Portal](https://developer.cloud.daikineurope.com)
- [Prometheus](https://prometheus.io/)
- [Grafana](https://grafana.com/)
- [daikin-controller-cloud Library](https://github.com/Apollon77/daikin-controller-cloud)

## 🆘 Support

If you encounter issues:

1. Check that your OIDC credentials are correct
2. Verify SSL certificates are present in the `cert/` directory
3. Ensure you're within the API rate limits
4. Check the application logs for detailed error messages

For bugs and feature requests, please open an issue on GitHub.
