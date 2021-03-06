fs     = require('fs')
sys    = require('sys')
path   = require('path')
haml   = require('haml')
child  = require('child_process')
watch  = require('watch')
uglify = require('uglify-js')
wrench = require('wrench')

build = (development) ->
  fs.mkdirSync('pkg/', 0755) unless path.existsSync('pkg/')

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
      sys.puts(message)

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

    wrench.rmdirSyncRecursive('tmp/') unless development

task 'build', 'Concatenate and compress widgets files', ->
  build()

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
    build('development')
