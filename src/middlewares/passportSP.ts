// Sets up a the passport object that we will use in the server.
// This is just to help clean up some of the mess from the server.js file
// Also use for exporting the ensureAuthenticated function for the other routes

import { Request, Response } from 'express'
import passport from 'passport'
import { Strategy as SpotifyStrategy, StrategyOptions } from 'passport-spotify'
import { User } from '../db/controllers/userController'
import { spotifyConfig } from '../config/config'



passport.serializeUser(function (user: any, done: Function) {
    done(null, user)
})

passport.deserializeUser(function (user: any, done: Function) {
    // so that it updates the user every time we change page !
    User.getUserFromID(user.userID).then((user) => {
        done(null, user)
    })
})

passport.use(
    new SpotifyStrategy(spotifyConfig, function (accessToken, refreshToken, profile, done) {
        // asynchronous verification, for effect...
        process.nextTick(function () {
            // To keep the example simple, the user's spotify profile is returned to
            // represent the logged-in user. In a typical application, you would want
            // to associate the spotify account with a user record in your database,
            // and return that user instead.

            // gets the user based off id.
            User.findOrCreate(profile.id)
                .then((user) => {
                    user.displayName = profile.displayName
                    user.username = profile.username
                    // typescript does not read this correctly as of 4/12/2021. need to ignore to get it
                    //@ts-ignore
                    if (profile.photos && profile.photos.length > 0) user.photo = profile.photos[0].value
                    user.accessToken = accessToken
                    user.refreshToken = refreshToken

                    // saving user changes
                    user.save()
                        .then((newUser) => {
                            return done(undefined, newUser)
                        })
                        .catch((error) => {
                            console.error(error)
                        })
                })
                .catch((err) => {
                    console.error(err)
                    return done(err, undefined)
                })
        })
    })
)

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed. Otherwise, the user will be redirected to the
//   login page.
export function ensureAuthenticated(req: Request, res: Response, next: Function) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/login')
}

export const middleware = passport.authenticate('spotify', {
    scope: spotifyConfig.scope,
})

export default {
    ensureAuthenticated: ensureAuthenticated,
    passport: passport,
    authMiddleware: middleware,
}
