import mongoose, { Schema, Document, ObjectId } from 'mongoose'

export interface ILogger {
    userID: ObjectId
    serviceName: string
    time: Date
    error: string
}
export interface ILoggerDoc extends ILogger, Document {}

const LoggerSchema = new Schema({
    userID: { type: mongoose.Schema.Types.ObjectId, index: true },
    serviceName: { type: String, required: true },
    time: { type: Date, required: true, default: new Date() },
    error: { type: String, required: true, default: '' },
    errorObj: { type: Object, required: true, default: {} },
})

export default mongoose.model<ILoggerDoc>('logger', LoggerSchema)
