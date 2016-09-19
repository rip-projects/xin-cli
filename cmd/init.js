'use strict';

const fs = require('fs-promise');
const path = require('path');
const spawn = require('child_process').spawn;
const bowerBin = path.resolve(__dirname, '../node_modules/.bin/bower');

module.exports = {
  run() {
    var dir = this._[0] || '.';

    return fs.exists(dir)
      .then(function(exist) {
        if (!exist) {
          return fs.mkdirp(dir);
        }
      })
      .then(function() {
        return fs.exists(path.join(dir, 'bower.json')).then(function(exists) {
          if (exists) return;

          var absolutePath = path.resolve(dir);
          var json = {
            'name': path.basename(absolutePath),
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

          return fs.writeFile(path.join(dir, 'bower.json'), JSON.stringify(json, null, 2));
        });
      })
      .then(function() {
        return new Promise(function(resolve, reject) {
          var bower = spawn(bowerBin, ['install'], {cwd: dir, stdio: 'inherit'});
          bower.on('close', function(code) {
            if (code) {
              return reject(new Error('Error command with code:' + code));
            }
            resolve();
          });
        });
      })
      .then(function() {
        console.log('end');
      })
      ;
    // fs.exists()
  },
};
