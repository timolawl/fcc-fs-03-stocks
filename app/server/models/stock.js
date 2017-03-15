'use strict';

const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  stockTicker: { type: String, required: true }
});

stockSchema.statics.findOrCreate = function (stock, cb) {
  var newStock = new this();

  this.findOne({ stockTicker: stock }, function (err, result) {
    if (err) throw err;
    if (!stock) {
      newStock.stockTicker = stock;     
      newStock.save(cb); // interesting statement
    }
    else cb(err, result);
  });
};

module.exports = mongoose.model('Stock', stockSchema);
