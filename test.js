'use strict';

require('mocha');
var assert = require('assert');
var handle = require('./');
var assemble = require('assemble');
var app = assemble();


describe('assemble-handle', function() {
  it('should export a function', function() {
    assert.equal(typeof handle, 'function');
  });

  it('should handle the given middleware stage', function(cb) {
    app.handler('onFoo');
    app.onFoo(/\.hbs$/, function(file, next) {
      file.content += file.path;
      next();
    });

    var files = [];
    app.src('fixtures/*.hbs')
      .pipe(handle(app, 'onFoo'))
      .on('data', function(file) {
        files.push(file);
      })
      .pipe(app.dest('actual/'))
      .on('finish', function() {
        files[0].content = files[0].path;
        cb()
      });
  });
});
