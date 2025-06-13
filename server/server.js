console.log("👋 server.js file loaded");
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/docs', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Document = mongoose.model('Document', new mongoose.Schema({
  _id: String,
  data: Object,
}));

io.on('connection', socket => {
  socket.on('get-document', async documentId => {
    const document =
      (await Document.findById(documentId)) ||
      (await Document.create({ _id: documentId, data: '' }));

    socket.join(documentId);
    socket.emit('load-document', document.data);

    socket.on('send-changes', delta => {
      socket.broadcast.to(documentId).emit('receive-changes', delta);
    });

    socket.on('save-document', async data => {
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });
});

server.listen(3001, () => {
  console.log('Server started on http://localhost:3001');
});
