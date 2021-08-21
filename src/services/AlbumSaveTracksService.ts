import Service, { ServiceType } from './Service'
import AlbumSaveTrackss, { IAlbumSaveTracksDoc } from '../db/models/AlbumSaveTrackss'
import { ObjectId } from 'mongoose'
import { IUserDoc } from '../db/models/Users'
import { checkIfSavedFully, getAPIWithConfig, saveTracksFully, delay } from '../utils/SpotifyUtil'
import { BatchLogger } from '../db/controllers/batchLoggerController'

class AlbumSaveTracks extends Service {
    name = 'Album Save Tracks'
    description = 'With this enabled, saving an album will save all tracks within it'
    extendedDescription = this.description
    type = ServiceType.toggle
    serviceRoute = 'album_save_tracks'
    databaseCollection = 'AlbumSaveTracks'
    databaseModel = AlbumSaveTrackss
    runSchedule = '4,9,14,19,24,29,34,39,44,49,54,59 * * * *'
    selectPlaylist = false
    extraConfig = false
    extraConfigPath = ''

    constructor() {
        super()
    }

    async getFromUserID<IAlbumSaveTracksDoc>(userID: ObjectId): Promise<IAlbumSaveTracksDoc | null> {
        return this.getFromUserIDTemplate(userID)
    }

    async findOrCreate(userID: ObjectId): Promise<IAlbumSaveTracksDoc> {
        return this.findOrCreateTemplate<IAlbumSaveTracksDoc>(this.databaseModel, this.getFromUserID(userID), {
            userID: userID,
        })
    }

    async removeService(userID: ObjectId, serviceID: ObjectId) {
        return this.removeServiceTemplate(userID, serviceID)
    }

    async runServiceForUser(albumDoc: IAlbumSaveTracksDoc, user: IUserDoc) {
        const spotifyAPI = getAPIWithConfig(user.accessToken)
        let offset = 0
        const limit = 50
        let albumTracks: any[] = []
        try {
            do {
                let recentAlbums = (await spotifyAPI.getMySavedAlbums({ limit: limit, offset: offset })).body.items
                let allNew = true
                if (recentAlbums.length <= 0) {
                    break
                }
                for (let i = 0; i < recentAlbums.length; i++) {
                    let a = recentAlbums[i]
                    let addedAt = new Date(a.added_at)
                    if (addedAt > albumDoc.lastRun) {
                        albumTracks = albumTracks.concat(a.album.tracks.items)
                    } else {
                        allNew = false
                        break
                    }
                }
                if (!allNew) {
                    break
                }
                await delay(3000)
                offset += limit
            } while (true)

            let unsavedTracks = await checkIfSavedFully(albumTracks, spotifyAPI)
            if (unsavedTracks.length > 0) await saveTracksFully(unsavedTracks, spotifyAPI)
        } catch (err) {
            console.error(err)
        }
    }
}

export default AlbumSaveTracks
