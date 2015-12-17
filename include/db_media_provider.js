/*
    Copyright (C) 2015  PencilBlue, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

//dependencies
var Streamifier = require('streamifier');

module.exports = function DbMediaProviderModule(pb) {

    //pb dependencies
    var util          = pb.util;
    var PluginService = pb.PluginService;
    var Dropbox       = pb.PluginService.require('dropbox-pencilblue', 'dropbox');

    /**
     *
     * @class DbMediaProvider
     * @constructor
     */
    function DbMediaProvider(context) {

        /**
         * @property pluginService
         * @type {PluginService}
         */
        this.pluginService = new PluginService(context);
    };

    /**
     * Retrieves an instance of the Dropbox client
     * @method getClient
     * @param {Function} cb A callback that provides parameters: The first an
     * error, if occurred.  The second is an Dropbox instance for interfacing with
     * Amazon Dropbox.  The last parameter is the hash of the plugin settings.
     */
    DbMediaProvider.prototype.getClient = function(cb) {
        this.pluginService.getSettingsKV('dropbox-pencilblue', function(err, setts) {
            if (util.isError(err)) {
                return cb(err);
            }

            var client = new Dropbox.Client({
              key         : setts.key,
              secret      : setts.secret,
              sandbox     : setts.sandbox,
              token       : setts.token,
            });
            cb(null, client, setts);
        });
    };

    /**
     * Retrieves the item in Dropbox as a stream.
     * @method getStream
     * @param {String} mediaPath The path/key to the media.  Typically this is a
     * path such as: /media/2014/9/540a3ff0e30ddfb9e60000be-1409957872680.jpg
     * @param {Object} [options] Options for interacting with Dropbox
     * @param {Function} cb A callback that provides two parameters: An Error, if
     * occurred and a ReadableStream that contains the media content.
     */
    DbMediaProvider.prototype.getStream = function(mediaPath, options, cb) {
        if (util.isFunction(options)) {
            cb      = options;
            options = {};
        }
        else if (!util.isObject(options)) {
            return cb(new Error('The options parameter must be an object'));
        }

        //retrieve media
        this.get(mediaPath, options || {}, function(err, buffer) {
            if (util.isError(err)) {
                return cb(err);
            }
            else if (!Buffer.isBuffer(buffer)) {
                var err = new Error('NOT FOUND');
                err.code = 404;
                return cb(err);
            }
            var bufferStream = Streamifier.createReadStream(buffer, {encoding: null});
            cb(null, bufferStream);
        });
    };

    /**
     * Retrieves the content from Dropbox as a String or Buffer.
     * @method get
     * @param {String} mediaPath The path/key to the media.  Typically this is a
     * path such as: /media/2014/9/540a3ff0e30ddfb9e60000be-1409957872680.jpg
     * @param {Object} [options] Options for interacting with Dropbox
     * @param {Function} cb A callback that provides two parameters: An Error, if
     * occurred and an entity that contains the media content.
     */
    DbMediaProvider.prototype.get = function(mediaPath, options, cb) {
        if (util.isFunction(options)) {
            cb      = options;
            options = {};
        }
        else if (!util.isObject(options)) {
            return cb(new Error('The options parameter must be an object'));
        }

        this.getClient(function(err, client) {
            if (util.isError(err)) {
                return cb(err);
            }

            var params = {
                buffer: true,
                binary: true
            };
            client.readFile(mediaPath, params, cb);
        });
    };

    /**
     * Sets media content into an Dropbox bucket based on the specified media path and
     * options.  The stream provided must be a ReadableStream.
     * @method setStream
     * @param {ReadableStream} stream The content stream
     * @param {String} mediaPath The path/key to the media.  Typically this is a
     * path such as: /media/2014/9/540a3ff0e30ddfb9e60000be-1409957872680.jpg
     * @param {Object} [options] Options for interacting with Dropbox
     * @param {Function} cb A callback that provides two parameters: An Error, if
     * occurred and the success of the operation.
     */
    DbMediaProvider.prototype.setStream = function(stream, mediaPath, options, cb) {
        if (util.isFunction(options)) {
            cb      = options;
            options = {};
        }
        else if (!util.isObject(options)) {
            return cb(new Error('The options parameter must be an object'));
        }

        this.getClient(function(err, client) {
            if (util.isError(err)) {
                return cb(err);
            }

            var ended  = false;
            var cursor = null;
            stream.on('data', function (data) {
                stream.pause();
                client.resumableUploadStep(data, cursor, function (error, new_cursor) {
                    if (util.isError(error)) {
                        stream.emit(error);
                    }
                    cursor = new_cursor;
                    stream.resume();

                    if (ended) {
                        client.resumableUploadFinish(mediaPath, cursor, function (error, stats) {
                            cb(error, stats);
                        });
                    }
                });
            })
            .on('end', function () {
                ended = true;
            })
            .on('error', cb);
        });
    };

    /**
     * Sets media content into an Dropbox bucket based on the specified media path and
     * options.  The data must be in the form of a String or Buffer.
     * @method setStream
     * @param {String|Buffer|Stream} fileDataStrOrBuffOrStream The content to persist
     * @param {String} mediaPath The path/key to the media.  Typically this is a
     * path such as: /media/2014/9/540a3ff0e30ddfb9e60000be-1409957872680.jpg
     * @param {Object} [options] Options for interacting with Dropbox
     * @param {Function} cb A callback that provides two parameters: An Error, if
     * occurred and the success of the operation.
     */
    DbMediaProvider.prototype.set = function(fileDataStrOrBuff, mediaPath, options, cb) {
        if (util.isFunction(options)) {
            cb      = options;
            options = {};
        }
        else if (!util.isObject(options)) {
            return cb(new Error('The options parameter must be an object'));
        }

        this.getClient(function(err, client) {
            if(util.isError(err)) {
                return cb(err);
            }
            client.writeFile(mediaPath, fileDataStrOrBuff, cb);
        });
    };

    /**
     * Part of the interface but isn't used anywhere yet.  This implementation
     * throw an error because it is not implemented.
     * @method createWriteStream
     * @param {String} mediaPath The path/key to the media.  Typically this is a
     * path such as: /media/2014/9/540a3ff0e30ddfb9e60000be-1409957872680.jpg
     * @param {Function} cb A callback that provides two parameters: An Error, if
     * occurred and a WriteableStream.
     */
    DbMediaProvider.prototype.createWriteStream = function(mediaPath, cb) {
        throw new Error('Not implemented');
    };

    /**
     * Checks to see if the file actually exists in Dropbox
     * @method exists
     * @param {String} mediaPath The path/key to the media.  Typically this is a
     * path such as: /media/2014/9/540a3ff0e30ddfb9e60000be-1409957872680.jpg
     * @param {Function} cb A callback that provides two parameters: An Error, if
     * occurred and a Boolean.
     */
    DbMediaProvider.prototype.exists = function(mediaPath, cb) {
        this.stat(mediaPath, function(err, stat) {
            cb(null, stat ? true : false);
        });
    };

    /**
     * Deletes a file out of Dropbox
     * @method delete
     * @param {String} mediaPath The path/key to the media.  Typically this is a
     * path such as: /media/2014/9/540a3ff0e30ddfb9e60000be-1409957872680.jpg
     * @param {Object} [options] Options for interacting with Dropbox
     * @param {Function} cb A callback that provides two parameters: An Error, if
     * occurred and the success of the operation.
     */
    DbMediaProvider.prototype.delete = function(mediaPath, options, cb) {
        if (util.isFunction(options)) {
            cb      = options;
            options = {};
        }
        else if (!util.isObject(options)) {
            return cb(new Error('The options parameter must be an object'));
        }

        this.getClient(function(err, client) {
            if(util.isError(err)) {
                return cb(err);
            }

            client.remove(mediaPath, cb);
        });
    };

    /**
     * Retrieve the stats on the file
     * @method stat
     * @param {String} mediaPath The path/key to the media.  Typically this is a
     * path such as: /media/2014/9/540a3ff0e30ddfb9e60000be-1409957872680.jpg
     * @param {Function} cb A callback that provides two parameters: An Error, if
     * occurred and an object that contains the file stats
     */
    DbMediaProvider.prototype.stat = function(mediaPath, cb) {
        this.getClient(function(err, client) {
            if(util.isError(err)) {
                return cb(err);
            }

            client.stat(mediaPath, cb);
        });
    };

    //exports
    return DbMediaProvider;
};
