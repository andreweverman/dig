import Service, { ServiceType } from './Service'
import Catalogs, { ICatalog, ICatalogDoc } from '../db/models/Catalogs'
import { ObjectId } from 'mongoose'
import Users, { IUserDoc } from '../db/models/Users'
import { User } from '../db/controllers/userController'
import { getAPIWithConfig, getDiscoverWeeklyID } from '../utils/SpotifyUtil'

class Catalog extends Service {
    name = 'Catalog'
    description = 'Stores all Discover Weekly songs into one running playlist'
    extendedDescription = `"Catalog" is an archive of all of your Discover Weekly playlists. It automatically keeps updated in the background so you don't have to think about it. `
    type = ServiceType.redirect
    serviceRoute = 'catalog'
    databaseCollection = 'catalog'
    databaseModel = Catalogs
    runSchedule = ['0 12 * * *']
    selectPlaylist = true
    extraConfig = false
    extraConfigPath = ''

    constructor() {
        super()
    }

    async getFromUserID(userID: ObjectId): Promise<ICatalogDoc | null> {
        return this.getFromUserIDTemplate(userID)
    }

    async findOrCreate(userID: ObjectId, dwID: string, catID: string): Promise<ICatalogDoc> {
        return this.findOrCreateTemplate<ICatalogDoc>(this.databaseModel, this.getFromUserID(userID), {
            userID: userID,
            discoverWeeklyPlaylistID: dwID,
            catalogPlaylistID: catID,
        })
    }

    async removeService(userID: ObjectId, serviceID: ObjectId) {
        return this.removeServiceTemplate(userID, serviceID)
    }

    async existingPlaylist(user: IUserDoc, playlistID: string) {
        let spotifyAPI = getAPIWithConfig(user.accessToken)

        // set the variables in mongoose for the dig
        let discoverWeeklyPlaylistID = await getDiscoverWeeklyID(spotifyAPI, user.userID)

        let catalog = await this.findOrCreate(user._id, discoverWeeklyPlaylistID, playlistID)
        if (catalog.catalogPlaylistID != playlistID) {
            catalog.catalogPlaylistID = playlistID
            catalog.discoverWeeklyPlaylistID = discoverWeeklyPlaylistID
            await catalog.save()
        }

        // editing new user
        await this.addServiceToUser(user._id, catalog._id)
        // set the variables in mongoose for the dug
    }

    async newPlaylist(user: IUserDoc, catalogPlaylistName: string) {
        let spotifyAPI = getAPIWithConfig()
        spotifyAPI.setAccessToken(user.accessToken)

        let data = await spotifyAPI.createPlaylist(catalogPlaylistName, {
            description: 'Automatically generated recently saved tracks.',
            public: false,
            collaborative: false,
        })

        // need to add to dig db
        let discoverWeeklyPlaylistID = await getDiscoverWeeklyID(spotifyAPI, user._id)
        let catalogPlaylistID = data.body.id

        let catalog = await this.findOrCreate(user._id, discoverWeeklyPlaylistID, catalogPlaylistID)
        if (catalog.catalogPlaylistID != catalogPlaylistID) {
            catalog.catalogPlaylistID = catalogPlaylistID
            catalog.discoverWeeklyPlaylistID = discoverWeeklyPlaylistID
            await catalog.save()
        }
        await this.addServiceToUser(user._id, catalog._id)
    }

    async runServiceForUser(catalog: ICatalogDoc, user: IUserDoc) {
        let spotifyAPI = getAPIWithConfig()
        spotifyAPI.setAccessToken(user.accessToken)

        let dwPlaylist = await spotifyAPI.getPlaylistTracks(catalog.discoverWeeklyPlaylistID)
        let maxDateTrack = dwPlaylist.body.items.reduce((min, x) => (x.added_at > min.added_at ? x : min))
        let maxDateInPlaylist = new Date(maxDateTrack.added_at)
        if (maxDateInPlaylist > catalog.lastAddedDate) {
            // need to add the songs
            let tracks = dwPlaylist.body.items.map((x) => x.track.uri)
            spotifyAPI.addTracksToPlaylist(catalog.catalogPlaylistID, tracks).then(() => {
                catalog.lastAddedDate = maxDateInPlaylist
                catalog.save()
            })
        }
    }
}

export default Catalog
