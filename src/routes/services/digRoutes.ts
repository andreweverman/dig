import { Router, Request, Response } from 'express'
import { User } from '../../db/controllers/userController'
import { IUserDoc } from '../../db/models/Users'
import DigService from '../../services/DigService'
import { ensureAuthenticated } from '../../middlewares/passportSP'
import validationMiddleware from '../../middlewares/validationMiddleware'
import { ExistingPlaylistDto, NewPlaylistDto } from '../../dtos/playlist.dto'
import { DigConfig } from '../../dtos/digConfig.dto'
import spotifyWebApi from 'spotify-web-api-node'
import { spotifyConfig } from '../../config/config'
import { getUserOwnedPlaylists } from '../../utils/SpotifyUtil'

const router = Router()
const digService = new DigService()

router.get('/enable', ensureAuthenticated, async (req, res) => {
    let spotifyAPI = new spotifyWebApi(spotifyConfig)
    let user = req.user as IUserDoc
    spotifyAPI.setAccessToken(user.accessToken)

    getUserOwnedPlaylists(spotifyAPI, user).then((editablePlaylists) => {
        res.render('services/dig/enable.ejs', {
            user: user,
            playlists: editablePlaylists,
            service: digService,
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
            let dig = await digService.findOrCreate(user._id, playlistID)
            if (dig.playlistID != playlistID) {
                dig.playlistID = playlistID
                await dig.save()
            }
            // editing new user

            await User.addServiceToUser(digService.name, user._id)

            res.send({goTo:'/services/dig/config'})
            // saving user changes
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
                description: 'Automatically generated recently saved tracks.',
                public: false,
                collaborative: false,
            })

            // need to add to dig db
            let playlistID = data.body.id

            let dig = await digService.findOrCreate(user._id, playlistID)
            if (dig.playlistID != playlistID) {
                dig.playlistID = playlistID
                await dig.save()
            }
            await digService.addServiceToUser(user._id)

            res.redirect(303, '/services/dig/config')
        } catch (error) {
            console.error(error)
            res.redirect(500, '/')
        }
    }
)

router.get('/config', ensureAuthenticated, async (req, res) => {
    let spotifyAPI = new spotifyWebApi(spotifyConfig)
    let user = req.user as IUserDoc
    spotifyAPI.setAccessToken(user.accessToken)

    let dig = await digService.getFromUserID(user._id)
    res.render('services/dig/config.ejs', {
        user: user,
        service: digService,
        dig: dig,
    })
})

router.put(
    '/config',
    [ensureAuthenticated, validationMiddleware(DigConfig, 'body')],
    async (req: Request, res: Response) => {
        try {
            let user = req.user as IUserDoc
            // set the variables in mongoose for the dug
            let dig = await digService.getFromUserID(user._id)
            if (!dig) {
                throw 'Dig not found'
            }
            // editing new user
            dig.daysToKeep = req.body.daysToKeep
            dig.minSongs = req.body.minSongs
            dig.albumSort = req.body.albumSort

            await dig.save()

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
    digService
        .removeService(user._id)
        .then(() => res.redirect(200, '/'))
        .catch((err) => {
            console.error(err)
            res.redirect(500, '/')
        })
})

export default router
