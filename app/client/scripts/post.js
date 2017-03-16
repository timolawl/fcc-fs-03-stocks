'use strict';

// socket io -- the cdnjs script is in the HTML template above this script file
var socket = io();

// https://www.npmjs.com/package/cors-anywhere
jQuery.ajaxPrefilter(function(options) {
    if (options.crossDomain && jQuery.support.cors) {
        options.url = 'https://cors-anywhere.herokuapp.com/' + options.url;
    }
});

window.onload = function () {

  socket.emit('request tickers', {});

  // add stock
  document.querySelector('.submit-btn').addEventListener('click', e => {
    e.preventDefault();
    if (document.querySelector('.stock-ticker').value) { 
      // may want to sanitize this before passing it along
      socket.emit('add ticker', { ticker: document.querySelector('.stock-ticker').value.toUpperCase() }); 
    }
  });
  
  // remove stock
  document.querySelector('.delete-btn').addEventListener('click', e => {
    e.preventDefault();
    if (document.querySelector('.delete-stock-ticker').value) {
      socket.emit('remove ticker', { ticker: document.querySelector('.delete-stock-ticker').value.toUpperCase() });
    }
  });

  // load current stocks and have it painted in highstocks/highchart
  // have this triggered on first load to load the first painting of highcharts
  // and for subsequent paintings, just retrigger this socket event with updated data
  socket.on('repaint', function (data) {
    // given the stock ticker data
    console.log('Logging data: ' + data.stockTickers);

    // following the highcharts example:
    let seriesOptions = [],
        seriesCounter = 0,
        names = data.stockTickers;

    let to = new Date();
    let from = new Date(to);
  
    from.setMonth(to.getMonth() - 12);

    let urlFromSegment = `&a=${from.getUTCMonth()}&b=${from.getUTCDate()}&c=${from.getUTCFullYear()}`;
    let urlToSegment = `&a=${to.getUTCMonth()}&b=${to.getUTCDate()}&c=${to.getUTCFullYear()}`;

    let historicalURLs = names.map(stockTicker =>
      `http://real-chart.finance.yahoo.com/table.csv?s=${stockTicker}${urlFromSegment}${urlToSegment}`);

    let nameURLs = names.map(stockTicker => 
      `http://finance.yahoo.com/d/quotes.csv?s=${stockTicker}&f=n`);

    console.log(historicalURLs);
    console.log(nameURLs);

    //retrieveData(historicalURLs, nameURLs);
    
    names.forEach((name, index) => {
      // retrieve data first 
      $.get(historicalURLs[index], function (data) {
        let relevantData = data.split(/\r\n|\n/).sort().map(row => {
          let items = row.split(',');
          return [Date.parse(items[0]), parseFloat((+items[4]).toFixed(2))]; // date and stock closing value
        });

        
        let days = relevantData.filter((row, index) {
          return row && index !== 0;
        });

        seriesOptions[index] = {
          name: name,
          data: days
        };

        // console.log(relevantData);

        seriesCounter += 1;

        if (seriesCounter === names.length) {
            createChart(seriesOptions);
        }
      });
    });

    
   
  });


  // load new stocks
  socket.on('load stock', function (data) {
    // check to see if the stock is already listed
  });

};

// http://www.highcharts.com/stock/demo/compare
function createChart (seriesOptions) {
  Highcharts.stockChart(document.querySelector('.chart'), {
    rangeSelector: {
      selected: 4
    },
    yAxis: {
      labels: {
        formatter: function () {
          return (this.value > 0 ? ' + ' : '') + this.value + '%';
        }
      },
      plotLines: [{
        value: 0,
        width: 2,
        color: 'silver'
      }]
    },

    plotOptions: {
      series: {
        compare: 'percent',
        showInNavigator: true
      }
    },

    tooltip: {
      pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.change}%)<br/>',
      valueDecimals: 2,
      split: true
    },
    series: seriesOptions
  });
}
