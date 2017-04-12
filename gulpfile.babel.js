import path from 'path'
import gulp from 'gulp'
import babel from 'gulp-babel'
import extend from 'extend'
import {execute, exit} from './generator/gulp/utils/process'
import {readJSON, writeJSON, exists} from './generator/gulp/utils/file'
import {getVersion} from './bin/utils/package'

gulp.task('build', () => {
    // cli
    gulp.src('./bin/**/*')
        .pipe(babel())
        .pipe(gulp.dest('./.bin'))
    // pacakges
    let ginfo = readJSON('./generator/package.json');
    let devdeps = ginfo.devDependencies
    let cinfo = readJSON('./package.json')
    let deps = cinfo.dependencies
    cinfo.dependencies = extend(true, deps, devdeps)
    writeJSON(__dirname + '/package.json', cinfo)
})

gulp.task('install', () => {
    let info = require('./package.json')
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
            execute('npm install ' + name + '@' + version, true, () => {
                let pkgDir = path.join(__dirname, 'node_modules', name)
                execute(`rm -rf "${pkgDir}"`)
            })
        })
    }

    install(deps)
    install(devdeps)
})

gulp.task('watch', ['build', 'install'], () => {
    gulp.watch(['./bin/**/*', './generator/package.json'], ['build', 'install'])
})
