import Service, { ServiceType } from './Service'
import Digs, { IDigDoc } from '../db/models/Digs'
import { ObjectId } from 'mongoose'

class Dig extends Service {
    name = 'Dig'
    description = 'A constantly updated playlist of your most recently saved tracks'
    type = ServiceType.redirect
    serviceRoute = 'dig'
    databaseCollection = 'dig'
    databaseModel = Digs
    runSchedule = '*/5 * * * *'
    selectPlaylistOnly=false

    constructor() {
        super()
    }

    service() {
        console.log(`RAN ${new Date()}`)
    }

    async getFromUserID(userID: ObjectId): Promise<IDigDoc> {
        return this.getFromUserIDTemplate(userID)
    }

    async findOrCreate(userID: ObjectId, playlistID: string): Promise<IDigDoc> {
        return this.findOrCreateTemplate<IDigDoc>(this.databaseModel, this.getFromUserID(userID), {
            userID: userID,
            playlistID: playlistID
        })
    }

    async removeService(userID: ObjectId) {
        return this.removeServiceTemplate(this.databaseModel, userID, this.name)
    }
}

export default Dig
