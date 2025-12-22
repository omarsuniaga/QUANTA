// Servidor WebSocket básico para pruebas
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 3003 });

wss.on('connection', function connection(ws) {
  console.log('Cliente conectado');
  ws.send('Conexión WebSocket exitosa');

  ws.on('message', function incoming(message) {
    console.log('Mensaje recibido:', message);
    // Puedes responder al cliente si lo deseas
    ws.send(`Echo: ${message}`);
  });

  ws.on('close', () => {
    console.log('Cliente desconectado');
  });
});

console.log('Servidor WebSocket escuchando en ws://localhost:3003/');
