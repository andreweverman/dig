var path = require('path');
var express = require('express');
var router = express.Router();



router.use('/dig', require('../dig'));
router.use('/dug', require('../dug'));
router.use('/catalog', require('../catalog'));
router.use('/album_save_tracks', require('../album_save_tracks'));

module.exports = router;