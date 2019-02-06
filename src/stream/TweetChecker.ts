import { Twitter } from "twit"
import { injectable, inject } from "inversify"
import { searchqueries } from "../config/searchqueries"
import { TYPES } from "../container.types"
import { ILogger } from "../Logger"
const levenstein = require("../lib/levenstein.js")

export interface ITweetChecker {
  shouldRetweet(tweet: Twitter.Status): boolean
}

// const TweetFilters = {
//   "isRetweet": ,
//   "checkSimilarUrls": ,
//   "isReplyOrMessage": ,
//   "wasRetweetedRecently": ,
//   "isSameText": ,
//   "isSimilarText": ,
//   "isInBlocklist": ,
//   "isMediaOrLink": ,
// }

// const filterConfig = [
//   "isRetweet",
//   "checkSimilarUrls",
//   "isReplyOrMessage",
//   "wasRetweetedRecently",
//   "isSameText",
//   "isSimilarText",
//   "isInBlocklist",
//   "isMediaOrLink",
// ]

// type AvailableFilters =

@injectable()
export class TweetChecker implements ITweetChecker {
  constructor(@inject(TYPES.Logger) private logger: ILogger) {}
  shouldRetweet(tweet: Twitter.Status) {
    // measure total
    // measure funnel
    // should be configurable, too
    return (
      !this.isRetweet(tweet) &&
      !this.checkSimilarUrls(tweet) &&
      !this.isReplyOrMessage(tweet) &&
      !this.wasRetweetedRecently(tweet) &&
      !this.isSameText(tweet) &&
      !this.isSimilarText(tweet) &&
      !this.isInBlocklist(tweet) &&
      this.isMediaOrLink(tweet)
    )
    // measure passing
  }

  isRetweet = (tweet: Twitter.Status) => {
    if (tweet.text && tweet.text.indexOf("RT @") === 0) {
      this.logger.info("-> Is a retweet")
      return true
    }
    return false
  }

  checkSimilarUrls = (tweet: Twitter.Status) => {
    let similar = false
    let urls = tweet.entities.urls

    if (urls && urls.length > 0) {
      // set similar false, if it loops a second time
      similar = false
      this.logger.info("->urls in this tweet:")
      for (let url of urls) {
        this.logger.info(url.expanded_url)

        // now check if the URL was already in some post
        for (const tweet of this.tweets) {
          let oldUrls = tweet.entities.urls
          if (oldUrls && oldUrls.length > 0) {
            for (const oldUrl of oldUrls) {
              if (oldUrl.expanded_url == url.expanded_url) {
                this.logger.info("-> the url is already in another tweet!")
                similar = true
                break
              }
            }
          } else {
            continue
          }
          if (similar) break
        }
      }
    }
    if (similar)
      this.logger.info("-> URLS in the tweet were similar to another tweet")

    return similar
  }
  isMediaOrLink = (tweet: Twitter.Status) => {
    this.logger.info("...has suitable media or link?")
    if (this.hasMedia(tweet) || this.hasLink(tweet)) {
      this.logger.info("has suitable media or link - TRUE")
      return true
    }
    this.logger.info("has suitable media or link - FALSE")

    return false
  }

  hasLink = (tweet: Twitter.Status) => {
    for (let url of tweet.entities.urls) {
      this.logger.info(url.expanded_url)

      if (url.expanded_url) {
        let expanded_url = url.expanded_url
        this.logger.info("-> expanded url: " + expanded_url)
        for (let j in searchqueries.urls) {
          let urlPart = searchqueries.urls[j]
          if (expanded_url.indexOf(urlPart) >= 0) {
            this.logger.info("-> has link from: " + urlPart)
            return true
          }
        }
      }
    }
    return false
  }

  hasMedia = (tweet: Twitter.Status) => {
    if (tweet.entities.media && tweet.entities.media.length > 0) {
      // this.logger.info("--> media: " + JSON.stringify(tweet.entities.media));
      for (let i in tweet.entities.media) {
        let media = tweet.entities.media[i].media_url
        if (this.hasGif(media)) {
          return true
        }
      }
    } else {
      this.logger.info("-> no media")
    }
    return false
  }

  hasGif = (media: string) => {
    this.logger.info("-> expanded media url: " + media)
    if (media.indexOf("tweet_video_thumb") >= 0) {
      this.logger.info("-> has media .gif")
      return true
    }
    return false
  }

  hasImage = (media: string) => {
    if (media.indexOf(".png") + media.indexOf(".jpg") >= 0) {
      this.logger.info("-> has media .jpg/.png")
      return true
    }
    return false
  }

  isReplyOrMessage = (tweet: Twitter.Status) => {
    for (let i in searchqueries.followed) {
      if (tweet.text && tweet.text.indexOf(searchqueries.followed[i]) >= 0) {
        this.logger.info(
          "-> is probably a reply or message to " + searchqueries.followed,
        )
        return true
      }
    }
    return false
  }

  // TODO move to store
  tweets: Twitter.Status[] = []

  wasRetweetedRecently = (tweet: Twitter.Status) => {
    for (let i = 1; i < this.tweets.length && i <= 10; i++) {
      let j = this.tweets.length - i
      if (this.tweets[j].user.name == tweet.user.name) {
        this.logger.info("->user was retweeted recently")
        return true
      }
    }
    return false
  }

  isSimilarText = (tweet: Twitter.Status) => {
    let text = tweet.text
    // don't check short text
    if (text && text.length < 50) {
      return false
    }
    let nearest = 100
    let ntext = ""
    if (!text) {
      return false
    }
    for (const tweet of this.tweets) {
      let text2 = tweet.text
      if (!text2) continue

      // how different is the text
      let diff = levenstein.difference(text, text2)
      // percentage
      let ratio = diff / text.length
      // debug nearest

      if (nearest > ratio) {
        nearest = ratio
        ntext = text2
      }
      if (ratio < 0.34) {
        this.logger.info("-> [" + ratio + "] tweet to similar to: " + text2)
        return true
      }
    }

    this.logger.info("Nearest match was: " + nearest + " | " + ntext)
    return false
  }

  isInBlocklist = (tweet: Twitter.Status) => {
    // look if some of the blocklist entries is in the tweet
    return searchqueries.blocklist.some(function(blocked) {
      var truths = 0

      // check username, links and text
      truths +=
        tweet.text &&
        tweet.text.toLowerCase().indexOf(blocked.toLowerCase()) >= 0
          ? 1
          : 0
      truths += tweet.entities.urls.some(function(url) {
        return (
          url.expanded_url.toLowerCase().indexOf(blocked.toLowerCase()) >= 0
        )
      })
        ? 1
        : 0
      truths += tweet.text && tweet.text.indexOf(blocked) >= 0 ? 1 : 0
      truths +=
        tweet.user.name.toLowerCase().indexOf(blocked.toLowerCase()) >= 0
          ? 1
          : 0

      return truths > 0
    })
  }

  isSameText = (tweet: Twitter.Status) => {
    let text = tweet.text
    if (!text) return false
    let urls = tweet.entities.urls
    if (urls && urls.length > 0) {
      for (let i in urls) {
        let url = urls[i].url
        if (text.indexOf(url) == 0) {
          text = text.replace(url + " ", "")
        } else {
          text = text.replace(" " + url, "")
        }
      }
    }
    for (const tweet2 of this.tweets) {
      if (tweet2.text && tweet2.text.indexOf(text) >= 0) {
        this.logger.info("-> same text as other tweet!")
        return true
      }
    }
    return false
  }
}
