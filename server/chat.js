// http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
"use strict";

var http = require('http');
var flags = require('flags');
var log4js = require('log4js');
var mysql = require('mysql');
var logger = log4js.getLogger();
var webSocketServer = require('websocket').server;
var crypto = require('crypto');

var defaultIP = '127.0.0.1';
var defaultPort = 11338;

flags.defineBoolean('debug', false, 'Use debugging?');
flags.defineString('ip', defaultIP, 'IP to bind service to. (Defaults to ' + defaultIP + ')');
flags.defineInteger('port', defaultPort, 'Port to listen on. (Defaults to ' + defaultPort + ')');

flags.parse();

var debug = flags.get('debug');
var ip = flags.get('ip');
var port = flags.get('port');

if (debug !== false) {
	logger.setLevel('ERROR');
} else {
	logger.setLevel('INFO');
}

// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'node-chat';

// list of currently connected clients (users)
var clients = [];

/**
 * HTTP server
 */
var server = http.createServer(function(request, response) {
});
server.listen(port, function() {
	logger.info('Server has started!');
	logger.info('IP: ' + ip);
	logger.info('port: ' + port);
});

/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
	// WebSocket server is tied to a HTTP server. To be honest I don't understand why.
	httpServer : server
});

wsServer.on('request', function(request) {
	logger.info('Connection from origin: ' + request.origin + '.');

	// accept connection - you should check 'request.origin' to make sure that
	// client is connecting from your website
	// (http://en.wikipedia.org/wiki/Same_origin_policy)
	var connection = request.accept(null, request.origin);
	// we need to know client index to remove them on 'close' event

	logger.info('Connection accepted.');

	connection.on('message', function(message) {
		var data = JSON.parse(message.utf8Data);
		var errors = [];

		//var x = 0;
		if (data.email == '') {
			errors.push('empty-email');
		} else if (!validateEmail(data.email)) {
			errors.push('invalid-email');
		}

		if (data.password == sha1('')) {
			errors.push('empty-pass');
		}
		
		if (errors.length > 0) {
			//we have errors so don't login to the system
			logger.error(errors);
			var errorJSON = JSON.stringify(errors);
			connection.send(errorJSON);
		} else {
			//make connection
				
		}

		logger.warn(data);
	});

	// user disconnected
	connection.on('close', function(connection) {
		logger.info("Peer " + connection + " disconnected.");
	});
});

function sha1(input) {
	var shasum = crypto.createHash('sha1')
	shasum.update(input);
	var output = shasum.digest('hex');
	return output;
}

function validateEmail(email) {
	var re = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[A-Z]{2}|com|org|net|gov|mil|biz|info|mobi|name|aero|jobs|museum)\b/;
	return re.test(email);
}
