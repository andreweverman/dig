import { Router } from 'express'
// import { AlbumSaveTracks } from '../../db/controllers/controller'
import { IUserDoc } from '../../db/models/Users'
import Service from '../../services/AlbumSaveTracksService'
import { ensureAuthenticated } from '../../middlewares/passportSP'

const albumSaveTracksService = new Service()

const router = Router()

// handles the enabling of dcatalogug. only good input can get to this point
router.put('/toggle', ensureAuthenticated, function (req, res) {
    // user is creating a playlist
    let user = req.user as IUserDoc
    albumSaveTracksService.findOrCreate(user._id).then((albumSaveTracksDoc) => {
        let newStatus = !albumSaveTracksDoc.enabled
        albumSaveTracksDoc.enabled = newStatus
        albumSaveTracksDoc
            .save()
            .then(() => {
                if (!newStatus)
                    user.services = user.services.filter((s) => s.serviceName != albumSaveTracksService.name)
                else user.services.push({ serviceName: albumSaveTracksService.name, serviceID: albumSaveTracksDoc._id })

                user.save()
                    .then(() => res.redirect(200, '/'))
                    .catch((err) => {
                        console.error(err)
                    })
            })
            .catch((err) => {
                console.error(err)
            })
    })
})

export default router
