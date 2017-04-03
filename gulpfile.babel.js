import gulp from 'gulp'
import babel from 'gulp-babel'
import shell from 'shelljs'

gulp.task('build', () => {
    gulp.src('./bin/**/*')
        .pipe(babel())
        .pipe(gulp.dest('./.bin'))
})

gulp.task('install', () => {
    let info = require('./package.json')
    let deps = info.dependencies
    let devdeps = info.devDependencies
    let install = function(deps) {
        for(let name in deps) {
            let version = deps[name]
            shell.exec('npm install ' + name + '@' + version)
        }
    }

    install(deps)
    install(devdeps)
})
