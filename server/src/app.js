
/**
 * Module dependencies
 */

var express = require('express'),
    routes = require('./routes'),
    http = require('http'),
    path = require('path');

var expressJwt = require('express-jwt');
var jwt = require('jsonwebtoken');


// Session storage
var db = require('./models/db');

/**
 * Configuration
 */

var app = module.exports = express();

// all environments
app.set('build', path.join(__dirname, '../../build'));
app.set('port', process.env.PORT || 3000);
app.set('views', app.get('build') + '/partials');
app.use(express.logger('dev'));
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.methodOverride());

app.use(expressJwt({
  secret: 'hello world !',
  credentialsRequired: false
}));

app.use(express.json());
app.use(express.urlencoded());

app.use(express.static(path.join(app.get('build'))));
app.use(app.router);

// development only
if (app.get('env') === 'development') {
  app.use(express.errorHandler());

  db.conn = 'postgres://postgres:postgres@localhost:5432/memorizydev';
  db.nodepgConn = 'tcp://nodepg:nodepg@localhost:5432/memorizydev';
}
else {
  db.conn = 'postgres://postgres:postgres@localhost:5432/memorizy';
  db.nodepgConn = 'tcp://nodepg:nodepg@localhost:5432/memorizy';
}

/**
 * Routes
 */

routes.login(app);
routes.partials(app);

// JSON API
routes.api.finder(app);
routes.api.filemanager(app);
routes.api.deckeditor(app);
routes.api.deckstudy(app);
routes.api.calendar(app);
routes.api.media(app);

routes.index(app);

/**
 * Start Server
 */

var server = http.createServer(app),
    io = require('socket.io')(server);

io.on('connection', function (socket) {
  var uploader = require('socketio-uploader');
  uploader.listen(socket);
});

server.listen(app.get('port'), function () {
  'use strict';
  console.log('Express server listening on port ' + app.get('port'));
});


