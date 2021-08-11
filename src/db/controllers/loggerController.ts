import { ObjectId } from 'mongoose'
import Loggers, { ILoggerDoc } from '../models/Logger'

export namespace Logger {
    export function createLog(userID: ObjectId, serviceName: string, error: string): Promise<ILoggerDoc> {
        return Loggers.create({ userID, serviceName, error })
    }
}
