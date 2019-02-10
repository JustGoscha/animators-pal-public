import { injectable, inject } from "inversify"
import { TYPES } from "../container.types"
import { Scheduler } from "./Scheduler"

@injectable()
class Worker {
  constructor(@inject(TYPES.Scheduler) private scheduler: Scheduler) {}
  start() {}
}
