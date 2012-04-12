[
  express, 
  path, 
  config, 
  coffee, 
  child
] = [
  require('express'), 
  require('path'), 
  {dir: {}, bin: {}}, 
  require('coffee-script'), 
  require('child_process')
]

config.dir.root = path.normalize(__filename + '/../../')

[
  app, 
  config.dir.public, 
  config.dir.suite, 
  config.dir.lib,
  config.dir.helpers,
  config.dir.node_modules,
] = [
  express.createServer(), 
  path.join(config.dir.root, 'spec'), 
  path.join(config.dir.root, 'spec', 'suite'),
  path.join(config.dir.root, 'spec', 'lib'),
  path.join(config.dir.root, 'spec', 'helpers'),
  path.join(config.dir.root, 'node_modules')
]

[config.bin.coffee] = [path.join(config.dir.node_modules, 'coffee-script', 'bin') + '/coffee']

app.configure ->
  app.use express.logger()
  app.use express.bodyParser()
  app.use express.methodOverride()
  
  app.use app.router
  app.use express.static(config.dir.public)
  
  app.set 'home', config.dir.public
  app.set 'views', false
  app.set 'view options', 
  
  app.enable 'strict routing'
  app.enable 'jsonp callback'
  
app.get '/', (rq, rs) ->
  rs.redirect '/index.html', 301
  
app.get '/javascripts/:file', (rq, rs) ->
  file = path.join(config.dir.lib, "#{rq.params.file}")
  rs.contentType(file)
  rs.sendfile(file)
  
app.get '/src/:file', (rq, rs) ->
  file = path.join(path.normalize(config.dir.lib + "/../src"), "#{rq.params.file}")
  rs.contentType(file)
  rs.sendfile(file)

# TODO: Merge suite and helpers routes  
app.get '/suite/:file', (rq, rs) ->
  file = path.join(config.dir.suite, "#{rq.params.file.replace(/\.js/, ".coffee")}")
  proc = child.spawn 'coffee', ["-l", "-p", "#{file}"], {cwd: path.dirname(config.bin.coffee)}
  proc.stdout.on 'data', (d) ->
    rs.send d,
      'Content-Type': 'text/javascript'
    , 200
  proc.stderr.on 'data', (d) ->
    rs.send 404

app.get '/helpers/:file', (rq, rs) ->
  file = path.join(config.dir.helpers, "#{rq.params.file.replace(/\.js/, ".coffee")}")
  proc = child.spawn 'coffee', ["-l", "-p", "#{file}"], {cwd: path.dirname(config.bin.coffee)}
  proc.stdout.on 'data', (d) ->
    rs.send d,
      'Content-Type': 'text/javascript'
    , 200
  proc.stderr.on 'data', (d) ->
    rs.send 404

# Extracted from old test task in Cakefile
# formidable should do the trick
#    
# formidable = require('formidable')
# server.app.post '/iframe', (req, res) ->
#   form = new formidable.IncomingForm()
#   form.parse req, (error, fields, files) ->
#     res.writeHead(200, { 'Content-Type': 'text/plain' })
#     res.write(JSON.stringify(fields))
#     res.end()

Webrunner =
  'app': app
  'config': config

module.exports = Webrunner