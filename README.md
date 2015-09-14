# colorshare
## To run
- `$ git clone [clone url]`
- `$ npm install`
- `$ npm run dev`

## Tutorial

Color share is a simple app which changes color depending on the movement and clicking of the mouse cursor. The purpose of color share is to act as a very simple demonstration of web sockets through socket.io.

Let's try making our own!


Make sure that you have Node.js installed with `which node`. If you are getting a 'not found' output, go ahead and install node with:

`$ brew install node`

### Set up your Node.js Server

Let's get our node.js server up and running.

Create a new folder for your project, and make a package.json.

`$ mkdir project-name`
`$ cd project-name`

Call your server file (entry point) "app.js".
`$ npm init`

Now create your app.js file

`$ touch app.js`

Let's start by setting up the server to use the popular express framework and start listening for requests.

`$ npm install --save express`

then, in your server file (app.js), use the following script.

```javascript
// instantiate express
var express = require('express');
var path = require('path');
var app = express();
var http = require('http').Server(app);

app.get('/', function (req, res) {
  res.send('<h1>Hello World!</h1>');
});

http.listen('3333', function () {
  console.log('app listening on 3333');
});
```

in the same directory as your server file, run

`$ node app.js`

and then navigate to `http://localhost:3000` in your browser.

If you are seeing a large, bold "Hello World!", then everything is working! Let's start serving up files so we can begin building the client-side portion of our app.

`$ touch views/index.html`

Within that new file:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Color Sharing with Web Sockets!</title>
</head>
<body>
  <p class="color-indicator">This has all happened before. And it shall happen again.</p>
</body>
</html>
```

edit your server to deliver the new index file

```javascript
var express = require('express');
var path = require('path');
var app = express();
var http = require('http').Server(app);

// set the 'views' and 'public' directories
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
  res.sendFile(app.get('views') + '/index.html');
});

http.listen('3333', function () {
  console.log('app listening on 3333');
});
```

Then restart your server and refresh your browser to make sure everything works.

Great. We're serving up actual files. Time to establish a socket connection.

### Include Socket.io and test your first client connection

Socket.io is delivered as a node module that works with your express server. To install it, run an npm install:

`$ npm install --save socket.io`

and then include it in your server.

```javascript
// pass your server to socket io when you initialize it
var io = require('socket.io')(http);
```

First, let's tell socket.io what to do when a new client connection is created. For now, we'll just spit out a console log so we can begin building and testing the client side. In your server:

```javascript
io.on('connection', function (socket) {
  console.log('i\'ve been poked!');

  socket.on('disconnect', function () {
    console.log('poke disengaged');
  });
});
```

See that `socket` object being passed in the callback for the 'connection' event? That object represents a client's unique socket connection. It is through that connection that events can be published and read bidirectionally. The io object creates a new `socket` for every connected client.

One cool feature of the socket.io node module is that it actually serves up the client-side socket code for you! Let's edit our client to start using it. In your index.html's body:

```html
<body>
  <p class="color-indicator">This has all happened before. And it shall happen again.</p>
  <script src="/socket.io/socket.io.js"></script>
  <script>
    var socket = io();
  </script>
</body>
```

socket.io will automatically use the browser's url to connect with the server when it is instantiated. Remember: that connection will be represented by the `socket` object we see in the server side 'connection' event. Restart your server. Refresh your browser a few times, and your command line should spit out

```
i've been poked!
poke disengaged
i've been poked!
poke disengaged
i've been poked!
```

### Sending and receiving events

The socket connection is established. To put it to good use, we're going to create emissions using `socket.emit('emission name', { data })` on both the client and the server. They are each subscribed to one another waiting for these messages. We tell them what to do with received messages using `socket.on('emission name', callback)`. Let's give it a try.

In your index file:

```html
<script src="/socket.io/socket.io.js"></script>
<script>
  var socket = io();

  socket.emit('hey server', 'super duper useful data' }
</script>
```

in your server:
```javascript
io.on('connection', function (socket) {
  console.log('i\'ve been poked!');

  socket.on('hey server', function (data) {
    console.log(data);
  });

  socket.on('disconnect', function () {
    console.log('poke disengaged');
  });
});
```

When you restart your server and refresh your browser, the console should spit out:

```
i've been poked!
super duper useful data
```

### Create a listener for moving and clicking

We originally set out to create an app that changes color based on the user's mouse movements. We can also make a rule where a click event changes the hue to a random value. Let's start by capturing those events and publishing the relevant information to the server.

```html
<script src="/socket.io/socket.io.js"></script>
<script>
  var socket = io();

  function readyFunction () {
    window.addEventListener('mousemove', function (event) {
      // convert the x and y values of the cursor to
      // integer percentages of browser real estate
      var payload = {
        x: ((event.clientX / window.innerWidth) * 100).toFixed(0);
        Y: ((event.clientY / window.innerHeight) * 100).toFixed(0);
      };

      // we'll call the event 'mouse move'
      socket.emit('mouse move', payload);
    });

    window.addEventListener('click', function (event) {
      socket.emit('mouse click');
    });
  }

  if (document.readyState != 'loading') {
  	readyFunction();
  }
  else {
  	document.addEventListener('DOMContentLoaded', readyFunction)
  }
</script>
```

that's it! Since sockets are so fast, we can reasonably depend on the server to do larger calculations in the interest of performance. Let's check the values coming in on the server by logging them out.

```javascript
io.on('connection', function (socket) {
  console.log('i\'ve been poked!');

  socket.on('mouse move', function (data) {
    console.log(data);
  });

  socket.on('click', function (data) {
    console.log('a click happened');
  });

  socket.on('disconnect', function () {
    console.log('poke disengaged');
  });
});
```

Restart your server and refresh your browser. As you move your cursor around inside the browser window, your server should start streaming x and y values which represent percentages of the window width and height that your cursor is targeting. The origin is the top-leftmost corner of your window. The maximum is the bottom right most corner.

### Process the incoming event and publish one in return

We're going to be building a hue, saturation, lightness string on the server to send back to the client when these events are triggered. Saturation and lightness are percentages, while hue is measured in degrees, from 0 to 360.

in your server:

```javascript
io.on('connection', function (socket) {
  var hue = 0;
  console.log('i\'ve been poked!');

  socket.on('mouse move', function (data) {
    var colorString = 'hsl(' + hue + ', ' + data.x + '%, ' + data.y + '%)';
    socket.emit('new color', colorString);
  });

  socket.on('mouse click', function (data) {
    hue = (Math.random() * 360).toFixed(0);
  });

  socket.on('disconnect', function () {
    console.log('poke disengaged');
  });
});
```

Notice that we're using `emit()` and `on()` identically on both the client and the server. Web sockets are bidirectional, which means that it's a two-way publisher-subscriber connection. Both ends of the connection work the same way.

Create a handler in `readyFunction()` on the client:

```javascript
socket.on('new color', function (data) {
  document.querySelector('body').style.backgroundColor = data;
  document.querySelector('.color-indicator').innerText = data;
});
```

Now restart your server, refresh your browser, and start clicking and moving your mouse all over the window.

duuuuuuuude.

Building the hsl string on the server was extremely simple, but you can see from the way that this app is architected just how much processing we can do for the client! The performance gains are tremendous. But they're also shared.

### Multiple clients

Remember that one of the great benefits of web sockets is that it uses a pub/ sub model. So we would expect any number of clients to be able to subscribe to a server and receive its messages. Go ahead and navigate to your app on another machine, using your ip address. `http://xxx.xxx.x.x:3333`.
But wait. It doesn't work, does it?

Let's go back to some code on the server for a moment.

```javascript
io.on('connection', function (socket) {
  ...
  socket.on('mouse move', function (data) {
    var colorString = ...;
    socket.emit('new color', colorString);
  });
  ...
});
```
Remember when I explained that the socket object represents a _single_ unique client connection? That means that using it to call `emit()` will only publish that message across that one web socket. We want to publish to _all_ clients.

Luckily, the io object we declared using...

```javascript
var io = require('socket.io')(http);
```

...also supports the `emit()` function. And this time, the `emit()` function will apply to all connected clients.

Let's edit the server as follows:

```javascript
// instead of socket.emit(), use io.emit()
io.on('mouse move', function (data) {
  var colorString = ...;
  io.emit('new color', colorString);
});
```

Now restart your server. You may or may not even have to refresh your browsers to start seeing the magic happen. As you move and click your mouse in one client, you'll see the color replicated across all other connected devices!

Web socket in action, bebe.
