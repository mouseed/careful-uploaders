/*
 * Copyright (c) 2011 UploadCare
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

;(function () {
"use strict";

window.UploadCare = {

    // Function, which are waiting UploadCare initializing.
    _readyCallbacks: [],

    // jQuery version for UploadCare.
    _jQueryMinVersion: [1, 5, 0],

    // URL to get jQuery from CDN.
    _jQueryCDN: 'http://ajax.googleapis.com/ajax/libs/' +
                'jquery/1.6.2/jquery.js',

    // Is UploadCare initialized.
    initialized: false,

    // jQuery object for UploadCare.
    jQuery: null,

    // API public key.
    publicKey: null,
    
    //Base URL
    uploadBaseUrl: "http://upload.uploadcare.com",
    
    //URLs for widget internals. Set before initialization.
    urls: {
        byIframe: {
            upload: "",
        },
        byUrl: {
            upload: "",
            status: ""
        },
        byXHR2: {
            upload: ""
        },
        fileInfo: ""
    },

    // Call `callback`, when HTML is loaded.
    _domReady: function (callback) {
        var self     = this;
        var isLoaded = false;
        var unbind   = null;
        var loaded   = function () {
            if ( isLoaded ) {
                return;
            }
            isLoaded = true;
            unbind();
            callback.call(self)
        }

        if ( document.readyState === 'complete' ) {
            callback.call(this);
            return;
        } else if ( document.addEventListener ) {
            unbind = function () {
                document.removeEventListener('DOMContentLoaded', loaded, false);
            }
            document.addEventListener('DOMContentLoaded', loaded, false);
            window.addEventListener('load', loaded, false);
        } else {
            unbind = function () {
                document.detachEvent('onreadystatechange', loaded, false);
            }
            document.attachEvent('onreadystatechange', loaded, false);
            window.attachEvent('load', loaded, false);
        }
    },

    // Call all callbacks, which were added by `ready` method.
    _callReadyCallbacks: function () {
        this.initialized = true;
        for (var i = 0; i < this._readyCallbacks.length; i++) {
            this._readyCallbacks[i].call(this, this.jQuery);
        }
    },

    // Generate UUID for upload file ID.
    // Taken from http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#2117523
    _uuid: function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.
            replace(/[xy]/g, function(c) {
                var r = Math.random() * 16|0,
                    v = (c == 'x' ? r : (r&0x3|0x8));
                return v.toString(16);
            });
    },

    // Check, that jQuery loaded and have correct version. `noCallback` will be
    // call, if page doesn’t have jQuery, `versionCallback` – if page have
    // wrong version of jQuery.
    _checkJQuery: function (jQuery, noCallback, versionCallback) {
        if ( !jQuery || typeof(jQuery) === "undefined" ) {
            noCallback.call(this);
            return;
        }
        var require, subversion, version = jQuery.fn.jquery.split('.');
        for (var i = 0; i < this._jQueryMinVersion.length; i++) {
            require    = this._jQueryMinVersion[i]
            subversion = parseInt(version[i]);
            if ( require > subversion ) {
                versionCallback.call(this);
                return;
            } else if ( require < subversion ) {
                this._getJQuery();
                return;
            }
        }
        this._getJQuery();
    },

    // Copy jQuery to UploadCare object and run all callbacks.
    _getJQuery: function () {
        if ( typeof(window.jQuery) !== "undefined" ) {
            this.jQuery = window.jQuery;
        }
        this._callReadyCallbacks();
    },

    // Load own jQuery for UploadCare.
    _loadJQuery: function () {
        var script = document.createElement('script');
        script.src = this._jQueryCDN;
        script.onload = script.onreadystatechange = function () {
            if ( typeof(window.jQuery) !== "undefined" ) {
                window.jQuery.noConflict();
                UploadCare.jQuery = window.jQuery;
                window.jQuery = UploadCare._originjQuery;
                delete UploadCare._originjQuery;
                UploadCare._callReadyCallbacks();
            }
        };

        var head = document.getElementsByTagName('head')[0];
        if ( !head ) {
            head = document.body;
        }
        
        if ( typeof(window.jQuery) !== "undefined" ) {
            this._originjQuery = window.jQuery;
        }
        
        head.appendChild(script);
    },

    // Get user public key from current script tag.
    // If no key presents, try to get public key from input tag.
    _getPublicKey: function () {
        var scripts = document.getElementsByTagName('script');
        var current = scripts[scripts.length - 1];
        this.publicKey = current.getAttribute('data-public-key');
        
        if ( UploadCare.publicKey === void 0 || UploadCare.publicKey === null ) {
            UploadCare.ready(function($) {
                $(document).ready(function() {
                    var input = $('input[data-public-key]');
                    UploadCare.publicKey = input.attr('data-public-key');
                });
            });
        }
    },

    // Return init method for widget. It will try to find inputs with some
    // `role` in DOM or jQuery node and call widget’s `enlive` method.
    _widgetInit: function (role) {
        return function (base) {
            var widget = this;
            UploadCare.ready(function ($) {
                var inputs = null;
                var $ = UploadCare.jQuery;
                if ( typeof(base.jquery) == 'undefined' ) {
                    if ( base.tagName == 'INPUT') {
                        inputs = $(base);
                    }
                } else {
                    if ( base.is('input') ) {
                        inputs = base;
                    }
                }
                if ( inputs === null ) {
                    inputs = $('[role~=' + role + ']', base);
                }

                inputs.each(function (_, input) {
                    if ( input.getAttribute('data-upload-base-url') !== null ) {
                        UploadCare.setUrls(input.getAttribute('data-upload-base-url'));
                    }
                    widget.enlive(input);
                });
            });
        }
    },

    // Add `translation` in some `locale` as `widget` messages.
    //
    // Instead of replace `widget.messages` it will doesn’t change object link,
    // so you can copy `widget.messages` to `t` variable shortcut in
    // widget code, before add translation.
    //
    // Also it will set `messages.locale` with current locale code.
    _translate: function (widget, locale, translation) {
        widget.messages.locale = locale;
        for ( var name in translation ) {
            widget.messages[name] = translation[name];
        }
    },

    // Create Deferred promise object and add jQuery AJAX like proxy callbacks.
    _promise: function (deferred, extend) {
        if ( typeof(extend) == 'undefined' ) {
            extend = {
                progress: function () {}
            };
        }
        
        if ( typeof(deferred.state) == 'undefined' ) {
            deferred.state = function() {
                return deferred.isResolved() ? "resolved" : (deferred.isRejected() ? "rejected" : "pending");
            }
        }
        
        var promise = deferred.promise(extend);
        promise.success  = promise.done;
        promise.error    = promise.fail;
        promise.complete = promise.always;
        return promise;
    },

    // Return upload params by options hash.
    _params: function (options) {
        if ( typeof(options) == 'undefined' ) {
            options = { };
        }

        var params = {
            UPLOADCARE_PUB_KEY: options.publicKey || this.publicKey,
        };
        if ( options.meduim ) {
            params.UPLOADCARE_MEDIUM = options.meduim;
        }

        return params;
    },

    // Initialize jQuery object and call all function added by `ready`.
    init: function () {
        var _jq;
        
        if ( typeof(window.jQuery) !== "undefined" ) {
            _jq = window.jQuery;
        }
        
        this._checkJQuery(_jq,
            function () {
                this._domReady(function () {
                    this._checkJQuery(_jq,
                        this._loadJQuery, this._loadJQuery);
                });
            },
            this._loadJQuery);
    },

    // Call `callback` when UploadCare will be initialized. First argument will
    // by jQuery object.
    ready: function (callback) {
        if ( this.initialized ) {
            callback.call(this, this.jQuery);
        } else {
            this._readyCallbacks.push(callback)
        }
    },

    // Upload file to UploadCare and return jQuery Deferred promise.
    // UUID for uploaded file will be send to `done` callback.
    //
    // If `file` will be file input, `upload` will use iframe method to upload
    // file from user.
    //
    // If `file` will be string, `upload` will request UploadCare servers to
    // upload file from this URL. In this case promise will contain `progress`
    // function to add callbacks to uploading status.
    upload: function (file, options) {
        var params = this._params(options);
        if ( typeof(file) == 'string' ) {
            return this.byUrl.upload(file, params);
        } else {
            return this.byIframe.upload(file, params);
        }
    },

    setUrls: function(uploadBaseUrl) {
        uploadBaseUrl = typeof(uploadBaseUrl) === "undefined" ? this.uploadBaseUrl : uploadBaseUrl;
        
        if ( uploadBaseUrl.slice(-1) === "/" ) {
            uploadBaseUrl = uploadBaseUrl.slice(0, -1);
        }
        
        this.urls = {
            byUrl: {
                upload: "" + uploadBaseUrl + "/from_url/",
                status: "" + uploadBaseUrl + "/status/"
            },
            byIframe: {
                upload: "" + uploadBaseUrl + "/iframe/"
            },
            byXHR2: {
                upload: "" + uploadBaseUrl + "/iframe/"
            },
            fileInfo: "" + uploadBaseUrl + "/info/"
        }
    }
};

// Driver to upload file by iframe.
UploadCare.byIframe = {
    // ID counter to have unique iframe IDs.
    _lastIframeId: 0,

    // Create iframe to upload file by AJAX.
    _createIframe: function () {
        this._lastIframeId += 1;
        var id = 'uploadcareIframe' + this._lastIframeId;
        var iframe = UploadCare.jQuery('<iframe />').attr({ id: id, name: id });
        iframe.css('position', 'absolute').css('top', '-9999px');
        iframe.appendTo('body');
        return iframe;
    },
    
    _getUploadUrl: function() {
        return UploadCare.urls.byIframe.upload;
    },

    // Create form, link it action to `iframe` and clone `file` inside.
    _createFormForIframe: function (iframe, file) {
        var form = UploadCare.jQuery('<form />').attr({
            method:  'POST',
            action:  this._getUploadUrl(),
            enctype: 'multipart/form-data',
            target:  iframe.attr('id')
        });
        form.css('position', 'absolute').css('top', '-9999px');

        var next = file.clone(true);
        next.insertBefore(file);
        form.appendTo('body');       
        file.appendTo(form);

        return form;
    },

    // Upload file to UploadCare by iframe method and return jQuery Deferred.
    upload: function (file, params) {
        var iframe = this._createIframe();
        var form   = this._createFormForIframe(iframe, file);
        var id     = UploadCare._uuid();

        params.UPLOADCARE_FILE_ID = id;
        for ( var name in params ) {
            UploadCare.jQuery('<input type="hidden" />').
                attr('name', name).val(params[name]).appendTo(form);
        }

        var deferred = UploadCare.jQuery.Deferred();
        var complete = function () {
            iframe.remove();
            form.remove();
        };

        iframe.bind('load', function (e) {
            e.preventDefault();
            deferred.resolve(id);
            complete();
        });
        iframe.bind('error', function () {
            deferred.reject();
            complete();
        });
        
        form.submit();
        return UploadCare._promise(deferred);
    }
};

// Driver to upload file from Internet by URL.
UploadCare.byUrl = {
    // Period in miliseconds to check uploading progress.
    checkEvery: 1000,
    
    _getUploadUrl: function() {
        return UploadCare.urls.byUrl.upload;
    },
    
    _getStatusUrl: function() {
        return UploadCare.urls.byUrl.status;
    },

    // Send request to start uploading from Internet.
    upload: function (url, params) {
        var deferred = UploadCare.jQuery.Deferred();

        var watchers = [];
        var promise  = UploadCare._promise(deferred, {
            progress: function (callback) {
                watchers.push(callback);
                return this;
            }
        });

        var checking = null;
        var check = function (token) {
            UploadCare.byUrl.progress(token).
                success(function (data) {
                    if ( data.status == 'failure' ) {
                        deferred.reject();
                        return;
                    }
                    for ( var i = 0; i < watchers.length; i++ ) {
                        watchers[i](data);
                    }
                    if ( data.status == 'success' ) {
                        deferred.resolve(data.file_id);
                    }
                }).
                error(function () {
                    deferred.reject();
                })
        };
        
        var uploadUrl = this._getUploadUrl() + "?";

        params.pub_key = params.UPLOADCARE_PUB_KEY;
        params.source_url = url;
        
        delete params.UPLOADCARE_PUB_KEY;
        
        for ( var name in params ) {
            uploadUrl = "" + uploadUrl + "" + name + "=" + params[name] + "&";
        }
        
        uploadUrl = "" + uploadUrl + "jsoncallback=?";

        if ( url.length == 0 ) {
          deferred.reject('badFileUrl');
        } else {
          UploadCare.jQuery.ajax(uploadUrl, {dataType: "jsonp"}).
              success(function (data) {
                  checking = setInterval(function () {
                      check(data.token);
                  }, UploadCare.byUrl.checkEvery);
              }).
              error(function () {
                  deferred.reject();
              });
        }
        
        promise.complete(function() {
            clearInterval(checking);
        })
        return promise;
    },

    // Request UploadCare about uploading status and return AJAX promise.
    progress: function (token) {
        var statusUrl = "" + this._getStatusUrl() + "?token=" + token + "&jsoncallback=?";
        return UploadCare.jQuery.ajax(statusUrl, {dataType: "jsonp"});
    },
};

UploadCare._getPublicKey();
UploadCare.setUrls();
UploadCare.init();

})();
