import gulp from "gulp"
import webpack from "webpack-stream"
import mergeStream from "pipe-concat"
import extend from "extend"

import {config} from "../loader"
import {setFileExt} from "./index"
import {optimize} from "webpack"

export function buildScript(entryFile, outDir, settings = {}) {
	settings.output = settings.output || {}
	settings.output.filename = settings.output.filename || path.basename(entryFile)

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

	return mergeStream(stream1, stream2)

}