;(function() {
  UploadCare.FileData = {
    fetch: function(uuid, success_callback, error_callback) {
      var requestUrl = this._getRequestUrl();
      requestUrl = "" + requestUrl + ("?pub_key=" + UploadCare.publicKey);
      UploadCare.ready(function($) {
        if ( typeof uuid === void 0 ) {
          throw "UUID must be specified";
        }
        if ( typeof success_callback === void 0 ) {
          throw "Callback must be specified";
        }
        if ( typeof error_callback === void 0 ) {
          error_callback = function(d) {};
        }
        requestUrl = "" + requestUrl + "&file_id=" + uuid + "&jsoncallback=?";
        $.ajax(requestUrl, {dataType: "jsonp", success: success_callback, error: error_callback});
      });
      return null;
    },
    _getRequestUrl: function() {
      return UploadCare.urls.fileInfo;    
    }
  };
})();
