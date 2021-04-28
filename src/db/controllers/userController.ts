import Users, { IUserDoc } from '../models/Users'
import { ObjectId } from 'mongoose'
import DigService from '../../services/DigService'
import DugService from '../../services/DugService'
import CatalogService from '../../services/CatalogService'
import AlbumSaveTracksService from '../../services/AlbumSaveTracksService'

let dig = new DigService()
let dug = new DugService()
let catalog = new CatalogService()
let albumSaveTracks = new AlbumSaveTracksService()
let allServices = [dig, dug, catalog, albumSaveTracks]

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

    export async function addServiceToUser(serviceName: string, serviceID: ObjectId, userID: ObjectId) {
        let user = await Users.findById(userID).exec()
        // TODO Create a delete function for if cant find the user anymore
        if (!user) return
        let inServices = user.services.find((x) => x.serviceName == serviceName)
        if (!inServices) {
            user.services.push({ serviceName: serviceName, serviceID: serviceID })

            // sorting them for better look
            user.services.sort((a, b) => (a > b ? 1 : 0))

            await user.save()
        }

        return user
    }

    export async function removeServiceFromUser(serviceID: ObjectId, userID: ObjectId) {
        Users.findById(userID)
            .exec()
            .then((user) => {
                // TODO Create a delete function for if cant find the user anymore
                if (!user) return
                user.services = user.services.filter((service) => {
                    if (service.serviceID) {
                        // @ts-ignore
                        return !service.serviceID.equals(serviceID)
                    }
                    return true
                })
                user.save().catch((err) => console.error(err))
            })
    }

    export async function removeAllUserTraces(userID: ObjectId) {
        allServices.forEach((service) => {
            service
                .deleteServiceByUserID(userID)
                .exec()
                .catch((err) => console.error(err))
        })
    }
}
