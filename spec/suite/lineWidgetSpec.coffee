describe "UploadCare.Line", ->
  widgetInput = widgetContainer = rootContainer = null
  
  beforeEach ->
    loadFixtures "line-widget.html"
    rootContainer =  $ "div#jasmine-fixtures"
    widgetInput = $ "input[role='uploadcare-line-uploader']", rootContainer
  
  describe ".hiddenInput", ->
    it "should exist", ->
      expect(widgetInput).toExist()
      
    it "should have public key attribute", ->
      expect(widgetInput).toHaveAttr "data-public-key"
      
    it "should have instance id attribute after initialization", ->
      UploadCare.Line.init rootContainer
      expect(widgetInput).toHaveAttr "data-instance-id"
    
      
  describe ".uploader", ->
    instanceId =  null
    
    beforeEach ->
      rootContainer.hide()
      UploadCare.Line.init rootContainer
      [instanceId, widgetContainer] = [widgetInput.attr("data-instance-id"), $('div.uploadcare-line-uploader', rootContainer)]
      
      console.log widgetContainer
    
    it "should be initialized", ->
      expect(rootContainer).toContain "div.uploadcare-line-uploader"
      expect(instanceId).not.toBeNull()
    
    describe ".byUrl", ->
      remoteFile = urlInput = submit = pubkey = null
      
      beforeEach ->
        remoteFile = "http://nodejs.org/images/logo-light.png"
        pubkey = UploadCare.getInstanceOptions(instanceId).publicKey
        
      it "should start upload with pubkey from instance options", ->
        spyOn(UploadCare.byUrl, 'upload')
        UploadCare.upload remoteFile,
          meduim: 'line'
          publicKey: pubkey
        expect(UploadCare.byUrl.upload).toHaveBeenCalledWith remoteFile,
          UPLOADCARE_PUB_KEY: pubkey
          UPLOADCARE_MEDIUM: 'line'
          
      it "should post file URL and receive data", ->
        uploader = UploadCare.upload remoteFile,
          meduim: 'line'
          publicKey: pubkey
          
        spyOn uploader, 'success'  
        spyOn uploader, 'error'
        
        uploader.success (e) ->
          waitsFor -> e isnt null
        
        runs ->
          expect(uploader.success).toHaveBeenCalled()
          expect(uploader.error).not.toHaveBeenCalled()
          
    describe ".byIframe", ->
      file = pubkey = form = iframe = answer = successId = null
      
      beforeEach ->
        file = $('<input type="file" name="uploaded" />')
        pubkey = UploadCare.getInstanceOptions(instanceId).publicKey
        
      it "should upload file and receive file_id and token", ->
        success = jasmine.createSpy()
        
        try
          uploader = UploadCare.upload file,
            meduim: 'line'
            publicKey: pubkey
        catch error
          console.error error
        
        form = $ 'form'
        iframe = $ 'iframe'
        
        uploader.success (i) ->
          waitsFor -> i isnt null
        .success (i) ->
          answer = $.parseJSON iframe.contents().text()
          waitsFor -> i isnt null
          successId = i
        .error ->
          console.log 'wut'
          
        waitsFor -> answer isnt null
        
        runs ->  
          expect(answer.file_id).toEqual($('input[name="UPLOADCARE_FILE_ID"]', form).val())
          expect(answer.token).not.toBeNull()
          expect(answer.token).toEqual(123456)
          expect(answer.file_id).toEqual(successId)
        