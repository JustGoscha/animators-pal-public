var credentials = require('./credentials');
var twit = require('./node_modules/twit/lib/twitter');
var searchqueries = require('./searchqueries');
var levenstein = require('./lib/levenstein');
//var twit = require('twit');

var log = function(message){
  if(message && message.length > 0){
    var date = new Date();
    var date_string = date.getFullYear()+'.'+(date.getMonth()+1)+'.'+date.getDate()+'-'+date.getHours()+':'+date.getMinutes();
    console.log(date_string+" | "+message);
  }else{ 
    console.log()
  }
}
log("Starting Twitter Bot - AnimatorsPal");
log("waiting for: "+searchqueries.track)

var limit = 15;
var twitter = new twit(credentials);

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

var ripeToUnfollow = [];
getFriendsWhoDontFollowYouBack()
setInterval(getFriendsWhoDontFollowYouBack, 1000000);

// every hour look if we have more than a certain amount of tweets
setInterval(cutTweets,1800000);

// check every x min to
setInterval(unfollowRandom, 80000);

function connect(){

  //
  //  filter the twitter public stream by the word 'mango'.
  //
  var stream = twitter.stream('statuses/filter', { 
    track: searchqueries.track,
    follow: searchqueries.follow
  });

  stream.on('disconnect', function (disconnectMessage) {
    log("- - - Disconnect - - - ");
    log(disconnectMessage);
  });

  stream.on('warning', function (warningMessage) {
    log("- - - Warning - - - ");
    log(warningMessage);
  });
  stream.on('limit', function (limitMessage) {
    log("- - - Limit - - - ");
    log(limitMessage);
  });
  stream.on('reconnect', function (request, response, connectInterval) {
    log("- - - Reconnect - - - ");
  });
  stream.on('connect', function (response) {
    log("- - - Connect - - - ");
    stream.on('tweet', function (tweet) {
      log(new Date());
      log("from: "+tweet.user.name + " tweet_id:" + tweet.id_str);
      log(tweet.text);

      var retweetIt = true;
      if( isRetweet(tweet)
        ||checkSimilarUrls(tweet)
        ||isReplyOrMessage(tweet)
        ||wasRetweetedRecently(tweet)
        ||sameText(tweet)
        ||similarText(tweet)
        ){
        retweetIt = false;
      }

      if(retweetIt){
        doRetweet(tweet);
        followTweeter(tweet);
      }
      log('');

    });

  });
  stream.on('connected', function (response) {
    // log("- - - Connected - - - ");
  });
}

function isRetweet(tweet) {
  if (tweet.text.indexOf("RT @") === 0){
    log("-> Is a retweet");
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
  for(var i = 1; i<tweets.length && i<=30; i++){
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
    log("- - - Trim list of tweets! - - -");
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
        log("* * * Yeahy! Follow the user! * * *");
        follow(tweet);
      }
  } else {
    log("-> Already following user...");
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
      log(" - - - RETWEET IT - - -"); // manual retweet turned off...
      retweet(tweet);
    } else {
      log(" - - - RETWEET IT - - -");
      retweet(tweet);
    }
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
  log("- - - Dispatch from queue - - -");
  if(counter<10 && counter>0){
    doRetweet(queue.pop());
    setInterval(dispatchQueue(),20000);
  } else {
    log("- - - Stop from queue - - -");
  }

}

function follow (tweet) {
  // if(credentials.production){
    twitter.post('friendships/create', { user_id: tweet.user.id_str }, function (err, data, response) {
      // log(data);
      if(err){
        log("- - - follow ERROR: " + err);
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
        log("- - - retweet ERROR: " + err);
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
        log("UPDATE people to unfollow!");
      }
    });
  });
}

function unfollowRandom(){
  // randomize if unfollow or not
  if (Math.random()<0.1){
    var index = Math.floor(ripeToUnfollow.length * Math.random());
    twitter.post('friendships/destroy', { user_id: ripeToUnfollow[index] }, function (err, data, response) {
      if(err){
        log("- - - unfollow ERROR: " + err);
      } else {
        log("X_X_X UNFOLLOWED: " + data.name + " id: " + ripeToUnfollow[index]);
      }
      ripeToUnfollow.splice(index, 1);
    });
    log("UNFOLLOW: " + ripeToUnfollow[index]);
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