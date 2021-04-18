import spotifyWebAPI from 'spotify-web-api-node'
import { Response, Request } from 'express'
import { IUserDoc } from '../db/models/Users'

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
