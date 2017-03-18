'use strict';

const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  stockTicker: { type: String,
                 required: [true, 'Stock ticker required'],
                 validate: {
                   validator: function (v) {
                     return /^[A-Za-z\.\- ]{1,7}$/.test(v);
                   },
                   message: '{VALUE} is not a valid stock ticker!'
                 } 
               }
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
