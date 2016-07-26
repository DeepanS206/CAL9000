var google = require('googleapis');
var firebase = require('../models/firebase.js'); 

var getLogin = function (req, res) {
  res.render('signin.ejs'); 
};

var getSearch = function (req, res) {
  if (!req.session.isAuthenticated) {
    res.redirect('/signin'); 
  }
  res.render('home.ejs', {data: req.session.name});
};

var getAddEvent = function (req, res) {
  if (!req.session.isAuthenticated) {
    res.redirect('/signin'); 
  }
  res.render('addEvent.ejs'); 
};

var getRecentEvent = function (req, res) {
  console.log('getting recent event');
  firebase.getRecentEvent(req.session.userId, function (err, data) {
    if (!err) {
      console.log(data); 
      res.send(null); 
    } else {
      res.send(null); 
    }
  });
};

var addEvent = function (req, res) {
  var eventName = req.body.nameOfEvent; 
  var description = req.body.eventDescription; 
  var date = req.body.date; 
  if (!eventName || !description || !date) {
    res.redirect('/getAddEvent'); 
  }
  var startTime = date + 'T' + req.body.startTime; 
  var endTime = date + 'T' + req.body.endTime; 
  var location = req.body.location; 
  var calendar = google.calendar('v3');

  var event = {
    summary: eventName,
    location: location,
    description: description,
    start: {
      dateTime: startTime,
      timeZone: 'America/New_York'
    },
    end: {
      dateTime: endTime,
      timeZone: 'America/New_York'
    }
  };

  calendar.events.insert({
    auth: req.session.auth, 
    calendarId: 'primary', 
    resource: event
  }, function (err, eventReturned) {
    if (err) {
      console.log('error inserting in calendar'); 
    } else {
      console.log('event successfully created');
      console.log(eventReturned); 
    }
  }); 
  res.redirect('/searchPg'); 
};

var routes = {
  get_login: getLogin,
  get_search: getSearch, 
  get_addEvent: getAddEvent,
  add_event: addEvent,
  get_recent: getRecentEvent
};

module.exports = routes;