/*!
 * assemble-handle <https://github.com/jonschlinkert/assemble-handle>
 *
 * Copyright (c) 2016, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

/**
 * Plugin for handling middleware
 *
 * @param {Object} `app` Instance of "app" (assemble, verb, etc) or a collection
 * @param {String} `stage` the middleware stage to run
 */

function handle(app, stage) {
  return utils.through.obj(function(file, enc, next) {
    if (typeof app.handle !== 'function') {
      return next(null, file);
    }
    if (typeof file.options === 'undefined') {
      return next(null, file);
    }
    if (file.isNull()) return next();
    app.handle(stage, file, next);
  });
}

