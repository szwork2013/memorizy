
/**
 * Module dependencies
 */

var express = require('express'),
    routes = require('./routes'),
    api = require('./routes/api'),
    http = require('http'),
    path = require('path');

// Authentication
var passport = require('passport'),
    flash = require('connect-flash'),
    LocalStrategy = require('passport-local').Strategy;

// Session storage
var db = require('./models/db'),
    PGStore = require('connect-pg'),
    sessionStore = new PGStore(db.pgConnect);

// Used for less file compilation 
var lessMiddleware = require('less-middleware');

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

/**
 * Configuration
 */

var app = module.exports = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
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
app.use(express.static(path.join(__dirname, 'public')));
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
// development only
if (app.get('env') === 'development') {
  app.use(express.errorHandler());
}

/**
 * Routes
 */

routes.partials(app);

// JSON API
routes.api.filemanager(app);
routes.api.deckeditor(app);

routes.index(app);

/**
 * Start Server
 */

http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});
