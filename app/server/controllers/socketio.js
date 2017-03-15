'use strict';

const fetch = require('node-fetch');

const Stock = require('../models/stock');

module.exports = io => {

  // acting as route and controller here.
  // the structured formatting would help for sure..
  

  io.on('connection', function (socket) {
    socket.on('add ticker', function (data) {
      // first check to see if the stock is already in the db.
      console.log(data.ticker);

      Stock.findOne({ stockTicker: data.ticker }, (err, stock) => {
        if (err) throw err;
        if (!stock) {
          console.log('no stock was found with the given stock ticker.');
          let newStock = new Stock();
          newStock.stockTicker = data.ticker;
          newStock.save(err => {
            if (err) throw err;
            console.log(newStock.stockTicker + ' has been added to the db!');
          });
          // trigger visual update adding the new stock
          // resend all the stock tickers to have their data retrieved all over again?
        }
        else {
          console.log('stock already in the db');
        }
      });


      let historicalURL = 'http://real-chart.finance.yahoo.com/table.csv?s=GE&a=02&b=14&c=2016&d=02&e=14&f=2017&g=d&ignore=.csv';
      //let companyNameURL = 'http://finance.yahoo.com/d/quotes.csv?s=MSFT&f=n';
      /*
      let companyNameURL = 'http://autoc.finance.yahoo.com/autoc?query=mcd&region=1&lang=en';

      fetch(companyNameURL, { method: 'GET' })
        .then(res => res.json())
        .then(json => {
          console.log(json.ResultSet.Result[0].name);
        });
      */

      fetch(historicalURL, { method: 'GET' })
        .then(res => res.text())
        .then(csv => {
          let rows = csv.split(/\r\n|\n/);
       //   console.log(rows);
        })
    });

    socket.on('remove ticker', function (data) {
      console.log('removing ticker...');
      Stock.deleteOne({ stockTicker: data.ticker }, (err, result) => {
        console.log(result);
      });
      
    });
  });
};
