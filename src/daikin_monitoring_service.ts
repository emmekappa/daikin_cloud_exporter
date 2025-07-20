import { DaikinCloudController } from "daikin-controller-cloud";
import { OnectaRateLimitStatus } from "daikin-controller-cloud/dist/onecta/oidc-utils.js";
import { DaikinPrometheusExporter } from './daikin_prometheus_exporter.js';
import { homedir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Ottieni __dirname equivalente per moduli ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface DaikinConfig {
  oidcClientId: string;
  oidcClientSecret: string;
  updateInterval: number; // in secondi
  prometheusPort: number;
}

export class DaikinMonitoringService {
  private exporter: DaikinPrometheusExporter;
  private config: DaikinConfig;
  private updateTimer?: NodeJS.Timeout;
  private controller: DaikinCloudController;

  constructor(config: DaikinConfig) {
    this.config = config;
    this.exporter = new DaikinPrometheusExporter();

    // Inizializza il controller Daikin
    this.controller = new DaikinCloudController({
      oidcClientId: config.oidcClientId,
      oidcClientSecret: config.oidcClientSecret,
      oidcTokenSetFilePath: resolve(homedir(), '.daikin-controller-cloud-tokenset'),
      oidcAuthorizationTimeoutS: 120,
      certificatePathKey: resolve(__dirname, '..', 'cert', 'cert.key'),
      certificatePathCert: resolve(__dirname, '..', 'cert', 'cert.pem'),
    });

    // Setup eventi del controller
    this.setupControllerEvents();
  }

  private setupControllerEvents(): void {
    this.controller.on('authorization_request', (url: string) => {
      console.log(`
🔐 Authorization Required!
Please make sure that ${url} is set as "Redirect URL" in your Daikin Developer Portal account for the used Client!
 
Then please open the URL ${url} in your browser and accept the security warning for the self signed certificate (if you open this for the first time).
 
Afterwards you are redirected to Daikin to approve the access and then redirected back.`);
    });

    this.controller.on('rate_limit_status', (rateLimitStatus: OnectaRateLimitStatus) => {
      console.log('🚦 Rate limit status:', rateLimitStatus);
    });
  }

  async start(): Promise<void> {
    try {
      console.log('🏠 Starting Daikin Monitoring Service...');

      // Primo aggiornamento dati (che inizializza anche la connessione)
      await this.updateData();

      // Avvia il server Prometheus
      this.exporter.startServer(this.config.prometheusPort);

      // Configura aggiornamenti periodici
      this.scheduleUpdates();

      console.log(`✅ Monitoring service started successfully`);
      console.log(`📊 Prometheus metrics: http://localhost:${this.config.prometheusPort}/metrics`);
      console.log(`🏥 Health check: http://localhost:${this.config.prometheusPort}/health`);

    } catch (error) {
      console.error('❌ Failed to start monitoring service:', error);
      throw error;
    }
  }

  private async updateData(): Promise<void> {
    try {
      console.log('🔄 Fetching data from Daikin Cloud...');

      // Chiamata reale al controller Daikin
      const devices = await this.controller.getCloudDeviceDetails();

      // Aggiorna le metriche Prometheus
      this.exporter.updateDevices(devices);

      console.log(`✅ Updated ${devices.length} devices`);

    } catch (error) {
      console.error('❌ Error updating data:', error);

      // Potremmo aggiungere qui una metrica per tracciare gli errori
      throw error;
    }
  }

  private scheduleUpdates(): void {
    console.log(`⏰ Scheduling updates every ${this.config.updateInterval} seconds`);
    this.updateTimer = setInterval(
      () => this.updateData().catch(error => {
        console.error('❌ Scheduled update failed:', error);
      }),
      this.config.updateInterval * 1000
    );
  }

  async stop(): Promise<void> {
    console.log('🛑 Stopping Daikin Monitoring Service...');

    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }

    this.exporter.stopServer();

    console.log('✅ Service stopped');
  }
}
