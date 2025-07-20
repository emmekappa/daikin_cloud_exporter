import { DaikinMonitoringService } from './daikin_monitoring_service.js';


// ============================================================================
// Read OIDC client credentials as environment variables.
// ============================================================================

const {oidc_client_id, oidc_client_secret} = process.env;
if (!oidc_client_id || !oidc_client_secret) {
    console.error('❌ Please set the oidc_client_id and oidc_client_secret environment variables');
    process.exit(1);
}

// ============================================================================
// Configure the monitoring service
// ============================================================================

const config = {
  oidcClientId: oidc_client_id,
  oidcClientSecret: oidc_client_secret,
  updateInterval: parseInt(process.env.UPDATE_INTERVAL || '30'), // 30 seconds by default
  prometheusPort: parseInt(process.env.PROMETHEUS_PORT || '3001') // port 3001 by default
};

// ============================================================================
// Start the monitoring service
// ============================================================================

async function main() {
  const service = new DaikinMonitoringService(config);

  // Graceful shutdown handler
  const shutdownHandler = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
    try {
      await service.stop();
      console.log('✅ Service stopped successfully');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
  process.on('SIGINT', () => shutdownHandler('SIGINT'));

  try {
    await service.start();
  } catch (error) {
    console.error('💥 Service failed to start:', error);
    process.exit(1);
  }
}

// Start the application
main().catch(error => {
  console.error('💥 Unhandled error in main:', error);
  process.exit(1);
});
