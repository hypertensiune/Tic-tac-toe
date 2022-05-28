const fs = require('fs');
const http = require('http');

const server = http.createServer(function(req, res){
    let path = req.url == '/' ? __dirname + '/client/index.html' : __dirname + req.url;
    fs.readFile(path, (err, data) => {
        switch(req.url){
            case '/':
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write(data);
                break;
            case '/client/game.js':
                res.writeHead(200, {'Content-Type': 'text/javascript'});
                res.write(data);
                break;
        }
        return res.end();
    });
});

const io = require('socket.io')(server);

io.on('connection', socket => {
    socket.on('movetoserver', (data) => {
        io.in(socket.roomId).emit('movetoclient', data);
    });

    socket.on('join', (id) => {
        socket.join(id);
        socket.roomId = id;
    });

    socket.on('usernameset', (username) => {
        socket.username = username;
    });

    socket.on('join-room', (id, username, cb) => {
        if(io.sockets.adapter.rooms.has(id) && io.sockets.adapter.rooms.get(id).size < 2){
            let sockets = io.sockets.adapter.rooms.get(id);
            let targetsocket = io.sockets.sockets.get(Array.from(sockets)[0]);
            socket.join(id);
            socket.roomId = id;
            socket.to(id).emit('joined', username);
            cb(true, targetsocket.username);
        }
        else{
            cb(false);
        }
    });

    socket.on('win', () => {
        socket.to(socket.roomId).emit('lost');
    });

    socket.on('playagainrequest', () => {
        socket.to(socket.roomId).emit('playagainconfirm');
    });

    socket.on('playagaincancel', () => {
        socket.to(socket.roomId).emit('playagaincancelcon');
        socket.leave(socket.roomId);
    });
});

server.listen(process.env.PORT || 3000);