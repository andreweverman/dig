import moment, { Moment } from 'moment'
import mongoose, { Schema, Document, ObjectId } from 'mongoose'

export interface IDig {
    userID: ObjectId
    playlistID: string
    lastRun: Date
    running: boolean
    daysToKeep: number
    minSongs: number
    albumSort: boolean
}

export interface IDigDoc extends IDig, Document {}
const DigSchema = new Schema({
    userID: { type: mongoose.Types.ObjectId, required: true },
    playlistID: { type: String, required: true },
    lastRun: { type: Date, required: true, default: new Date('1998-07-12T16:00:00Z') },
    daysToKeep: { type: Number, required: true, default: 7 },
    minSongs: { type: Number, required: true, default: 20 },
    albumSort: { type: Boolean, default: false },
    running: { type: Boolean, default: false },
})

DigSchema.pre<IDigDoc>('save', function (next) {
    if (this.isModified('playlistID')) {
        this.lastRun = moment.utc().toDate()
    }
    next()
})

export default mongoose.model<IDigDoc>('Digs', DigSchema)
