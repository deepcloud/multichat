"use strict";

$(function() {
	$('#submit').click(function() {

		window.WebSocket = window.WebSocket || window.MozWebSocket;
		var connection = new WebSocket('ws://127.0.0.1:11338');

		connection.onopen = function() {

			var loginData = {
				email : $('#email').val(),
				password : $.sha1($('#password').val())
			};

			var loginJSON = JSON.stringify(loginData);
			console.log('Sending: ' + loginJSON);
			connection.send(loginJSON);
		}

		connection.onmessage = function(message) {
			try {
				var json = JSON.parse(message.data);
			} catch (e) {
				console.log(message.data);
				return;
			}
			console.log(json);

		};
		return false;
	});

});
