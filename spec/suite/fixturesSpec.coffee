describe 'UploadCare', ->
  rootContainer = null
  
  beforeEach ->
    loadFixtures 'plain-widget.html', 'line-widget.html'
    rootContainer = $ 'div#jasmine-fixtures'
  
  describe 'plain widget fixture', ->
    it 'should appear in SpecRunner', ->
      expect(rootContainer).toContain('input[role="uploadcare-plain-uploader"]')
      
  describe 'line widget fixture', ->
    it 'should appear in SpecRunner', ->
      expect(rootContainer).toContain('input[role="uploadcare-line-uploader"]')