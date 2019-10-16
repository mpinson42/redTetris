"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var debug_1 = __importDefault(require("debug"));
var classPieces_1 = __importDefault(require("./pieces/classPieces"));
var joinRoom_1 = require("./rooms/joinRoom");
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
var initEngine = function (io) {
    io.on('connection', function (socket) {
        console.log("Socket connected: " + socket.id);
        socket.on('action', function (action) {
            if (action.type === 'server/piecesSolo') {
                socket.emit('action', { type: 'newPiece', piece: classPieces_1.default.getPieces() });
            }
            if (action.type === 'server/creatRoom') {
                rooms_array = joinRoom_1.joinRoom(action.roomName, action.playerName, action.socketID, rooms_array);
                var room = joinRoom_1.getRoom(action.playerName, rooms_array);
                socket.emit('action', { type: 'joinRoom', room: room });
                console.log(room);
            }
            if (action.type == 'server/searchRoom') {
                console.log("Searching for room ", joinRoom_1.getSearchResult(rooms_array));
                socket.emit('action', { type: 'searchResult', results: joinRoom_1.getSearchResult(rooms_array) });
            }
        });
    });
};
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
