import gulp from "gulp"
import webpack from "webpack-stream"
import merge from "pipe-concat"
import extend from "extend"

import {config} from "../loader"
import {setFileExt} from "./index"
import {optimize} from "webpack"


/**
 * @param string|array entryfile: entry file(s) to build begin with, absolute path
 * @param string outDir: built files to put out, absolute path
 */
export function buildScript(entryFile, outDir, settings) {
	// build js with webpack
	var stream1 = gulp.src(entryFile)
		.pipe(webpack(config.webpack(settings)))
		.pipe(gulp.dest(outDir))

	// if not want to minify js code, return
	if(!settings._minify) {
		return stream1
	}

	// build js with webpack (minify)
	var filename = settings.output.filename
	var sourceMapFilename = settings.output.sourceMapFilename

	extend(true, settings, {
		output: {
			filename: setFileExt(filename, ".min.js"),
		},
		plugins: [
			new optimize.UglifyJsPlugin({
				minimize: true,
			}),
		],
	})

	if(sourceMapFilename) {
		settings.output.sourceMapFilename = setFileExt(sourceMapFilename, ".min.js.map", [".map", ".js.map"])
	}

	var stream2 = gulp.src(entryFile)
		.pipe(webpack(config.webpack(settings)))
		.pipe(gulp.dest(outDir))

	return merge(stream1, stream2)

}