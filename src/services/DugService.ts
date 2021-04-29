import Service, { ServiceType } from './Service'
import Dugs, { IDugDoc, IDug } from '../db/models/Dugs'
import { ObjectId } from 'mongoose'
import { IUserDoc } from '../db/models/Users'
import { User } from '../db/controllers/userController'
import { getAPIWithConfig, addNewTracksToPlaylist } from '../utils/SpotifyUtil'

class Dug extends Service {
    name = 'Dug'
    description = 'All of your saved tracks in one playlist'
    extendedDescription = `"Dug" is a way to quickly find a collection of all of your saved tracks. It automatically keeps updated in the background so you don't have to think about it. `
    type = ServiceType.redirect
    serviceRoute = 'dug'
    databaseCollection = 'dug'
    databaseModel = Dugs
    runSchedule = '*/5 * * * *'
    selectPlaylist = true
    extraConfig = false
    extraConfigPath = ''

    constructor() {
        super()
    }

    async getFromUserID(userID: ObjectId): Promise<IDugDoc | null> {
        return this.getFromUserIDTemplate(userID)
    }

    async findOrCreate(userID: ObjectId, playlistID: string): Promise<IDugDoc> {
        return this.findOrCreateTemplate<IDugDoc>(this.databaseModel, this.getFromUserID(userID), {
            userID: userID,
            playlistID: playlistID,
        })
    }

    async removeService(userID: ObjectId, serviceID: ObjectId) {
        return this.removeServiceTemplate(userID, serviceID)
    }

    async existingPlaylist(user: IUserDoc, playlistID: string) {
        // set the variables in mongoose for the dug
        let dug = await this.findOrCreate(user._id, playlistID)

        dug.playlistID = playlistID
        await dug.save()

        await User.addServiceToUser(this.name, dug._id, user._id)
    }

    async newPlaylist(user: IUserDoc, playlistName: string) {
        const spotifyAPI = getAPIWithConfig(user.accessToken)

        let data = await spotifyAPI.createPlaylist(playlistName, {
            description: 'Automatically generated playlist of all saved tracks.',
            public: false,
            collaborative: false,
        })

        // need to add to dig db
        let playlistID = data.body.id

        let dug = await this.findOrCreate(user._id, playlistID)
        dug.playlistID = playlistID
        await dug.save()
        // editing new user

        await User.addServiceToUser(this.name, dug._id, user._id)
    }

    async runServiceForUser(dug: IDugDoc, user: IUserDoc) {
        try {
            if (dug.running) return
            dug.running = true
            dug.save()
            const increment = 30
            let spotifyAPI = getAPIWithConfig(user.accessToken)

            let savedTracks = (await spotifyAPI.getMySavedTracks({ limit: increment })).body.items

            if (checkIfAdd()) {
                await addNewTracksToPlaylist(dug.playlistID, dug.lastRun, spotifyAPI, {
                    addIfEmpty: true,
                })
            }

            dug.running = false
            dug.lastRun = new Date()
            dug.save()

            function checkIfAdd(): boolean {
                return dug.lastRun < new Date(savedTracks[0].added_at)
            }
        } catch (err) {
            console.error(err)
        }
    }
}

export default Dug
