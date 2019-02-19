import { boot } from "../boot"
import { Worker } from "../scheduler/Worker"
import { TYPES } from "../container.types"
import { ITweetProcessor } from "../stream/TweetProcessor"

const container = boot()
const worker = container.get<Worker>(TYPES.Worker)
const processor = container.get<ITweetProcessor>(TYPES.TweetProcessor)

worker.start()
processor.startProcessingStream()
