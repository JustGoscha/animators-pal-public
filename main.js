var credentials = require('./credentials');
var twit = require('./node_modules/twit/lib/twitter');
var searchqueries = require('./searchqueries');
//var twit = require('twit');

console.log("Starting Twitter Bot - AnimatorsPal");

var twitter = new twit(credentials);

// twitter.get('search/tweets', { q: '@gkurkdjian animation since:2014-09-11', count: 20 }, function(err, data, response) {
//   for(var i in data.statuses){
//     console.log(i)
//     console.log(data.statuses[i].text); 
//   }
// });


//
//  filter the twitter public stream by the word 'mango'.
//
var stream = twitter.stream('statuses/filter', { 
  track: searchqueries.filter,
  follow: searchqueries.follow
});

stream.on('tweet', function (tweet) {
  console.log(tweet.id_str);
  console.log(tweet.text+'\n');
});

stream.on('disconnect', function (disconnectMessage) {
  console.log(disconnectMessage);
});

stream.on('warning', function (warningMessage) {
  console.log(warningMessage);
});


// // use id_str for everything because of stupid JS
// twitter.post('statuses/retweet/:id', { id: '514011659393064961' }, function (err, data, response) {
//   console.log(data)
//   console.error(err)
// });