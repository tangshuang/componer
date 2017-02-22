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
	var entryfile = settings.file
    var outputfile = settings.outputfile
    var outputdir = path.dirname(outputfile)
    var outputfilename = path.basename(outputfile)
    var plugins = [
        cssnext,
	]
    var sourcemapdir = options.sourcemap === "inline" ? undefined : "./"

    function NoSourceMapNoMinify() {
		return gulp.src(entryfile)
			.pipe(sass())
			.pipe(postcss(plugins))
			.pipe(rename(outputfilename))
			.pipe(gulp.dest(outputdir))
	}

	function HasSourceMapNoMinify() {
		return gulp.src(entryfile)
			.pipe(sourcemaps.init())
			.pipe(sass())
			.pipe(postcss(plugins))
			.pipe(rename(outputfilename))
			.pipe(sourcemaps.write(sourcemapdir))
			.pipe(gulp.dest(outputdir))
	}

	function NoSourceMapHasMinify() {
        var filename = outputfilename.substr(0, outputfilename.lastIndexOf(".css")) + ".min.css"
		return gulp.src(entryfile)
			.pipe(sass())
			.pipe(postcss(plugins))
			.pipe(cssmin())
			.pipe(rename(filename))
			.pipe(gulp.dest(outputdir))
	}

	function HasSourceMapHasMinify() {
        var filename = outputfilename.substr(0, outputfilename.lastIndexOf(".css")) + ".min.css"
		return gulp.src(entryfile)
			.pipe(sourcemaps.init())
			.pipe(sass())
			.pipe(postcss(plugins))
			.pipe(cssmin())
			.pipe(rename(filename))
			.pipe(sourcemaps.write(sourcemapdir))
			.pipe(gulp.dest(outputdir))
	}

    if(options.sourcemap) {
        let stream1 = HasSourceMapNoMinify()
		if(!options.minify) {
			return stream1
		}

		let stream2 = HasSourceMapHasMinify()
		return merge(stream1, stream2)
    }

    let stream1 = NoSourceMapNoMinify()
    if(!options.minify) {
        return stream1
    }

    let stream2 = NoSourceMapHasMinify()
    return merge(stream1, stream2)
}
