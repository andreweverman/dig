import { Router, Request, Response } from 'express'
import { User } from '../../db/controllers/userController'
import { IUserDoc } from '../../db/models/Users'
import DugService from '../../services/DugService'
import { ensureAuthenticated } from '../../middlewares/passportSP'
import spotifyWebApi from 'spotify-web-api-node'
import { spotifyConfig } from '../../config/config'
import { getUserOwnedPlaylists } from '../../utils/SpotifyUtil'
import validationMiddleware from '../../middlewares/validationMiddleware'
import { PlaylistDto } from '../../dtos/playlist.dto'

const router = Router()
const dugService = new DugService()

router.get('/enable', ensureAuthenticated, async (req, res) => {
    let spotifyAPI = new spotifyWebApi(spotifyConfig)
    let user = req.user as IUserDoc
    spotifyAPI.setAccessToken(user.accessToken)

    getUserOwnedPlaylists(spotifyAPI, user).then((editablePlaylists) => {
        res.render('partials/serviceEnable.ejs', {
            user: req.user,
            playlists: editablePlaylists,
            service: dugService,
        })
    })
})

router.post(
    '/enable',
    [ensureAuthenticated, validationMiddleware(PlaylistDto, 'body')],
    async (req: Request, res: Response) => {
        try {
            let user = req.user as IUserDoc
            // set the variables in mongoose for the dug
            if (req.body.playlistRadio == 'existingPlaylist') {
                await dugService.existingPlaylist(user, req.body.playlistID)
            } else if (req.body.playlistRadio == 'newPlaylist') {
                await dugService.newPlaylist(user, req.body.newPlaylistName)
            }

            // editing new user
            res.redirect('/')
        } catch (error) {
            console.error(error)
            res.redirect(500, '/')
        }
    }
)
router.delete('/disable', ensureAuthenticated, async (req, res) => {
    let user = req.user as IUserDoc
    let dug = await dugService.getFromUserID(user._id)
    // delete from digs and user
    dugService
        .removeService(user._id, dug._id)
        .then(() => res.redirect(200, '/'))
        .catch((err) => {
            console.error(err)
            res.redirect(500, '/')
        })
})

export default router
