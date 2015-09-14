var express = require('express');
var path = require('path');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// set the 'views' and 'public' directories
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
  res.sendFile(app.get('views') + '/index.html');
});


io.on('connection', function (socket) {
  var hue = 0;
	console.log('i\'ve been poked!');

  socket.on('mouse move', function (data) {
    var colorString = 'hsl(' + hue + ', ' + data.x + '%, ' + data.y + '%)';
    io.emit('new color', colorString);
  });

  socket.on('mouse click', function (data) {
		hue = (Math.random() * 360).toFixed(0);
  });

	socket.on('disconnect', function () {
    console.log('poke disengaged');
	});
});

http.listen('3333', function () {
  console.log('app listening on 3333');
});
