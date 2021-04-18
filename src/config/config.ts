export const scope = [
    'user-read-email',
    'user-read-private',
    'playlist-read-private',
    'playlist-modify-public',
    'playlist-modify-private',
    'user-library-read',
    'user-library-modify',
]


export const spotifyConfig = {
    clientID: process.env.clientID!,
    clientSecret: process.env.clientSecret!,
    callbackURL: process.env.callbackURL!,
    scope: scope,
}
