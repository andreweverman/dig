import { Request, Router, Response } from 'express'
import { User } from '../../db/controllers/userController'
import { IUserDoc } from '../../db/models/Users'
import CatalogService from '../../services/CatalogService'
import { ensureAuthenticated } from '../../middlewares/passportSP'
import validationMiddleware from '../../middlewares/validationMiddleware'
import { ExistingPlaylistDto, NewPlaylistDto } from '../../dtos/playlist.dto'
import spotifyWebApi from 'spotify-web-api-node'
import { spotifyConfig } from '../../config/config'
import { getDiscoverWeeklyID, getUserOwnedPlaylists } from '../../utils/SpotifyUtil'

const router = Router()
const catalogService = new CatalogService()

router.get('/enable', ensureAuthenticated, (req, res) => {
    try {
        let spotifyApi = new spotifyWebApi(spotifyConfig)
        let user = req.user as IUserDoc
        spotifyApi.setAccessToken(user.accessToken)

        getUserOwnedPlaylists(spotifyApi, user).then((editablePlaylists) => {
            res.render('services/catalog/enable_catalog.ejs', {
                user: req.user,
                playlists: editablePlaylists,
                service: catalogService,
            })
        })
    } catch (error) {
        console.error(error)
        res.redirect(500, '/')
    }
})

// handles the enabling of dig. only good input can get to this point
router.put(
    '/enable/existing_playlist',
    [ensureAuthenticated, validationMiddleware(ExistingPlaylistDto, 'body')],
    async (req: Request, res: Response) => {
        try {
            let spotifyAPI = new spotifyWebApi(spotifyConfig)
            let user = req.user as IUserDoc
            let playlistID = req.body.playlistID

            spotifyAPI.setAccessToken(user.accessToken)

            // set the variables in mongoose for the dig
            let discoverWeeklyPlaylistID = await getDiscoverWeeklyID(spotifyAPI, user.userID)

            let catalog = await catalogService.findOrCreate(user._id, discoverWeeklyPlaylistID, playlistID)
            if (catalog.catalogPlaylistID != playlistID) {
                catalog.catalogPlaylistID = playlistID
                catalog.discoverWeeklyPlaylistID = discoverWeeklyPlaylistID
                await catalog.save()
            }

            // editing new user
            await catalogService.addServiceToUser(user._id)

            res.redirect(200, '/')
        } catch (error) {
            console.error(error)
            res.redirect(500, '/')
        }
    }
)

// handles the enabling of dig. only good input can get to this point
router.put(
    '/enable/new_playlist',
    [ensureAuthenticated, validationMiddleware(NewPlaylistDto, 'body')],
    async (req, res) => {
        // user is creating a playlist
        try {
            let user = req.user as IUserDoc
            let catalogPlaylistName = req.body.newPlaylistName

            let spotifyAPI = new spotifyWebApi(spotifyConfig)
            spotifyAPI.setAccessToken(user.accessToken)

            let data = await spotifyAPI.createPlaylist(catalogPlaylistName, {
                description: 'Automatically generated recently saved tracks.',
                public: false,
                collaborative: false,
            })

            // need to add to dig db
            let discoverWeeklyPlaylistID = await getDiscoverWeeklyID(spotifyAPI, user._id)
            let catalogPlaylistID = data.body.id

            let catalog = await catalogService.findOrCreate(user._id, discoverWeeklyPlaylistID, catalogPlaylistID)
            if (catalog.catalogPlaylistID != catalogPlaylistID) {
                catalog.catalogPlaylistID = catalogPlaylistID
                catalog.discoverWeeklyPlaylistID = discoverWeeklyPlaylistID
                await catalog.save()
            }
            await catalogService.addServiceToUser(user._id)

            res.redirect(200, '/')
        } catch (error) {
            console.error(error)
            res.redirect(500, '/')
        }
    }
)

router.delete('/disable', ensureAuthenticated, (req, res) => {
    try {
        let user = req.user as IUserDoc
        // delete from digs
        catalogService
            .removeService(user._id)
            .then(() => res.redirect(200, '/'))
            .catch((err) => {
                console.error(err)
                res.writeHead(500, '/')
            })
    } catch (error) {
        console.error(error)
        res.redirect(500, '/')
    }
})

export default router
