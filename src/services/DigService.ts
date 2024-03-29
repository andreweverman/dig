import Service, { ServiceType } from './Service'
import Digs, { IDig, IDigDoc } from '../db/models/Digs'
import { IUserDoc } from '../db/models/Users'
import { User } from '../db/controllers/userController'
import { ObjectId } from 'mongoose'
import {
    getAPIWithConfig,
    addNewTracksToPlaylist,
    removeTracksFromPlaylistFully,
    checkIfSavedFully,
} from '../utils/SpotifyUtil'
import moment from 'moment'
import { Logger } from '../db/controllers/loggerController'
import { delay } from 'lodash'

class Dig extends Service {
    name = 'Dig'
    description = 'A constantly updated playlist of your most recently saved tracks'
    extendedDescription = `"Dig" takes the recently most saved tracks and making a small playlist of just those tracks. It automatically keeps updated in the background so you don't have to think about it.`
    type = ServiceType.redirect
    serviceRoute = 'dig'
    databaseCollection = 'dig'
    databaseModel = Digs
    runSchedule = '*/5 * * * *'
    selectPlaylist = true
    extraConfig = true
    extraConfigPath = '../services/dig/config.ejs'

    constructor() {
        super()
    }

    async getFromUserID(userID: ObjectId): Promise<IDigDoc | null> {
        return this.getFromUserIDTemplate(userID)
    }

    async findOrCreate(userID: ObjectId, playlistID: string): Promise<IDigDoc> {
        return this.findOrCreateTemplate<IDigDoc>(this.databaseModel, this.getFromUserID(userID), {
            userID: userID,
            playlistID: playlistID,
        })
    }

    async removeService(userID: ObjectId, serviceID: ObjectId) {
        return this.removeServiceTemplate(userID, serviceID)
    }

    async existingPlaylist(user: IUserDoc, digParams: IDig) {
        // set the variables in mongoose for the dug
        let dig = await this.findOrCreate(user._id, digParams.playlistID)

        for (const property in digParams) {
            dig[property] = digParams[property]
        }
        await dig.save()
        // editing new user

        await User.addServiceToUser(this.name, dig._id, user._id)
    }

    async newPlaylist(user: IUserDoc, playlistName: string, digParams: IDig) {
        const spotifyAPI = getAPIWithConfig(user.accessToken)

        let data = await spotifyAPI.createPlaylist(playlistName, {
            description: 'Automatically generated recently saved tracks.',
            public: false,
            collaborative: false,
        })

        // need to add to dig db
        let playlistID = data.body.id
        digParams.playlistID = playlistID
        let dig = await this.findOrCreate(user._id, playlistID)

        for (const property in digParams) {
            dig[property] = digParams[property]
        }
        await dig.save()
        // editing new user

        await User.addServiceToUser(this.name, dig._id, user._id)
    }

    async runServiceForUser(dig: IDigDoc, user: IUserDoc) {
        const delayz = this.delay
        try {
            const increment = 30
            let spotifyAPI = getAPIWithConfig(user.accessToken)

            let savedTracks = (await spotifyAPI.getMySavedTracks({ limit: increment })).body.items
            let digTracks = await getFullDig()

            Logger.createLog(dig.userID, this.name, 'About to check if I should add tracks to dig...', {})
            if (checkIfAdd()) {
                let ranSuccessfully = await addNewTracksToPlaylist(dig.playlistID, dig.lastRun, spotifyAPI, {
                    addIfEmpty: true,
                    daysToKeep: dig.daysToKeep,
                })
                if (!ranSuccessfully){
                    return
                }
            }
            await trimTracks()
            // await removeUnsavedTracks()
            if (dig.albumSort) albumSort()

            dig.lastRun = moment.utc().toDate()
            dig.save()

            async function removeUnsavedTracks() {
                digTracks = await getFullDig()
                if (digTracks.length > 0) {
                    let removeTracks = await checkIfSavedFully(
                        digTracks.map((x) => x.track),
                        spotifyAPI
                    )
                    if (removeTracks.length > 0)
                        await removeTracksFromPlaylistFully(dig.playlistID, removeTracks, spotifyAPI)
                }
            }

            async function getFullDig() {
                let offset = 0
                let limit = increment
                let currentDig = []
                do {
                    let digTracks = (
                        await spotifyAPI.getPlaylistTracks(dig.playlistID, { limit: limit, offset: offset })
                    ).body.items
                    currentDig = currentDig.concat(digTracks)
                    offset = limit
                    limit += increment
                } while (currentDig.length == offset)
                return currentDig
            }

            function checkIfAdd(): boolean {
                return moment(dig.lastRun) < moment(savedTracks[0].added_at) || digTracks.length == 0
            }

            async function trimTracks() {
                digTracks = await getFullDig()
                let staleURIs = tracksPastDate()
                if (staleURIs.length > 0 && digTracks.length > dig.minSongs) {
                    let removeURIs = staleURIs.slice(0, digTracks.length - dig.minSongs)
                    removeTracksFromPlaylistFully(dig.playlistID, removeURIs, spotifyAPI)
                }
            }

            function tracksPastDate() {
                let staleURIs = []
                digTracks.forEach((track, i) => (track.order = i))
                digTracks.sort((a, b) => (a.added_at > b.added_at ? 1 : a.order > b.order ? -1 : 1))
                digTracks.forEach((track) => {
                    if (Math.abs(moment().diff(moment(track.added_at), 'days')) > dig.daysToKeep) {
                        staleURIs.push(track.track)
                    }
                })

                return staleURIs
            }

            async function albumSort() {
                digTracks = await getFullDig()

                let idealOrder = []
                let trackAlbums = new Set()
                digTracks.forEach((track, idx) => {
                    let albumURI = track.track.album.uri
                    if (!trackAlbums.has(albumURI)) {
                        let albumTracks = []
                        albumTracks.push(track)
                        for (let i = idx + 1; i < digTracks.length; i++) {
                            let checkTrack = digTracks[i]
                            if (checkTrack.track.album.uri == albumURI) {
                                albumTracks.push(checkTrack)
                            }
                        }
                        const newOrder = albumTracks.sort((a, b) => (a.track.track_number < b.track.track_number ? -1 : 1))
                        idealOrder = idealOrder.concat(newOrder)
                        trackAlbums.add(albumURI)
                    }
                })


                for (let idx = 0; idx < idealOrder.length; idx++) {
                    let track = idealOrder[idx]
                    let index = digTracks.indexOf(track)
                    if (index != idx && index > -1) {
                        await spotifyAPI.reorderTracksInPlaylist(dig.playlistID, index, idx, {
                            range_length: 1,
                        })
                        await delayz(1000)
                    
                        digTracks.splice(index, 1)
                        digTracks.splice(idx, 0, track)
                    }
                }
            }
        } catch (err) {
            Logger.createLog(dig.userID, this.name, err.toString(),err)
            console.error(err)
            dig.running = false
            dig.lastRun = moment.utc().toDate()
            dig.save()
        }
    }
}

export default Dig
