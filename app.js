var express = require('express');
app = express();
server = require('http').createServer(app);
io = require('socket.io').listen(server);

var SerialPort = require("serialport").SerialPort

// This is the USB port
var serialPort = new SerialPort("/dev/ttyACM0", { baudrate: 9600 });

// This is the standard Raspi Pi serial port
var bluetooth_dev = '/dev/ttyAMA0'; 
var bluetooth = new SerialPort(bluetooth_dev, {
  baudRate: 9600,
  dataBits: 8,
  parity: 'none',
  stopBits: 1,
  flowControl: false
});

// Variable to hold the filtered value of bpm_value
// Not used now
var weighted_bpm = 0;

// Port at which server is started
port = 3000;
server.listen(port);
console.log ('Live at port ' + port);

// Folder from which html files are served
app.use(express.static('/home/pi/raspi_iot/public'));

// Initial Device states
status_a = false;
status_b = false;
status_c = false;
status_d = false;

io.sockets.on('connection', function (socket) {
	socket.on('move', function (data) {
		console.log ("Moving " + data.value)
		serialPort.write(data.value)
	});

	socket.on('action', function (data) {

		// Change the states of devices
		switch (data.button){
			case 'a' : status_a = !status_a; break;
			case 'b' : status_b = !status_b; break;
			case 'c' : status_c = !status_c; break;
			case 'd' : status_d = !status_d; break;
			default: break;
		}
		console.log ("\nAction set is now")
		console.log (status_a, status_b, status_c, status_d);

		// Send the toggled button blueooth module
		bluetooth.write(data.button)

		// Now emit to all connected devices so they synchronise
		io.sockets.emit('action', { 'a': status_a, 'b': status_b, 'c': status_c, 'd': status_d });
	});

	// Emit status when new devices are connected
	socket.emit('action', { 'a': status_a, 'b': status_b, 'c': status_c, 'd': status_d });
});

bluetooth.on('open', function (error) {
	if (error) {
		console.log('Failed to open Bluetooth port: ' + error);
	} else {
		console.log('Bluetooth port opened...');
		
		var readBluetoothData = '';  // this stores the raw data
		var device_states = '';     // this stores the actual device states received
		
		 // Call back when data is received
		bluetooth.on('data', function (data) {
		
			// Append data to buffer
			readBluetoothData += data.toString(); 
			
			// If the Letters '*' and '#' are found on the buffer 
			// then isolate what's in the middle, which is the BPM
			// Then clear the read buffer.
			if (readBluetoothData.indexOf('*') >= 0 && readBluetoothData.indexOf('#') >= 0) {
				device_states = readBluetoothData.substring(readBluetoothData.indexOf('*') + 1, readBluetoothData.indexOf('#'));
				readBluetoothData = '';
				
				if(device_states.length == 4) {

					console.log('Device States: ' + device_states );
					
					status_a = parseInt(device_states.charAt(0));
					status_b = parseInt(device_states.charAt(1));
					status_c = parseInt(device_states.charAt(2));
					status_d = parseInt(device_states.charAt(3));
					
					// Now emit to all connected devices so they synchronise
					io.sockets.emit('action', { 'a': status_a, 'b': status_b, 'c': status_c, 'd': status_d });
				}
			}
		});		
	}
});

serialPort.open(function (error) {
  if (error) {
   		console.log('Failed to open SerialPort: ' + error);
  } else {
		
		// Reset's the states of all devices
		bluetooth.write('x');

	    // Always listen actively for data. 
		// If heart_rate, broadcast its value.
		
		var bpm_value = ''; // this stores the filtered data
		var readData = '';  // this stores the raw data
		
		 // Call back when data is received
		serialPort.on('data', function (data) {
		
		// Append data to buffer
		readData += data.toString(); 
		
		// If the Letters '*' and '#' are found on the buffer 
		// then isolate what's in the middle, which is the BPM
		// Then clear the read buffer.
		if (readData.indexOf('*') >= 0 && readData.indexOf('#') >= 0) {
			bpm_value = readData.substring(readData.indexOf('*') + 1, readData.indexOf('#'));
			readData = '';
			bpm_value = parseInt(bpm_value,10);
			if(bpm_value >= 60 && bpm_value <= 100)
			{
				weighted_bpm = bpm_value;
			}
			weighted_bpm = parseInt(weighted_bpm,10);
			console.log('BPM: ' + weighted_bpm );
			// To introduce filtering of bpm
			// io.sockets.emit('heart_rate', {'value': weighted_bpm});
			io.sockets.emit('heart_rate', {'value': bpm_value});
		}
    });
  }
});
