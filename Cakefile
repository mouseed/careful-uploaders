fs     = require('fs-extra')
path   = require('path')
haml   = require('haml')
child  = require('child_process')
watch  = require('watch')
uglify = require('uglify-js')
wrench = require('wrench')
events = require('events')

listener = new events.EventEmitter()

build = (development) ->
  fs.mkdirSync('pkg/', '0755') unless path.existsSync('pkg/')

  pack = (bundleName, files) ->
    js = files.reduce ( (all, i) -> all + fs.readFileSync(i) ), ''

    unless development
      ast = uglify.parser.parse(js)
      ast = uglify.uglify.ast_mangle(ast)
      ast = uglify.uglify.ast_squeeze(ast)
      js  = uglify.uglify.gen_code(ast)

    fs.writeFileSync("pkg/#{bundleName}.js", js)

  template = (hamlFile, jsFile) ->
    dir  = path.basename(path.dirname(hamlFile))
    name = dir[0].toUpperCase() + dir[1..-1]
    html = haml(fs.readFileSync(hamlFile).toString())()
    js   = "UploadCare.#{name}.html = '"
    js  += html.toString().replace(/\s+/g, ' ')
    js  += "';"
    fs.writeFileSync(jsFile, js)

  child.exec 'bash -c "compass compile"', (error, message) ->
    if error
      process.stderr.write(error.message)
      process.exit(1) unless development
    if development
      console.log(message)

    bundles = JSON.parse(fs.readFileSync('bundles.json'))
    for bundle, files of bundles
      i18n = false
      translations = null

      for filepath, i in files
        if filepath.match /i18n$/
          [i18n, translations] = [i, "lib/#{filepath}"]
        else if filepath.match /\.sass$/
          filepath = filepath.replace(/sass$/, 'js')
          files[i] = "tmp/#{filepath}"
        else if filepath.match /\.haml$/
          jsPath = filepath.replace(/haml$/, 'js')
          files[i] = "tmp/#{jsPath}"
          template("lib/#{filepath}", files[i])
        else
          files[i] = "lib/#{filepath}"

      if i18n
        for translation in fs.readdirSync(translations)
          locale = translation.replace('.js', '')
          files[i18n] = path.join(translations, translation)
          pack("#{bundle}.#{locale}", files)
      else
        pack(bundle, files)

    listener.emit('builded', {'devMode': development})
    wrench.rmdirSyncRecursive('tmp/') unless development

collect_assets = (development = false) ->
  version    = JSON.parse(fs.readFileSync('package.json'))['version']
  assetsPath = "pkg/assets/#{version}"

  if path.existsSync(assetsPath)
    for extfile in fs.readdirSync(assetsPath)
      if /\.js/.test(extfile) and /uploadcare/.test(extfile)
        fs.unlinkSync "#{assetsPath}/#{extfile}"
  else
    fs.mkdirSync assetsPath, '0755'

  finalPath = assetsPath + "/" + (if development then "development" else "production")

  if path.existsSync(finalPath)
    wrench.rmdirSyncRecursive(finalPath)

  fs.mkdirSync finalPath, '0755'

  for srcfile in fs.readdirSync('pkg/')
    if /\.js/.test(srcfile)
      src = fs.readFileSync "pkg/#{srcfile}"

      newFileName = switch true
        when /line/.test(srcfile)
          if /\.en/.test(srcfile)
            "uploadcare.js"
          else
            srcfile.replace('line-widget.', 'uploadcare_')
        when /plain/.test(srcfile) then srcfile.replace('plain-widget', 'uploadcare_plain')
        when /uploader/.test(srcfile) then "uploadcare_#{srcfile}"
  
      newFileName = newFileName.replace('.js', '.min.js') unless development

      fs.writeFileSync "#{finalPath}/#{newFileName}", src
  
  results =
    'version': version
    'rootPath': assetsPath
    'path': finalPath
    'devMode': development

  listener.emit('collected', results)

  results

clean_pkg = ->
  for srcfile in fs.readdirSync('pkg/')
    if /\.js/.test(srcfile)
      fs.unlinkSync "pkg/#{srcfile}"
  listener.emit('cleaned')

build_assets = ->
  results = []

  listener.on 'builded', (s) ->
    try
      collect_assets(s['devMode'])
    catch error
      console.error error

  listener.once 'cleaned', (s) ->
    build(true)

  listener.on 'collected', (s) ->
    results.push s

    if results.length is 2
      listener.emit 'assetsFinished', results
    else
      clean_pkg()

  build()

  listener.once 'assetsFinished', (s) ->
    for result in results
      console.log "Widget bundle of version #{result['version']} was build with " + (if result['devMode'] then "development" else "production") + " environment."
      console.log "Destination path: #{result['path']}"
      console.log "\n"

    listener.removeAllListeners()

task 'build', 'Concatenate and compress widgets files', ->
  build()

task 'dev-build', 'Development build', ->
  build(true)

task 'assets-build', 'Build widgets for using in Rails gem with assets pipeline', ->
  build_assets()
  
task 'clobber', 'Delete all generated files', ->
  wrench.rmdirSyncRecursive('pkg/') if path.existsSync('pkg/')

task 'test', 'Run specs server', ->
  webrunner = require('./tools/webrunner')
  webrunner.app.listen 8124
  console.log 'Server started, 127.0.0.1:8124'

task 'watch', 'Rebuild widgets after any file changes', ->
  build('development')
  watch.watchTree 'lib/', ->
    console.log('Rebuild')
    build(true)
