import { Router, Request, Response } from 'express'
import { User } from '../../db/controllers/userController'
import { IUserDoc } from '../../db/models/Users'
import DugService from '../../services/DugService'
import { ensureAuthenticated } from '../../middlewares/passportSP'
import validationMiddleware from '../../middlewares/validationMiddleware'
import { ExistingPlaylistDto, NewPlaylistDto } from '../../dtos/playlist.dto'
import spotifyWebApi from 'spotify-web-api-node'
import { spotifyConfig } from '../../config/config'
import { getUserOwnedPlaylists } from '../../utils/SpotifyUtil'

const router = Router()
const dugService = new DugService()

router.get('/enable', ensureAuthenticated, async (req, res) => {
    let spotifyAPI = new spotifyWebApi(spotifyConfig)
    let user = req.user as IUserDoc
    spotifyAPI.setAccessToken(user.accessToken)

    getUserOwnedPlaylists(spotifyAPI, user).then((editablePlaylists) => {
        res.render('services/dug/enable_dug.ejs', {
            user: req.user,
            playlists: editablePlaylists,
            service: dugService,
        })
    })
})

// handles the enabling of dug. only good input can get to this point
router.put(
    '/enable/existing_playlist',
    [ensureAuthenticated, validationMiddleware(ExistingPlaylistDto, 'body')],
    async (req: Request, res: Response) => {
        try {
            let user = req.user as IUserDoc
            let playlistID = req.body.playlistID
            // set the variables in mongoose for the dug
            let dug = await dugService.findOrCreate(user._id, playlistID)
            if (dug.playlistID != playlistID) {
                dug.playlistID = playlistID
                await dug.save()
            }
            // editing new user
            await User.addServiceToUser(dugService.name, user._id)
            // saving user changes
            res.redirect(200, '/')
        } catch (error) {
            console.error(error)
            res.redirect(500, '/')
        }
    }
)

// handles the enabling of dug. only good input can get to this point
router.put(
    '/enable/new_playlist',
    [ensureAuthenticated, validationMiddleware(NewPlaylistDto, 'body')],
    async (req: Request, res: Response) => {
        // user is creating a playlist
        try {
            let user = req.user as IUserDoc
            let playlistName = req.body.newPlaylistName

            let spotifyAPI = new spotifyWebApi(spotifyConfig)
            spotifyAPI.setAccessToken(user.accessToken)

            let data = await spotifyAPI.createPlaylist(playlistName, {
                description: 'Automatically updated liked tracks.',
                public: false,
                collaborative: false,
            })

            // need to add to dig db
            let playlistID = data.body.id

            let dug = await dugService.findOrCreate(user._id, playlistID)
            if (dug.playlistID != playlistID) {
                dug.playlistID = playlistID
                await dug.save()
            }
            await dugService.addServiceToUser(user._id)

            res.redirect(200, '/')
        } catch (error) {
            console.error(error)
            res.redirect(500, '/')
        }
    }
)

router.delete('/disable', ensureAuthenticated, (req, res) => {
    let user = req.user as IUserDoc
    // delete from digs and user
    dugService
        .removeService(user._id)
        .then(() => res.redirect(200, '/'))
        .catch((err) => {
            console.error(err)
            res.redirect(500, '/')
        })
})

export default router
