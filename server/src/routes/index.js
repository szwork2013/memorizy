(function () {
  'use strict';

  var path = require('path');

  exports.api = {
    finder: require('./finder'),
    filemanager: require('./filemanager'),
    deckeditor: require('./deckeditor'),
    deckstudy: require('./deckstudy'),
    calendar: require('./calendar'),
    media: require('./media')
  };

  exports.partials = function (app) {
    app.get('/partials/*', function (req, res) {
      var name = req.params;
      res.sendfile(path.join(app.get('views'), name + '.html'));
    });
  };

  exports.login = function (app) {
    require('./login')(app);
  };

  exports.index = function (app) {
    app.get('*', function (req, res) {
      console.log('req.path = ' , req.path);
      res.sendfile(path.join(app.get('views'), 'index.html'));
    });
  };

})();
