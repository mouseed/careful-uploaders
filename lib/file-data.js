;(function() {
  UploadCare.FileData = {
    fetch: function(uuid, callback) {
      var requestUrl = this._getRequestUrl();
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
    _getRequestUrl: function() {
      return UploadCare.urls.fileInfo;    
    }
  };
})();
