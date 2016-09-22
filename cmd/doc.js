const Cmd = require('./').Cmd;
const fetchMetadata = require('./').fetchMetadata;
const fs = require('fs-promise');
const path = require('path');

const WWW_DIR = path.join(__dirname, '../www');

class DocCmd extends Cmd {
  constructor(args, opts) {
    super(args, opts);

    this.input = path.resolve(this.args[0] || '.');
    this.output = path.resolve(this.opts.o || '_docs');
    this.force = Boolean(this.opts.f);
  }

  *run() {
    if (yield fs.exists(this.output)) {
      if (!this.force) {
        throw new Error(`Output directory already exists`);
      }

      // yield fs.remove(this.output);
    } else {
      yield fs.mkdirp(this.output);
    }

    let metadata = yield fetchMetadata(this.input);

    yield fs.copy(WWW_DIR, this.output, {clobber: true});
    yield fs.copy(path.join(this.input, 'bower_components'), path.join(this.output, 'bower_components'), {clobber: true});
    yield fs.copy(path.join(this.input), path.join(this.output, 'bower_components', metadata.name), {
      clobber: true,
      filter: function(file) {
        if (file.indexOf('/bower_components') >= 0 || file.indexOf('/node_modules') >= 0) {
          return false;
        }

        return true;
      },
    });

    yield fs.writeFile(path.join(this.output, 'metadata.json'), JSON.stringify(metadata, null, 2));
  }
}

module.exports = DocCmd;
