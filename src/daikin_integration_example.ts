// integration-example.ts
import { DaikinPrometheusExporter } from './daikin_prometheus_exporter.js';
// Sostituisci con la tua libreria Daikin
// import { DaikinCloudController } from 'daikin-controller-cloud';

interface DaikinConfig {
  username: string;
  password: string;
  updateInterval: number; // in secondi
  prometheusPort: number;
}

class DaikinMonitoringService {
  private exporter: DaikinPrometheusExporter;
  private config: DaikinConfig;
  private updateTimer?: NodeJS.Timeout;
  // private daikinController: DaikinCloudController;

  constructor(config: DaikinConfig) {
    this.config = config;
    this.exporter = new DaikinPrometheusExporter();
    
    // Inizializza il controller Daikin
    // this.daikinController = new DaikinCloudController({
    //   username: config.username,
    //   password: config.password
    // });
  }

  async start(): Promise<void> {
    try {
      console.log('🏠 Starting Daikin Monitoring Service...');
      
      // Connessione iniziale a Daikin Cloud
      // await this.daikinController.login();
      // console.log('✅ Connected to Daikin Cloud');

      // Primo aggiornamento dati
      await this.updateData();

      // Avvia il server Prometheus
      this.exporter.startServer(this.config.prometheusPort);

      // Configura aggiornamenti periodici
      this.scheduleUpdates();

      console.log(`✅ Monitoring service started successfully`);
      console.log(`📊 Prometheus metrics: http://localhost:${this.config.prometheusPort}/metrics`);
      
    } catch (error) {
      console.error('❌ Failed to start monitoring service:', error);
      throw error;
    }
  }

  private async updateData(): Promise<void> {
    try {
      console.log('🔄 Fetching data from Daikin Cloud...');
      
      // Ottieni i dati dalla libreria Daikin
      // const devices = await this.daikinController.getDevices();
      
      // Per ora usa dati di esempio - sostituisci con la chiamata reale
      const devices = await this.getMockData();
      
      // Aggiorna le metriche Prometheus
      this.exporter.updateDevices(devices);
      
      console.log(`✅ Updated ${devices.length} devices`);
      
    } catch (error) {
      console.error('❌ Error updating data:', error);
      
      // Metriche di errore per Prometheus
      // Potresti aggiungere una metrica per tracciare gli errori di fetch
    }
  }

  private scheduleUpdates(): void {
    this.updateTimer = setInterval(
      () => this.updateData(),
      this.config.updateInterval * 1000
    );
  }

  async stop(): Promise<void> {
    console.log('🛑 Stopping Daikin Monitoring Service...');
    
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
    
    // Disconnetti da Daikin Cloud se necessario
    // await this.daikinController.logout();
    
    console.log('✅ Service stopped');
  }

  // Metodo temporaneo per dati mock - rimuovi quando integri la libreria reale
  private async getMockData() {
    // Usa i tuoi dati JSON reali qui
    return [
      {
        "_id": "0b0357c4-2067-4e3f-a1ba-d0a1c6f9a913",
        "deviceModel": "dx4",
        "isCloudConnectionUp": { "value": true },
        "timestamp": new Date().toISOString(),
        "managementPoints": [
          {
            "embeddedId": "gateway",
            "managementPointType": "gateway"
          },
          {
            "embeddedId": "climateControl",
            "managementPointType": "climateControl",
            "name": { "value": "Sala" },
            "onOffMode": { "value": "off" },
            "operationMode": { "value": "cooling" },
            "powerfulMode": { "value": "off" },
            "sensoryData": {
              "value": {
                "roomTemperature": { "value": 29, "unit": "°C" },
                "roomHumidity": { "value": 50, "unit": "%" },
                "outdoorTemperature": { "value": 31, "unit": "°C" }
              }
            },
            "temperatureControl": {
              "value": {
                "operationModes": {
                  "cooling": {
                    "setpoints": {
                      "roomTemperature": { "value": 28, "unit": "°C" }
                    }
                  },
                  "heating": {
                    "setpoints": {
                      "roomTemperature": { "value": 25, "unit": "°C" }
                    }
                  },
                  "auto": {
                    "setpoints": {
                      "roomTemperature": { "value": 25, "unit": "°C" }
                    }
                  }
                }
              }
            },
            "fanControl": {
              "value": {
                "operationModes": {
                  "cooling": {
                    "fanSpeed": {
                      "currentMode": { "value": "auto" }
                    },
                    "fanDirection": {
                      "horizontal": { "currentMode": { "value": "swing" } },
                      "vertical": { "currentMode": { "value": "windNice" } }
                    }
                  }
                }
              }
            },
            "consumptionData": {
              "value": {
                "electrical": {
                  "unit": "kWh",
                  "heating": {
                    "d": Array(24).fill(0),
                    "w": Array(14).fill(0),
                    "m": Array(24).fill(0)
                  },
                  "cooling": {
                    "d": [0.7, 0.1, 0.1, 0.1, 0.1, 0.1, 1.2, 0.1, 0.1, 0.2, 0.1, 0.5, 0.3, ...Array(11).fill(0)],
                    "w": Array(14).fill(0.5),
                    "m": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1.2, 35.4, 27.4, ...Array(5).fill(0)]
                  }
                }
              }
            },
            "isInErrorState": { "value": false },
            "isInWarningState": { "value": false },
            "isInCautionState": { "value": false }
          }
        ]
      }
    ];
  }
}

// Configurazione
const config: DaikinConfig = {
  username: process.env.DAIKIN_USERNAME || '',
  password: process.env.DAIKIN_PASSWORD || '',
  updateInterval: parseInt(process.env.UPDATE_INTERVAL || '30'), // 30 secondi
  prometheusPort: parseInt(process.env.PROMETHEUS_PORT || '3001')
};

// Avvio del servizio
async function main() {
  const service = new DaikinMonitoringService(config);

  // Gestione graceful shutdown
  process.on('SIGTERM', async () => {
    await service.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    await service.stop();
    process.exit(0);
  });

  try {
    await service.start();
  } catch (error) {
    console.error('💥 Service failed to start:', error);
    process.exit(1);
  }
}

// Avvia solo se questo file viene eseguito direttamente
if (require.main === module) {
  main();
}

export { DaikinMonitoringService, DaikinConfig };