(function () {
  'use strict';

  function Auth () {}

  var singleton = new Auth();

  Auth.prototype.isLoggedIn = function(req, res, next) {
    if (req.user.id) { return next(); }
    res.send(401);
  };

  module.exports = singleton;

})();
