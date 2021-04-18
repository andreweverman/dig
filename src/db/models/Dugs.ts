import mongoose, { Schema, Document, ObjectId } from 'mongoose'

export interface IDug {
    userID: ObjectId
    playlistID: string
    lastRun: Date
}

export interface IDugDoc extends IDug, Document {}

const DugSchema = new Schema({
    userID: { type: mongoose.Types.ObjectId, required: true },
    playlistID: { type: String, required: true },
    lastRun: { type: Date, required: true, default: new Date('1998-07-12T16:00:00Z') },
})

export default mongoose.model<IDugDoc>('Dugs', DugSchema)
