'use strict';

require('mocha');
const path = require('path');
const assert = require('assert');
const App = require('assemble-core');
const del = require('delete');
const File = require('vinyl');
const handle = require('..');
const actual = path.resolve.bind(path, __dirname, 'actual');
let app;

describe('assemble-handle', function() {
  beforeEach(function() {
    app = new App();
  });

  afterEach(function(cb) {
    del(path.join(__dirname, 'actual'), cb);
  });

  it('should export a function', function() {
    assert.equal(typeof handle, 'function');
  });

  it('should use a custom middleware handler', function(cb) {
    app.handler('onFoo');
    app.onFoo(/\.hbs$/, function(file, next) {
      file.contents = Buffer.from(file.path);
      next();
    });

    let files = [];
    let paths = [];

    app.src('fixtures/*.hbs', { cwd: __dirname })
      .on('data', function(file) {
        paths.push(file.path);
      })
      .pipe(handle(app, 'onFoo'))
      .on('data', function(file) {
        files.push(file);
      })
      .pipe(app.dest(actual()))
      .on('finish', function() {
        assert.equal(files[0].contents.toString(), paths[0]);
        cb();
      });
  });

  it('should handle multiple middleware for a custom handler', function(cb) {
    app.handler('onFoo');
    app.onFoo(/\.hbs$/, function(file, next) {
      file.contents = Buffer.from(file.contents.toString() + 'a');
      next();
    });

    app.onFoo(/\.hbs$/, function(file, next) {
      file.contents = Buffer.from(file.contents.toString() + 'b');
      next();
    });

    app.onFoo(/\.hbs$/, function(file, next) {
      file.contents = Buffer.from(file.contents.toString() + 'c');
      next();
    });

    let files = [];
    let paths = [];

    app.src('fixtures/*.hbs', { cwd: __dirname })
      .on('data', function(file) {
        paths.push(file.path);
      })
      .pipe(handle(app, 'onFoo'))
      .on('data', function(file) {
        files.push(file);
      })
      .on('end', function() {
        assert.equal(files[0].contents.toString(), 'abc');
        cb();
      });
  });

  it('should handle the same middleware method multiple times', function(cb) {
    let count = 0;

    app.handler('onFoo');
    app.onFoo(/\.hbs$/, function(file, next) {
      file.contents = Buffer.from(file.contents.toString() + 'a');
      count++;
      next();
    });

    app.onFoo(/\.hbs$/, function(file, next) {
      file.contents = Buffer.from(file.contents.toString() + 'b');
      count++;
      next();
    });

    app.onFoo(/\.hbs$/, function(file, next) {
      file.contents = Buffer.from(file.contents.toString() + 'c');
      count++;
      next();
    });

    let files = [];
    let paths = [];

    app.src('fixtures/foo.hbs', { cwd: __dirname })
      .on('data', function(file) {
        paths.push(file.path);
      })
      .pipe(handle(app, 'onFoo'))
      .pipe(handle(app, 'onFoo'))
      .pipe(handle(app, 'onFoo'))
      .pipe(handle(app, 'onFoo'))
      .pipe(handle(app, 'onFoo'))
      .pipe(handle(app, 'onFoo'))
      .on('data', function(file) {
        files.push(file);
      })
      .on('end', function() {
        assert.equal(files[0].contents.toString(), 'abcabcabcabcabcabc');
        assert.equal(count, 18);
        cb();
      });
  });

  it('should only run a handler once when `handle.once` is used', function(cb) {
    let count = 0;

    app.handler('onFoo');
    app.onFoo(/\.hbs$/, function(file, next) {
      file.contents = Buffer.from(file.contents.toString() + 'a');
      count++;
      next();
    });

    app.onFoo(/\.hbs$/, function(file, next) {
      file.contents = Buffer.from(file.contents.toString() + 'b');
      count++;
      next();
    });

    app.onFoo(/\.hbs$/, function(file, next) {
      file.contents = Buffer.from(file.contents.toString() + 'c');
      count++;
      next();
    });

    let files = [];
    let paths = [];

    app.src('fixtures/foo.hbs', { cwd: __dirname })
      .on('data', function(file) {
        paths.push(file.path);
      })
      .pipe(handle.once(app, 'onFoo'))
      .pipe(handle.once(app, 'onFoo'))
      .pipe(handle.once(app, 'onFoo'))
      .pipe(handle.once(app, 'onFoo'))
      .pipe(handle.once(app, 'onFoo'))
      .pipe(handle.once(app, 'onFoo'))
      .on('data', function(file) {
        files.push(file);
      })
      .on('end', function() {
        assert.equal(files[0].contents.toString(), 'abc');
        assert.equal(count, 3);
        cb();
      });
  });

  it('should handle onLoad', function(cb) {
    let count = 0;
    app.onLoad(/./, function(file, next) {
      count++;
      next();
    });

    app.src('fixtures/bar.hbs', { cwd: __dirname })
      .pipe(app.dest(actual('out-fixtures')))
      .on('end', function() {
        assert.equal(count, 1);
        cb();
      });
  });

  it('should handle preWrite', function(cb) {
    let count = 0;
    app.preWrite(/./, function(file, next) {
      count++;
      next();
    });

    let srcPath = path.join(__dirname, 'fixtures/foo.hbs');
    let stream = app.dest(actual('out-fixtures'));

    stream.once('finish', function() {
      assert.equal(count, 1);
      cb();
    });

    let file = new File({
      path: srcPath,
      cwd: __dirname,
      contents: Buffer.from('1234567890')
    });
    file.options = {};

    stream.write(file);
    stream.end();
  });

  it('should handle postWrite', function(cb) {
    let count = 0;
    app.postWrite(/./, function(file, next) {
      count++;
      next();
    });

    let srcPath = path.join(__dirname, 'fixtures/bar.hbs');
    let stream = app.dest(actual('out-fixtures'));

    stream.once('finish', function() {
      assert.equal(count, 1);
      cb();
    });

    let file = new File({
      path: srcPath,
      cwd: __dirname,
      contents: Buffer.from('1234567890')
    });
    file.options = {};

    stream.write(file);
    stream.end();
  });
});
