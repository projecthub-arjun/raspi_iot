var express = require('express');
app = express();
server = require('http').createServer(app);
io = require('socket.io').listen(server);

// var SerialPort = require("serialport").SerialPort
// var serialPort = new SerialPort("/dev/ttyACM0", { baudrate: 115200 });

port = 8080;
server.listen(port);
console.log ('Live at ' + port);

app.use(express.static('public'));		

io.sockets.on('connection', function (socket) {
	/*socket.on('led', function (data) {
		brightness = data.value;
		
		var buf = new Buffer(1);
		buf.writeUInt8(brightness, 0);
		serialPort.write(buf);
		
		io.sockets.emit('led', {value: brightness});	
	});*/

	socket.on('move', function (data) {

		/* data is ascii for {u, d, l, r} */

		console.log ("Moving " + data.value)

		// var buf = new Buffer(1);
		// buf.writeUInt8(data.value, 0);
		// serialPort.write(buf);
		
	});

	
	// socket.emit('led', {value: brightness});
});

// serialPort.open(function (error) {
//   if ( error ) {
//     console.log('failed to open: '+error);
//   } else {
//     console.log('open');
//     serialPort.on('data', function(data) {
//       console.log('data received: ' + data);
//     });
//   }
// });

