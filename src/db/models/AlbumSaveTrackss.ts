import mongoose, { Schema, Document, ObjectId } from 'mongoose'

export interface IAlbumSaveTracks {
    userID: ObjectId
    enabled: boolean
    lastRun: Date
}

export interface IAlbumSaveTracksDoc extends IAlbumSaveTracks, Document {}

const AlbumSaveTracksSchema = new Schema({
    userID: { type: mongoose.Types.ObjectId, index: true, unique: true },
    enabled: { type: Boolean, default: false },
    lastRun: { type: Date, default: new Date('1998-07-12T16:00:00Z'), required: true },
})

export default mongoose.model<IAlbumSaveTracksDoc>('AlbumSaveTracks', AlbumSaveTracksSchema)
