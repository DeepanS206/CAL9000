var Firebase = require('firebase');
var StrParser = require('string');
var Set = require('./set'); 
var myFirebaseRef = new Firebase('https://project-3577478074564744891.firebaseio.com/');

var getEvent = function (query, id, callback) {
  var userRef = myFirebaseRef.child(id); 
  var eventRef = userRef.child('events'); 
  var list = []; 
  var counter = 0; 
  eventRef.once('value', function (snapshot) {
    var numEvents = snapshot.numChildren(); 
    snapshot.forEach(function (childSnapShot) {
      var sum = childSnapShot.val()['summary'] || ''; 
      var desc = childSnapShot.val()['description'] || ''; 
      var start_date = childSnapShot.val()['startTime'] || '';
      var end_date = childSnapShot.val()['endTime'] || ''; 
      var location = childSnapShot.val()['location'] || '';
      var start = StrParser(start_date);
      var end = StrParser(end_date); 
      var eventName = StrParser(sum.toLowerCase()); 
      var description = StrParser(desc.toLowerCase());
      var loc = StrParser(location.toLowerCase());  
      counter++; 
      if (eventName.contains(query.toLowerCase()) || description.contains(query.toLowerCase()) 
        || start.contains(query.toLowerCase()) || end.contains(query.toLowerCase()) || loc.contains(query.toLowerCase())) {
        list.push(childSnapShot.val());  
        if (counter >= numEvents) {
          callback(null, list); 
        }
      } else {
        if (counter >= numEvents) {
          callback(null, list); 
        }
      }
    });
  }); 
};

var addArrToSet = function (set, arr, callback) {
  var counter = 0; 
  for (var i = 0; i < arr.length; i++) {
    set.add(arr[i]); 
    counter++; 
    if (counter == arr.length) {
      callback(set); 
    }
  }
};

module.exports = {
  addUser: function (id, name) {
    myFirebaseRef.push(id); 
    var userRef = myFirebaseRef.child(id); 
    userRef.set({name: name, events: ''});
  },

  addEvent: function (id, event) { 
    if (!id) {
      return; 
    }
    var userRef = myFirebaseRef.child(id); 
    var eventRef = userRef.child('events'); 
    eventRef.push(event.id); 
    var summaryRef = eventRef.child(event.id); 
    var desc = event.description || ''; 
    var start = event.start.dateTime || event.start.date;
    var end = event.end.dateTime || event.end.date;
    var location = event.location || ''; 
    summaryRef.set({summary: event.summary, description: desc, location: location, startTime: start, 
      endTime: end, link: event.htmlLink}); 
  },

  getEvents: function (query, id, callback) {
    var queryArr = query.split(' '); 
    var eventSet = new Set([]); 
    var counter = 0; 
    for (var i = 0; i < queryArr.length; i++) {
      getEvent(queryArr[i], id, function (err, data) {
        if (!err && data.length !== 0) {
          addArrToSet(eventSet, data, function (newSet) {
            eventSet = newSet; 
            counter++;
            if (counter === queryArr.length) {
              callback(eventSet.get()); 
            }
          }); 
        } else {
          counter++; 
          if (counter === queryArr.length) {
            callback(eventSet.get()); 
          }
          console.log(err); 
        }
      });
    }
  },

  getRecentEvent: function (id, callback) {
    callback(null, null); 
  }
};