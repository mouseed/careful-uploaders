(function() {
  UploadCare.FileData = {
    requestUrl: 'http://upload.uploadcare.com/info/',
    publicKey: null,
    jQuery: null,
    initialized: false,
    lastResponse: null,
    hidden: null,
    init: function() {
      if (UploadCare === undefined || UploadCare.jQuery === undefined) {
        throw "UploadCare not initialized.";
      }
      if (!this.initialized) {
        this.jQuery = UploadCare.jQuery;
        this.publicKey = this.jQuery("script[data-public-key]").attr("data-public-key");
        this.requestUrl = this.requestUrl + ("?pub_key=" + this.publicKey);
      }
      this.initialized = true;
      return null;
    },
    getData: function(uuid) {
      var data, requestUrl;
      this._checkInitialized();
      if (uuid === undefined) {
        throw "UUID must be specified";
      }
      requestUrl = "" + this.requestUrl + "&file_id=" + uuid + "&jsoncallback=UploadCare.FileData.jsonCallback";
      this.hidden = this.jQuery('input[value=' + uuid + ']');
      this.jQuery.ajax({url: requestUrl, dataType: 'script'});
      return null;
    },
    getResult: function() {
      return this.lastResponse;    
    },
    jsonCallback: function(data) {
      this.lastResponse = data;
      this.hidden.trigger('uploadcare-data-fetch-complete');
    },
    _checkInitialized: function() {
      if (!this.initialized) {
        this.init();
      }
      return null;
    }
  };
  window.UploadCare.FileData = UploadCare.FileData;
}).call(this);
