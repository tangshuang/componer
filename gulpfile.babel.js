import gulp from 'gulp'
import babel from 'gulp-babel'

gulp.task('build', () => {
    gulp.src('./bin/**/*')
        .pipe(babel())
        .pipe(gulp.dest('./.bin'))
})

gulp.task('watch', ['build'], () => {
    gulp.watch('./bin/**/*', ['build'])
})
