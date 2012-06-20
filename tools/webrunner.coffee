[
  express, 
  path, 
  config, 
  coffee, 
  child
] = [
  require('express'), 
  require('path'), 
  require('./configTool'), 
  require('coffee-script'), 
  require('child_process')
]

config.dir
  .root('.')
  .add('public', 'spec')
  .add('suite', 'spec/suite')
  .add('lib', 'spec/lib')
  .add('helpers', 'spec/helpers')
  .add('node_modules', 'node_modules')
  .add('tmp', 'tmp')
  .add('src', 'spec/src')
  .add('fixtures', 'spec/fixtures')

config.bin
  .addToDir 'coffee', 'node_modules', 'coffee-script/bin/coffee'


app = express.createServer()

app.configure ->
  app.use express.logger()
  app.use express.methodOverride()
  app.use express.bodyParser({uploadDir: config.dir.get('tmp')})
  
  app.use app.router
  app.use express.static(config.dir.get('public'))
  
  app.set 'home', config.dir.get('public')
  app.set 'views', false
  app.set 'view options',
    layout: false
  
  app.enable 'strict routing'
  app.enable 'jsonp callback'
  
app.get '/', (rq, rs) ->
  rs.redirect '/index.html', 301
  
app.get '/javascripts/:file', (rq, rs) ->
  file = path.join(config.dir.get('lib'), "#{rq.params.file}")
  rs.contentType(file)
  rs.sendfile(file)
  
app.get /^\/(src|fixtures)\/([^\/]+)/, (rq, rs) ->
  [section, reqFile] = [rq.params[0], rq.params[1]]
  if section? and reqFile?
    sectionPath = config.dir.get(section)
    
    if sectionPath?
      file = path.join(sectionPath, "#{reqFile}")
      rs.contentType(file)
      rs.sendfile(file)
    else
      rs.send 404
  else
    rs.send 404

app.get /^\/(suite|helpers)\/([^\/]+)/, (rq, rs) ->
  [section, reqFile] = [rq.params[0], rq.params[1]]
  if section? and reqFile?
    sectionPath = config.dir.get(section)
    
    if sectionPath?
      file = path.join(sectionPath, "#{reqFile.replace(/\.js/, ".coffee")}")
      proc = child.spawn 'coffee', ["-l", "-p", "#{file}"], {cwd: path.dirname(config.bin.get('coffee'))}
      proc.stdout.on 'data', (d) ->
        rs.send d,
          'Content-Type': 'text/javascript'
        , 200
      proc.stderr.on 'data', (d) ->
        rs.send 404
    else
      rs.send 404
  else
    rs.send 404
    
app.post /^\/iframe(\/)?/, (rq, rs) ->
  rs.send
    file_id: rq.body.UPLOADCARE_FILE_ID
    token: 123456
  , 200
  
app.get /^\/from_url(\/)?/, (rq, rs) ->
  rs.send "#{rq.query.jsoncallback}({\"file_id\": \"d4336ac0-8b8b-11e1-b0c4-0800200c9a66\", \"token\": \"123456\"})", 200

app.get /^\/status(\/)?/, (rq, rs) ->
  rs.send "#{rq.query.jsoncallback}({\"file_id\": \"d4336ac0-8b8b-11e1-b0c4-0800200c9a66\", \"status\": \"success\"})", 200

Webrunner =
  'app': app
  'config': config

module.exports = Webrunner