import dotenv from 'dotenv'
dotenv.config()

import express, { Request, Response } from 'express'
import session from 'express-session'
import passport_sp from './middlewares/passportSP'
import expressLayouts from 'express-ejs-layouts'
import mongoose from 'mongoose'
import schedule from 'node-schedule'
import path from 'path'
import bodyParser from 'body-parser'
import helmet, { contentSecurityPolicy } from 'helmet'
import refresh from './services/refresh'
import DigService from './services/DigService'
import DugService from './services/DugService'
import CatalogService from './services/CatalogService'

export enum Queues {
    dig = 'dig',
    dug = 'dug',
    catalog = 'catalog',
}


// < - - - - - - SERVER SETUP - - - - - - >

// connecting to the mongodb server
mongoose
    .connect(process.env.MONGO_URL!, {
        useNewUrlParser: true,
        useFindAndModify: true,
        useCreateIndex: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log('Connected to mongodb')
        setupSchedules()
    })
    .catch((err: any) => console.log('Error connecting to mongodb', err))

let passport = passport_sp.passport

let app = express()
app.use(bodyParser.urlencoded({ extended: false }))
app.use(helmet())
app.use(
    contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'", 'https://code.jquery.com', 'https://i.scdn.co/'],
            scriptSrc: ["'self'", 'https://code.jquery.com'],
            styleSrc: ["'self'", 'https://stackpath.bootstrapcdn.com'],
            imgSrc: ["'self'", 'https://i.scdn.co/'],
        },
    })
)

app.set('views', path.resolve('./views'))
app.set('view engine', 'ejs')
app.use(expressLayouts)

app.use(session({ secret: 'aunt jemima', resave: true, saveUninitialized: true }))
app.use(passport.initialize())
app.use(passport.session())
app.use('/public', express.static(path.resolve('./public')))

// < - - - - - - EDN SERVER SETUP - - - - - - >

// / - - - - - -  MY ROUTES - - - - - - - \
import basicRoute from './routes/basic'
app.use('/', basicRoute)

import dugRoutes from './routes/services/dugRoutes'
app.use('/services/dug', dugRoutes)
import digRoutes from './routes/services/digRoutes'
app.use('/services/dig', digRoutes)
import catalogRoutes from './routes/services/catalogRoutes'
import { consumeServiceQueueMessages } from './utils/Consumer'
app.use('/services/catalog', catalogRoutes)

// \ - - - - - -  EDN MY ROUTES - - - - - - /

if (process.env.RUN_WEB_SERVER) {
    app.listen(process.env.PORT, process.env.IP as any)
}

function setupSchedules() {
    // run refresh tokens every 30
    refresh()
    schedule.scheduleJob('*/20 * * * *', refresh)

    let digService = DigService.getInstance()
    digService.runService()
    digService.queueService()

    // let dugService = new DugService()
    // dugService.runService(serviceRunner(DugService))

    // let catalogService = new DugService()
    // catalogService.runService(serviceRunner(CatalogService))

    consumeServiceQueueMessages()
}

