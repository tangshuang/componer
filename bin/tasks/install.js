import path from 'path'
import {log, execute} from '../utils/process'
import {exists, readJSON} from '../utils/file'

export default function(commander) {
    commander
    .command('install')
	.description('install dependencies one by one for componout')
	.action(() => {
        let cwd = process.cwd()
        let bower = path.resolve(__dirname, '../../node_modules/.bin/bower')
        let bowerJson = path.join(cwd, 'bower.json')
        let npmJson = path.join(cwd, 'package.json')

        let exec = (deps, driver, sep) => {
            if(!deps) return
            let items = Object.keys(deps)
            for(let name in items) {
                let version = deps[name]
                execute(driver + ' install ' + name + sep + version, true)
            }
        }
        let install = (jsonfile, driver, sep) => {
            let info = readJSON(jsonfile)
            let deps = info.dependencies
            let devdeps = info.devDependencies
            let peerdeps = info.peerDependencies
            exec(deps, driver, sep)
            exec(devdeps, driver, sep)
            exec(peerdeps, driver, sep)
        }

        install(npmJson, 'npm', '@')
        install(bowerJson, `"${bower}"`, '#')
    })
}
