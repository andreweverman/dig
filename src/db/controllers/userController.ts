import Users, { IUserDoc } from '../models/Users'
import { ObjectId } from 'mongoose'

export namespace User {
    export function getAllUsers() {
        return Users.find().exec()
    }

    export async function getUserFromID(userID: string) {
        const user = await Users.findOne({ userID: userID }).exec()
        if (!user) throw 'User not found'
        return user
    }

    export async function updateAccessToken(userID: string, accessToken: string) {
        return Users.updateOne({ userID: userID }, { $set: { accessToken: accessToken } })
    }

    export async function findOrCreate(userID: string) {
        return new Promise<IUserDoc>((resolve, reject) => {
            getUserFromID(userID)
                .then((user) => {
                    resolve(user)
                })
                .catch(() => {
                    Users.create({ userID: userID })
                        .then((user: IUserDoc) => {
                            resolve(user)
                        })
                        .catch((err) => {
                            reject(err)
                        })
                })
        })
    }

    export async function addServiceToUser(serviceName: string, userID: ObjectId) {
        let user = await Users.findById(userID).exec()
        // TODO Create a delete function for if cant find the user anymore
        if (!user) return
        let inServices = user.services.includes(serviceName)
        if (!inServices) {
            user.services.push(serviceName)

            // sorting them for better look
            user.services.sort((a, b) => (a > b ? 1 : 0))

            await user.save()
        }

        return user
    }

    export async function removeServiceFromUser(serviceName: string, userID: ObjectId) {
        Users.findById(userID)
            .exec()
            .then((user) => {
                // TODO Create a delete function for if cant find the user anymore
                if (!user) return
                user.services = user.services.filter((service) => service != serviceName)
                user.save().catch((err) => console.error(err))
            })
    }
}
