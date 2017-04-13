import path from 'path'
import gulp from 'gulp'
import extend from 'extend'
import {execute, exit} from './generator/gulp/utils/process'
import {readJSON, writeJSON, exists} from './generator/gulp/utils/file'
import {getVersion} from './bin/utils/package'

const yarn = path.resolve(__dirname, 'node_modules/.bin/yarn')

gulp.task('install', () => {
    let info = readJSON('./package.json')
    let deps = info.dependencies
    let devdeps = info.devDependencies
    let install = function(deps) {
        let items = Object.keys(deps)
        items.forEach(name => {
            let version = deps[name]

            let pkgJson = path.join(__dirname, 'node_modules', name, 'package.json')
            if(exists(pkgJson)) {
                let pkgVersion = readJSON(pkgJson).version
                if(getVersion(version) <= getVersion(pkgVersion)) return
            }

            console.log(`installing ${name}@${version} ...`)
            execute(`"${yarn}" add ${name}@${version}`, true, () => {
                let pkgDir = path.join(__dirname, 'node_modules', name)
                execute(`rm -rf "${pkgDir}"`)
            })
        })
    }

    install(deps)
    install(devdeps)
})
