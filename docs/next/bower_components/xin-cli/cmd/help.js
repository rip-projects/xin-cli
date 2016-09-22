const Cmd = require('./').Cmd;

class HelpCmd extends Cmd {
  *run() {
    console.log(`
Usage:
  xin <command>

Commands:
  init       Initialize new library or application
  serve      Serve your project to read documentation
  help       You see it now`
    );
  }
}

module.exports = HelpCmd;
