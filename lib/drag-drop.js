;(function() {
  UploadCare.DragDrop = {
    useLargeDropZone: false,
    
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
      
      dropzone.prev().data('margin', {
        "margin-top": dropzone.prev().css('margin-top')
      });
      
      widget.data('dimensions', {
        width: widget.width(),
        height: widget.height()
      });
      
      this.dragDropEvents(dragzone, dropzone);
      
      upload = function (files) {
        var uploading;
        
        uploading = UploadCare.DragDrop.process(widget, hidden, files);
        uploading.success(function (id) {
          hidden.val(id);
          hidden.trigger('uploadcare-success', id);
          hidden.trigger('uploadcare-complete');
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
          }
        });
      };
      
      dropzone.bind('file-drop', function (ev, dev) {
        var files;
        
        files = dev.dataTransfer.files;
        if ( typeof files !== "undefined" && files !== null ) {
          upload(files);
        }
      });
    },
    
    createDropZone: function ($, widget) {
      var cropper, dropZoneContainer, dropZoneNode, dropZoneNotification;
      cropper = $(this.selectors.cropper, widget);
      
      dropZoneContainer = $('<div/>').attr({
        "class": this.useLargeDropZone ? "uploadcare-line-largedrop" : "uploadcare-line-tinydrop"
      });
      
      dropZoneNotification = $('<span />');
      dropZoneNotification.html('Drop files here');
      dropZoneNotification.appendTo(dropZoneContainer);
      
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
      
      UploadCare.jQuery(document).bind('drop', cooldownEvent).bind('dragenter', cooldownEvent).bind('dragover', cooldownEvent).bind('dragleave', cooldownEvent);
      
      dragzone.bind('dragover', function (ev) {
        UploadCare.DragDrop.onDragOver(cooldownEvent(ev), dragzone, dropzone);
      });
      dropzone.bind('dragleave', function (ev) {
        UploadCare.DragDrop.onDragLeave(cooldownEvent(ev), dragzone, dropzone);
      });
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
      
      dragzone.parents(this.selectors.slider).css({
        "margin-top": -90
      });
      widget.find(this.selectors.filedata).css({
        top: -1
      });
      dropzone.prev().animate(dropzone.prev().data('margin'));
      widget.animate({
        width: 350,
        height: 70
      }, function() {
        dropzone.css({
          width: 350,
          height: 70
        });
      });
    },
    
    onDragLeave: function (ev, dragzone, dropzone) {
      var widget = dragzone.parents(this.selectors.widget);
      var slider = dragzone.parents(this.selectors.slider);
      var filedata = widget.find(this.selectors.filedata);
      
      dropzone.prev().animate({
        "margin-top": 0
      });
      
      widget.animate(widget.data('dimensions'), function() {
        slider.css({
          "margin-top": 0
        });
        filedata.css({
          top: 1
        });      
      });      
    },
    
    onDrop: function (ev, dragzone, dropzone) {
      var widget = dragzone.parents(this.selectors.widget);
      var slider = dragzone.parents(this.selectors.slider);
      var filedata = widget.find(this.selectors.filedata);
      
      dropzone.prev().animate({
        "margin-top": 0
      });
      widget.animate(widget.data('dimensions'), function() {
        slider.css({
          "margin-top": -30
        });
        filedata.css({
          top: 1
        });
      })
      
      return null;
    }
  };
})();

UploadCare.ready(function($) {
  $(document).bind('enlive', function() {
    UploadCare.DragDrop.init();
  });
});
