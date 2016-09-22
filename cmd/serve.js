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

// var bowerJson;
// try {
//   bowerJson = require(path.resolve('bower.json'));
// } catch (e) {
//   console.error('bower.json not found');
//   return;
// }
//
//
// function apiRoot() {
//   return fs.readdir('./').then(function(files) {
//     var hasIndex = false;
//     var components = [];
//     files.forEach(function(file) {
//       if (path.extname(file) === '.html') {
//         if (file === 'index.html') {
//           hasIndex = true;
//           return;
//         }
//         var name = path.basename(file, '.html');
//         var component = {
//           name: name,
//           documentationUrl: '/cdocs/' + name,
//         };
//         return components.push(component);
//       }
//     });
//
//     return {
//       name: bowerJson.name,
//       index: hasIndex,
//       components: components,
//     };
//   });
// }
//
// function serveStatic(res, file, cached) {
//   const _write = function(res, cache) {
//     res.writeHead(200, {
//       'Content-Type': cache.type,
//     });
//     res.write(cache.content);
//     res.end();
//   };
//
//   var type = 'text/html';
//   switch (path.extname(file)) {
//     case '.ico':
//       type = 'image/x-icon';
//       break;
//     case '.css':
//       type = 'text/css';
//       break;
//     case '.js':
//       type = 'application/javascript';
//       break;
//   }
//
//   if (DEBUG || !cached) {
//     return fs.readFile(file)
//       .then(function(content) {
//         _write(res, {
//           type: type,
//           content: content,
//         });
//       }, function(err) {
//         console.error('E:', err.message);
//         res.error = err;
//       });
//   }
//
//   serveStatic.caches = serveStatic.caches || {};
//   var cache = serveStatic.caches[file];
//   if (cache) {
//     _write(res, cache);
//     return Promise.resolve();
//   }
//
//   return fs.readFile(file)
//     .then(function(content) {
//       var cache = serveStatic.caches[file] = {
//         type: type,
//         content: content,
//       };
//       _write(res, cache);
//     });
// }
//
// function mwIndex(next) {
//   return function(req, res) {
//     if (req.method === 'GET') {
//       if (req.url === '/') {
//         return serveStatic(res, path.join(__dirname, '../templates/index.html'));
//       } else if (req.url === '/cdocs') {
//         res.writeHead(302, {
//           Location: '/cdocs/',
//         });
//         res.end();
//         return Promise.resolve();
//       } else if (req.url.startsWith('/cdocs/')) {
//         return serveStatic(res, path.join(__dirname, '../templates/docs.html'));
//       }
//     }
//
//     return next(req, res);
//   };
// }
//
// function mwDemo(next) {
//   return function(req, res) {
//     if (req.method === 'GET' && req.url.startsWith('/demo/')) {
//       var file = path.join('demo', req.url.substr(6));
//       return serveStatic(res, file);
//     }
//     return next(req, res);
//   };
// }
