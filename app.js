var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

var localport = process.env.port || '3333';
var localhost = 'http://localhost';

app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.set('port', localport);

app.host = app.set('host', process.env.HOST || localhost);
app.port = app.set('port', process.env.PORT || localport);

app.get('/', function(req, res) {
	res.sendFile(app.get('views') + '/index.html');
});

var currHue = 30;

io.on('connection', function (socket) {
	console.log('received socket connection');

	socket.on('mouse move', function (payload) {
		var newSL = 'hsl(' + currHue + ', ' + payload.x + '%, ' + payload.y + '%)';
		console.log(newSL);
		io.emit('update color', newSL);
	});

	socket.on('click', function () {
		currHue = (Math.random() * 360).toFixed(0);
	});

	socket.on('disconnect', function () {
		console.log('client disconnected');
	});
});

http.listen(app.get('port'), function () {
	console.log('app listening on ' + localport);
});
