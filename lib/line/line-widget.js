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

var $;

UploadCare.ready(function (jQuery) {
    $ = jQuery;

    // Animation easing from jQuery Easing plugin by George McGinley Smith.
    $.extend($.easing, {
        easeInOutQuad: function (x, t, b, c, d) {
            if ((t/=d/2) < 1) return c/2*t*t + b;
            return -c/2 * ((--t)*(t-2) - 1) + b;
        },
        easeOutBounce: function (x, t, b, c, d) {
            if ((t/=d) < (1/2.75)) {
                return c*(7.5625*t*t) + b;
            } else if (t < (2/2.75)) {
                return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
            } else if (t < (2.5/2.75)) {
                return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
            } else {
                return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
            }
        }
    });
});

// Default one line upload widget.
//
// It create widget before every hidden input with `uploadcare-line-uploader`
// role. When user select file, widget will upload it by AJAX and set file ID
// to hidden input value.
//
// Widget will block form submit during file uploading.
//
// If you will add AJAX content and want to enlive new hidden inputs, call
// `UploadCare.Line.init` with new content:
//
//     $.get('/next/page', function (html) {
//         var newContent = $(html).appendTo('.list');
//         UploadCare.Line.init(newContent);
//     });
UploadCare.Line = {

    // Text messages. It will be set in translation, see `i18n/` dir.
    messages: { },

    // CSS for widget. Will be copied from `line-style.sass` by build script.
    style: '',

    // HTML structure of widget. Will be copied from `line-template.html`
    // by build script.
    html: '',
    
    //Stylesheet for IE support
    ie_css_url: 'http://static.uploadcare.com/assets/compat/stylesheets/ie.css',
    //ie_css_url: null,

    // Add widgets to inputs inside `base`. You can pass DOM node or jQuery
    // objects.
    init: UploadCare._widgetInit('uploadcare-line-uploader'),

    // Return transition by `path` in messages.
    message: function (path) {
        var node  = UploadCare.Line.messages;
        var names = path.split('.');
        for (var i = 0; i < names.length; i++) {
            node = node[names[i]];
            if ( typeof(node) == 'undefined' ) {
                throw('There is no translation for `' + path + '`');
            }
        }
        return node;
    },

    // Add widget after hidden `input` to upload file to UploadCare.
    enlive: function (input) {
        var hidden = $(input);
        
        if ( !($.support.opacity && $.support.htmlSerialize) && (/6.0/.test(navigator.userAgent) || /7.0/.test(navigator.userAgent)) ) {
            if ( this.ie_css_url != null) {
                var link = $('<link />').attr({
                    rel: "stylesheet",
                    type: "text/css",
                    href: this.ie_css_url
                });
                link.appendTo($('head'));
            }
            
            $('a.uploadcare-line-computer').click(function() {
                $('input.uploadcare-uploader').click();
            });
        }

        var html = this.html.replace(/{([^}]+)}/g, function (_, name) {
            if ( name == 'style' ) {
                return UploadCare.Line.style;
            } else if ( name == 'file' ) {
                return '<div data-replace="file"></div>';
            } else if ( name.match(/^t /) ) {
                return UploadCare.Line.message(name.substr(2));
            }
        });
        
        var widget = $(html).insertAfter(hidden);
        
        var instanceId = hidden.attr('data-instance-id');
        var instance;
        
        if ( instanceId ) {
            instance = UploadCare.getInstance( instanceId );
        }
        
        if ( instance ) {
            var toggleTab = function(blocks, positive) {
                var elems = [];
                $(blocks).each(function() {
                    elems = $.merge(elems, $('a', this));
                    elems = $.merge(elems, $('input', this));
                });
                
                if ( positive === void(0) ) {
                    positive = true;
                }
                
                $( elems ).each(function() {
                    var tab = $(this).attr('tabindex');
                    
                    if ( !tab ) {
                        tab = -1;
                    }
                    if ( tab && tab < 0 && positive ) {
                        $(this).attr('tabindex', '1');
                    } else {
                        $(this).attr('tabindex', '-1');
                    }
                });
            }
            
            var reset = function() {
                toggleTab(['.uploadcare-line-uploader'], false);
            }
          
            var mainWindow = function() {
                var blocks = ['.uploadcare-line-error-wrapper', '.uploadcare-line-uploading', '.uploadcare-line-filedata', '.uploadcare-line-from-url'];
                
                if ( widget ) {
                  widget.data('fromUrl', false);
                }
                
                toggleTab(['.uploadcare-line-upload']);
                toggleTab(blocks, false);
            };
            var fromUrlWindow = function() {
                reset();
                toggleTab(['.uploadcare-line-from-url']);
            };
            var uploadingWindow = function() {
                reset();
                toggleTab(['.uploadcare-line-uploading']);
            };
            var fileInfoWindow = function() {
                reset();
                toggleTab(['.uploadcare-line-filedata']);
            };
            var fromUrlExit = function($, prev) {
                var fromUrl = widget.data('fromUrl');
                if ( fromUrl ) {
                    instance.state.set('fromUrlEnter');
                } else {
                    instance.state.set('mainWindow');
                }
                widget.data('fromUrl', false);
            };
            var fromUrlUpload = function() {
              if ( widget ) {
                widget.data('fromUrl', true);
              }
            }
            
            widget.data('fromUrl', false);
            
            instance.state.setCallback('idle', reset);
            instance.state.setCallback('startEnlive', mainWindow).setCallback('mainWindow', mainWindow).setCallback('upload', uploadingWindow).setCallback('afterUpload', fileInfoWindow);
            instance.state.setCallback('fromUrlEnter', fromUrlWindow).setCallback('fromUrlUpload', uploadingWindow).setCallback('fromUrlAfterUpload', fileInfoWindow);
            instance.state.setCallback('fromUrlUpload', fromUrlUpload);
            instance.state.setCallback('reloadToBase', fromUrlExit);
        }
        
        var file   = UploadCare.Plain.enlive(hidden, {
            meduim:        'line',
            fromUrl:       $('.uploadcare-line-url', widget),
            fromUrlSubmit: $('.uploadcare-line-url-submit', widget)
        });
        file.detach().replaceAll($('[data-replace=file]', widget));
        
        widget.data('info_loaded', false);
        widget.data('instance', instance);
        widget.addClass(instanceId);

        $('a', widget).click(false);
        //$('a', widget).attr({ "tabindex": "-1" });
        //$('input', widget).attr({ "tabindex": "-1" });
        
        this.uploadingEvents(widget, hidden);
        this.fromUrlEvents(widget, hidden);

        hidden.bind('uploadcare-error', function (ev, errorCode) {
            var fixable = false;
            
            errorCode = (void 0 === errorCode || null === errorCode) ? 'network' : errorCode;
            fixable   = errorCode === 'onlyImages' ? true : false;
            UploadCare.Line.showError(widget, errorCode, fixable, function () {
                UploadCare.Line.hideUploading(widget);
            });
        });
        
        hidden.bind('uploadcare-success', function() {
            var promise = UploadCare.FileData.fetch(hidden.val(), instanceId);
            
            promise.success(function(data) {
              UploadCare.Line.showFileData(data);
            });
            promise.error(function(errorCode) {
              errorCode = (void 0 === errorCode || null === errorCode) ? 'network' : errorCode;
              hidden.trigger('uploadcare-error', errorCode);
            });
        });
        
        if ( hidden.attr('data-override-style') !== void 0 ) {
          var overrideStyle = hidden.attr('data-override-style');
          var styleTag = $('style', widget);
          var styleContent = styleTag.html();
          
          styleContent = "" + styleContent + "." + instanceId + "{" + overrideStyle + "}";
          styleTag.html(styleContent);
        }
        
        $(document).trigger('enlive');
    },

    // Add events for uploading status and animate progress bar.
    uploadingEvents: function (widget, hidden) {
        var progress = $('.uploadcare-line-progress div', widget);
        var end      = progress.parent().width() - progress.width();
        var toLeft   = function () {
            progress.animate({ left: -1 }, 800, 'easeInOutQuad', toRight);
        }
        var toRight  = function () {
            progress.animate({ left: end }, 800, 'easeInOutQuad', toLeft);
        }
        var instance = widget.data('instance');

        hidden.bind('uploadcare-start', function () {
            widget.addClass('uploadcare-uploading');
            widget.find('.uploadcare-line-slider').css({
              "margin-top": -30
            });
            toRight();
        });

        var total = $('.uploadcare-line-progress').outerWidth();
        
        progress.data('width', progress.width());
        hidden.bind('uploadcare-progress', function (e, data) {
            var percentage = data.done / data.total;
            progress.stop().css({ left: -1 });
            progress.width(total * percentage);
        });

        var uploading = $('.uploadcare-line-uploading', widget);
        var slider = $('.uploadcare-line-slider', widget);
        
        $('.uploadcare-line-cancel', uploading).click(function () {
            slider.css({
              "margin-top": 0
            });
            var iframe = $('iframe[class="' + hidden.attr('data-instance-id') + '"]');
            if ( iframe.length !== 0 ) {
              iframe.remove();
            }
            UploadCare.Line.hideUploading(widget);
        });
        
        var filedata = $('.uploadcare-line-filedata', widget);
        
        $('.uploadcare-line-cancel', filedata).click(function() {
            hidden.val('');
            filedata.css({
                top: 1
            });
            slider.css({
                "margin-top": 0
            });
            
            if ( instance ) {
                instance.state.set('reloadToBase');
            }
            
            UploadCare.Line.hideUploading(widget);
        });
        
    },

    fromUrlEvents: function (widget, hidden) {
        var instance, instanceId;
        
        if ( hidden ) {
            instanceId = hidden.attr('data-instance-id');
            instance   = UploadCare.getInstance(instanceId);
        };
        $('.uploadcare-line-web', widget).click(function () {
            if ( instance ) {
                instance.state.set('fromUrlEnter');
            }
            
            widget.addClass('uploadcare-from-url');
            setTimeout(function () {
                $('.uploadcare-line-url').focus();
            }, 300);
        });

        var fromUrl = $('.uploadcare-line-from-url', widget);
        $('.uploadcare-line-cancel', fromUrl).click(function () {
            if ( instance ) {
                instance.state.set('reloadToBase');
            }
            widget.removeClass('uploadcare-from-url');
            $('.uploadcare-line-url').val('');
        });
    },

    // Hide uploading status and move progress to start position.
    hideUploading: function (widget) {
        var progress = $('.uploadcare-line-progress div', widget);
        progress.stop().css({ left: -1, width: progress.data('width') });
        widget.removeClass('uploadcare-uploading');
    },

    // Show error with some `code` by widget. If you set `fixable` argument,
    // error message willn contain back button.
    //
    // Method will be get error text from translation by `code`.
    showError: function (widget, code, fixable, callback) {
        var text    = this.message('errors.' + code);
        var error   = $('.uploadcare-line-error', widget);
        $('.uploadcare-line-error-text', error).html(text);

        var wrapper = error.parent().show();
        var height  = error.show().outerHeight();
        error.css({ top: -height }).
            animate({ top: 0 }, 600, 'easeOutBounce', function () {
                widget.addClass('uploadcare-error');
                callback();
            });

        var back = $('.uploadcare-line-error-back', error).toggle(fixable);
        if ( fixable ) {
            var _this = this;
            back.one('click', function () {
                error.animate({ top: -height }, 400, 'easeInOutQuad',
                    function () {
                        wrapper.hide();
                        widget.removeClass('uploadcare-error');
                    });
                _this.hideUploading(widget);
                $('.uploadcare-line-slider', widget).css({ "margin-top": 0 });
            });
        }
    },
    
    showFileData: function(fileData) {
        var widget = $('input[value=' + fileData.file_id + ']').next();
        var uploadPane  = $('.uploadcare-line-slider', widget);
        var fileDataPane = $('.uploadcare-line-filedata', widget);
        var filename = $('.uploadcare-line-filedata-filename', widget);
        var filesize = $('.uploadcare-line-filedata-filesize', widget);
        var human_size = Math.ceil(fileData.size / 1024) + "kb";
        var human_filename = fileData.original_filename;
        
        if ( human_filename.length > 16 ) {
          human_filename = human_filename.slice(0, 8) + '...' + human_filename.slice(-8);
        }

        filename.html(human_filename);
        filename.innerHTML = human_filename;
        filesize.innerHTML = human_size;
        filesize.html(human_size);
        fileDataPane.animate({top: 0});
        uploadPane.css({ "margin-top": -60 });
        
        widget.data('info_loaded', true);     
    }

};

})();
