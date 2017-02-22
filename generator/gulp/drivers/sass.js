import path from "path"
import gulp from "gulp"
import sass from "gulp-sass"
import cssmin from "gulp-cssmin"
import postcss from "gulp-postcss"
import cssnext from "postcss-cssnext"
import rename from "gulp-rename"
import sourcemaps from "gulp-sourcemaps"

import merge from "pipe-concat"

export default function({from, to, settings, options}) {
	var outputdir = path.dirname(to)
    var filename = path.basename(to)
	var sourcemapdir = options.sourcemap === "inline" ? undefined : "./"
    var plugins = [
        cssnext,
	]

    function NoSourceMapNoMinify() {
		return gulp.src(from)
			.pipe(sass())
			.pipe(postcss(plugins))
			.pipe(rename(filename))
			.pipe(gulp.dest(outputdir))
	}

	function HasSourceMapNoMinify() {
		return gulp.src(from)
			.pipe(sourcemaps.init())
			.pipe(sass())
			.pipe(postcss(plugins))
			.pipe(rename(filename))
			.pipe(sourcemaps.write(sourcemapdir))
			.pipe(gulp.dest(outputdir))
	}

	function NoSourceMapHasMinify() {
        var filename = filename.substr(0, filename.lastIndexOf(".css")) + ".min.css"
		return gulp.src(from)
			.pipe(sass())
			.pipe(postcss(plugins))
			.pipe(cssmin())
			.pipe(rename(filename))
			.pipe(gulp.dest(outputdir))
	}

	function HasSourceMapHasMinify() {
        var filename = filename.substr(0, filename.lastIndexOf(".css")) + ".min.css"
		return gulp.src(from)
			.pipe(sourcemaps.init())
			.pipe(sass())
			.pipe(postcss(plugins))
			.pipe(cssmin())
			.pipe(rename(filename))
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
