import Service, { ServiceType } from './Service'
import Dugs, {IDugDoc} from '../db/models/Dugs'
import {ObjectId} from 'mongoose'

class Dug extends Service {
    name = 'Dug'
    description = 'All of your saved tracks in one playlist'
    type = ServiceType.redirect
    serviceRoute = 'dug'
    databaseCollection = 'dug'
    databaseModel = Dugs
    runSchedule = '*/5 * * * *'
    selectPlaylistOnly=true

    constructor() {
        super()
    }

    service() {
        console.log(`RAN ${new Date()}`)
    }

    async getFromUserID<IDugDoc>(userID: ObjectId): Promise<IDugDoc> {
        return this.getFromUserIDTemplate(userID)
    }

    async findOrCreate(userID: ObjectId, playlistID:string): Promise<IDugDoc> {
        return this.findOrCreateTemplate<IDugDoc>(this.databaseModel, this.getFromUserID(userID), {
            userID: userID,
            playlistID:playlistID
        })
    }

    async removeService(userID: ObjectId) {
        return this.removeServiceTemplate(this.databaseModel, userID, this.name)
    }
}

export default Dug

