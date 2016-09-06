'use strict';

const http = require('http');
const fs = require('fs-promise');
const path = require('path');
const sprintf = require('sprintf-js').sprintf;
const portfinder = require('portfinder');
portfinder.basePort = 3000;

const ERR_NOT_FOUND = (function() {
  var err = new Error('Not found');
  err.status = 404;
  return err;
})();

var bowerJson;
try {
  bowerJson = require(path.resolve('bower.json'));
} catch(e) {
  console.error('bower.json not found');
  return;
}

const DEBUG = process.env.XIN_CLI_DEBUG ? true : false;

function apiRoot() {
  return fs.readdir('./').then(function(files) {
    var hasIndex = false;
    var components = [];
    files.forEach(function(file) {
      if (path.extname(file) === '.html') {
        if (file === 'index.html') {
          hasIndex = true;
          return;
        }
        var name = path.basename(file, '.html');
        var component = {
          name: name,
          documentationUrl: '/_docs/' + name,
        };
        return components.push(component);
      }
    });

    return {
      name: bowerJson.name,
      index: hasIndex,
      components: components,
    };
  });
}

function serveStatic(res, file, cached) {
  const _write = function(res, cache) {
    res.writeHead(200, {
      'Content-Type': cache.type,
    });
    res.write(cache.content);
    res.end();
  };

  var type = 'text/html';
  switch (path.extname(file)) {
    case '.ico':
      type = 'image/x-icon';
      break;
    case '.css':
      type = 'text/css';
      break;
    case '.js':
      type = 'application/javascript';
      break;
  }

  if (DEBUG || !cached) {
    return fs.readFile(file)
      .then(function(content) {
        _write(res, {
          type: type,
          content: content,
        });
      }, function(err) {
        console.error('E:', err.message);
        res.error = err;
      });
  }

  serveStatic.caches = serveStatic.caches || {};
  var cache = serveStatic.caches[file];
  if (cache) {
    _write(res, cache);
    return Promise.resolve();
  }

  return fs.readFile(file)
    .then(function(content) {
      var cache = serveStatic.caches[file] = {
        type: type,
        content: content,
      };
      _write(res, cache);
    });
}

function mwIndex(next) {
  return function(req, res) {
    if (req.method === 'GET') {
      if (req.url === '/') {
        return serveStatic(res, path.join(__dirname, 'templates/index.html'));
      } else if (req.url === '/_docs') {
        res.writeHead(302, {
          Location: '/_docs/'
        });
        res.end();
        return Promise.resolve();
      } else if (req.url.startsWith('/_docs/')) {
        return serveStatic(res, path.join(__dirname, 'templates/docs.html'));
      }
    }

    return next(req, res);
  };
}

function mwLog(next) {
  return function(req, res) {
    return next(req, res)
      .then(function() {
        if (!res.finished) {
          res.writeHead(404);
          res.write('Not found');
          res.end();
        }
        var dt = new Date();
        var tStr = sprintf('%02d.%03d', dt.getSeconds(), dt.getMilliseconds());
        console.log('| %s [%s] %s %s', tStr, res.statusCode, req.method, req.url);
      });
  };
}

function mwFavicon(next) {
  return function(req, res) {
    if (req.method === 'GET' && req.url === '/favicon.ico') {
      return serveStatic(res, path.join(__dirname, 'favicon.ico'));
    }

    return next(req, res);
  };
}

function mwBower(next) {
  return function(req, res) {
    if (req.method === 'GET' && req.url.startsWith('/bower_components/')) {
      var file = path.join('.', req.url);
      if (req.url.startsWith('/bower_components/xin-cli/')) {
        file = path.join(__dirname, req.url.substr(25));
      } else if (req.url.startsWith('/bower_components/' + bowerJson.name + '/')) {
        file = req.url.substr(19 + bowerJson.name.length);
      }
      return serveStatic(res, file);
    }

    return next(req, res);
  };
}

function mwApi(next) {
  return function(req, res) {
    if (req.url.startsWith('/xin-cli-api/')) {
      var apiUrl = req.url.substr(12);

      return Promise.resolve()
        .then(function() {
          switch(apiUrl) {
            case '/':
              return apiRoot();
            default:
              throw ERR_NOT_FOUND;
          }
        })
        .then(function(body) {
          res.writeHead(200, {
            'Content-Type': 'application/json',
          });
          res.write(JSON.stringify(body || null));
          res.end();
        })
        .catch(function(err) {
          res.writeHead(err.status || 500, {
            'Content-Type': 'application/json',
          });
          res.write(JSON.stringify({
            message: err.message
          }));
          res.end();
        });
    }

    return next(req, res);
  };
}

function mwDemo(next) {
  return function(req, res) {
    if (req.method === 'GET' && req.url.startsWith('/demo/')) {
      var file = path.join('demo', req.url.substr(6));
      return serveStatic(res, file);
    }
    return next(req, res);
  };
}

function mwNoop() {
  return function(){
    return Promise.resolve();
  };
}

const server = http.createServer(function(req, res) {
  mwLog(
  mwFavicon(
  mwApi(
  mwIndex(
  mwDemo(
  mwBower(
    mwNoop()
  ))))))(req, res);
});

portfinder.getPort(function (err, port) {
  if (err) {
    console.error(err);
    return;
  }

  server.listen(port, function() {
    console.log('Listening at %s...', server.address().port);
  });
});
