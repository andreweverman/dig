import mongoose, { Schema, Document, ObjectId } from 'mongoose'

export interface IAlbumSaveTracks {
    userID: ObjectId
    enabled: boolean
}

export interface IAlbumSaveTracksDoc extends IAlbumSaveTracks, Document {}

const AlbumSaveTracksSchema = new Schema({
    userID: { type: mongoose.Types.ObjectId, index: true, unique: true },
    enabled: { type: Boolean, default: false },
})

export default mongoose.model<IAlbumSaveTracksDoc>('AlbumSaveTracks', AlbumSaveTracksSchema)
