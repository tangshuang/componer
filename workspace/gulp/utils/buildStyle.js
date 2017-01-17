import path from "path"
import gulp from "gulp"
import sass from "gulp-sass"
import concat from "gulp-concat"
import cssmin from "gulp-cssmin"
import rename from "gulp-rename"
import sourcemaps from "gulp-sourcemaps"

import merge from "pipe-concat"

import {setFileExt} from "./index"

export function buildStyle(entryFile, outDir, settings) {

	var filename = settings.output.filename
	var isSourceMap = settings.output.sourcemap
	var sourceMapDir = isSourceMap === "inline" ? undefined : "./"
	var isMinfiy = settings._minify

	if(!filename) {
		filename = typeof entryFile === "string" ? setFileExt(path.basename(entryFile), ".css") : "styles.css"
	}

	function NoSourceMapNoMinify() {
		return gulp.src(entryFile)
			.pipe(sass())
			.pipe(rename(filename))
			.pipe(gulp.dest(outDir))
	}

	function SourceMapNoMinify() {
		return gulp.src(entryFile)
			.pipe(sourcemaps.init())
			.pipe(sass())
			.pipe(rename(filename))
			.pipe(sourcemaps.write(sourceMapDir))
			.pipe(gulp.dest(outDir))
	}

	function NoSourceMapMinify() {
		return gulp.src(entryFile)
			.pipe(sass())
			.pipe(cssmin())
			.pipe(rename(setFileExt(filename, ".min.css")))
			.pipe(gulp.dest(outDir))
	}

	function SourceMapMinify() {
		return gulp.src(entryFile)
			.pipe(sourcemaps.init())
			.pipe(sass())
			.pipe(cssmin())
			.pipe(rename(setFileExt(filename, ".min.css")))
			.pipe(sourcemaps.write(sourceMapDir))
			.pipe(gulp.dest(outDir))
	}

	if(isSourceMap) {
		let stream1 = SourceMapNoMinify()
		if(!isMinfiy) {
			return stream1
		}

		let stream2 = SourceMapMinify()
		return merge(stream1, stream2)
	}
	else {
		let stream1 = NoSourceMapNoMinify()
		if(!isMinfiy) {
			return stream1
		}

		let stream2 = NoSourceMapMinify()
		return merge(stream1, stream2)
	}

}