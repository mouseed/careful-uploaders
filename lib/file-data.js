(function() {
  UploadCare.FileData = {
    requestUrl: 'http://upload.uploadcare.com/info/',
    jQuery: null,
    initialized: false,
    _lastResponse: {},
    init: function($) {
      if ( UploadCare === undefined ) {
        throw "UploadCare not initialized.";
      }
      if ( !this.initialized ) {
        this.jQuery = $;
        this.requestUrl = this.requestUrl + ("?pub_key=" + UploadCare.publicKey);
      }
      this.initialized = true;
      return null;
    },
    getData: function(uuid, callback) {
      if ( !this.initialized ) {
        var root = this;
        UploadCare.ready(function($) {
          root._getData($, uuid, callback);
        });
      } else {
        this._getData(this.jQuery, uuid, callback);
      }
      
      return null;
    },
    _getData: function($, uuid, callback) {
      var data, requestUrl;
      if ( uuid === undefined ) {
        throw "UUID must be specified";
      }
      requestUrl = "" + this.requestUrl + "&file_id=" + uuid + "&jsoncallback=";
      if ( callback === undefined ) {
        requestUrl = "" + requestUrl + "UploadCare.FileData.jsonCallback";
        $.ajax({url: requestUrl, dataType: 'script'});
      } else {
        requestUrl = "" + requestUrl + "?"
        $.getJSON(requestUrl, callback);
      }
    },
    _getResult: function() {
      return this._lastResponse;    
    },
    jsonCallback: function(data) {
      var hidden = this.jQuery('input[value=' + data.file_id + ']');
      this._lastResponse = data;
      hidden.trigger('uploadcare-data-fetch-complete', data);
    }
  };
  window.UploadCare.FileData = UploadCare.FileData;
}).call(this);

UploadCare.ready(function($) {
  UploadCare.FileData.init($);
});
