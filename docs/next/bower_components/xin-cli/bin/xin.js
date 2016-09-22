#!/usr/bin/env node
/* eslint strict: ["error", "global"] */
'use strict';

const argv = require('minimist')(process.argv.slice(2));
const cmd = require('../cmd');
const Promise = require('bluebird');

Promise.coroutine(function *() {
  try {
    yield cmd(argv).start();
    console.log('');
  } catch (err) {
    console.error(`E: ${err.message}`);
    if (process.env.XIN_CLI_DEBUG) {
      console.error(`
Trace:
${err.stack}`);
    }
  }
})();
