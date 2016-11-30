import {gulp, fs, path, args, logger, config} from "../loader"
import isValidName from "../utils/isValidName"
import {dashlineName, capitalName} from "../utils/nameConvert"

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
	// if it is a normal component
	else {
		return buildComponent()
	}

	function doneMsg() {
		logger().timestamp().done(`gulp success: ${name} has been completely built.`)
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

	function buildComponentScript() {
		var stream = gulp.src(srcPath + "/js/index.js")
			// webpack code
			.pipe(webpack({
				module: {
					loaders: [
						{
							test: /\.js$/, 
							loaders: ["babel?presets[]=latest"],
						},
					],
				},
				output: {
			        library: capitalName(name),
			        libraryTarget: "umd",
			    },
			}))
			.pipe(rename(name + ".js"))
			.pipe(gulp.dest(distPath + "/js/"))
			// browserify
			// minify code
			.pipe(uglify())
			.pipe(rename({
				suffix: ".min",
			}))
			.pipe(gulp.dest(distPath + "/js/"))
		return stream
	}

	function buildPackageScript() {
		var stream = gulp.src(srcPath + "/" + name + ".js")
			// compile code
			.pipe(babel())
			.pipe(rename(name + ".js"))
			.pipe(gulp.dest(distPath))
		return stream
	}

	function buildPackage() {
		var stream = buildPackageScript()
		stream.on("end", doneMsg)
		return stream
	}

	function buildComponent() {
		var stream = merge(buildComponentScript(), buildStyle(), copyImages(), copyFonts())
		stream.on("end", doneMsg)
		return stream
	}
}