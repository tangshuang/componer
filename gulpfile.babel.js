import gulp from 'gulp'
import babel from 'gulp-babel'
import shell from 'shelljs'

gulp.task('build', () => {
    gulp.src('./bin/**/*')
        .pipe(babel())
        .pipe(gulp.dest('./.bin'))
})

gulp.task('watch', ['build'], () => {
    gulp.watch('./bin/**/*', ['build'])    
})

gulp.task('install', () => {
    let info = require('./package.json')
    let deps = info.dependencies
    let devdeps = info.devDependencies
    let peerdeps = info.peerDependencies
    let install = function(deps) {
        let items = Object.keys(deps)
        items.forEach(name => {
            let version = deps[name]
            let result = shell.exec('npm install ' + name + '@' + version)
            if(result && result.code !== 0) {
                process.exit(result.code)
            }
        })
    }

    install(deps)
    install(devdeps)
    install(peerdeps)
})
