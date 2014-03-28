exports.api = {
  filemanager: require('./filemanager'),
  deckeditor: require('./deckeditor')
};

exports.partials = function (app) {
  app.get('/partials/*', function (req, res) {
    var name = req.params;
    console.log('requesting partial ', req.params);
    res.render('partials/' + req.params);
  });
};

exports.index = function (app) {
  app.get('*', function (req, res) {
    console.log('render index');
    res.render('index');
  });
};

