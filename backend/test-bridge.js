const net = require('net');

// Create bridge
const server = net.createServer((socket) => {
    const remote = net.createConnection({ port: 5432, host: '::1' });
    socket.pipe(remote);
    remote.pipe(socket);
    socket.on('error', () => remote.destroy());
    remote.on('error', () => socket.destroy());
});

server.listen(5433, '127.0.0.1', async () => {
    console.log('Bridge ready on 127.0.0.1:5433');
    
    // Test Prisma or raw connection
    const testSocket = net.createConnection({ port: 5433, host: '127.0.0.1' }, () => {
        console.log('Successfully connected to bridge on 127.0.0.1:5433!');
        testSocket.destroy();
        process.exit(0);
    });
    testSocket.on('error', (err) => {
        console.error('Failed to connect to bridge:', err.message);
        process.exit(1);
    });
});
