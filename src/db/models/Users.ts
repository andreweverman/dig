import mongoose, { Schema, Document, ObjectId } from 'mongoose'

export interface IServiceObj {
    serviceName: string
    serviceID?: ObjectId
}
export interface IServiceObjDoc extends IServiceObj, Document {}

export interface IUser {
    userID: string
    displayName: string
    username: string
    photo: string
    accessToken: string
    refreshToken: string
    services: IServiceObj[]
}

export interface IUserDoc extends IUser, Document {}

const UserSchema = new Schema({
    userID: { type: String, index: true, unique: true },
    displayName: String,
    username: String,
    photo: String,
    accessToken: String,
    refreshToken: String,
    services: { type: Array, default: [] },
})

export default mongoose.model<IUserDoc>('users', UserSchema)
