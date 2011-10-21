;(function() {
  UploadCare.FileData = {
    requestUrl: 'http://upload.uploadcare.com/info/',
    _lastResponse: {},

    getData: function(uuid, callback) {
      var requestUrl = this.requestUrl;
      var root = this;
      requestUrl = "" + requestUrl + ("?pub_key=" + UploadCare.publicKey);
      UploadCare.ready(function($) {
        if ( uuid === undefined ) {
          throw "UUID must be specified";
        }
        requestUrl = "" + requestUrl + "&file_id=" + uuid + "&jsoncallback=";
        if ( callback === undefined ) {
          requestUrl = "" + requestUrl + "UploadCare.FileData.jsonCallback";
          $.ajax({url: requestUrl, dataType: 'script'});
        } else {
          requestUrl = "" + requestUrl + "?"
          $.getJSON(requestUrl, callback);
        }
      });
          
      return null;
    },
    _getResult: function() {
      return this._lastResponse;    
    },
    jsonCallback: function(data) {
      this._lastResponse = data;
      UploadCare.Line.showFileData(data);
    }
  };
})();
