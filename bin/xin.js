#!/usr/bin/env node
'use strict';

const argv = require('minimist')(process.argv.slice(2));
const cmd = require('../cmd');

var command;
try {
  command = cmd(argv);
} catch (e) {
  if (!e.message.startsWith('Cannot find module ')) {
    console.error(e.stack);
    return;
  }
  command = cmd({_: ['help']});
}

command.run()
  .then(function() {
    console.log('');
  }, function(err) {
    console.error(err);
  });
