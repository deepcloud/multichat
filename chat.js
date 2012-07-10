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

var clients = [];

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

	var connection = request.accept(null, request.origin);
	// we need to know client index to remove them on 'close' event

	var index = clients.push(connection) - 1;

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

			var frontendData = {};
			frontendData.type = 'login-errors';
			frontendData.data = errors;

			var errorJSON = JSON.stringify(frontendData);
			connection.send(errorJSON);
		} else {
			//make connection to the mysql database
			var mysqlconnection = mysql.createClient({
				host : 'localhost',
				user : 'root',
				password : '',
				database : 'chat'
			});

			var query = 'SELECT * FROM `users` WHERE `email` = \'' + data.email + '\';'

			mysqlconnection.query(query, function selectCallBack(err, results, fields) {
				if (err) {
					throw err;
				}
				try {
					if (results[0].pass == data.password) {

						var frontendData = {};
						frontendData.type = 'login-succes';
						frontendData.data = 'main';

						var succesJSON = JSON.stringify(frontendData);
						connection.send(succesJSON);
					} else {
						errors.push('wrong-pass');

						var frontendData = {};
						frontendData.type = 'login-errors';
						frontendData.data = errors;

						var errorJSON = JSON.stringify(frontendData);
						connection.send(errorJSON);
					}
				} catch(e) {
					errors.push('wrong-email');

					var frontendData = {};
					frontendData.type = 'login-errors';
					frontendData.data = errors;

					var errorJSON = JSON.stringify(frontendData);
					connection.send(errorJSON);
				}

				console.log(results);
			});

			logger.info(query);
			mysqlconnection.query(query);

		}

		logger.warn(data);
	});

	// user disconnected
	connection.on('close', function(connection) {
		logger.info("Peer " + connection + " disconnected.");
		clients.splice(index, 1);
	});
});

function sha1(input) {
	var shasum = crypto.createHash('sha1')
	shasum.update(input);
	var output = shasum.digest('hex');
	return output;
}

function validateEmail(email) {
	//somehow this does validate email addresses like email@host.com' or '1' == '1
	var re = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
	return re.test(email);
}
