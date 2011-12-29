;(function () {
"use strict";

UploadCare.Barebone = {
  init: UploadCare._widgetInit('uploadcare-barebone-uploader'),
  eventTimer: null,
  idle: true,
  started: false,
  
  enlive: function(input, options) {
    UploadCare.jQuery(input).attr('data-barebone', 1);
    UploadCare.Plain.enlive(input, options);
    this._stateCallbacks(input);
  },
  
  _stateCallbacks: function(input) {
    var instanceId = UploadCare.jQuery(input).attr('data-instance-id');
    
    if ( instanceId ) {
      instance = UploadCare.getInstance( instanceId );
    }
    
    if ( instance ) {
      var root = this;
      var list = root._createFileList(input);

      instance.state.setCallback('afterUpload', function() {
        var filedata = UploadCare.FileData.fetch(UploadCare.jQuery(input).val(), instanceId);
        
        filedata.success(function(data) {
          root._addFileInfo(data, list);
        });
      });
      
      //root._createDropZone(input, list);
    }
  },
  
  _createFileList: function(input) {
    var instanceId = UploadCare.jQuery(input).attr('data-instance-id');
    var list = UploadCare.jQuery('<ul class="uploadcare-barebone-filelist filelist-'+ instanceId +'"></ul>');
    
    list.bind('item-removed', function(e, data) {
      //var vals = UploadCare.jQuery(input).val();
    });
    list.insertAfter(UploadCare.jQuery(input).next());
    
    return list;
  },
  
  _createFileHiddenField: function(input, data) {
    
  },
  
  _createDropZone: function(input, list) {
    var cooldownEvent;
    
    cooldownEvent = function (ev) {
      ev.stopPropagation();
      ev.preventDefault();
      return ev;
    };
    
    var dde = function(event) {
      if ( UploadCare.Barebone.eventTimer !== false ) {
        clearTimeout(UploadCare.Barebone.eventTimer);
        UploadCare.Barebone.eventTimer = false;
      }
      if ( UploadCare.Barebone.idle === true ) {
        switch(event.type) {
          case 'drop':          
            UploadCare.Barebone.started = false;
            UploadCare.Barebone.onDragLeave(event, list);
            break;
          case 'dragleave':
            UploadCare.Barebone.eventTimer = setTimeout(function() {
              UploadCare.Barebone.started = false;
              UploadCare.Barebone.onDragLeave(event, list);
            }, 100);
            break;
          case 'dragover':
          case 'dragenter':
            if ( UploadCare.Barebone.started === false ) {
              UploadCare.Barebone.started = true;
              UploadCare.Barebone.onDragOver(event, list);
            }
        }
      }
      return cooldownEvent(event);
    }
    
    UploadCare.jQuery(list).bind('drop', dde).bind('dragenter', dde).bind('dragover', dde).bind('dragleave', dde);

    dropzone[0].ondrop = function (ev) {
      UploadCare.Barebone.onDrop(cooldownEvent(ev), list);
      dropzone.trigger('file-drop', ev);
    };
  },
  
  _addFileInfo: function(data, list) {
    var item = UploadCare.jQuery('<li>'+data.original_filename+' &mdash; OK</li>');
    item.attr('data-file-id', data.file_id);
    item.appendTo(list);
    this._addDeleteButton(data, item);
  },
  
  _addDeleteButton: function(data, item) {
    var button = UploadCare.jQuery('<a href="javascript:void(0)">delete</a>');
    button.click(function(e) {
      e.preventDefault();
      item.parent().trigger('item-removed', item.attr('data-file-id'));
      item.remove();
    });
    item.append('&nbsp;');
    button.appendTo(item);
  }
};

})();