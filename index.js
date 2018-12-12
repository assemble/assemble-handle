'use strict';

const through = require('through2');

module.exports = (app, method) => {
  return through.obj(async(file, enc, next) => {
    if (!file || !file.isNull || (!file.path && !file.contents)) {
      next();
      return;
    }

    if (file.isNull()) {
      next(null, file);
      return;
    }

    if (app.handle) {
      try {
        await app.handle(method, file);
      } catch (err) {
        next(err);
        return;
      }
    }

    next(null, file);
  });
};

module.exports.once = (app, method) => {
  const once = app._handleOnce || (app._handleOnce = {});
  once[method] = once[method] || new Set();

  return through.obj(async(file, enc, next) => {
    if (!file || !file.isNull || (!file.path && !file.contents)) {
      next();
      return;
    }

    if (file.isNull()) {
      next(null, file);
      return;
    }

    if (app.handle && !once[method].has(file)) {
      try {
        await app.handle(method, file);
      } catch (err) {
        next(err);
        return;
      }
    }

    once[method].add(file);
    next(null, file);
  });
};
