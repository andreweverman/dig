import { scheduleJob } from 'node-schedule'
import { Model, ObjectId, Document } from 'mongoose'
import { User } from '../db/controllers/userController'
import { IAlbumSaveTracksDoc } from '../db/models/AlbumSaveTrackss'
import { IDigDoc } from '../db/models/Digs'
export enum ServiceType {
    redirect = 'redirect',
    toggle = 'toggle',
}

abstract class Service {
    abstract name: string
    abstract description: string
    abstract type: ServiceType
    abstract serviceRoute?: string
    abstract databaseCollection: string
    abstract databaseModel: Model<any, {}>
    abstract runSchedule: string | string[]
    abstract selectPlaylistOnly: boolean
    runService(): void {
        if (Array.isArray(this.runSchedule)) {
            this.runSchedule.forEach((scheddy) => {
                scheduleJob(scheddy, this.service)
            })
        } else {
            scheduleJob(this.runSchedule, this.service)
        }
    }

    abstract service(): void

    abstract findOrCreate(userID: ObjectId, ...args: any[]): Promise<any>

    abstract getFromUserID(userID: ObjectId): Promise<any>

    abstract removeService(userID: ObjectId): Promise<void>

    protected async getFromUserIDTemplate<T>(userID: ObjectId): Promise<T> {
        let doc = await this.databaseModel.findOne({ userID: userID }).exec()
        if (doc) return doc
        throw 'Not found'
    }
    protected findOrCreateTemplate<T>(model: Model<any, {}>, matcher: Promise<T>, createOptions: any) {
        return new Promise<T>((resolve, reject) => {
            matcher
                .then((x: any) => {
                    resolve(x)
                })
                .catch(() => {
                    model
                        .create(createOptions)
                        .then((user: T) => {
                            resolve(user)
                        })
                        .catch((err) => {
                            reject(err)
                        })
                })
        })
    }

    protected removeServiceTemplate<T>(model: Model<any, {}>, userID: ObjectId, serviceName: string) {
        model
            .deleteOne({ userID: userID })
            .exec()
            .then(() => {
                User.removeServiceFromUser(serviceName, userID).catch((err) => console.error(err))
            })
            .catch((err) => {
                console.log(err)
            })
    }

    async addServiceToUser(userID: ObjectId) {
        User.addServiceToUser(this.name, userID)
    }
}

export default Service
