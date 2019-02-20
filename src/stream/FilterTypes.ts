import { Twitter } from "twit"

export type FilterFunction = (tweet: Twitter.Status) => boolean
export type FilterName =
  | "isRetweet"
  | "isSimilarUrl"
  | "isReplyOrMessage"
  | "wasRetweetedRecently"
  | "isSameText"
  | "isSimilarText"
  | "isInBlocklist"
  | "isMediaOrLink"
  | "isMatureContent"

export type FilterRule = [FilterName, boolean]
export type FilterPipelineConfig = FilterRule[]

export type FilterStatistics = {
  totalTweets: number
  passedTweets: number
  funnel: { [key in FilterName]?: number }
}
