import mongoose, { Schema, Document } from 'mongoose';

export interface Dig extends Document {
    user_id: string,
    playlist_id: string,
    last_run: Date,
    sort: {
        enabled: boolean,
        sort_on: string
    },
    max_length: number

}

const DigSchema: Schema = new Schema({
    user_id: { type: String, index: true, unique: true },
    playlist_id: String,
    last_run: Date,
    sort: {
        enabled: { type: Boolean, default: true },
        sort_on: { type: String, default: 'album' }
    }
})

export default mongoose.model<Dig>('Dig', DigSchema)