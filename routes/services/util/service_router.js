var path = require('path');
var express = require('express');
var router = express.Router();



router.use('/dig', require('../dig'));
router.use('/dug', require('../dug'));

module.exports = router;