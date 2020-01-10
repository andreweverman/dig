var express = require('express'),
  session = require('express-session'),
  passport_sp = require('./passport_sp'),
  expressLayouts = require('express-ejs-layouts'),
  mongoose = require('mongoose'),
  schedule = require('node-schedule'),
  path = require("path"),
  bodyParser = require('body-parser'),
  helmet = require('helmet');
 


// < - - - - - - SERVER SETUP - - - - - - >
const config = require(path.resolve("./config") + '/config.json');

// connecting to the mongodb server
mongoose.connect(config.MONGO_URL, { useNewUrlParser: true, useFindAndModify: true, useCreateIndex: true, useUnifiedTopology: true }).then(console.log("Connected to mongodb")).catch(err => console.log("Error connecting to mongodb", err));


var passport = passport_sp.passport;

var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(helmet());

app.set('views', path.resolve("./views"));
app.set('view engine', 'ejs');
app.use(expressLayouts);

app.use(session({ secret: 'aunt jemima', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use('/public', express.static(path.resolve("./public")));

// < - - - - - - EDN SERVER SETUP - - - - - - >


// / - - - - - -  MY ROUTES - - - - - - - \

app.use('/', require(path.resolve("./routes/basic")));

app.use('/', require(path.resolve('./routes/login')));

app.use('/enable_dig', require(path.resolve('./routes/services/dig/enable_dig.js')));

app.use('/enable_dug', require(path.resolve('./routes/services/dug/enable_dug.js')));

app.use('/disable_dig', require(path.resolve('./routes/services/dig/disable_dig.js')));

app.use('/disable_dug', require(path.resolve('./routes/services/dug/disable_dug.js')));


// \ - - - - - -  EDN MY ROUTES - - - - - - /




// ! - - - - - - SERVICES SCHEDULES - - - - - - !
var dig = require("./services/dig"),
  dug = require('./services/dug')
refresh = require('./refresh');

// run refresh tokens every 30
refresh();
var refresh_schedule = schedule.scheduleJob('*/20 * * * *', refresh);


// run dig every 5 minutes
dig();
var dig_schedule = schedule.scheduleJob('*/5 * * * *', dig);

// run dug every 5 minutes
dug();
var dug_schedule = schedule.scheduleJob('*/5 * * * *', dug);



// ! - - - - - - EDN SERVICES SCHEDULES - - - - - - !


app.listen(8080);