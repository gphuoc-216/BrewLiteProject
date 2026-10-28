const net = require('net');

const server = net.createServer((socket) => {
    const remote = net.createConnection({ port: 5432, host: '::1' });
    socket.pipe(remote);
    remote.pipe(socket);
    socket.on('error', () => remote.destroy());
    remote.on('error', () => socket.destroy());
});

server.listen(5433, '127.0.0.1', () => {
    console.log('PostgreSQL Bridge listening on 127.0.0.1:5433 -> [::1]:5432');
});
