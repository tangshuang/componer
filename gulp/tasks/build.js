import {gulp, fs, path, args, logger, config} from "../loader"
import isValidName from "../utils/isValidName"
import hasComponent from "../utils/hasComponent"
import {dashlineName, camelName} from "../utils/nameConvert"

import extend from "extend"

import merge from "pipe-concat"
import shell from "shelljs"
import PipeQueue from "pipe-queue"

import webpack from "webpack-stream"
import rename from "gulp-rename"
import uglify from "gulp-uglify"
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

		for(let dependence in dependencies) {
			externals[dependence] = dependence
		}

		var settings = {
			externals: externals
		}

		return merge(buildScript(undefined, undefined, settings), buildStyle(), copyImages(), copyFonts()).on("end", doneMsg)
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

		return merge(buildScript(componentPath + "/" + entry.js, componentPath + "/" + output.js, settings), buildStyle(componentPath + "/" + entry.style, componentPath + "/" + output.style, settings), copyImages(), copyFonts()).on("end", doneMsg)
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
			})
		var settings = extend(true, {}, defaults, options)

		var $queue = new PipeQueue()

		$queue.when(gulp.src(entryFile)
				.pipe(webpack(settings))
				.pipe(gulp.dest(outDir)))
			.then(next => {
				gulp.src(outDir + "/" + name + ".js")
					.pipe(uglify())
					.pipe(rename({
						suffix: ".min",
					}))
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
			.pipe(gulp.dest(outDir))
	}

	function copyImages() {
		return gulp.src(srcPath + "/img/**")
			.pipe(gulp.dest(distPath + "/img/"))
	}

	function copyFonts() {
		return gulp.src(srcPath + "/fonts/**")
			.pipe(gulp.dest(distPath + "/fonts/"))
	}

	function doneMsg() {
		logger.done(`Success: ${name} has been completely built.`)
	}
}