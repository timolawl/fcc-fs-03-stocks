'use strict';

const Stock = require('../models/stock');
const socket = require('./socketio');

module.exports = function controller () { // can't use arrow notation here because the this is execution context this and not lexical this
  this.loadStocks = (req, res) => {

    // Pull current stocks from db and load them:
    Stock.find({}, (err, stocks) => {
      if (err) throw err;
      if (!stocks) {
        console.log('no stocks');
      }
      else {
        if (stocks.length > 0) {
          console.log(stocks);
        }
        else console.log('no stocks right now.');
      }
    });

    res.render('index');
  };
};


