import { scheduleJob } from 'node-schedule'
import { Model, ObjectId } from 'mongoose'
import { User } from '../db/controllers/userController'
import Users from '../db/models/Users'
import { publishToQueue } from '../utils/QueueUtil'
import { Queues, ServiceMessage } from '../utils/enums'
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
    abstract queueName: Queues
    abstract runSchedule: string | string[]
    abstract selectPlaylist: boolean
    abstract extraConfig: boolean
    abstract extraConfigPath: string


    abstract runService(): void

    runServiceClass(singletonClass: any): void {
        if (Array.isArray(this.runSchedule)) {
            this.runSchedule.forEach((scheddy) => {

                scheduleJob(scheddy, serviceRunner(singletonClass))
            })
        } else {
            scheduleJob(this.runSchedule, serviceRunner(singletonClass))
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

    protected async findService<T>(serviceId: string) {
        let doc = await this.databaseModel.findOne({ _id: serviceId }).exec()
        if (doc) return doc
        return null
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

    protected async getAllDocs() {
        return this.databaseModel.find({}, { _id: 1 }).exec()
    }

    abstract service(serviceMessage: ServiceMessage)

    async queueService() {
        const docs = await this.getAllDocs()

        docs.forEach((doc) => {
            publishToQueue(this.queueName, doc._id)
        })

    }

    protected delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }
}

function serviceRunner(serviceClass: any) {
    return () => {
        let service = new serviceClass()
        service.queueService()
    }
}

export default Service
