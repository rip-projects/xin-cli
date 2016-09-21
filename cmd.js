'use strict';

const path = require('path');

function cmd(argv) {
  return new Command(argv);
}

class Command {
  constructor(argv) {
    this.name = argv._[0] || 'help';
    this._ = argv._.splice(1);
    this.argv = argv;

    var commandFile = path.join(__dirname, 'cmd', this.name);
    var plugin = require(commandFile);
    for (var i in plugin) {
      this[i] = plugin[i];
    }
  }
}

module.exports = cmd;
module.exports.Command = Command;
