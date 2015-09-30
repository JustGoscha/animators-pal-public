var credentials = require('./credentials');
var twit = require('./node_modules/twit/lib/twitter');
var searchqueries = require('./searchqueries');
var levenstein = require('./lib/levenstein');
//var twit = require('twit');

var logComplete = function(){
  console.log(logMessage);
  logMessage = "";
}
var logDelete = function(){
  logMessage = "";
}

var logDirect = function(message){
  if(message && message.length > 0){
    var date = new Date();
    var date_string = date.getFullYear()+'.'+(date.getMonth()+1)+'.'+date.getDate()+'-'+date.getHours()+':'+date.getMinutes();
    console.log(date_string+" | "+message);
  } else {
    console.log();
  }
}

var log = function(message){
  if(message && message.length > 0){
    var date = new Date();
    var date_string = date.getFullYear()+'.'+(date.getMonth()+1)+'.'+date.getDate()+'-'+date.getHours()+':'+date.getMinutes();
    logMessage += date_string+" | "+message + "\n";
  } else {
    logMessage += "\n";
  }
}
logDirect("Starting Twitter Bot - AnimatorsPal");
logDirect("waiting for: "+searchqueries.track)

var appStatus = {
  connectRuns: 0,
  reconnects: 0
}

var TWITTER_TIMEFRAME = 15;
var LIMIT = 5;
var twitter = new twit(credentials);

var logMessage = "";
// twitter.get('search/tweets', { q: '@gkurkdjian animation since:2014-09-11', count: 20 }, function(err, data, response) {
//   for(var i in data.statuses){
//     log(i)
//     log(data.statuses[i].text); 
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
var maxQueue = 30

/**
 * How many tweets were made in the last 15 minutes?
 * Should never go above 15
 * @type {Number}
 */
var counter = 0;


var decreaseInterval = TWITTER_TIMEFRAME/LIMIT * 1000 * 60;

// decrease counter every minute
setInterval(function(){
  if(counter>0){
    counter--;
    if(counter <= LIMIT && queue.length>0){
      dispatchQueue();
    }
  }
}, decreaseInterval);

var ripeToUnfollow = [];
getFriendsWhoDontFollowYouBack()
setInterval(getFriendsWhoDontFollowYouBack, 1000000);

// every hour look if we have more than a certain amount of tweets
setInterval(cutTweets, 1800000);

// check every x min to
setInterval(unfollowRandom, 80000);

function connect(){
  appStatus.reconnects = 0;
  appStatus.connectRuns++;
  logDirect("Running connect function..." + appStatus.connectRuns + " times");

  //
  //  filter the twitter public stream by the word 'mango'.
  //
  var stream = twitter.stream('statuses/filter', { 
    track: searchqueries.track,
    follow: searchqueries.follow
  });

  stream.on('disconnect', function (disconnectMessage) {
    logDirect("- - - Disconnect - - - ");
    logDirect(disconnectMessage);
  });

  stream.on('error', function(error){
    logDirect("! ! ! ERROR ! ! !");
    connect();
  })
  stream.on('warning', function (warningMessage) {
    logDirect("- - - Warning - - - ");
    logDirect(warningMessage);
  });
  stream.on('limit', function (LIMITMessage) {
    logDirect("- - - Limit - - - ");
    logDirect(LIMITMessage);
  });
  stream.on('reconnect', function (request, response, connectInterval) {
    logDirect("- - - Reconnect ["+ appStatus.reconnects++ +"] - - - ");
  });
  stream.on('connect', function (response) {
    if(appStatus.reconnects == 0){
      logDirect("- - - Connect - - - ");
      stream.on('tweet', onIncomingTweet);
    }
  });
  stream.on('connected', function (response) {
    // log("- - - Connected - - - ");
  });
}

function onIncomingTweet(tweet) {
  log("from: "+tweet.user.name + " tweet_id:" + tweet.id_str);
  log(tweet.text);

  var retweetIt = true;
  if( isRetweet(tweet)
    ||checkSimilarUrls(tweet)
    ||isReplyOrMessage(tweet)
    ||wasRetweetedRecently(tweet)
    ||sameText(tweet)
    ||similarText(tweet)
    ||!mediaOrLink(tweet)
    ){
    retweetIt = false;
  }

  if(retweetIt){
    doRetweet(tweet);
    followTweeter(tweet);
    logComplete();
  }
  logDelete();
  log("");

}

function isRetweet(tweet) {
  if (tweet.text.indexOf("RT @") === 0){
    log("-> Is a retweet");
    logDelete();
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
    log("->urls in this tweet:");
    for(var i in urls){
      log(urls[i].expanded_url);

      // now check if the URL was already in some post
      for(var j in tweets){
        var oldUrls = tweets[j].entities.urls;
        if(oldUrls && oldUrls.length>0){
          for(var k in oldUrls){
            if(oldUrls[k].expanded_url == urls[i].expanded_url){
              log('-> the url is already in another tweet!');
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
    log("-> URLS in the tweet were similar to another tweet");

  return similar;
}
function mediaOrLink(tweet){
  log("...has suitable media or link?");
  if(hasMedia(tweet)||hasLink(tweet)){
    log("has suitable media or link - TRUE");
    return true;
  } 
  log("has suitable media or link - FALSE");

  return false;
}

function hasLink(tweet){

  for(var i in tweet.entities.urls){
    log(tweet.entities.urls[i]);

    if(tweet.entities.urls[i].expanded_url){
      var url = tweet.entities.urls[i].expanded_url;
      log("-> expanded url: "+url);
      var check = false;
      for(var j in searchqueries.urls){
        var urlPart = searchqueries.urls[j];
        if(url.indexOf(urlPart)>=0){
          check = true;
          log("-> has link from: " + urlPart);
          return true;
        }
      }
    }
  }
  return false;
}

function hasMedia(tweet){
  if(tweet.entities.media && tweet.entities.media.length>0){
    // log("--> media: " + JSON.stringify(tweet.entities.media));
    for(var i in tweet.entities.media){
      var media = tweet.entities.media[i].media_url;
      if(hasGif(media)){
        return true;
      }
    }
  } else {
    log("-> no media");
  }
  return false;
}

function hasGif(media){
  log("-> expanded media url: " + media);
  if(media.indexOf("tweet_video_thumb")>=0){
    log("-> has media .gif");
    return true;
  }
  return false;
}

function hasImage(media){
  if( media.indexOf(".png")+media.indexOf(".jpg") >= 0){
    log("-> has media .jpg/.png");
    return true;
  }
  return false;
}

function isReplyOrMessage(tweet){
  for(var i in searchqueries.followed){
    if(tweet.text.indexOf(searchqueries.followed[i])>=0){
      log("-> is probably a reply or message to "+searchqueries.followed);
      return true;
    }
  }
  return false;
}

function wasRetweetedRecently(tweet){
  for(var i = 1; i<tweets.length && i<=10; i++){
    var j = tweets.length-i;
    if (tweets[j].user.name == tweet.user.name){
      log("->user was retweeted recently");
      return true;
    }
  }
  return false;
}

function similarText(tweet){
  var text = tweet.text;
  // don't check short text
  if (text.length<50){
    return false;
  }
  var nearest = 100;
  var ntext = "";
  for(var i in tweets){
    var text2 = tweets[i].text;
    // how different is the text
    var diff = levenstein.difference(text, text2);
    // percentage
    var ratio = diff/text.length;
    // debug nearest matches
    if(nearest>ratio){
      nearest=ratio;
      ntext=text2;
    }
    if ( ratio < 0.34 ){
      log("-> ["+ratio+"] tweet to similar to: " + text2)
      return true;
    }
  }

  log("Nearest match was: " + nearest + " | "+ntext)
  return false
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
      log("-> same text as other tweet!");
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
  log("@@@ CLEANUP @@@");
  if(tweets.length>tweetsLimit-cutBy){
    logDirect("- - - Trim list of tweets! - - -");
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
    if(Math.random()>0.97){  
        logDirect("* * * Yeahy! Follow the user! * * *");
        setTimeout(function(){
          follow(tweet); // follow sometime within the hour
        }, Math.random()*1000*60*60);
      }
  } else {
    log("-> Already following user...");
  }
}

function randomTimeBetween(fromSeconds, toSeconds){
  if (toSeconds<fromSeconds){
    return 0;
  }
  var from = fromSeconds*1000;
  var to = toSeconds*1000 - from;
  return from + Math.random()*to;
}

/**
 * Retweet the message
 * @param  {[type]} tweet
 * @return {[type]}
 */
function doRetweet(tweet){
  if(counter<LIMIT){
    counter++;

    var randomTime = randomTimeBetween(0,120);
    log(" - - - RETWEET IT - - - in "+Math.floor(randomTime)/1000+"sec");
    setTimeout(function(){
      retweet(tweet);
    }, randomTime);

    if (tweet.entities.media && tweet.entities.media.length>0) {
      log("-> has media, but not link!");
    } 
    tweets.push(tweet);
    log('tweeted: '+tweets.length+' counter: '+counter);
  } else {
    log("<-- Pushed on QUEUE: " + queue.length);
    queue.push(tweet);
  }
}


function dispatchQueue() {
  logDirect("- - - Dispatch from queue - - -");
  if(counter<LIMIT && queue.length>0){
    onIncomingTweet(queue.pop());
    // doRetweet(queue.pop());
    setTimeout(dispatchQueue, 60000);
  } else {
    logDirect("- - - Stop Dispatching from queue - - -");
  }

}

function follow (tweet) {
  // if(credentials.production){
    twitter.post('friendships/create', { user_id: tweet.user.id_str }, function (err, data, response) {
      // log(data);
      if(err){
        logDirect("- - - follow ERROR: " + err);
      }
    });
  // }
}

function manualRetweet(tweet){
  log("- - - manual RETWEET - - -");
  var rtMessage = "RT @"+tweet.user.screen_name+": "+tweet.text;
  log("Retweet length chars: "+rtMessage.length);
  if(rtMessage.length>140){
    log("-> Manual retweet not possible :(, trying normal retweet.");
    retweet(tweet);   
  }
}

function retweet(tweet){
  // if(credentials.production){
    // use id_str for everything because of stupid JS
    twitter.post('statuses/retweet/:id', { id: tweet.id_str }, function (err, data, response) {
      // log(data);
      if(err){
        logDirect("- - - retweet ERROR: " + err);
      }
    });
  // }
}

function getFriendsWhoDontFollowYouBack() {
  ripeToUnfollow = [];
  twitter.get('friends/ids', { screen_name: credentials.screen_name, stringify_ids: true, count: 5000},  function (err, data, response) {
    var friends;
    if(data && !err){
      friends = data.ids; 
    } else {
      console.log("ERROR: some error happened")
    }

    //log("Friends:" + data.ids);

    twitter.get('followers/ids', { screen_name: credentials.screen_name, stringify_ids: true, count: 5000},  function (err, data, response) {
      if(!err && data){
        var followers = data.ids;
        //log("Followers:"+data.ids);
        for(var i in friends){
          var friend = friends[i];
          var guilty = true;
          for(var j in followers){
            if(friend == followers[j]){
              //log("Duplicate:" +friend);
              guilty = false;
              break;
            }
          }
          if(guilty){
            ripeToUnfollow.push(friend)
          }
        }
        //log("All ready to unfollow:" + ripeToUnfollow);
        logDirect("UPDATE people to unfollow!");
      }
    });
  });
}

function unfollowRandom(){
  // randomize if unfollow or not
  if (Math.random()<0.01){
    var index = Math.floor(ripeToUnfollow.length * Math.random());
    if(ripeToUnfollow[index] != undefined){
      logDirect("UNFOLLOW: " + ripeToUnfollow[index]);
      
      twitter.post('friendships/destroy', { user_id: ripeToUnfollow[index] }, function (err, data, response) {
        if(err){
          logDirect("- - - unfollow ERROR: " + err);
        } else {
          logDirect("X_X_X UNFOLLOWED: " + data.name + " id: " + ripeToUnfollow[index]);
        }
        ripeToUnfollow.splice(index, 1);
      });
    }
  }
}


function init() {
  connect();
};

init();
// // use id_str for everything because of stupid JS
// twitter.post('statuses/retweet/:id', { id: '514011659393064961' }, function (err, data, response) {
//   log(data)
//   console.error(err)
// });