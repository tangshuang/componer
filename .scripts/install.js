var path = require('path')
var shell = require('shelljs')

var cwd = path.resolve(__dirname, '..')
var yarn = path.resolve(__dirname, '../node_modules/.bin/yarn')
var info = require('../package.json')
var deps = info.dependencies

for(var dep in deps) {
    if((['shelljs', 'yarn']).indexOf(dep) > -1) continue
    
    var version = deps[name]
    var pkg = dep + '@' + version
    shell.exec('cd "' + cwd + '" && "' + yarn + '" add ' + pkg)
}
