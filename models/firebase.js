var Firebase = require('firebase');
var StrParser = require('string');
var async = require('async');
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
  //console.log('List:');
  //console.log(list);
  //callback(null, list);
};

var checkRecentEvent = function(arr, recentDate, callback) {

}

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

  removeUser: function (id, callbck) {
    var userRef = myFirebaseRef.child(id);
    userRef.remove(callbck);
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

//need to pass in sum and recenDate into the fucking waterfall


  getRecentEvent: function (id, callback) {
    var userRef = myFirebaseRef.child(id); 
    var eventRef = userRef.child('events');
    var recentSum = '';
    var recentDate = [3000, 13, 32];
    var counter = 0;  
    eventRef.once('value', function (data) {
      var numEvents = data.numChildren(); 
      data.forEach(function (snapshot) {
        var sum = snapshot.val()['summary'] || ''; 
        var start_date = snapshot.val()['startTime'] || '';
        var arr = start_date.split('-');
        counter++; 
        checkRecentEvent(arr, recentDate, function(err, sum2, recentDate2) {
          recentSum = sum2;
          recentDate = recentDate2;
          if (counter >= numEvents) {
            callback(recentSum);
          }
        });
        async.waterfall([
          async.apply(function(arr, recentDate, callbackTemp) {
            callbackTemp(null, Number(arr[0]) < Number(recentDate[0]), Number(arr[0]) == Number(recentDate[0]), arr, recentDate);
          }, arr, recentDate), function(yearLess, yearEqual, arr, recentDate, callbackTemp) {
            console.log(arr[1] + ' compared to ' + recentDate[1])
            if (yearLess) {
              console.log('work1');
              callbackTemp(null, true, true, arr, recentDate);
            } else if (yearEqual) {
              console.log('work1a');
              callbackTemp(null, Number(arr[1]) < Number(recentDate[1]), Number(arr[1]) == Number(recentDate[1]), arr, recentDate);
            } else {
              console.log('work1b');
              callbackTemp(null, false, false, null, null);
            }
          }, function(skipToEnd, bool, arr, recentDate, callbackTemp) {
            console.log(arr[2] + ' compared to ' + recentDate[2])
            if (skipToEnd) {
              console.log('work2')
              callbackTemp(null, true, arr, recentDate)
            } else if (bool) {
              console.log('work2a')
              callbackTemp(null, Number(arr[2]) <= Number(recentDate[2]), arr, recentDate)
            } else {
              console.log('work2b')
              callbackTemp(null, false)
            }
          }], function(err, boolean, arr, recentDate) {
            console.log('callback hell finished');
            //recentSum = sum;
          if (boolean) {
            console.log('recent events changed?')
            recentDate = arr;
            recentSum = sum || 'sum';
            console.log('changed sum: ' + recentSum);
            console.log('changed date: ' + recentDate);
            callback(err, recentSum, recentDate)
          } else {
            callback(err, '', recentDate)
          }
        });
      });
    });
  }
};