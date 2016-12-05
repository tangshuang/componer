import {gulp, fs, path, args, logger, config} from "../loader"
import isValidName from "../utils/isValidName"
import {dashlineName, camelName} from "../utils/nameConvert"

import merge from "pipe-concat"

import webpack from "webpack-stream"
import rename from "gulp-rename"
import uglify from "gulp-uglify"
import sass from "gulp-sass"
import concat from "gulp-concat"
import cssmin from "gulp-cssmin"
import babel from "gulp-babel"

module.exports = function() {
	var arg = args.build
	var name = arg.name

	if(!isValidName(name)) {
		return
	}

	name = dashlineName(name)
	var componentPath = path.join(config.paths.components, name)
	var srcPath = path.join(componentPath, "src")
	var distPath = path.join(componentPath, "dist")

	if(!fs.existsSync(distPath)) {
		fs.mkdir(distPath)
	}

	// if it is a package
	if(fs.existsSync(componentPath + "/package.json")) {
		return buildPackage()
	}
	// bower
	else if(fs.existsSync(componentPath + "/bower.json")) {
		var bowerInfo = fs.readfileSync(componentPath + "/bower.json")
		var bowerInfo = JSON.parse(bowerInfo)
		
	}
	// pack component if there is a index.js in src dir
	else if(fs.existsSync(srcPath + "/index.js")) {
		return buildScript(srcPath + "/index.js", distPath)
	}
	// if it is a normal component
	else {
		return buildComponent()
	}

	function buildPackage() {
		return gulp.src(srcPath + "/**/*")
			.pipe(babel())
			.pipe(gulp.dest(distPath))
			.on("end", doneMsg)
	}

	function buildComponent() {
		return merge(buildScript(), buildStyle(), copyImages(), copyFonts()).on("end", doneMsg)
	}

	function buildScript(entryFile = srcPath + "/js/" + name + ".js", outDir = distPath + "/js/") {
		return gulp.src(entryFile)
			// webpack
			.pipe(webpack(config.webpack({
				output: {
					filename: name + ".js",
					library: camelName(name),
				},
			})))
			.pipe(gulp.dest(outDir))
			// minify code
			.pipe(uglify())
			.pipe(rename({
				suffix: ".min",
			}))
			.pipe(gulp.dest(outDir))
	}

	function buildStyle() {
		return gulp.src(srcPath + "/style/*.scss")
			// compile scss
			.pipe(sass())
			.pipe(concat(name + ".css"))
			.pipe(gulp.dest(distPath + "/css/"))
			// minify code
			.pipe(cssmin())
			.pipe(rename({
				suffix: ".min",
			}))
			.pipe(gulp.dest(distPath + "/css/"))
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
		logger.set("timestamp", true).done(`gulp success: ${name} has been completely built.`)
	}
}