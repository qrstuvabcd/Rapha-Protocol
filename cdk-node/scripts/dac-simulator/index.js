/**
 * Rapha Chain - DAC Simulator
 * 
 * Simulates the Medical Research Institution Data Availability Committee
 * for local development and testing.
 * 
 * Endpoints:
 * - GET /health - Health check
 * - POST /sign - Sign data batch
 * - GET /status - DAC status
 */

const http = require('http');
const crypto = require('crypto');

const PORT = process.env.PORT || 8090;
const REQUIRED_SIGNATURES = parseInt(process.env.REQUIRED_SIGNATURES || '2');
const NODE_NAMES = (process.env.NODE_NAMES || 'Edinburgh,HKU,CUHK').split(',');

// Simulated DAC nodes
const nodes = NODE_NAMES.map((name, index) => ({
    id: index + 1,
    name: name.trim(),
    address: `0x${crypto.randomBytes(20).toString('hex')}`,
    publicKey: crypto.generateKeyPairSync('ed25519').publicKey,
    privateKey: crypto.generateKeyPairSync('ed25519').privateKey,
    online: true,
    signedBatches: 0
}));

// Batch storage
const batches = new Map();

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.method === 'GET' && url.pathname === '/health') {
        res.writeHead(200);
        res.end(JSON.stringify({ status: 'healthy', nodes: nodes.length }));
        return;
    }

    if (req.method === 'GET' && url.pathname === '/status') {
        res.writeHead(200);
        res.end(JSON.stringify({
            mode: 'simulator',
            requiredSignatures: REQUIRED_SIGNATURES,
            totalNodes: nodes.length,
            onlineNodes: nodes.filter(n => n.online).length,
            nodes: nodes.map(n => ({
                id: n.id,
                name: n.name,
                address: n.address,
                online: n.online,
                signedBatches: n.signedBatches
            })),
            totalBatches: batches.size
        }));
        return;
    }

    if (req.method === 'POST' && url.pathname === '/sign') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { batchHash, batchNumber } = JSON.parse(body);

                if (!batchHash) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: 'batchHash required' }));
                    return;
                }

                // Collect signatures from online nodes
                const signatures = [];
                const onlineNodes = nodes.filter(n => n.online);

                for (const node of onlineNodes) {
                    if (signatures.length >= REQUIRED_SIGNATURES) break;

                    // Simulate signature
                    const signature = crypto.createHash('sha256')
                        .update(`${node.address}:${batchHash}:${Date.now()}`)
                        .digest('hex');

                    signatures.push({
                        nodeId: node.id,
                        nodeName: node.name,
                        nodeAddress: node.address,
                        signature: `0x${signature}`,
                        timestamp: Date.now()
                    });

                    node.signedBatches++;
                }

                const isValid = signatures.length >= REQUIRED_SIGNATURES;

                // Store batch
                batches.set(batchHash, {
                    batchHash,
                    batchNumber,
                    signatures,
                    isValid,
                    timestamp: Date.now()
                });

                res.writeHead(isValid ? 200 : 503);
                res.end(JSON.stringify({
                    batchHash,
                    isValid,
                    signaturesCollected: signatures.length,
                    requiredSignatures: REQUIRED_SIGNATURES,
                    signatures
                }));

            } catch (error) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: error.message }));
            }
        });
        return;
    }

    if (req.method === 'GET' && url.pathname.startsWith('/batch/')) {
        const batchHash = url.pathname.split('/')[2];
        const batch = batches.get(batchHash);

        if (!batch) {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Batch not found' }));
            return;
        }

        res.writeHead(200);
        res.end(JSON.stringify(batch));
        return;
    }

    // Toggle node online/offline for testing
    if (req.method === 'POST' && url.pathname.startsWith('/node/')) {
        const nodeId = parseInt(url.pathname.split('/')[2]);
        const action = url.pathname.split('/')[3];

        const node = nodes.find(n => n.id === nodeId);
        if (!node) {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Node not found' }));
            return;
        }

        if (action === 'offline') {
            node.online = false;
        } else if (action === 'online') {
            node.online = true;
        }

        res.writeHead(200);
        res.end(JSON.stringify({ nodeId, name: node.name, online: node.online }));
        return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
    console.log(`🏥 Rapha Chain DAC Simulator`);
    console.log(`============================`);
    console.log(`Mode: Simulator`);
    console.log(`Port: ${PORT}`);
    console.log(`Required Signatures: ${REQUIRED_SIGNATURES}`);
    console.log(`DAC Nodes:`);
    nodes.forEach(n => console.log(`  - ${n.name}: ${n.address}`));
    console.log(`\nEndpoints:`);
    console.log(`  GET  /health     - Health check`);
    console.log(`  GET  /status     - DAC status`);
    console.log(`  POST /sign       - Sign batch`);
    console.log(`  GET  /batch/:id  - Get batch`);
});
