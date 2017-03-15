'use strict';

const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  stockTicker: { type: String, required: true }
});

stockSchema.statics.findOrCreate = function (profile, cb) {
  var newUser = new this();

  this.findOne({ $or: [{ twitterID: profile.id }, { facebookID: profile.id }] }, function (err, result) {
    if (err) throw err;
    if (!result) {
      newUser.provider = profile.provider;

      if (profile.provider === 'facebook') {
        newUser.facebookID = profile.id;
        newUser.facebookDisplayName = profile.displayName;
      }

      if (profile.provider === 'twitter') {
        newUser.twitterID = profile.id; // do I need to save token and token secret?
        newUser.twitterDisplayName = profile.displayName;
      }
      
      newUser.save(cb); // interesting statement
    }
    else cb(err, result);
  });
};

module.exports = mongoose.model('Stock', stockSchema);
