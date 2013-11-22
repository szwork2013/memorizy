
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var passport = require('passport');
var flash = require('connect-flash');
var LocalStrategy = require('passport-local').Strategy;
var lessMiddleware = require('less-middleware');

var usr = require('./models/user');

// Passport session setup.
// To support persistent login sessions, Passport needs to be able to
// serialize users into and deserialize users out of the session. Typically,
// this will be as simple as storing the user ID when serializing, and finding
// the user by ID when deserializing.
passport.serializeUser(function(user, done) {
	done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	usr.getUserById(id).then(function(user){
		done(null, user);
	}).catch(done)
	.done();
});

passport.use(new LocalStrategy(
	function(username, password, done) {
		process.nextTick(function () {
			usr.authenticateUser(username, password).then(function(val){
				done(null, val);
			})
			.catch(function(err){
				done(null, false);
			})
			.done();
		});
	})
);

var app = express();

// all environments
app.set('port', process.env.PORT || 8080);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.session({ secret: 'keyboard cat' }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(lessMiddleware({
    	src : __dirname + "/public",
	/*
         *compress : true
	 */
}));
app.use(express.static(path.join(__dirname, 'public')));

/*
 *Routes
 */
require('./routes/index')(app);
require('./routes/register')(app);
require('./routes/login')(app);

require('./routes/home')(app);


// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

/*
 *Socket-io configuration
 */

var io = require('socket.io').listen(server);
var home = require('./models/home');

io.sockets.on('connection', function(socket) {
	socket.on('createFile', function(file){
		file.type = (file.type == 'folder' ? 1 : 2);
		home.createFileWithParentId(file.ownerId, file.filename, file.type, file.parentId)
		.then(function(val){
			socket.emit('fileCreated', {
				typeId: file.type,
				name: file.filename,
				//ownerId: file.ownerId Take id from session
			});
		}).catch(function(err){
			console.log(err);
		}).done();
	});

	socket.on('deleteFile', function(file){
		home.deleteFile(123, file.id).then(function(){
			socket.emit('fileDeleted');
		})
		.catch(function(err){
			console.log(err);
			socket.emit('deleteFileError', {
				fileId: file.id
			});
		}).done();
	});
});



