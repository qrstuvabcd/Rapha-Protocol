/**
 * TACo Simulator - Threshold Access Control Node Simulator
 * For Rapha Chain local development environment
 * 
 * Simulates the Threshold Network infrastructure for:
 * - Dual signature verification (Lab + Patient)
 * - Decryption key management
 * - Condition-based access control
 */

const http = require('http');

const PORT = process.env.PORT || 9090;
const THRESHOLD = parseInt(process.env.THRESHOLD) || 2;

// Simulated key fragments (in production, these would be distributed across nodes)
const keyFragments = new Map();
const pendingDecryptions = new Map();

const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        try {
            const data = body ? JSON.parse(body) : {};
            handleRequest(req.url, data, res);
        } catch (error) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
    });
});

function handleRequest(url, data, res) {
    switch (url) {
        case '/health':
            res.writeHead(200);
            res.end(JSON.stringify({
                status: 'healthy',
                mode: 'simulator',
                threshold: THRESHOLD
            }));
            break;

        case '/verify-dual-signature':
            // Simulate dual signature verification
            const { dataHash, labSignature, patientSignature } = data;

            if (!dataHash || !labSignature || !patientSignature) {
                res.writeHead(400);
                res.end(JSON.stringify({ valid: false, error: 'Missing parameters' }));
                return;
            }

            // In simulator mode, accept all signatures
            const valid = labSignature.length > 0 && patientSignature.length > 0;

            console.log(`[TACo] Verified dual signature for ${dataHash.substring(0, 10)}... : ${valid}`);

            res.writeHead(200);
            res.end(JSON.stringify({
                valid,
                dataHash,
                labVerified: true,
                patientVerified: true,
                timestamp: Date.now()
            }));
            break;

        case '/create-condition':
            // Create a new access condition
            const conditionId = `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`;

            console.log(`[TACo] Created condition: ${conditionId}`);

            res.writeHead(200);
            res.end(JSON.stringify({
                conditionId,
                created: true,
                timestamp: Date.now()
            }));
            break;

        case '/trigger-decryption':
            // Trigger decryption key release for a bounty
            const { bountyId, recipient } = data;

            if (!bountyId || !recipient) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Missing bountyId or recipient' }));
                return;
            }

            // Simulate key fragment collection
            const decryptionKey = `dk_${bountyId.substring(0, 10)}_${Date.now()}`;
            pendingDecryptions.set(bountyId, {
                recipient,
                key: decryptionKey,
                released: true,
                timestamp: Date.now()
            });

            console.log(`[TACo] Decryption triggered for bounty ${bountyId} -> ${recipient}`);

            res.writeHead(200);
            res.end(JSON.stringify({
                bountyId,
                recipient,
                decryptionTriggered: true,
                timestamp: Date.now()
            }));
            break;

        case '/status':
            res.writeHead(200);
            res.end(JSON.stringify({
                mode: 'simulator',
                threshold: THRESHOLD,
                activeConditions: keyFragments.size,
                pendingDecryptions: pendingDecryptions.size,
                uptime: process.uptime()
            }));
            break;

        default:
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Not found' }));
    }
}

server.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔══════════════════════════════════════════════════════╗
║           TACo Simulator - Rapha Chain               ║
║══════════════════════════════════════════════════════║
║  Mode:      SIMULATOR (Development Only)             ║
║  Port:      ${PORT}                                       ║
║  Threshold: ${THRESHOLD}-of-3 signatures required            ║
║                                                      ║
║  Endpoints:                                          ║
║    POST /verify-dual-signature                       ║
║    POST /create-condition                            ║
║    POST /trigger-decryption                          ║
║    GET  /status                                      ║
║    GET  /health                                      ║
╚══════════════════════════════════════════════════════╝
    `);
});
