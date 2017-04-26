import gulp from 'gulp'
import babel from 'gulp-babel'

gulp.task('build', () => {
    // build bin/* to .bin
    gulp.src('./bin/**/*')
        .pipe(babel())
        .pipe(gulp.dest('./.bin'))
    // build drivers to .bin
    gulp.src('./generator/gulp/drivers/**/*')
        .pipe(babel())
        .pipe(gulp.dest('./.bin/drivers'))
    // build utils
    gulp.src([
            './generator/gulp/utils/file.js',
            './generator/gulp/utils/convert-name.js',
            './generator/gulp/utils/crypt.js',
        ])
        .pipe(babel())
        .pipe(gulp.dest('./.bin/utils'))
})
