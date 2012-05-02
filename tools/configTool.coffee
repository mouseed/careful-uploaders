path = require 'path'

ConfigTool = {}
ConfigTool.dir =
  list: {}
  root: (_path) ->
    @_root = path.resolve _path
    @
  add: (name, dir) ->
    if name? and dir?
      _p = if dir.charAt(0) isnt '/'
        path.normalize path.join @_root, dir
      else
        dir
      @list[name] = path.normalize _p
    @
  remove: (name) ->
    delete @list[name]
    @
  get: (name) ->
    @list[name]
      
ConfigTool.bin =
  list: {}
  add: (name, _path) ->
    @list[name] = path.resolve _path
    @
    
  remove: (name) ->
    delete @list[name]
    @
    
  get: (name) ->
    @list[name]
    
  addToDir: (name, dir, addition) ->
    _path = ConfigTool.dir.get dir
    _path = path.normalize path.join _path, addition if addition?
    @.add name, _path
    @
  
ConfigTool.globalizeDirs = () ->
  vm = require 'vm'
  res = []
  if @.dir.list isnt undefined
    for attr, value of @.dir.list
      res.push "__#{attr} = '#{value}';"
  vm.runInThisContext res.join(' ')

module.exports = ConfigTool
  
# ConfigTool.dir.root('../').add('spec', 'spec')
# ConfigTool.bin.addToDir 'runner', 'spec', 'runner'
# ConfigTool.globalizeDirs()
# console.log ConfigTool
# console.log __spec