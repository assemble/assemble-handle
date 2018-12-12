'use strict';

const del = require('delete');
const Assemble = require('assemble-core');
const handle = require('./');
const app = new Assemble();

app.handler('onFoo');

app.onFoo(/./, function(file, next) {
  file.count = file.count || 0;
  file.count++;
  next();
});

app.task('handle-once', function(cb) {
  var files = [];
  app.src('test/**/*.*')
    .pipe(handle.once(app, 'onFoo'))
    .pipe(handle.once(app, 'onFoo'))
    .pipe(handle.once(app, 'onFoo'))
    .pipe(handle.once(app, 'onFoo'))
    .pipe(handle.once(app, 'onFoo'))
    .on('data', function(file) {
      files.push(file);
    })
    .pipe(app.dest('test/actual'))
    .on('end', function() {
      console.log('should be 1:', files[0].count);
      //=> 1
      cb();
    });
});

app.task('handle', function(cb) {
  var files = [];
  app.src('test/**/*.*')
    .pipe(handle(app, 'onFoo'))
    .pipe(handle(app, 'onFoo'))
    .pipe(handle(app, 'onFoo'))
    .pipe(handle(app, 'onFoo'))
    .pipe(handle(app, 'onFoo'))
    .on('data', function(file) {
      files.push(file);
    })
    .pipe(app.dest('test/actual'))
    .on('end', function() {
      console.log('should be 5:', files[0].count);
      //=> 5
      cb();
    });
});

app.task('del', function(cb) {
  del('test/actual', cb);
});

app.task('default', ['handle-once', 'handle', 'del']);

module.exports = app;
