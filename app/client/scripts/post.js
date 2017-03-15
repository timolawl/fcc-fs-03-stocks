'use strict';

// socket io -- the cdnjs script is in the HTML template above this script file
var socket = io();

window.onload = function () {

  // add stock
  document.querySelector('.submit-btn').addEventListener('click', e => {
    e.preventDefault();
    if (document.querySelector('.stock-ticker').value) { 
      // may want to sanitize this before passing it along
      socket.emit('add ticker', { ticker: document.querySelector('.stock-ticker').value }); 
    }
  });
  
  // remove stock
  document.querySelector('.delete-btn').addEventListener('click', e => {
    e.preventDefault();
    if (document.querySelector('.delete-stock-ticker').value) {
      socket.emit('remove ticker', { ticker: document.querySelector('.delete-stock-ticker').value});
    }
  });

  // load current stocks  

  // load new stocks
  socket.on('load stock', function (data) {
    // check to see if the stock is already listed
  });

};
