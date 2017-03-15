'use strict';

// socket io -- the cdnjs script is in the HTML template above this script file
var socket = io();

window.onload = function () {

  document.querySelector('button').addEventListener('click', e => {
    socket.emit('add ticker');
  });
};
