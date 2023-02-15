import { Request, Router, Response } from 'express'
import { IUserDoc } from '../../db/models/Users'
import CatalogService from '../../services/CatalogService'
import { ensureAuthenticated } from '../../middlewares/passportSP'
import validationMiddleware from '../../middlewares/validationMiddleware'
import { PlaylistDto } from '../../dtos/playlist.dto'
import spotifyWebApi from 'spotify-web-api-node'
import { spotifyConfig } from '../../config/config'
import { getUserOwnedPlaylists } from '../../utils/SpotifyUtil'

const router = Router()
const catalogService = CatalogService.getInstance()

router.get('/enable', ensureAuthenticated, (req, res) => {
    try {
        let spotifyApi = new spotifyWebApi(spotifyConfig)
        let user = req.user as IUserDoc
        spotifyApi.setAccessToken(user.accessToken)

        getUserOwnedPlaylists(spotifyApi, user).then((editablePlaylists) => {
            res.render('partials/serviceEnable.ejs', {
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
router.post(
    '/enable',
    [ensureAuthenticated, validationMiddleware(PlaylistDto,'body')],
    async (req: Request, res: Response) => {
        try {
            let user = req.user as IUserDoc
            // set the variables in mongoose for the dug

            if (req.body.playlistRadio == 'existingPlaylist') {
                await catalogService.existingPlaylist(user, req.body.playlistID)
            } else if (req.body.playlistRadio == 'newPlaylist') {
                await catalogService.newPlaylist(user, req.body.newPlaylistName)
            }

            res.redirect('/')
        } catch (error) {
            console.error(error)
            res.redirect(500, '/')
        }
    }
)

router.delete('/disable', ensureAuthenticated, async (req, res) => {
    try {
        let user = req.user as IUserDoc
        let catalog = await catalogService.getFromUserID(user._id)
        // delete from digs
        catalogService
            .removeService(user._id, catalog._id)
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
