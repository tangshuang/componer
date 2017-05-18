import path from 'path'
import {execute, log} from '../utils/process'
import {check, fixname, root} from '../utils/componer'
import {dashName} from '../utils/convert-name'
import {exists, symlink, isSymLink, unSymlink, remove, readJSON, scandir} from '../utils/file'

const cwd = root()
const bower = path.resolve(__dirname, '../../node_modules/.bin/bower')

export default function(name, options) {
    let LinkPkg = name => {
        let jsonfile = `${cwd}/componouts/${name}/componer.json`
        if(!exists(jsonfile)) {
            log(name + '/componer.json not found!', 'warn')
            return
        }
        let info = readJSON(jsonfile)
        let type = info.type
        if(type === 'bower' && exists(`${cwd}/componouts/${name}/bower.json`)) {
            remove(`${cwd}/bower_components/${name}`)
            if(options.force) {
                execute(`cd "${cwd}/componouts/${name}" && "${bower}" link`)
                execute(`cd "${cwd}" && "${bower}" link ${name}`)
            }
            else {
                symlink(`${cwd}/componouts/${name}`, `${cwd}/bower_components/${name}`)
            }
            log(name + ' is linked as bower component.', 'done')
        }
        if(type === 'npm' && exists(`${cwd}/componouts/${name}/package.json`)) {
            remove(`${cwd}/node_modules/${name}`)
            if(options.force) {
                execute(`cd "${cwd}/componouts/${name}" && npm link`)
                execute(`cd "${cwd}" && npm link ${name}`)
            }
            else {
                symlink(`${cwd}/componouts/${name}`, `${cwd}/node_modules/${name}`)
            }
            log(name + ' is linked as npm package.', 'done')
        }
        else {
            log(name + ' type not support link.', 'warn')
        }
    }
    
    if(name === undefined) {
        check()
        scandir(`${cwd}/componouts`).forEach(item => LinkPkg(item))
    }
    else {
        name = dashName(name)
        name = fixname(name)
        check(name)
        LinkPkg(name)
    }
}
