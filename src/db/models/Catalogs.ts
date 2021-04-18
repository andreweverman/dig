import mongoose, { Schema, Document, ObjectId } from 'mongoose'
export interface ICatalog {
    userID: ObjectId
    catalogPlaylistID: string
    discoverWeeklyPlaylistID: string
    initialRun: boolean
}
export interface ICatalogDoc extends ICatalog, Document {}

const CatalogSchema = new Schema({
    userID: { type: mongoose.Types.ObjectId, index: true, unique: true },
    catalogPlaylistID: { type: String, required: true },
    discoverWeeklyPlaylistID: { type: String, required: true },
    initialRun: { type: Boolean, default:false },
})

export default mongoose.model<ICatalogDoc>('Catalog', CatalogSchema)
