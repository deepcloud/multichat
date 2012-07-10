// Simple web server 

var path = require('path'),
    fs = require('fs'),
    sys = require('util'),
    less = require('less'),
    express = require('express');
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

// Pages

app.get('/', function(req, res){
	res.render('index', {
		title: 'Home'
	});
});

/* CSS Monitors */
function toCSS(path, callback) {
    var tree, css;
    fs.readFile(path, 'utf-8', function (e, str) {
        if (e) { return callback(e) }

        new(less.Parser)({
            paths: [require('path').dirname(path)],
            optimization: 0
        }).parse(str, function (err, tree) {
            if (err) {
                callback(err);
            } else {
                try {
                    css = tree.toCSS();
                    callback(null, css);
                } catch (e) {
                    callback(e);
                }
            }
        });
    });
}

var update_bootstrap = function(curr, prev){
	if(curr && curr.mtime.getTime() == prev.mtime.getTime())
		return;

	console.info("Updating bootstrap css");
	toCSS(__dirname + '/less/bootstrap.less', function (err, less) {
	    var name = path.basename(__dirname + '/less/bootstrap.less', '.less');
		fs.writeFile(path.join(__dirname + '/htdocs/css', name) + '.css', less, 'utf-8' );
	});
};
fs.watchFile(__dirname + '/less/bootstrap.less', update_bootstrap);
update_bootstrap();

var update_css = function(curr, prev){
	if(curr && curr.mtime.getTime() == prev.mtime.getTime())
		return;

	console.info("Updating main css.css");
	toCSS(__dirname + '/less/multichat.less', function (err, less) {
	    var name = path.basename(__dirname + '/less/multichat.less', '.less');
		fs.writeFile(path.join(__dirname + '/htdocs/css', 'css') + '.css', less, 'utf-8' );
	});
};
fs.watchFile(__dirname + '/less/multichat.less', update_css);
update_css();

// Listen

app.listen(3151);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);