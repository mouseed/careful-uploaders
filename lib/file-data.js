;(function() {
  UploadCare.FileData = {
    timeout: 15000,
    
    fetch: function(uuid) {
      var requestUrl = this._getRequestUrl();
      requestUrl = "" + requestUrl + ("?pub_key=" + UploadCare.publicKey);

      if ( typeof uuid === void 0 ) {
        throw "UUID must be specified";
      }
      
      requestUrl = "" + requestUrl + "&file_id=" + uuid + "&jsoncallback=?";
      
      try {
        var _$       = UploadCare.jQuery(this);
        var deferred = UploadCare.jQuery.Deferred();
        var xhr      = UploadCare.jQuery.ajax( requestUrl, {
          dataType: "jsonp",
          global: true,
          beforeSend: function(jqXHR, settings) {
            _$.data('_xhr', jqXHR);
            
            jqXHR.state = function() { 
              return jqXHR.isResolved() ? "resolved" : (jqXHR.isRejected() ? "rejected" : "pending"); 
            }

            UploadCare.jQuery(_$).bind('start-timeout', function(ev, t) {
              var tries = interval = 0;
            
              t = ( t === void 0 || typeof(t) == "undefined" ) ? _$.timeout : t;
              
              if ( jqXHR.readyState != 4 && (void 0 === jqXHR.status || jqXHR.status >= 400) ) {
                var timer = setInterval(function() {
                  switch( jqXHR.state() ) {
                    case "resolved":
                    case "rejected":
                      void( 0 );
                      break;
                    case "pending":
                      if ( tries < 3 ) {
                        tries += 1;
                      } else {
                        clearInterval(timer);
                        jqXHR.abort();
                      }
                      break;
                  }
                }, t);
              }
            });
            
            return true;
          }
        }).success( function(data) {
          deferred.resolve(data);
        }).error( function(e) {
          deferred.reject('misconfiguration');
        });
      } catch( error ) {
        deferred.reject('misconfiguration');
      } finally {
        if ( !deferred.isResolved() ) {
          if ( !xhr || xhr === void 0 ) {
            xhr = _$.data('_xhr');
          }
          
          if ( !xhr.isResolved() ) {
            _$.triggerHandler('start-timeout', 1000);
          } else {
            deferred.resolve(xhr.data('response'));
          }
        }
      }

      return UploadCare._promise(deferred);
    },
    
    _getRequestUrl: function() {
      return UploadCare.urls.fileInfo;    
    }
  };
  
  UploadCare.jQuery(document).ready(function() {
    UploadCare.jQuery.ajaxPrefilter( "script", function( s ) {
    	if ( s.cache === undefined ) {
    		s.cache = false;
    	}
    	if ( s.crossDomain ) {
    		s.type = "GET";
    		s.global = true;
    	}
    });
  });
})();
