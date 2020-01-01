var express = require('express'),
  session = require('express-session'),
  passport_sp = require('./passport_sp'),
  expressLayouts = require('express-ejs-layouts'),
  mongoose = require('mongoose'),  
  schedule = require('node-schedule'),
  path = require("path");

var dig = require("./services/dig");
var refresh = require('./refresh');

const config = require(path.resolve("./config") + '/config.json');

// connecting to the mongodb server
mongoose.connect(config.MONGO_URL, {useNewUrlParser: true, useFindAndModify: true, useCreateIndex: true, useUnifiedTopology: true});


var passport = passport_sp.passport;

var app = express();
// configure Express
app.set('views', path.resolve("./views"));
app.set('view engine', 'ejs');
app.use(expressLayouts);

app.use(session({ secret: 'aunt jemima', resave: true, saveUninitialized: true }));
// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());
// app.use(express.static(__dirname + '/public'));
app.use('/public', express.static(path.resolve("./public")));

app.use('/', require(path.resolve("./routes/basic")));

app.use('/', require(path.resolve('./routes/login')));

app.use('/enable_dig', require(path.resolve('./routes/services/enable_dig.js')));


app.listen(8080);

// schedule the services down here
// run dig every 5 minutes
refresh();
var refresh_schedule = schedule.scheduleJob('*/30 * * * *', refresh);


// run dig every 5 minutes
dig();
var dig_schedule = schedule.scheduleJob('*/5 * * * *', dig);