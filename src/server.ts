import * as express from 'express';
import * as session from 'express-session';
import * as passport_sp from './passport_sp';
import * as expressLayouts from 'express-ejs-layouts';
import * as mongoose from 'mongoose';
import * as schedule from 'node-schedule';
import * as bodyParser from 'body-parser';
import * as helmet from 'helmet';
import * as https from 'https';

import * as config from '../config/config.json';


if (!process.env.MONGO_URL) {
    console.log('Need to setup MONGO_URL in .env');
    process.exit(1)
}

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useFindAndModify: true, useCreateIndex: true, useUnifiedTopology: true }).then(x => console.log("Connected to mongodb")).catch(err => console.log("Error connecting to mongodb", err));

