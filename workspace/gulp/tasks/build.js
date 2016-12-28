import {gulp, fs, path, args, log, config, exit, exists, extend, clear, readJSON} from "../loader"
import {hasComponout, dashlineName, camelName, getFileExt, getComponout} from "../utils"

import shell from "shelljs"

import mergeStream from "pipe-concat"
import PipeQueue from "pipe-queue"

import {optimize} from "webpack"
import webpack from "webpack-stream"
import rename from "gulp-rename"
import sass from "gulp-sass"
import concat from "gulp-concat"
import cssmin from "gulp-cssmin"
import babel from "gulp-babel"

import sourcemaps from "gulp-sourcemaps"

gulp.task("build", () => {
	const arg = args.build
	const name = dashlineName(arg.name)

	if(!hasComponout(name)) {
		log(`${name} not exists.`, "error")
		exit()
	}

	var componoutPath = path.join(config.paths.componouts, name)
	var srcPath = path.join(componoutPath, "src")
	var distPath = path.join(componoutPath, "dist")

	// mkdir
	if(!exists(distPath)) {
		fs.mkdir(distPath)
	}
	// clean the dist dir
	else {
		clear(distPath)
	}

	if(!exists(componoutPath + "/componer.json")) {
		log("componer.json not exists.", "error")
		exit()
	}

	var type = getComponout(name).type
	var pkgfile = type === "bower" || type === "package" ? componoutPath + "/" + type + ".json" : false
	var settings = readJSON(componoutPath + "/componer.json")

	var entryFiles = settings.entry
	var outputDirs = settings.output
	var webpackSettings = settings.webpack

	if(!entryFiles) {
		log("Not found `entry` option in componer.json.")
		exit()
	}

	if(!outputDirs) {
		log("Not found `output` option in componer.json.")
		exit()
	}

	if(pkgfile) {
		let info = readJSON(pkgfile)
		let externals = {}
		let dependencies = info.dependencies

		dependencies = typeof dependencies === "object" && Object.keys(dependencies)
		if(dependencies && dependencies.length > 0) {
			dependencies.forEach(dependence => externals[dependence] = dependence)
		}

		webpackSettings.externals = typeof webpackSettings.externals === "object" ? extend(false, {}, webpackSettings.externals, externals) : externals
	}

	function getPath(file, warn) {
		if(!file) {
			return false
		}
		var filePath = path.join(componoutPath, file)
		if(warn && !exists(filePath)) {
			log(`Can not found ${file} based on your componer.json.`, "error")
			exit()
		}
		return filePath
	}

	var entryJs = getPath(entryFiles.script, true)
	var entryScss = getPath(entryFiles.style, true)

	var outputJs = getPath(outputDirs.script)
	var outputCss = getPath(outputDirs.style)

	if(entryJs && !webpackSettings) {
		log("Not found `webpack` option in componer.json.")
		exit()
	}

	if(entryScss && !settings.sass) {
		log("Not found `sass` option in componer.json.")
		exit()
	}

	if(entryJs && entryScss) {
		return mergeStream(script(entryJs, outputJs, settings), style(entryScss, outputCss, settings)).on("end", doneMsg)
	}
	else if(entryJs && !entryScss) {
		return script(entryJs, outputJs, settings).on("end", doneMsg)
	}
	else if(entryScss && !entryJs) {
		return style(entryScss, outputCss, settings).on("end", doneMsg)
	}
	else {
		log("Something is wrong. Check your componer.json.", "warn")
		exit()
	}

	// ===============================================================================

	function renameFile(file, tail) {
		return file.substr(0, file.lastIndexOf('.')) + tail
	}

	function script(entryFile, outDir, options) {
		var settings = options.webpack
		var isMinfiy = options.minify
		var isSourceMap = options.sourcemap
		var filename = settings.output.filename
		
		settings.output.library = camelName(name)
		if(isSourceMap) {
			settings.devtool = "source-map"
			settings.output.sourceMapFilename = filename + ".map"
		}

		// build js with webpack
		var stream1 = gulp.src(entryFile)
			.pipe(webpack(config.webpack(settings)))
			.pipe(gulp.dest(outDir))

		if(!isMinfiy) {
			return stream1
		}

		// build js with webpack (minify)
		var settings2 = extend(true, {}, settings, {
			output: {
				filename: renameFile(filename, ".min.js"),
				sourceMapFilename: renameFile(filename, ".min.js.map"),
			},
			plugins: [
				new optimize.UglifyJsPlugin({
					minimize: true,
				}),
			],
		})

		var stream2 = gulp.src(entryFile)
			.pipe(webpack(config.webpack(settings2)))
			.pipe(gulp.dest(outDir))

		return mergeStream(stream1, stream2)

	}

	function style(entryFile, outDir, options) {
		var settings = options.sass
		var filename = settings.output.filename
		var isSourceMap = options.sourcemap
		var isMinfiy = options.minify

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
				.pipe(sourcemaps.write("./"))
				.pipe(gulp.dest(outDir))
			
		}

		function NoSourceMapMinify() {
			return gulp.src(entryFile)
				.pipe(sass())
				.pipe(cssmin())
				.pipe(rename(renameFile(filename, ".min.css")))
				.pipe(gulp.dest(outDir))
		}

		function SourceMapMinify() {
			return gulp.src(entryFile)
				.pipe(sourcemaps.init())
				.pipe(sass())
				.pipe(cssmin())
				.pipe(rename(renameFile(filename, ".min.css")))
				.pipe(sourcemaps.write("./"))
				.pipe(gulp.dest(outDir))
		}

		if(isSourceMap) {
			let stream1 = SourceMapNoMinify()
			if(!isMinfiy) {
				return stream1
			}

			let stream2 = SourceMapMinify()
			return mergeStream(stream1, stream2)
		}
		else {
			let stream1 = NoSourceMapNoMinify()
			if(!isMinfiy) {
				return stream1
			}

			let stream2 = NoSourceMapMinify()
			return mergeStream(stream1, stream2)
		}

	}

	function doneMsg() {
		log(`${name} has been completely built.`, "done")
	}

})