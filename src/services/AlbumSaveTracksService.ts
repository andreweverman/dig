import Service, { ServiceType } from './Service'
import AlbumSaveTrackss, { IAlbumSaveTracksDoc } from '../db/models/AlbumSaveTrackss'
import { ObjectId } from 'mongoose'

class AlbumSaveTracks extends Service {
    name = 'Album Save Tracks'
    description = 'With this enabled, saving an album will save all tracks within it'
    type = ServiceType.toggle
    serviceRoute = 'album_save_tracks'
    databaseCollection = 'AlbumSaveTracks'
    databaseModel = AlbumSaveTrackss
    runSchedule = '4,9,14,19,24,29,34,39,44,49,54,59 * * * *'
    selectPlaylistOnly=false
    constructor() {
        super()
    }

    service() {
        console.log(`RAN ${new Date()}`)
    }

    async getFromUserID<IAlbumSaveTracksDoc>(userID: ObjectId): Promise<IAlbumSaveTracksDoc> {
        return this.getFromUserIDTemplate(userID)
    }

    async findOrCreate(userID: ObjectId): Promise<IAlbumSaveTracksDoc> {
        return this.findOrCreateTemplate<IAlbumSaveTracksDoc>(this.databaseModel, this.getFromUserID(userID), {
            userID: userID,
        })
    }

    async removeService(userID: ObjectId) {
        return this.removeServiceTemplate(this.databaseModel, userID, this.name)
    }
}

export default AlbumSaveTracks
