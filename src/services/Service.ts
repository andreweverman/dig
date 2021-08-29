import { scheduleJob } from 'node-schedule'
import { Model, ObjectId, Document } from 'mongoose'
import { User } from '../db/controllers/userController'
import { IAlbumSaveTracksDoc } from '../db/models/AlbumSaveTrackss'
import { IDigDoc } from '../db/models/Digs'
import Users, { IUserDoc } from '../db/models/Users'
import { BatchLogger } from '../db/controllers/batchLoggerController'
export enum ServiceType {
    redirect = 'redirect',
    toggle = 'toggle',
}

abstract class Service {
    abstract name: string
    abstract description: string
    abstract extendedDescription: string
    abstract type: ServiceType
    abstract serviceRoute?: string
    abstract databaseCollection: string
    abstract databaseModel: Model<any, {}>
    abstract runSchedule: string | string[]
    abstract selectPlaylist: boolean
    abstract extraConfig: boolean
    abstract extraConfigPath: string

    runService(func: any): void {
        if (Array.isArray(this.runSchedule)) {
            this.runSchedule.forEach((scheddy) => {
                scheduleJob(scheddy, func)
            })
        } else {
            scheduleJob(this.runSchedule, func)
        }
    }

    abstract findOrCreate(userID: ObjectId, ...args: any[]): Promise<any>

    abstract getFromUserID(userID: ObjectId): Promise<any>

    abstract removeService(userID: ObjectId, serviceID: ObjectId): Promise<void>

    protected async getFromUserIDTemplate<T>(userID: ObjectId): Promise<T | null> {
        let doc = await this.databaseModel.findOne({ userID: userID }).exec()
        if (doc) return doc
        return null
    }
    protected findOrCreateTemplate<T>(model: Model<any, {}>, matcher: Promise<T>, createOptions: any) {
        return new Promise<T>((resolve, reject) => {
            matcher
                .then((x: any) => {
                    if (!x) {
                        model
                            .create(createOptions)
                            .then((user: T) => {
                                resolve(user)
                            })
                            .catch((err) => {
                                reject(err)
                            })
                    } else {
                        resolve(x)
                    }
                })
                .catch((err) => {
                    throw err
                })
        })
    }

    protected removeServiceTemplate(userID: ObjectId, serviceID: ObjectId) {
        this.deleteServiceByUserID(userID)
            .exec()
            .then(() => {
                User.removeServiceFromUser(serviceID, userID).catch((err) => console.error(err))
            })
            .catch((err) => {
                console.log(err)
            })
    }

    async addServiceToUser(userID: ObjectId, serviceID: ObjectId) {
        User.addServiceToUser(this.name, serviceID, userID)
    }

    deleteServiceByUserID(userID: ObjectId) {
        return this.databaseModel.deleteOne({ userID: userID })
    }

    protected async matchUserToService(service: any) {
        let user = await Users.findById(service.userID).exec()
        if (user == null) {
            User.removeAllUserTraces(service.userID)
            throw 'User is no more'
        }
        return user
    }

    private async getAllDocs() {
        return this.databaseModel.find().exec()
    }

    abstract runServiceForUser(serviceDoc: any, userID: IUserDoc)

    async service() {
        let service = await this.getAllDocs()
        service.forEach((service) => {
            this.matchUserToService(service)
                .then((user) => {
                    BatchLogger.createLog(this.name)
                    this.runServiceForUser(service, user)
                })
                .catch((err) => {
                    console.error(err)
                })
            // goes to the catch if the user gets deleted. going to log elsewhere so nothing needs to be done there
        })
    }

    protected delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }
}

export function serviceRunner(serviceClass: any) {
    return () => {
        let service = new serviceClass()
        service.service()
    }
}

export default Service
