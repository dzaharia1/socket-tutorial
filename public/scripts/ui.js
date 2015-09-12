var body, hslIndicator;

var toPercentage = function (numerator, denominator) {
	return (numerator / denominator * 100).toFixed(0);
}

var readyFunction = function() {
	hslIndicator = document.querySelector('.hsl-indicator');
	console.log(hslIndicator);
	var socket = io();

	window.addEventListener('mousemove', function (event) {
		var payload = {
			x: toPercentage(event.clientX, window.innerWidth),
			y: toPercentage(event.clientY, window.innerHeight)
		};

		socket.emit('mouse move', payload);
	});

	window.addEventListener('click', function (event) {
		socket.emit('click');
	});

	socket.on('update color', function (payload) {
		hslIndicator.style.color = payload;
		hslIndicator.innerText = payload;
	});
}

if (document.readyState != 'loading') {
	readyFunction();
}
else {
	document.addEventListener('DOMContentLoaded', readyFunction)
}
