var calendarModel = require('../models/calendar.js'); 

module.exports = function (app) {
  app.get('/api/:username/calendar', function (req, res, next) {
    calendarModel.getCalendar(req.user.id).then(function (calendar) {
      res.json(calendar);
    }).catch(function (err) {
      console.log(err);
      res.send(404);
    });
  });
};

