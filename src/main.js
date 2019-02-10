var credentials = require("./credentials")
var twit = require("twit")
var searchqueries = require("./searchqueries")
var levenstein = require("../lib/levenstein")
//var twit = require('twit');

var appStatus = {
  connectRuns: 0,
  reconnects: 0,
}

var TWITTER_TIMEFRAME = 15
var LIMIT = 5
var twitter = new twit(credentials)

var logMessage = ""


// tweets that were re-tweeted, about 1000...
var tweets = []

var tweetsLimit = 500
var cutBy = 100

/**
 * if you want to retweet more than 15 tweets per minute store the tweets here
 * @type {Array}
 */
var queue = []
var maxQueue = 30

/**
 * How many tweets were made in the last 15 minutes?
 * Should never go above 15
 * @type {Number}
 */
var counter = 0

var decreaseInterval = (TWITTER_TIMEFRAME / LIMIT) * 1000 * 60

// decrease counter every minute
setInterval(function() {
  if (counter > 0) {
    counter--
    if (counter <= LIMIT && queue.length > 0) {
      dispatchQueue()
    }
  }
}, decreaseInterval)

var ripeToUnfollow = []
// init app state
getFriendsWhoDontFollowYouBack()
setInterval(getFriendsWhoDontFollowYouBack, 1000000)

// every hour look if we have more than a certain amount of tweets
setInterval(cutTweets, 1800000)

// check every x min to
setInterval(unfollowRandom, 80000)

function connect() {
  appStatus.reconnects = 0
  appStatus.connectRuns++
  logDirect("Running connect function..." + appStatus.connectRuns + " times")

  //
  //  filter the twitter public stream by the word 'mango'.
  //
  var stream = twitter.stream("statuses/filter", {
    track: searchqueries.track,
    follow: searchqueries.follow,
  })

  stream.on("disconnect", function(disconnectMessage) {
    logDirect("- - - Disconnect - - - ")
    logDirect(disconnectMessage)
  })

  stream.on("error", function(error) {
    logDirect("! ! ! ERROR ! ! !")
    connect()
    process.exit(1)
  })
  stream.on("warning", function(warningMessage) {
    logDirect("- - - Warning - - - ")
    logDirect(warningMessage)
  })
  stream.on("limit", function(LIMITMessage) {
    logDirect("- - - Limit - - - ")
    logDirect(LIMITMessage)
  })
  stream.on("reconnect", function(request, response, connectInterval) {
    logDirect("- - - Reconnect [" + appStatus.reconnects++ + "] - - - ")
  })
  stream.on("connect", function(response) {
    if (appStatus.reconnects == 0) {
      logDirect("- - - Connect - - - ")
      stream.on("tweet", onIncomingTweet)
    }
  })
  stream.on("connected", function(response) {
    // log("- - - Connected - - - ");
  })
}




function init() {
  connect()
}

init()
// // use id_str for everything because of stupid JS
// twitter.post('statuses/retweet/:id', { id: '514011659393064961' }, function (err, data, response) {
//   log(data)
//   console.error(err)
// });
