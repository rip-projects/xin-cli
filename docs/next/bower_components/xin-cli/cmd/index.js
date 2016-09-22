const Promise = require('bluebird');
const path = require('path');
const fs = require('fs-promise');

let metadata;

class Cmd {
  constructor(args = [], opts = {}) {
    this.args = args;
    this.opts = opts;
  }

  start() {
    return Promise.coroutine(this.run.bind(this))();
  }

  *run() {
    throw new Error(`Unimplemented run for ${this.constructor.name}`);
  }
}

function getCmdClassByName(name) {
  try {
    return require('./' + name);
  } catch (e) {
    if (!e.message.startsWith('Cannot find module ')) {
      throw e;
    }

    return require('./help');
  }
}

function createCmd(argv) {
  const name = argv._[0] || 'help';
  const Cmd = getCmdClassByName(name);
  const args = argv._.splice(1);
  const opts = argv;

  if (typeof Cmd !== 'function') {
    throw new Error(`Bad command ${name}`);
  }

  return new Cmd(args, opts);
}

const fetchMetadataModules = Promise.coroutine(function *(baseDir, metadata) {
  let modules = [];

  let raw = metadata.xin.modules || [];
  for (let i = 0; i < raw.length; i++) {
    let ext = path.extname(raw[i]);
    modules.push({
      name: path.basename(raw[i], ext),
      file: raw[i],
    });
  }

  let files = yield fs.readdir(baseDir);
  files.forEach(file => {
    if (path.extname(file) !== '.html') {
      return;
    }

    let name = path.basename(file, '.html');
    if (modules.find(function(module) {
      return module.name === name;
    })) {
      return;
    }

    modules.push({
      name: name,
      file: file,
    });
  });

  return modules;
});

const fetchMetadataPages = Promise.coroutine(function *(baseDir, metadata) {
  let pages = [];

  let raw = metadata.xin.pages || [];
  for (let i = 0; i < raw.length; i++) {
    let ext = path.extname(raw[i]);
    pages.push({
      name: path.basename(raw[i], ext),
      file: raw[i],
    });
  }

  let docDir = path.join(baseDir, 'docs');
  let files = yield fs.readdir(docDir);
  for (let i = 0; i < files.length; i++) {
    let file = files[i];

    if (path.extname(file) !== '.md') {
      continue;
    }

    let name = path.basename(file, '.md');
    if (pages.find(function(page) {
      return page.name === name;
    })) {
      continue;
    }

    let content = yield fs.readFile(path.join(docDir, file), 'utf8');
    let matches = content.match(/\s*#\s*([^\n]+)/);

    pages.push({
      name: name,
      title: matches ? matches[1] : name,
      file: file,
    });
  };

  return pages;
});

function *fetchMetadata(baseDir) {
  if (!metadata) {
    metadata = require(path.join(baseDir, './bower.json'));

    metadata.xin = metadata.xin || {};
    metadata.xin.modules = yield fetchMetadataModules(baseDir, metadata);
    metadata.xin.pages = yield fetchMetadataPages(baseDir, metadata);
  }

  return metadata;
}

module.exports = createCmd;
module.exports.Cmd = Cmd;
module.exports.fetchMetadata = Promise.coroutine(fetchMetadata);
