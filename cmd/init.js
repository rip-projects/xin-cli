const fs = require('fs-promise');
const path = require('path');
const spawn = require('child_process').spawn;
const bowerBin = path.resolve(__dirname, '../node_modules/.bin/bower');
const Cmd = require('./').Cmd;

class InitCmd extends Cmd {
  constructor(args, opts) {
    super(args, opts);

    this.dir = args[0];
  }

  *run() {
    let dir = path.resolve(this.dir);

    if (!(yield fs.exists(dir))) {
      yield fs.mkdirp(this.dir);
    }

    let bowerJsonFile = path.join(this.dir, 'bower.json');

    if (!(yield fs.exists(bowerJsonFile))) {
      let json = {
        'name': path.basename(dir),
        'authors': [
          // "Ganesha <reekoheek@gmail.com>"
        ],
        'description': '',
        'main': '',
        'license': 'ISC',
        'homepage': '',
        'ignore': [
          '**/.*',
          'node_modules',
          'bower_components',
          'test',
          'tests',
        ],
        'dependencies': {
          'xin': 'xinix-technology/xin#ver-2.x',
        },
      };

      yield fs.writeFile(bowerJsonFile, JSON.stringify(json, null, 2));
    }

    var bower = spawn(bowerBin, ['install'], {cwd: dir, stdio: 'inherit'});

    yield new Promise((resolve, reject) => {
      bower.on('close', (code) => code ? reject(new Error(`Error command with code: ${code}`)) : resolve());
    });
  }
}

module.exports = InitCmd;
