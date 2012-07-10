// Simple web server 

var express = require('express');
var app = module.exports = express.createServer();

// Configuration
app.configure(function(){
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	
	app.use(app.router);
	app.use(express.static(__dirname + '/htdocs'));
});

var error = require('./lib/ErrorHandler');

app.configure('development', function(){
  //app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
	app.use(error({ showMessage: true, dumpExceptions: true, showStack: true, logErrors: __dirname + '/log/error_log' }));
});

app.listen(3151);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);