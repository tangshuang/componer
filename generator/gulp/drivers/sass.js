import path from 'path'
import gulp from 'gulp'
import sass from 'gulp-sass'
import cssmin from 'gulp-cssmin'
import postcss from 'gulp-postcss'
import cssnext from 'postcss-cssnext'
import rename from 'gulp-rename'
import sourcemaps from 'gulp-sourcemaps'

import merge from 'pipe-concat'

import cssCopyAssets from '../utils/gulp-css-copy-assets'

export default function({from, to, settings = {}, options = {}}) {
	var outputdir = path.dirname(to)
    var filename = path.basename(to)
	var basename = path.basename(to, '.css')
	var sourcemapdir = options.sourcemap === 'inline' ? undefined : './'
    var plugins = [
        cssnext(settings.cssnext),
	]

    function NoSourceMapNoMinify() {
		return gulp.src(from)
			.pipe(sass())
			.pipe(postcss(plugins, settings.postcss))
			.pipe(rename(filename))
			.pipe(cssCopyAssets(settings.assets))
			.pipe(gulp.dest(outputdir))
	}

	function HasSourceMapNoMinify() {
		return gulp.src(from)
			.pipe(sourcemaps.init())
			.pipe(sass())
			.pipe(postcss(plugins, settings.postcss))
			.pipe(rename(filename))
			.pipe(cssCopyAssets(settings.assets))
			.pipe(sourcemaps.write(sourcemapdir))
			.pipe(gulp.dest(outputdir))
	}

	function NoSourceMapHasMinify() {
        filename = basename + '.min.css'
		return gulp.src(from)
			.pipe(sass())
			.pipe(postcss(plugins, settings.postcss))
			.pipe(cssmin())
			.pipe(rename(filename))
			.pipe(cssCopyAssets(settings.assets))
			.pipe(gulp.dest(outputdir))
	}

	function HasSourceMapHasMinify() {
        filename = basename + '.min.css'
		return gulp.src(from)
			.pipe(sourcemaps.init())
			.pipe(sass())
			.pipe(postcss(plugins, settings.postcss))
			.pipe(cssmin())
			.pipe(rename(filename))
			.pipe(cssCopyAssets(settings.assets))
			.pipe(sourcemaps.write(sourcemapdir))
			.pipe(gulp.dest(outputdir))
	}

	// with sourcemap
    if(options.sourcemap) {
		// not minified
        let stream1 = HasSourceMapNoMinify()
		if(!options.minify) {
			return stream1
		}
		// minified
		let stream2 = HasSourceMapHasMinify()
		return merge(stream1, stream2)
    }

	// without sourcemap
	// not minified
    let stream1 = NoSourceMapNoMinify()
    if(!options.minify) {
        return stream1
    }
	// minified
    let stream2 = NoSourceMapHasMinify()
    return merge(stream1, stream2)
}
