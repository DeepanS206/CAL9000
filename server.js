var express = require ('express'); 
var routes = require('./routes/routes.js');
var firebase = require('./models/firebase.js'); 
var session = require('express-session');
var cookieSession = require('cookie-session'); 
var bodyParser = require('body-parser'); 
var http = require('http'); 
var uuid = require('node-uuid');
var google = require('googleapis');
var plus = google.plus('v1');
var OAuth2 = google.auth.OAuth2;
var app = express(); 

http.globalAgent.maxSockets = 100;

var generateCookieSecret = function () {
  return 'iamasecret' + uuid.v4();
};

//app.use(cookieSession({
  //secret: generateCookieSecret()
//})); 

app.use(session({
  secret: 'iamasecret'
}));

app.use(bodyParser.urlencoded({ extended: false })); 

var oauth2Client = new OAuth2('308256462081-c8tr2ruobau2p0gcvbufaoelgl2mld5k.apps.googleusercontent.com', 
  'hYhGyMgcjLQTE8jVhAUDqYoH', 'http://localhost:8080/search');
google.options({ auth: oauth2Client });

// generate a url that asks permissions Google Calendar scope
var scopes = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/plus.login'
];


function listEvents(auth, id) {
  var calendar = google.calendar('v3');
  calendar.events.list({
    auth: auth,
    calendarId: 'primary',
    timeMin: (new Date()).toISOString(),
    maxResults: 20,
    singleEvents: true,
    orderBy: 'startTime'
  }, function (err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var events = response.items;
    if (events.length == 0) {
      console.log('No upcoming events found.');
      return;
    } else {
      console.log('Upcoming 20 events:');
      for (var i = 0; i < events.length; i++) {
        var event = events[i];
        firebase.addEvent(id, event); 
      }
    }
  });
}



var url = oauth2Client.generateAuthUrl({
  access_type: 'offline', // 'online' (default) or 'offline' (gets refresh_token)
  scope: scopes // If you only need one scope you can pass it as string
});

app.get('/autho', function (req, res) {
  res.redirect(url); 
}); 

app.get('/searchPg', routes.get_search); 

app.get('/search', function (req, res) {
  oauth2Client.getToken(req.query.code, function (err, tokens) {
    if (!err) {
      oauth2Client.setCredentials(tokens); 
      req.session.auth = oauth2Client; 
      req.session.isAuthenticated = true; 
      plus.people.get({ userId: 'me', auth: oauth2Client }, function (err2, response) {
        if (!err2) {
          req.session.name = response['displayName']; 
          console.log('Display Name: ' + response['displayName']);
          req.session.userId = response['id']; 
          console.log('User Id: ' + response['id']);
          firebase.addUser(req.session.userId, req.session.name); 
          listEvents(oauth2Client, req.session.userId); 
          res.render('home.ejs', {data: req.session.name}); 
        } else {
          console.log(err2); 
          console.log('error in getting g+ info'); 
        }
      });
    } 
  });
});

app.get('/signin', function (req, res) {
  if (req.session.isAuthenticated) {
    res.render('home.ejs', {data: req.session.name}); 
  } else {
    res.render('signin.ejs'); 
  }
});

app.engine('html', require('ejs').__express);
app.set('view engine', 'html');
app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  if (req.session.isAuthenticated) {
    res.redirect('/searchPg'); 
  } else {
    res.redirect('/signin'); 
  }
}); 
app.get('/getAddEvent', routes.get_addEvent); 

app.post('/addEvent', function (req, res) {
  var eventName = req.body.nameOfEvent; 
  var description = req.body.eventDescription; 
  var date = req.body.date; 
  var startTime = date + 'T' + req.body.startTime + ':00'; 
  var endTime = date + 'T' + req.body.endTime + ':00'; 
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
    auth: oauth2Client, 
    calendarId: 'primary', 
    resource: event
  }, function (err, eventReturned) {
    if (err) {
      console.log('error inserting in calendar'); 
      console.log(err); 
    } else {
      console.log('event successfully created');
      firebase.addEvent(req.session.userId, eventReturned); 
    }
  }); 
  res.redirect('/searchPg'); 
}); 

app.get('/popResults', function (req, res) {
  var str = JSON.stringify(req.query); 
  var arr = str.split(':'); 
  var str2 = arr[0]; 
  var query = str2.substring(2, str2.length - 1); 
  firebase.getEvents(query, req.session.userId, function (data) {
    console.log(data); 
    if (query === '}') {
      res.send([]); 
    } else {
      res.send(data); 
    }
  }); 
});

app.get('/getRecentEvent', routes.get_recent); 

app.get('/logout', function (req, res) {
  req.session.destroy(function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log('session destroyed');
      res.redirect('/'); 
    }
  });
  /*if (req.session.isAuthenticated) {
    req.session = null; 
  } 
  res.redirect('/'); */
});

console.log('Author: Deepan Saravanan (deepans)');
app.listen(8080);
console.log('Server running on port 8080. Now open http://localhost:8080/ in your browser!');