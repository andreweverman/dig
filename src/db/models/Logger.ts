import mongoose, { Schema, Document, ObjectId } from 'mongoose'

export interface ILogger {
    userID: ObjectId
    serviceName: string
    time: Date
    error: string
}
export interface ILoggerDoc extends ILogger, Document {}

const LoggerSchema = new Schema({
    userIDs: { type: mongoose.Schema.Types.ObjectId, index: true },
    serviceName: { type: String, required: true },
    time: { type: Date, required: true },
    error: { type: String, required: true },
})

export default mongoose.model<ILoggerDoc>('logger', LoggerSchema)
