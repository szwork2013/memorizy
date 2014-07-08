var calendarModel = require('../models/calendar.js'); 

module.exports = function (app) {
  app.get('/api/calendar', function (req, res, next) {
    if (req.query.action !== "count") { return; }
    calendarModel.count(req.user.id).then(function (count) {
      res.json(count);
    });
  });

  app.get('/api/:username/calendar', function (req, res, next) {
    calendarModel.getCalendar(req.user.id).then(function (calendar) {
      res.json(calendar);
    }).catch(function (err) {
      console.log(err);
      res.send(404);
    });
  });
};

