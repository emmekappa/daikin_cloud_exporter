import {DaikinMonitoringService} from './daikin_monitoring_service.js';


// ============================================================================
// Read OIDC client credentials as environment variables.
// ============================================================================

const {OIDC_CLIENT_ID, OIDC_CLIENT_SECRET} = process.env;
if (!OIDC_CLIENT_ID || !OIDC_CLIENT_SECRET) {
    console.error('❌ Please set the OIDC_CLIENT_ID and OIDC_CLIENT_SECRET environment variables');
    process.exit(1);
}

// ============================================================================
// Configure the monitoring service
// ============================================================================

const config = {
    oidcClientId: OIDC_CLIENT_ID,
    oidcClientSecret: OIDC_CLIENT_SECRET,
    updateInterval: parseInt(process.env.UPDATE_INTERVAL || '30'), // 30 seconds by default
    prometheusPort: parseInt(process.env.PROMETHEUS_PORT || '3001'), // port 3001 by default
    // Path configurations
    certPath: process.env.CERT_PATH || './cert',
    cacheFilePath: process.env.CACHE_FILE_PATH || './daikin-cache.json',
    tokenFilePath: process.env.TOKEN_FILE_PATH || './daikin-controller-cloud-tokenset',
    oidcCallbackServerPort: parseInt(process.env.OIDC_CALLBACK_SERVER_PORT || '59748'),
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
