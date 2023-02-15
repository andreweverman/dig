import mongoose, { Schema, Document, ObjectId } from 'mongoose'
export interface ICatalog {
    userID: ObjectId
    catalogPlaylistID: string
    discoverWeeklyPlaylistID: string
    lastAddedDate:Date
}
export interface ICatalogDoc extends ICatalog, Document {}

const CatalogSchema = new Schema({
    userID: { type: mongoose.Types.ObjectId, index: true, unique: true },
    catalogPlaylistID: { type: String, required: true },
    discoverWeeklyPlaylistID: { type: String, required: true },
    lastAddedDate: { type: Date, default: new Date('1998-07-12T16:00:00Z') },
})

export default mongoose.model<ICatalogDoc>('Catalog', CatalogSchema)
