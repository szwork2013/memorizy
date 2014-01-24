
/**
 * Module dependencies.
 */

//Http modules
var express = require('express');
//var routes = require('./routes');
var http = require('http');
var path = require('path');

//Authentication
var passport = require('passport');
var flash = require('connect-flash');
var LocalStrategy = require('passport-local').Strategy;

//Used for less file compilation 
var lessMiddleware = require('less-middleware');

//Session storage
var db = require('./models/db');
var PGStore = require('connect-pg');
var sessionStore = new PGStore(db.pgConnect);
//var sessionStore = new express.session.MemoryStore();

// Passport session setup.
// To support persistent login sessions, Passport needs to be able to
// serialize users into and deserialize users out of the session. 
// Typically, this will be as simple as storing the user ID when 
// serializing, and finding the user by ID when deserializing.
var usr = require('./models/user'); // used for authentication method
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
			usr.authenticateUser(username, password)
            .then(function(val){
				done(null, val);
			})
			.catch(function(){
				done(null, false);
			})
			.done();
		});
	})
);

/***************************************
 * Express configuration
 **************************************/

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.session({ 
	store : sessionStore,
	key : 'express.sid',
	secret: 'keyboard cat', 
	//cookie: { httpOnly: false}
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(lessMiddleware({
	src : __dirname + '/public',
	/*
         *compress : true
	 */
}));
// does not compress html files
app.configure('development', function () { 
  app.locals.pretty = true; 
}); 
app.use(express.static(path.join(__dirname, 'public')));

/*
 *Routes
 */
require('./routes/index')(app);
require('./routes/register')(app);
require('./routes/login')(app);

require('./routes/file')(app);


// development only
if ('development' === app.get('env')) {
	app.use(express.errorHandler());
}

var server = http.createServer(app).listen(app.get('port'), function() {
	console.log('Express server listening on port ' + app.get('port'));
});

/***************************************
 *Socket-io configuration
 **************************************/

var io = require('socket.io').listen(server);
var passportSocketIo = require('passport.socketio');
	
io.set('authorization', passportSocketIo.authorize({
	cookieParser: express.cookieParser,
	key:    'express.sid',  
	secret: 'keyboard cat', 
	store:   sessionStore,  
	fail: function(data, message, error, accept) {
		console.log('failed with message ' + message);
		console.log('error : ' + error);
		console.log(data);
		accept(null, false); 
	},
	success: function(data, accept) {
		console.log('success socket.io auth');
		console.log(data);
		accept(null, true);
	}
}));

io.sockets.on('connection', function(socket) {
  require('./socket-io/filenavigation')(socket);
  require('./socket-io/deckedit')(socket);
});



