import { ObjectId } from 'mongoose'
import BatchLoggers, { IBatchLogger } from '../models/BatchLogger'

export namespace BatchLogger {
    export function createLog(serviceName: string): Promise<IBatchLogger> {
        const env = process.env.ENV
        const time = new Date()
        return BatchLoggers.create({ serviceName, env, time })
    }
}
