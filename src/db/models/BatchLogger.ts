import mongoose, { Schema, Document, ObjectId } from 'mongoose'

export interface IBatchLogger {
    serviceName: string
    time: Date
    env: string
}
export interface IBatchLoggerDoc extends IBatchLogger, Document {}

const LoggerSchema = new Schema({
    serviceName: { type: String, required: true },
    env: { type: String, required: true },
    time: { type: Date, required: true, default: new Date() },
})

export default mongoose.model<IBatchLoggerDoc>('batchlogger', LoggerSchema)
