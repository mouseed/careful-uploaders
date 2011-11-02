/*
    Problems:
        1. We're unable to control XMLHttpRequest from widget namespaces, so we cannot to abort XHR on demand.
        2. Use of CORS for uploads by url is not DRY because of partial code duplication with UploadCare.byUrl. 
            On the other hand, why we need CORS only for file uploads?
*/

UploadCare._corsAllowed = "withCredentials" in new XMLHttpRequest

UploadCare.upload = function(file, options) {
    var params = UploadCare._params(options);
    if ( UploadCare._corsAllowed ) {
        return UploadCare.byXHR2.upload(file, params);
    } else {
        if ( typeof(file) == 'string' ) {
            return UploadCare.byUrl.upload(file, params);
        } else {
            return UploadCare.byIframe.upload(file, params);
        }
    } 
}

UploadCare.byXHR2 = {
    _getUploadUrl: function() {
        return UploadCare.urls.byXHR2.upload;
    },
    
    upload: function(file, options) {
        var deferred = UploadCare.jQuery.Deferred();
        var xhr = new XMLHttpRequest;
        var watchers = [];
        var progress = null;
        var id = null;
        var promise  = UploadCare._promise(deferred, {
            progress: function (callback) {
                watchers.push(callback);
                return this;
            }
        });
        
        if ( typeof(file) === "object" ) {
            var form = new FormData();
            
            id = UploadCare._uuid();
            options.UPLOADCARE_FILE_ID = id;
            
            for (option in options) {
                form.append(option, options[option]);
            }
            form.append('file', file);
            
            progress = function(ev) {
                if ( ev.lengthComputable ) {
                    for ( var i = 0; i < watchers.length; i++ ) {
                        watchers[i]({done: ev.loaded, total: ev.total});
                    }
                }
                if ( ev.loaded == ev.total ) {
                    
                }
            }

            xhr.upload.addEventListener('progress', progress, false);
            
            xhr.addEventListener('abort', function() {
                return deferred.reject();
            }, false);
            xhr.addEventListener('error', function() {
                return deferred.reject(true);
            }, false);
            xhr.addEventListener('load', function() {
                return deferred.resolve(id);
            }, false);
            
            xhr.open("POST", this._getUploadUrl(), true);
            xhr.send(form);
        } else {
            //We can use jQuery, it supports CORS
            //For now, fallback to UploadCare.byUrl
            promise = UploadCare.byUrl.upload(file, options);
        }
        
        return promise;
    }
}
