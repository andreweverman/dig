import { ObjectId } from 'mongoose'
import Loggers, { ILoggerDoc } from '../models/Logger'

export namespace Logger {
    export function createLog(
        userID: ObjectId,
        serviceName: string,
        message: string,
        errorObj={}
    ): Promise<ILoggerDoc> {
        const time = new Date()
        return Loggers.create({ userID, serviceName, message, time, errorObj})
    }
}
