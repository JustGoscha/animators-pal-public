var credentials = require('./credentials');
var twit = require('./node_modules/twit/lib/twitter');
var searchqueries = require('./searchqueries');
var levenstein = require('./lib/levenstein');
//var twit = require('twit');

console.log("Starting Twitter Bot - AnimatorsPal");
console.log("waiting for: "+searchqueries.track)

var limit = 15;
var twitter = new twit(credentials);

// twitter.get('search/tweets', { q: '@gkurkdjian animation since:2014-09-11', count: 20 }, function(err, data, response) {
//   for(var i in data.statuses){
//     console.log(i)
//     console.log(data.statuses[i].text); 
//   }
// });

// tweets that were re-tweeted, about 1000...
var tweets = [];

var tweetsLimit = 500;
var cutBy = 100;

/**
 * if you want to retweet more than 15 tweets per minute store the tweets here
 * @type {Array}
 */
var queue = [];
var maxQueue = 30;

/**
 * How many tweets were made in the last 15 minutes?
 * Should never go above 15
 * @type {Number}
 */
var counter = 0;

// decrease counter every minute
setInterval(function(){
  if(counter>0){
    counter--;
    if(counter <= 5 && queue.length>0){
      dispatchQueue();
    }
  }
}, 71000);

// every hour look if we have more than a certain amount of tweets
setInterval(cutTweets,360000);




function connect(){

  //
  //  filter the twitter public stream by the word 'mango'.
  //
  var stream = twitter.stream('statuses/filter', { 
    track: searchqueries.track,
    follow: searchqueries.follow
  });

  stream.on('disconnect', function (disconnectMessage) {
    console.log("- - - Disconnect - - - ");
    console.log(disconnectMessage);
  });

  stream.on('warning', function (warningMessage) {
    console.log("- - - Warning - - - ");
    console.log(warningMessage);
  });
  stream.on('limit', function (limitMessage) {
    console.log("- - - Limit - - - ");
    console.log(limitMessage);
  });
  stream.on('reconnect', function (request, response, connectInterval) {
    console.log("- - - Reconnect - - - ");
  });
  stream.on('connect', function (response) {
    console.log("- - - Connect - - - ");
    stream.on('tweet', function (tweet) {
      console.log(new Date());
      console.log("from: "+tweet.user.name + " tweet_id:" + tweet.id_str);
      console.log(tweet.text);

      var retweetIt = true;
      if(isRetweet(tweet)
        ||checkSimilarUrls(tweet)
        ||isReplyOrMessage(tweet)
        ||wasRetweetedRecently(tweet)
        ||sameText(tweet)
        ){
        retweetIt = false;
      }

      if(retweetIt){
        doRetweet(tweet);
        followTweeter(tweet);
      }
      console.log('');

    });

  });
  stream.on('connected', function (response) {
    //console.log("- - - Connected - - - ");
  });
}

function isRetweet(tweet) {
  if (tweet.text.indexOf("RT @") === 0){
    console.log("-> Is a retweet");
    return true;
  } 
  return false;
};

function checkSimilarUrls(tweet){
  var similar = false;
  var urls = tweet.entities.urls;

  if( urls && urls.length>0){
    // set similar false, if it loops a second time
    similar = false;
    console.log("->urls in this tweet:");
    for(var i in urls){
      console.log(urls[i].expanded_url);

      // now check if the URL was already in some post
      for(var j in tweets){
        var oldUrls = tweets[j].entities.urls;
        if(oldUrls && oldUrls.length>0){
          for(var k in oldUrls){
            if(oldUrls[k].expanded_url == urls[i].expanded_url){
              console.log('-> the url is already in another tweet!');
              similar = true;
              break;
            }
          }
        } else {
          continue;
        }
        if(similar)
          break;
      }
    }
  }
  if(similar)
    console.log("-> URLS in the tweet were similar to another tweet");

  return similar;
}

function isReplyOrMessage(tweet){
  for(var i in searchqueries.followed){
    if(tweet.text.indexOf(searchqueries.followed[i])>=0){
      console.log("-> is probably a reply or message to "+searchqueries.followed);
      return true;
    }
  }
  return false;
}

function wasRetweetedRecently(tweet){
  for(var i = 1; i<tweets.length && i<=30; i++){
    var j = tweets.length-i;
    if (tweets[j].user.name == tweet.user.name){
      console.log("->user was retweeted recently");
      return true;
    }
  }
  return false;
}

function sameText(tweet){
  var text = tweet.text;
  var urls = tweet.entities.urls;
  if(urls && urls.length>0){
    for(var i in urls){
      var url = urls[i].url;
      if(text.indexOf(url)==0){
        text = text.replace(url+' ','');
      }else {
        text = text.replace(' '+url,'');
      }
    }
  }
  for (var i in tweets){
    var t2 = tweets[i];
    if(t2.text.indexOf(text)>=0){
      console.log("-> same text as other tweet!");
      return true;
    }
  }
  return false;
}

/**
 * Trim all saved tweets, store something like 1000
 * @return {[type]}
 */
function cutTweets(){
  console.log("... Time to cleanup a little? ...");
  if(tweets.length>tweetsLimit-cutBy){
    console.log("- - - Trim list of tweets! - - -");
    tweets.splice(0, cutBy);
  }
}

/**
 * Follow the guy/gal who tweeted this
 * @param  {[type]} tweet
 * @return {[type]}
 */
function followTweeter(tweet){
  // don't follow everybody... 
  if(!tweet.user.following){
    if(Math.random()>0.8){  
        console.log("* * * Yeahy! Follow the user! * * *");
        follow(tweet);
      }
  } else {
    console.log("-> Already following user...");
  }
}

/**
 * Retweet the message
 * @param  {[type]} tweet
 * @return {[type]}
 */
function doRetweet(tweet){
  if(counter<limit){
    counter++;
    if(tweet.entities.urls.length>0){
      console.log(" - - - RETWEET IT - - -"); // manual retweet turned off...
      retweet(tweet);
    } else {
      console.log(" - - - RETWEET IT - - -");
      retweet(tweet);
    }
    if (tweet.entities.media && tweet.entities.media.length>0) {
      console.log("-> has media, but not link!");
    } 
    tweets.push(tweet);
    console.log('tweeted: '+tweets.length+' counter: '+counter);
  } else {
    console.log("<-- Pushed on QUEUE: " + queue.length);
    queue.push(tweet);
  }
}


function dispatchQueue() {
  console.log("- - - Dispatch from queue - - -");
  if(counter<10 && counter>0){
    doRetweet(queue.pop());
    setInterval(dispatchQueue(),20000);
  } else {
    console.log("- - - Stop from queue - - -");
  }

}

function follow (tweet) {
  if(credentials.production){
    twitter.post('friendships/create', { user_id: tweet.user.id_str }, function (err, data, response) {
      // console.log(data);
      if(err){
        console.log("- - - follow ERROR: " + err);
      }
    });
  }
}

function manualRetweet(tweet){
  console.log("- - - manual RETWEET - - -");
  var rtMessage = "RT @"+tweet.user.screen_name+": "+tweet.text;
  console.log("Retweet length chars: "+rtMessage.length);
  if(rtMessage.length>140){
    console.log("-> Manual retweet not possible :(, trying normal retweet.");
    retweet(tweet);   
  }
}

function retweet(tweet){
  if(credentials.production){
    // use id_str for everything because of stupid JS
    twitter.post('statuses/retweet/:id', { id: tweet.id_str }, function (err, data, response) {
      // console.log(data);
      if(err){
        console.log("- - - retweet ERROR: " + err);
      }
    });
  }
}


function init() {
  connect();
};

init();
// // use id_str for everything because of stupid JS
// twitter.post('statuses/retweet/:id', { id: '514011659393064961' }, function (err, data, response) {
//   console.log(data)
//   console.error(err)
// });