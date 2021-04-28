import { Router, Request, Response } from 'express'
import { User } from '../../db/controllers/userController'
import { IUserDoc } from '../../db/models/Users'
import DigService from '../../services/DigService'
import { ensureAuthenticated } from '../../middlewares/passportSP'
import spotifyWebApi from 'spotify-web-api-node'
import { spotifyConfig } from '../../config/config'
import { getUserOwnedPlaylists } from '../../utils/SpotifyUtil'
import { IDig } from '../../db/models/Digs'

const router = Router()
const digService = new DigService()

router.get('/enable', ensureAuthenticated, async (req, res) => {
    let spotifyAPI = new spotifyWebApi(spotifyConfig)
    let user = req.user as IUserDoc
    spotifyAPI.setAccessToken(user.accessToken)
    let editablePlaylists = await getUserOwnedPlaylists(spotifyAPI, user)

    let dig = await digService.getFromUserID(user._id)

    let params: any = {
        user: user,
        playlists: editablePlaylists,
        service: digService,
        dig: dig,
    }

    res.render('partials/serviceEnable.ejs', params)
})

router.post('/enable', ensureAuthenticated, async (req: Request, res: Response) => {
    try {
        let user = req.user as IUserDoc
        // set the variables in mongoose for the dug
        let params = {
            minSongs: req.body.minSongs,
            albumSort: req.body.albumSort == 'on',
            daysToKeep: req.body.daysToKeep,
        } as IDig
        if (req.body.inlineRadioOptions == 'existingPlaylist') {
            params.playlistID = req.body.playlistID
            await digService.existingPlaylist(user, params)
        } else if (req.body.inlineRadioOptions == 'newPlaylist') {
            await digService.newPlaylist(user, req.body.newPlaylistName, params)
        }

        // editing new user
        res.redirect('/')
    } catch (error) {
        console.error(error)
        res.redirect(500, '/')
    }
})

router.delete('/disable', ensureAuthenticated, async (req, res) => {
    let user = req.user as IUserDoc
    let dig = await digService.getFromUserID(user._id)
    // delete from digs and user
    digService
        .removeService(user._id, dig._id)
        .then(() => res.redirect(200, '/'))
        .catch((err) => {
            console.error(err)
            res.redirect(500, '/')
        })
})

export default router
