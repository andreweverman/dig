import Service, { ServiceType } from './Service'
import Catalogs, { ICatalog, ICatalogDoc } from '../db/models/Catalogs'
import { ObjectId } from 'mongoose'

class Catalog extends Service {
    name = 'Catalog'
    description = 'Stores all Discover Weekly songs into one running playlist'
    type = ServiceType.redirect
    serviceRoute = 'catalog'
    databaseCollection = 'catalog'
    databaseModel = Catalogs
    runSchedule = ['00 13 * * 0', '00 13 * * 1']
    selectPlaylistOnly=true

    constructor() {
        super()
    }

    service() {
        console.log(`RAN ${new Date()}`)
    }
    async getFromUserID(userID: ObjectId): Promise<ICatalogDoc> {
        return this.getFromUserIDTemplate(userID)
    }

    async findOrCreate(userID: ObjectId, dwID: string, catID: string): Promise<ICatalogDoc> {
        return this.findOrCreateTemplate<ICatalogDoc>(this.databaseModel, this.getFromUserID(userID), {
            userID: userID,
            discoverWeeklyPlaylistID: dwID,
            catalogPlaylistID: catID,
        })
    }

    async removeService(userID: ObjectId) {
        return this.removeServiceTemplate(this.databaseModel, userID, this.name)
    }
}

export default Catalog
