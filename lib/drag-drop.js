;(function() {
  UploadCare.DragDrop = {
    useLargeDropZone: false,
    started: false,
    eventTimer: false,
    idle: true,
    
    selectors: {
      widget: 'div.uploadcare-line-uploader',
      cropper: 'div.uploadcare-line-cropper',
      slider: 'div.uploadcare-line-slider',
      filedata: 'div.uploadcare-line-filedata'
    },
    
    init: function () {
      return UploadCare.ready(function($) {
        try {
          if ( $(UploadCare.DragDrop.selectors.widget).length === 0 ) {
            throw "Widget block not found. Do you use inline version if widget?";
          }
          if ( 'draggable' in document.createElement('span') === false ) {
            throw "D&D not available, please use modern browser.";
          }
        } catch ( error ) {
          return;
        } finally {
          UploadCare.DragDrop.enlive($);
        }
      });
    },
    enlive: function ($) {
      var dragzone, dropzone, filedata, hidden, slider, upload, widget;
      
      widget   = $(this.selectors.widget);
      hidden   = $(widget).prev();
      slider   = $(this.selectors.slider, widget);
      filedata = $(this.selectors.filedata, widget);
      dragzone = $('.uploadcare-line-thumb', slider).first();
      dropzone = this.createDropZone($, widget);
      
      // dropzone.prev().data('margin', {
      //   "margin-top": dropzone.prev().css('margin-top')
      // });
      // 
      // widget.data('dimensions', {
      //   width: widget.width(),
      //   height: widget.height()
      // });
      
      this.dragDropEvents(dragzone, dropzone);
      
      upload = function (files) {
        var uploading;
        
        uploading = UploadCare.DragDrop.process(widget, hidden, files);
        uploading.success(function (id) {
          hidden.val(id);
          hidden.trigger('uploadcare-success', id);
          hidden.trigger('uploadcare-complete');
          
          UploadCare.DragDrop.idle = true;
        });
        
        uploading.error(function (errorNotReject) {
          errorNotReject = typeof errorNotReject === void 0 ? false : errorNotReject;
          
          if (errorNotReject) {
            UploadCare.Line.showError(widget, 'unknown', true, function() {
              UploadCare.Line.hideUploading(widget);
            });
          } else {
            filedata.css({
              top: 1
            });
            slider.css({
              "margin-top": 0
            });
            UploadCare.Line.hideUploading(widget);
            UploadCare.DragDrop.idle = true;
          }
        });
      };
      
      dropzone.bind('file-drop', function (ev, dev) {
        var files;
        files = dev.dataTransfer.files;
        if ( typeof files !== "undefined" && files !== null && files.length !== 0 ) {
          UploadCare.DragDrop.idle = false;
          upload(files);
        } else {
          UploadCare.DragDrop.onDragLeave(ev, dragzone, dropzone);
        }
      });
    },
    
    createDropZone: function ($, widget) {
      var cropper, dropZoneContainer, dropZoneNode, dropZoneNotification, dndLeftCorner, dndRightCorner, dropZoneDecorator;
      cropper = $(this.selectors.cropper, widget);
      
      dropZoneContainer = $('<div/>').attr({
        "class": this.useLargeDropZone ? "uploadcare-line-largedrop" : "uploadcare-line-tinydrop"
      });
      
      dropZoneDecorator = $('<div/>').attr({
        "class": "uploadcare-line-drop-decoration"
      }).css({
        width: widget.width() - 20,
        height: widget.height()
      });
      
      dropZoneArray = $('<span />').attr({
        "class": "dnd-arrow"
      });
      //dropZoneNotification.html('Drop files here');
      dropZoneArray.appendTo(dropZoneDecorator);
      
      dropZoneNotification = $('<span />');
      dropZoneNotification.html('Drop files here');
      dropZoneNotification.appendTo(dropZoneDecorator);
      
      dndLeftCorner = $('<div />').attr({ "class": "lc" });
      dndRightCorner = $('<div />').attr({ "class": "rc" });
      
      dndLeftCorner.appendTo(dropZoneDecorator);
      dndRightCorner.appendTo(dropZoneDecorator);
      dropZoneDecorator.appendTo(dropZoneContainer);
      
      dropZoneNode = $('<div/>').attr({
        "class": "uploadcare-line-dropzone"
      });
      dropZoneNode.css({
        width: widget.width(),
        height: widget.height()
      });
      
      dropZoneContainer.appendTo(cropper);
      dropZoneNode.appendTo(dropZoneContainer);
      return dropZoneNode;
    },
    
    dragDropEvents: function (dragzone, dropzone) {
      var cooldownEvent;
      
      cooldownEvent = function (ev) {
        ev.stopPropagation();
        ev.preventDefault();
        return ev;
      };
      
      var dde = function(event) {
        if ( UploadCare.DragDrop.eventTimer !== false ) {
          clearTimeout(UploadCare.DragDrop.eventTimer);
          UploadCare.DragDrop.eventTimer = false;
        }
        if ( UploadCare.DragDrop.idle === true ) {
          switch(event.type) {
            case 'drop':          
              UploadCare.DragDrop.started = false;
              UploadCare.DragDrop.onDragLeave(event, dragzone, dropzone);
              break;
            case 'dragleave':
              UploadCare.DragDrop.eventTimer = setTimeout(function() {
                UploadCare.DragDrop.started = false;
                UploadCare.DragDrop.onDragLeave(event, dragzone, dropzone);
              }, 100);
              break;
            case 'dragover':
            case 'dragenter':
              if ( UploadCare.DragDrop.started === false ) {
                UploadCare.DragDrop.started = true;
                UploadCare.DragDrop.onDragOver(event, dragzone, dropzone);
              }
          }
        }
        return cooldownEvent(event);
      }
      
      UploadCare.jQuery(document).bind('drop', dde).bind('dragenter', dde).bind('dragover', dde).bind('dragleave', dde);

      dropzone[0].ondrop = function (ev) {
        UploadCare.DragDrop.onDrop(cooldownEvent(ev), dragzone, dropzone);
        dropzone.trigger('file-drop', ev);
      };
      
      return null;
    },
    
    process: function (widget, hidden, files) {
      var deferred, form, getProgress, options, uploading, xhr;
      
      form = new FormData();
      deferred = UploadCare.jQuery.Deferred();
      options = UploadCare._params({
        pubKey: UploadCare.publicKey,
        meduim: 'line'
      });
      
      options.UPLOADCARE_FILE_ID = UploadCare._uuid();
      
      hidden.trigger('uploadcare-start');
      
      getProgress = function (ev) {
        if (ev.lengthComputable) {
          hidden.trigger('uploadcare-progress', {
            done: ev.loaded,
            total: ev.total
          });
        }
      };
      
      UploadCare.jQuery.each(options, function(key, value) {
        return form.append(key, value);
      });
      
      form.append('file', files[0]);
      
      xhr = new XMLHttpRequest;
      
      xhr.upload.addEventListener('progress', getProgress, false);
      xhr.addEventListener('abort', function() {
        return deferred.reject();
      }, false);
      xhr.addEventListener('error', function() {
        return deferred.reject(true);
      }, false);
      xhr.addEventListener('load', function() {
        return deferred.resolve(options.UPLOADCARE_FILE_ID);
      }, false);
      
      xhr.open("POST", UploadCare.byIframe._getUploadUrl(), true);
      xhr.send(form);
      
      uploading = UploadCare.jQuery('.uploadcare-line-uploading', widget);
      UploadCare.jQuery('.uploadcare-line-cancel', uploading).click(function() {
        xhr.abort();
      });
      return UploadCare._promise(deferred);
    },
    
    onDragOver: function (ev, dragzone, dropzone) {
      var widget = dragzone.parents(this.selectors.widget);
      
      widget.addClass('uploadcare-line-uploader-dnd');
      
      dragzone.parents(this.selectors.slider).css({
        "margin-top": -90
      });
      widget.find(this.selectors.filedata).css({
        top: -1
      });
      // dropzone.prev().animate(dropzone.prev().data('margin'));
      // widget.animate({
      //   width: 350,
      //   height: 70
      // }, function() {
      //   dropzone.css({
      //     width: 350,
      //     height: 70
      //   });
      // });
      
      return null;
    },
    
    onDragLeave: function (ev, dragzone, dropzone) {
      var widget = dragzone.parents(this.selectors.widget);
      var slider = dragzone.parents(this.selectors.slider);
      var filedata = widget.find(this.selectors.filedata);
      
      widget.removeClass('uploadcare-line-uploader-dnd');
      
      // dropzone.prev().animate({
      //   "margin-top": 0
      // });
      // widget.animate(widget.data('dimensions'), function() {
        slider.css({
          "margin-top": 0
        });
        filedata.css({
          top: 1
        });      
      // });
      
      return null; 
    },
    
    onDrop: function (ev, dragzone, dropzone) {
      var widget = dragzone.parents(this.selectors.widget);
      var slider = dragzone.parents(this.selectors.slider);
      var filedata = widget.find(this.selectors.filedata);
      
      widget.removeClass('uploadcare-line-uploader-dnd');
      
      // dropzone.prev().animate({
      //   "margin-top": 0
      // });
      // widget.animate(widget.data('dimensions'), function() {
        slider.css({
          "margin-top": -30
        });
        filedata.css({
          top: 1
        });
      // })
      
      return null;
    }
  };
})();

UploadCare.ready(function($) {
  $(document).bind('enlive', function() {
    UploadCare.DragDrop.init();
  });
});
