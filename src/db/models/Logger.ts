import mongoose, { Schema, Document, ObjectId } from 'mongoose'

export interface ILogger {
    userID: ObjectId
    serviceName: string
    time: Date
    message: string
    errorObj: Object
}
export interface ILoggerDoc extends ILogger, Document {}

const LoggerSchema = new Schema({
    userID: { type: mongoose.Schema.Types.ObjectId, index: true },
    serviceName: { type: String, required: true },
    time: { type: Date, required: true, default: new Date() },
    message: { type: String, required: false, default: '' },
    errorObj: { type: Object, required: true, default: {} },
})

export default mongoose.model<ILoggerDoc>('logger', LoggerSchema)
