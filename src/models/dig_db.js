const path = require("path");
const config = require(path.resolve("./config/config.json"));
const mongoose = require('mongoose');
const findorcreate = require('mongoose-findorcreate');

const models;


module.exports = function (mongoose) {

  if (!models) {

    const User = new mongoose.Schema({
      user_id: { type: String, index: true, unique: true },
      display_name: String,
      username: String,
      photo: String,
      profile: Object,
      access_token: String,
      refresh_token: String,
      services: [{ type: String }]
    });
    User.plugin(findorcreate);



    const Dig = new mongoose.Schema({
      user_id: { type: String, index: true, unique: true },
      dig_id: String,
      last_run: Date,
      sort: {
        enabled: { type: Boolean, default: true }
      },
      max_length: { type: Number, default: 20 },

    });
    Dig.plugin(findorcreate);

    const Dug = new mongoose.Schema({
      user_id: { type: String, index: true, unique: true },
      dug_id: String,
      last_run: Date

    });
    Dug.plugin(findorcreate);

    const Catalog = new mongoose.Schema({
      user_id: { type: String, index: true, unique: true },
      catalog_id: String,
      dw_id: String,
      initial_run: Boolean

    });
    Catalog.plugin(findorcreate);

    const AlbumSaveTracks = new mongoose.Schema({
      user_id: { type: String, index: true, unique: true },
      enabled: Boolean, last_run: Date


    });
    AlbumSaveTracks.plugin(findorcreate);


    // exporting
    models = {
      User: mongoose.model('User', User),
      Dig: mongoose.model('Dig', Dig),
      Dug: mongoose.model('Dug', Dug),
      Catalog: mongoose.model('Catalog', Catalog),
      AlbumSaveTracks: mongoose.model('AlbumSaveTracks', AlbumSaveTracks)
    }
  }



  return models;
}
