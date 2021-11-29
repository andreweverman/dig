import spotifyWebAPI from 'spotify-web-api-node'
import { Response, Request } from 'express'
import { IUserDoc } from '../db/models/Users'
import { spotifyConfig } from '../config/config'
import moment from 'moment'
import SpotifyWebApi from 'spotify-web-api-node'

export function getAPIWithConfig(accessToken?: string) {
    const api = new SpotifyWebApi()
    // let api = new spotifyWebAPI(spotifyConfig)
    if (accessToken) api.setAccessToken(accessToken)
    return api
}

export async function checkIfSavedFully(tracks: any[], spotifyAPI: spotifyWebAPI) {
    let max = 50
    let notSaved = []
    for (let i = 0; i < tracks.length; i += max) {
        let slice = tracks.slice(i, i + max)
        let contains = await spotifyAPI.containsMySavedTracks(slice.map((t) => t.id))
        for (let j = 0; j < slice.length; j++) {
            if (!contains.body[j]) {
                notSaved.push(slice[j])
            }
        }
        delay(3000)
    }
    return notSaved
}

export async function saveTracksFully(tracks: any[], spotifyAPI: spotifyWebAPI) {
    const max = 50
    for (let i = 0; i < tracks.length; i += max) {
        let slice = tracks.slice(i, max)
        await spotifyAPI.addToMySavedTracks(slice.map((x) => x.id))
        await delay(3000)
    }
}

export async function removeTracksFromPlaylistFully(playlistID: string, tracks: any[], spotifyAPI: spotifyWebAPI) {
    const max = 100
    for (let i = 0; i < tracks.length; i += max) {
        let slice = tracks.slice(i, max).map((x) => {
            return { uri: x.uri }
        })
        await spotifyAPI.removeTracksFromPlaylist(playlistID, slice)
        await delay(3000)
    }
}

export async function getDiscoverWeeklyID(spotifyAPI: spotifyWebAPI, userID: string) {
    let playlists = (await spotifyAPI.getUserPlaylists(userID)).body.items

    let editable_playlists = playlists.filter(
        (playlist) => playlist.owner.id == 'spotify' && playlist.name == 'Discover Weekly'
    )
    if (editable_playlists.length > 0) {
        return editable_playlists[0].id
    }
    throw 'Not found'
}

export async function getUserOwnedPlaylists(spotifyAPI: spotifyWebAPI, user: IUserDoc) {
    const data = await spotifyAPI.getUserPlaylists(user.userID)
    let playlists = data.body.items
    let editablePlaylists = playlists.filter((playlist) => playlist.owner.id == user.userID)
    return editablePlaylists
}

export interface addSongsOptions {
    addIfEmpty?: boolean
    daysToKeep?: number
}
export async function addNewTracksToPlaylist(
    playlistID: string,
    lastRun: Date,
    spotifyAPI: spotifyWebAPI,
    options: addSongsOptions
) {
    try {
        let breakOut = false
        let increment = 30
        let offset = 0
        let limit = increment
        let allNewSongs = []
        let savedTracks = (await spotifyAPI.getMySavedTracks({ limit: increment })).body.items
        let playlistTracks = (await spotifyAPI.getPlaylistTracks(playlistID)).body.items

        do {
            let newSongs = savedTracks.filter((track) => {
                let addedAt = new Date(track.added_at)

                let checkAddIfEmpty = options.addIfEmpty ? options.addIfEmpty && playlistTracks.length == 0 : false
                let checkStale = true
                if (options.daysToKeep) {
                    let days = Math.abs(moment().diff(moment(addedAt), 'days'))
                    checkStale = days < options.daysToKeep
                }
                return (addedAt > lastRun || checkAddIfEmpty) && checkStale
            })

            spotifyAPI
                .addTracksToPlaylist(
                    playlistID,
                    newSongs.map((x) => x.track.uri),
                    { position: offset }
                )
                .catch((err) => {
                    if (err.statusCode == 404) {
                        breakOut = true
                    }
                })
            allNewSongs = allNewSongs.concat(newSongs)
            if (newSongs.length == increment) {
                await delay(3000)
                try {
                    savedTracks = (await spotifyAPI.getMySavedTracks({ offset: offset, limit: increment })).body.items
                } catch (err) {
                    console.error(err)
                }
                offset = limit
                limit += increment
            } else {
                break
            }
            if (breakOut) {
                break
            }
        } while (true)
    } catch (err) {
        console.error(err)
    }
}

export function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}
