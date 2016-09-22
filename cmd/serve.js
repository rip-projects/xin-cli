const Cmd = require('./').Cmd;
const DocCmd = require('./doc');
const http = require('http');
const koa = require('koa');
const Promise = require('bluebird');
const sprintf = require('sprintf-js').sprintf;
const browserSync = require('browser-sync');
const portfinder = require('portfinder');
const getPort = Promise.promisify(portfinder.getPort);

portfinder.basePort = 3000;

class ServeCmd extends Cmd {
  *run() {
    function updateDoc() {
      return new DocCmd([], { f: true }).start();
    }

    yield updateDoc();

    const server = http.createServer(this.app.callback()).listen(yield getPort(), () => {
      var bs = browserSync.create();
      bs.init({
        online: false,
        open: false,
        proxy: {
          target: 'localhost:' + server.address().port,
          ws: true,
        },
      });
      bs.watch('**/*.html', {ignored: '_docs'}).on('change', function(file) {
        updateDoc().then(() => bs.reload.apply(bs, arguments));
      });

      // Provide a callback to capture ALL events to CSS
      // files - then filter for 'change' and reload all
      // css files on the page.
      bs.watch('**/*.css', {ignored: '_docs'}).on('change', function(event, file) {
        updateDoc().then(() => bs.reload('*.css'));
      });
    });
  }

  get app() {
    let app = this._app;
    if (!app) {
      app = koa();
    }

    app.use(function *(next) {
      yield next;

      var dt = new Date();
      console.log(sprintf('| %02d.%03d [%s] %s %s', dt.getSeconds(), dt.getMilliseconds(), this.status, this.method, this.url));
    });

    app.use(require('koa-static')('_docs'));

    return app;
  }
};

module.exports = ServeCmd;
