import {gulp, fs, path, args, logger, config} from "../loader"
import isValidName from "../utils/isValidName"
import hasComponent from "../utils/hasComponent"
import {dashlineName, camelName} from "../utils/nameConvert"

import extend from "extend"

import merge from "pipe-concat"
import shell from "shelljs"
import PipeQueue from "pipe-queue"

import {optimize} from "webpack"
import webpack from "webpack-stream"
import rename from "gulp-rename"
import sass from "gulp-sass"
import concat from "gulp-concat"
import cssmin from "gulp-cssmin"
import babel from "gulp-babel"

import sourcemaps from "gulp-sourcemaps"

module.exports = function() {
	var arg = args.build
	var name = arg.name

	if(!isValidName(name)) {
		return
	}
	if(!hasComponent(name)) {
		return
	}

	name = dashlineName(name)
	var componentPath = path.join(config.paths.components, name)
	var srcPath = path.join(componentPath, "src")
	var distPath = path.join(componentPath, "dist")

	// mkdir
	if(!fs.existsSync(distPath)) {
		fs.mkdir(distPath)
	}

	// clean the dist dir
	shell.exec("rm -rf " + distPath + "/*")

	// package
	if(fs.existsSync(componentPath + "/package.json")) {
		return gulp.src(srcPath + "/**/*")
			.pipe(babel())
			.pipe(gulp.dest(distPath))
			.on("end", doneMsg)
	}
	// bower
	else if(fs.existsSync(componentPath + "/bower.json")) {
		var bowerInfo = JSON.parse(fs.readFileSync(componentPath + "/bower.json"))
		var dependencies = bowerInfo.dependencies
		var externals = {}
		var entryFiles = bowerInfo.main

		dependencies = dependencies && Object.keys(dependencies)
		if(dependencies.length > 0) {
			dependencies.forEach(dependence => externals[dependence] = dependence)
		}

		var settings = {
			externals: externals
		}

		var entry = {}
		var output = {}
		
		if(entryFiles && Array.isArray(entryFiles)) {
			entryFiles.forEach(file => {

			})
		}

		return merge(buildScript(entryJs, undefined, settings), buildStyle(entryScss)).on("end", doneMsg)
	}
	// component
	else if(fs.existsSync(componentPath + "/componer.json")) {
		var componentInfo = JSON.parse(fs.readFileSync(componentPath + "/componer.json"))
		var settings = componentInfo.settings
		var entry = componentInfo.entry
		var output = componentInfo.output

		if(!fs.existsSync(componentPath + "/" + entry.js) && !fs.existsSync(componentPath + "/" + entry.style)) {
			logger.error(`Error: not found entry file when build ${name}.`)
			return
		}

		var copyStreams = []

		if(entry.copy && Array.isArray(entry.copy)) {
			entry.copy.forEach(files => copyStreams.push(copy(files)))
		}

		var streams = [buildScript(componentPath + "/" + entry.js, componentPath + "/" + output.js, settings), buildStyle(componentPath + "/" + entry.style, componentPath + "/" + output.style, settings)]
		if(copyStreams.length) {
			streams.push(merge(...copyStreams))
		}

		return merge(...streams).on("end", doneMsg)
	}
	// other
	else {
		return merge(buildScript(), buildStyle(), copyImages(), copyFonts()).on("end", doneMsg)
	}

	function buildScript(entryFile = `${srcPath}/js/${name}.js"`, outDir = `${distPath}/js/`, options = {}) {
		var defaults = config.webpack({
				output: {
					filename: name + ".js",
					sourceMapFilename: name + ".js.map",
					library: camelName(name),
				},
				devtool: "source-map",
			})

		var settings = extend(true, {}, defaults, options)

		var $queue = new PipeQueue()

		$queue.when(gulp.src(entryFile)
				.pipe(webpack(settings))
				.pipe(gulp.dest(outDir)))
			.then(next => {
				defaults.output = {
					filename: name + ".min.js",
					sourceMapFilename: name + ".min.js.map",
				}
				defaults.plugins = [
					new optimize.UglifyJsPlugin({
						minimize: true,
					}),
				]
				settings = extend(true, {}, defaults, options)

				gulp.src(entryFile)
					.pipe(webpack(settings))
					.pipe(gulp.dest(outDir))
					.on("end", next)
			})

		return $queue.stream()
	}

	function buildStyle(entryFile = `${srcPath}/style/${name}.scss"`, outDir = `${distPath}/css/`, options = {}) {
		return gulp.src(entryFile)
			// compile scss
			.pipe(sourcemaps.init())
			.pipe(sass().on('error', sass.logError))
			.pipe(sourcemaps.write())
			.pipe(gulp.dest(distPath + "/css/"))
			// minify code
			.pipe(cssmin())
			.pipe(rename({
				suffix: ".min",
			}))
			.pipe(sourcemaps.write())
			.pipe(gulp.dest(outDir))
	}

	function copy(from, to = "") {
		return gulp.src(srcPath + "/" + from)
			.pipe(gulp.dest(distPath + "/" + to))
	}

	function doneMsg() {
		logger.done(`Success: ${name} has been completely built.`)
	}
}