;(function() {
  UploadCare.FileData = {
    requestUrl: 'http://upload.uploadcare.com/info/',
    _lastResponse: {},
    fetch: function(uuid, callback) {
      var requestUrl = this.requestUrl;
      requestUrl = "" + requestUrl + ("?pub_key=" + UploadCare.publicKey);
      UploadCare.ready(function($) {
        if ( uuid === undefined ) {
          throw "UUID must be specified";
        }
        if ( callback === undefined ) {
          throw "Callback must be specified";
        }
        requestUrl = "" + requestUrl + "&file_id=" + uuid + "&jsoncallback=?";
        $.getJSON(requestUrl, callback);
      });
      return null;
    },
    _getResult: function() {
      return this._lastResponse;    
    }
  };
})();
