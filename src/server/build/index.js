"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var debug_1 = __importDefault(require("debug"));
var classPieces_1 = require("./pieces/classPieces");
var Game_1 = require("./game/Game");
var Game_2 = require("./game/Game");
var keyUp_1 = require("./pieces/keyUp");
var logerror = debug_1.default('tetris:error'), loginfo = debug_1.default('tetris:info');
var initApp = function (app, params, cb) {
    var host = params.host, port = params.port;
    var handler = function (req, res) {
        var file = req.url === '/bundle.js' ? '/../../build/bundle.js' : '/../../../index.html';
        fs_1.default.readFile(__dirname + file, function (err, data) {
            if (err) {
                logerror(err);
                res.writeHead(500);
                return res.end('Error loading index.html');
            }
            res.writeHead(200);
            res.end(data);
        });
    };
    app.on('request', handler);
    app.listen({ host: host, port: port }, function () {
        console.log("tetris listen on " + params.url);
        cb();
    });
};
var rooms_array = [];
function emit_to_room(room, io) {
    if (room)
        for (var i in room.players) {
            io.to(room.players[i].socketID).emit('action', { type: 'joinRoom', room: room, master: room.players[i].gameMaster });
        }
}
var initEngine = function (io) {
    io.on('connection', function (socket) {
        console.log("Socket connected: " + socket.id);
        socket.on('action', function (action) {
            console.log(action.type);
            if (action.type === 'server/creatRoom') {
                rooms_array = Game_2.joinGame(action.roomName, action.playerName, action.socketID, rooms_array, action.priv);
                var room = Game_2.getGame(action.playerName, rooms_array);
                if (!room)
                    return (false);
                socket.join(room.name);
                socket.emit('action', { type: 'joinRoom', room: room, master: 2 });
                socket.broadcast.emit('action', { type: 'joinRoom_', room: room, master: 2 });
                socket.emit('action', { type: 'searchResult', results: Game_1.getSearchResult(rooms_array) });
                socket.broadcast.emit('action', { type: 'searchResult', results: Game_1.getSearchResult(rooms_array) });
            }
            if (action.type == 'server/searchRoom') {
                socket.emit('action', { type: 'searchResult', results: Game_1.getSearchResult(rooms_array) });
            }
            if (action.type == 'server/removePlayerFromRoom') {
                var room = Game_2.getGame(action.playerName, rooms_array);
                if (!room)
                    return (false);
                if (room)
                    socket.leave(room.name);
                var removedPlayer = Game_2.removePlayer(action.playerName, "", rooms_array);
                socket.emit('action', { type: 'joinRoom', room: undefined, master: false });
                if (room)
                    emit_to_room(room, io);
                if (isEndGame(room)) {
                    room = resetRoomSpec(room);
                    io.sockets.in(room.name).emit('action', { type: 'END_GAME', room: room });
                }
                socket.emit('action', { type: 'searchResult', results: Game_1.getSearchResult(rooms_array) });
                socket.broadcast.emit('action', { type: 'searchResult', results: Game_1.getSearchResult(rooms_array) });
            }
            if (action.type == 'server/changeParamRoom') {
                Game_2.GameChangeParam(action.val, action.id, action.name, rooms_array);
                var room = Game_2.getGameWithNameRoom(action.name, rooms_array);
                if (room)
                    emit_to_room(room, io);
            }
            if (action.type == 'server/keyDown') {
                var room = Game_2.getGame(action.name, rooms_array);
                if (!room)
                    return (false);
                room = classPieces_1.featherDrop(room, socket.id);
                io.sockets.in(room.name).emit('action', { type: 'GAME_START', room: room });
                socket.broadcast.emit('action', { type: 'searchResult', results: Game_1.getSearchResult(rooms_array) });
                Game_2.updateRoomArray(room, rooms_array);
                if (isEndGame(room)) {
                    room = resetRoomSpec(room);
                    io.sockets.in(room.name).emit('action', { type: 'END_GAME', room: room });
                }
            }
            if (action.type == 'server/keySpace') {
                var room = Game_2.getGame(action.name, rooms_array);
                if (!room)
                    return (false);
                room = classPieces_1.floorPiece(room, socket.id);
                io.sockets.in(room.name).emit('action', { type: 'GAME_START', room: room });
                socket.broadcast.emit('action', { type: 'searchResult', results: Game_1.getSearchResult(rooms_array) });
                Game_2.updateRoomArray(room, rooms_array);
                if (isEndGame(room)) {
                    room = resetRoomSpec(room);
                    io.sockets.in(room.name).emit('action', { type: 'END_GAME', room: room });
                }
            }
            if (action.type == 'server/keyleft') {
                var room = Game_2.getGame(action.name, rooms_array);
                if (!room)
                    return (false);
                room = classPieces_1.moveLeft(room, socket.id);
                Game_2.updateRoomArray(room, rooms_array);
                io.sockets.in(room.name).emit('action', { type: 'GAME_START', room: room });
                socket.broadcast.emit('action', { type: 'searchResult', results: Game_1.getSearchResult(rooms_array) });
                if (isEndGame(room)) {
                    room = resetRoomSpec(room);
                    io.sockets.in(room.name).emit('action', { type: 'END_GAME', room: room });
                }
            }
            if (action.type == 'server/keyRight') {
                var room = Game_2.getGame(action.name, rooms_array);
                if (!room)
                    return (false);
                room = classPieces_1.moveRight(room, socket.id);
                Game_2.updateRoomArray(room, rooms_array);
                io.sockets.in(room.name).emit('action', { type: 'GAME_START', room: room });
                socket.broadcast.emit('action', { type: 'searchResult', results: Game_1.getSearchResult(rooms_array) });
                if (isEndGame(room)) {
                    room = resetRoomSpec(room);
                    io.sockets.in(room.name).emit('action', { type: 'END_GAME', room: room });
                }
            }
            if (action.type == 'server/gameStart') {
                var room = Game_2.getGame(action.playerName, rooms_array);
                if (!room)
                    return (false);
                var socketRoom = Game_2.getGameWithNameRoom(room.name, rooms_array);
                var new_room = [];
                socketRoom.Pieces.push(new classPieces_1.pieces());
                socketRoom.Pieces.push(new classPieces_1.pieces());
                if (!socketRoom)
                    return (undefined);
                socketRoom = classPieces_1.resetParty(socketRoom);
                socketRoom = classPieces_1.setNewPieceInGridForAll(socketRoom);
                socketRoom.status = "runing";
                Game_2.updateRoomArray(socketRoom, rooms_array);
                io.sockets.in(room.name).emit('action', { type: 'GAME_START_', room: socketRoom });
                socket.broadcast.emit('action', { type: 'searchResult', results: Game_1.getSearchResult(rooms_array) });
            }
            if (action.type == 'server/boucle') {
                var room = Game_2.getGame(action.name, rooms_array);
                if (!room)
                    return (false);
                room = classPieces_1.fall_piece(room, action.id);
                Game_2.updateRoomArray(room, rooms_array);
                io.sockets.in(room.name).emit('action', { type: 'GAME_START', room: room });
                socket.broadcast.emit('action', { type: 'searchResult', results: Game_1.getSearchResult(rooms_array) });
                if (isEndGame(room)) {
                    room = resetRoomSpec(room);
                    io.sockets.in(room.name).emit('action', { type: 'END_GAME', room: room });
                }
            }
            if (action.type == "server/keyUp") {
                var room = Game_2.getGame(action.name, rooms_array);
                if (!room)
                    return (false);
                room = keyUp_1.keyUp(room, socket.id);
                io.sockets.in(room.name).emit('action', { type: 'GAME_START', room: room });
                socket.broadcast.emit('action', { type: 'searchResult', results: Game_1.getSearchResult(rooms_array) });
                Game_2.updateRoomArray(room, rooms_array);
                if (isEndGame(room)) {
                    room = resetRoomSpec(room);
                    io.sockets.in(room.name).emit('action', { type: 'END_GAME', room: room });
                }
            }
        });
        socket.on('disconnect', function () {
            var room = Game_2.getGameWithId(socket.id, rooms_array);
            if (room)
                socket.leave(room.name);
            var player = Game_2.removePlayer("", socket.id, rooms_array);
            if (room && isEndGame(room)) {
                room = resetRoomSpec(room);
                io.sockets.in(room.name).emit('action', { type: 'END_GAME', room: room });
            }
            if (room)
                emit_to_room(room, io);
            socket.broadcast.emit('action', { type: 'searchResult', results: Game_1.getSearchResult(rooms_array) });
            if (player == null)
                console.log("Unknown User Disconnected");
            else
                console.log("User disconnected : ", player);
            console.log(rooms_array);
        });
    });
};
function resetRoomSpec(room) {
    room.status = "waiting";
    room.Pieces = [];
    for (var i in room.players) {
        room.players[i].hit = false;
        room.players[i].spec = false;
        room.players[i].loose = false;
        room.players[i].currentPiece = 0;
    }
    return room;
}
function isEndGame(room) {
    for (var i in room.players) {
        if (room.players[i].loose == false)
            return false;
    }
    return true;
}
function create(params) {
    var promise = new Promise(function (resolve, reject) {
        var app = require('http').createServer();
        initApp(app, params, function () {
            var io = require('socket.io')(app);
            var stop = function (cb) {
                io.close();
                app.close(function () {
                    app.unref();
                });
                console.log("Engine stopped.");
                cb();
            };
            initEngine(io);
            resolve({ stop: stop });
        });
    });
    return promise;
}
exports.create = create;
