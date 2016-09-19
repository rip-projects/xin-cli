'use strict';

module.exports = {
  run() {
    console.log('Usage:');
    console.log('  xin <command>');
    console.log('');
    console.log('Commands:');
    console.log('  init       Initialize new library or application');
    console.log('  serve      Serve your project to read documentation');
    console.log('  help       You see it now');
    return Promise.resolve();
  },
};
