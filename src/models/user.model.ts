import mongoose, { Schema, Document } from 'mongoose';

export interface User extends Document {
    user_id: string,
    display_name: string,
    username: string,
    photo: string,
    profile: Object,
    access_token: string,
    refresh_token: string,
    services: string[]
}

const UserSchema: Schema = new Schema({
    user_id: { type: String, index: true, unique: true },
    display_name: String,
    username: String,
    photo: String,
    profile: String,
    access_token: String,
    refresh_token: String,
    services: [{ type: String }]

})

export default mongoose.model<User>('User', UserSchema)