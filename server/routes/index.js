exports.api = {
  filemanager: require('./filemanager'),
  deckeditor: require('./deckeditor'),
  deckstudy: require('./deckstudy'),
  calendar: require('./calendar'),
  media: require('./media')
};

exports.partials = function (app) {
  app.get('/partials/*', function (req, res) {
    var name = req.params;
    res.render('partials/' + req.params);
  });
};

exports.login = function (app) {
  require('./login')(app);
};

exports.index = function (app) {
  app.get('*', function (req, res) {
    res.render('index');
  });
};

