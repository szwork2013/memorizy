
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
app.use(express.static(path.join(__dirname, 'public')));

/*
 *Routes
 */
require('./routes/index')(app);
require('./routes/register')(app);
require('./routes/login')(app);

require('./routes/home')(app);
require('./routes/deck_edit')(app);


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
var home = require('./models/home');
	
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
	socket.on('createFile', function(file){
		home.createFileWithParentId(
      socket.handshake.user.id, 
      file.filename, 
      file.type, 
      file.parentId
    ).then(function(val){
			socket.emit('fileCreated', {
				fileId: val,
				type: file.type,
				name: file.filename,
				ownerId: socket.handshake.user.id
			});
		}).catch(function(err){
			console.log(err);
		}).done();
	});

	socket.on('renameFile', function(data){
    console.log('renameFile ' + data.fileId + ' to \'' + data.newName + '\'');
		home.renameFile(socket.handshake.user.id, data.fileId, data.newName)
    .then(function () {
			socket.emit('fileRenamed', {
				fileId : data.fileId,	
				newName : data.newName
			});
		})
		.catch(function(err){
			socket.emit('renameFileError', err.message); /* check err.message */
		})
		.done();
	});

	socket.on('deleteFile', function(file){
		home.deleteFile(socket.handshake.user.id, file.id).then(function(){
			socket.emit('fileDeleted');
		})
		.catch(function(err){
			console.log(err);
			socket.emit('deleteFileError', {
				fileId: file.id
			});
		}).done();
	});

	socket.on('moveFile', function (data) {
		console.log('Move file ' + data.src + ' under ' + data.dest);
		home.moveFile(socket.handshake.user.id, data.src, data.dest)
    .then(function () {
			console.log('File ' + data.src + ' has correctly been moved');
			socket.emit('fileMoved');
		})
		.catch(function () {
			console.log('An error occured while moving file ' + data.src +
					        ' under ' + data.dest);
			//-TODO should send an error message
			socket.emit('moveFileError', data); 
		}).done();
	});

	socket.on('copyFile', function (data) {
		console.log('Copy file ' + data.src + ' under ' + data.dest);
		home.copyFile(socket.handshake.user.id, data.src, data.dest)
    .then(function () {
			console.log('File ' + data.src + ' has correctly been copied');
			socket.emit('fileCopied');
		})
		.catch(function (err) {
			console.log('An error occured while copying file ' + data.src +
					' under ' + data.dest);
			console.log(err);
			//-TODO should send an error message
			socket.emit('copyFileError', data); 
		}).done();
	});

	socket.on('getFileTree', function (data) {
		// data.root is the root folder name
		home.getFileTree(socket.handshake.user.id, data.root)
    .then( function (tree) {
			socket.emit('fileTree', {
				tree : tree
			});
		})
		.catch(function(err){
			socket.emit('getFileTreeError', {
				message: err.message //check message property
			});
		})
		.done();
	});

	socket.on('star', function (data) {
		home.star(socket.handshake.user.id, data.fileId)
		.then(function (symlinkId) {
			socket.emit('fileStarred', {
				src : data.fileId,
				dest : symlinkId
			});
		})
		.catch(function (err) {
			socket.emit('fileStarredError', {
				src : data.fileId,
				msg : err.message
			});
		})
		.done();
	});

	socket.on('unstar', function (data) {
		home.unstar(socket.handshake.user.id, data.fileId)
		.then(function () {
			socket.emit('fileUnstarred', {
				fileId : data.fileId,
			});
		})
		.catch(function (err) {
			socket.emit('fileUnstarredError', {
				fileId : data.fileId,
				msg : err.message
			});
		})
		.done();
	});
});



