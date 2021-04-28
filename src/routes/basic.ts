import express from 'express'
const router = express.Router()
import passportSP from '../middlewares/passportSP'
const ensureAuthenticated = passportSP.ensureAuthenticated
import { IUserDoc } from '../db/models/Users'
import DigService from '../services/DigService'
import DugService from '../services/DugService'
import CatalogService from '../services/CatalogService'
import AlbumSaveTracksService from '../services/AlbumSaveTracksService'
import _ from 'lodash'
const passport = passportSP.passport

let dig = new DigService()
let dug = new DugService()
let catalog = new CatalogService()
let albumSaveTracks = new AlbumSaveTracksService()

let allServices = [dig, dug, catalog, albumSaveTracks]

router.get('/', function (req, res) {
    let user = req.user as IUserDoc | undefined
    
    if (!user) {
        let serviceDescriptions = allServices.map((s) => `${s.name}: ${s.description}`)
        res.render('basic/index.ejs', { user: req.user, serviceDescriptions: serviceDescriptions })
    } else {

        let [enabledServices,disabledServices]  = _.partition(allServices, (s) => user.services.some((us) => us.serviceName==s.name))
        // let disabledServices = allServices.filter((service) => !user!.services.some((s) => s.serviceName == service.name))
        // let enabledServices = allServices.filter((service) => user!.services.some((s) => s.serviceName == service.name))

        res.render('basic/index.ejs', {
            user: req.user,
            enabledServices: enabledServices,
            disabledServices: disabledServices,
        })
    }
})

router.get('/login', function (req, res) {
    res.render('basic/login.ejs', { user: req.user })
})

router.get('/account', ensureAuthenticated, function (req, res) {
    res.render('basic/account.ejs', { user: req.user })
})

router.get('/logout', function (req, res) {
    req.logout()
    res.redirect('/')
})

// GET /auth/spotify
//   Use passport.authenticate() as route middleware to authenticate the
//   request. The first step in spotify authentication will involve redirecting
//   the user to spotify.com. After authorization, spotify will redirect the user
//   back to this application at /auth/spotify/callback
router.get('/auth/spotify', passportSP.authMiddleware, () => {})

// GET /auth/spotify/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request. If authentication fails, the user will be redirected back to the
//   login page. Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
router.get('/callback', passport.authenticate('spotify', { failureRedirect: '/login' }), function (req, res) {
    res.redirect('/')
})

export default router
