var express = require('express');
app = express();
server = require('http').createServer(app);
io = require('socket.io').listen(server);

var SerialPort = require("serialport").SerialPort
var serialPort = new SerialPort("/dev/ttyACM0", { baudrate: 115200 });

port = 8080;
server.listen(port);
console.log ('Live at port ' + port);

app.use(express.static('public'));		

/* Initialize Actions to false */
status_a = false;
status_b = false;
status_c = false;
status_d = false;

io.sockets.on('connection', function (socket) {
	socket.on('move', function (data) {
		console.log ("Moving " + data.value)
		send_via_serial (data.value)
	});

	socket.on('action', function (data) {

		/* Data is ascii for {u, d, l, r} */

		switch (data.button){
			case 'a' : status_a = !status_a; break;
			case 'b' : status_b = !status_b; break;
			case 'c' : status_c = !status_c; break;
			case 'd' : status_d = !status_d; break;
			default: break;
		}
		console.log ("\nAction set is now")
		console.log (status_a, status_b, status_c, status_d);

		/* Send the toggled button to Arduino */
		send_via_serial(data.button)

		/* Now emit to all connected devices so they synchronise */
		io.sockets.emit('action', { 'a': status_a, 'b': status_b, 'c': status_c, 'd': status_d });
	});

	/* Emit status when new devices are connected */	
	socket.emit('action', { 'a': status_a, 'b': status_b, 'c': status_c, 'd': status_d });
});

serialPort.open(function (error) {
  if (error) {
   		console.log('Failed to open SerialPort: ' + error);
  } else {


	 /* Send signal to reset the Arduino.
		(Don't forget to write the handler for this:
		Set all Action buttons to 0 if you capture 
		this on the Arduino.) */
		
		send_via_serial('x');


	 /* Always listen actively for data. 
		If heart_rate, broadcast its value. */
		
		serialPort.on('data', function(data) {
		console.log('Data received: ' + data);

		if(data[0] == 'b') { socket.emit ('heart_rate', {value: data[1]})}
    });
  }
});


function send_via_serial (control) {
	var buf = new Buffer(1);
	buf.writeUInt8(control, 0);
	serialPort.write(buf);
}