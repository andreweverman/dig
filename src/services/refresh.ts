// This code is what keeps the users access tokens fresh for use constantly
// This is used at the bottom of the server file

import { User } from '../db/controllers/userController'
import axios from 'axios'
import { IUserDoc } from '../db/models/Users'

const clientID = process.env.clientID!
const clientSecret = process.env.clientSecret
const clientAuth = `${clientID}:${clientSecret}`
const bufferStr: string = Buffer.from(clientAuth, 'utf-8').toString('base64')

// keeps all tokens fresh always so we don't need to worry about it anywhere else
function refresh_tokens() {
    User.getAllUsers().then((users) => {
        users.forEach((user) => {
            refresh(user)
        })
    })
}

function refresh(user: IUserDoc) {
    axios({
        url: 'https://accounts.spotify.com/api/token',
        method: 'post',
        headers: {
            Accept: 'application/json',
            Authorization: 'Basic ' + bufferStr,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        params: {
            grant_type: 'refresh_token',
            refresh_token: user.refreshToken,
        },
    })
        .then((response) => {
            if (response.status === 200) {
                user.accessToken = response.data.access_token
                user.save().catch((err) => console.error(err))
            }
        })
        .catch((err) => {
            console.error(err)
        })
}

export default refresh_tokens
