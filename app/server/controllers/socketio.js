'use strict';

const fetch = require('node-fetch');

const Stock = require('../models/stock');

module.exports = io => {

  io.on('connection', function (socket) {
    socket.on('add ticker', function (data) {
      // first check to see if the stock is already in the db.

      // do some sanitization here:
      // strip $ to prevent query injection or..
      // just test the string against a regex:
      if(!/^[A-Za-z][A-Za-z\.:]{0,9}$/.test(data.ticker)) {
        socket.emit('error message', { display: true });
        console.log('validation failed');
        // return to break off if the test fails
        return;
      }
      else {
        Stock.findOne({ stockTicker: data.ticker }).exec() // rather than passing a cb to exec..
          .then(stock => {
            if (!stock) {
              // checking ticker validity by doing a fetch on the historical data
              let to = new Date();
              let from = new Date(to);
            
              from.setMonth(to.getMonth() - 12);

              let urlFromSegment = `&a=${from.getUTCMonth()}&b=${from.getUTCDate()}&c=${from.getUTCFullYear()}`;
              let urlToSegment = `&a=${to.getUTCMonth()}&b=${to.getUTCDate()}&c=${to.getUTCFullYear()}`;

              let historicalURL = `http://real-chart.finance.yahoo.com/table.csv?s=${data.ticker}${urlFromSegment}${urlToSegment}`;

              return fetch(historicalURL, { method: 'GET' })
                .then(res => {
            
                  if (res.status !== 404) {
                    let newStock = new Stock();
                    newStock.stockTicker = data.ticker;
                    socket.emit('error message', { display: false });
                    return newStock.save(err => {
                      if (err) {
                        throw err;
                      }
                    });
                  }
                  else {
                    socket.emit('error message', { display: true });
                  }
                }); 
            }
            else {
              socket.emit('stock already added', {});
            }
          })
          .then(() => {
            Stock.find({}, (err, stocks) => {
              // console.log('Stock(s) currently in the db are: ' + stocks);
            });
          })

          .then(() => io.emit('update processed', {})); // emit to all users including sender
      }
    });

    socket.on('remove ticker', function (data) {
      // check if ticker:
      if(!/^[A-Za-z][A-Za-z\.:]{0,9}$/.test(data.ticker)) {
        socket.emit('error message', { display: true });
        console.log('validation failed');
        // return to break off if the test fails
        return;
      }
      else {
        Stock.deleteOne({ stockTicker: data.ticker }, (err, result) => {
          if (err) throw err;
          if (!result.deletedCount) {
            socket.emit('error message', { display: true });
          }
          else socket.emit('error message', { display: false });
        });
        io.emit('update processed', {}); // emit to all users including sender
      }
    });

    socket.on('request tickers', function (data) {
      Stock.find({}, (err, stocks) => {
        if (err) throw err;
        if (!stocks) {
          console.error('no stocks found.');
        }
        else {
          let stockTickersArray = stocks.map(stock => stock.stockTicker);

          socket.emit('repaint', { stockTickers: stockTickersArray });
        }
      });
    });
  });
};
