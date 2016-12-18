import {gulp, fs, path, args, logger, config, exit} from "../loader"
import {validComponent, hasComponent, dashlineName, camelName, getFileExt} from "../utils"

import extend from "extend"
import shell from "shelljs"

import merge from "pipe-concat"
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

	if(!validComponent(name)) {
		exit()
	}
	if(!hasComponent(name)) {
		exit()
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

	/**
	 * if it is a package, just build it with babel
	 */
	if(fs.existsSync(componentPath + "/package.json")) {

		return gulp.src(srcPath + "/**/*")
			.pipe(babel())
			.pipe(gulp.dest(distPath))
			.on("end", doneMsg)

	}

	/**
	 * if it is a bower or component
	 * because bower.json and componer.json both use main option to point entry files, we can use some same codes
	 * static files of component should be put under component root directory
	 */

	var type
	var isComponent = fs.existsSync(componentPath + "/componer.json")
	var isBower = fs.existsSync(componentPath + "/bower.json")

	if(isComponent) {
		type = "componer"
	}
	else if(isBower) {
		type = "bower"
	}

	if(isComponent || isBower) {

		let info = JSON.parse(fs.readFileSync(`${componentPath}/${type}.json`))
		let settings = info.webpack || {}

		/**
		 * find out externals
		 */
		let externals = {}
		let dependencies = info.dependencies

		dependencies = dependencies && Object.keys(dependencies)
		if(dependencies.length > 0) {
			dependencies.forEach(dependence => externals[dependence] = dependence)
		}

		settings.externals = typeof settings.externals === "object" ? extend(false, {}, settings.externals, externals) : externals

		/**
		 * find out which files to be build entry
		 */
		
		let entryFiles = info.main

		if(entryFiles && Array.isArray(entryFiles)) {
			let entryJs
			let entryScss
			let outputJs
			let outputCss

			entryFiles.forEach(file => {
				if(getFileExt(file) == ".js") {
					entryJs = componentPath + "/" + file
					outputJs = distPath + "/js/"
				}
				else if(getFileExt(file) == ".scss") {
					entryScss = componentPath + "/" + file
					outputCss = distPath + "/css/"
				}
			})

			if(entryJs && entryScss) {
				return merge(script(entryJs, outputJs, settings), style(entryScss, outputCss)).on("end", doneMsg)
			}
			else if(entryJs && !entryScss) {
				return script(entryJs, distPath, settings).on("end", doneMsg)
			}
			else if(entryScss && !entryJs) {
				return style(entryScss, distPath).on("end", doneMsg)
			}
		}

		logger.error("Can't find entry files. Only `.js` and `.scss` files allowed. Check your bower.json `main` option.")
		exit()
	}
	
	/**
	 * can't find out the type of this component
	 */
	logger.error("I don't know what is the type of this component. \nPlease follow rules of Componer.")
	exit()

	// ===============================================================================

	function script(entryFile = `${srcPath}/js/${name}.js"`, outDir = `${distPath}/js/`, options = {}) {
		
		// build js with webpack
		var settings1 = extend(true, {}, config.webpack(), options, {
			output: {
				filename: name + ".js",
				sourceMapFilename: name + ".js.map",
				library: camelName(name),
			},
		})
		var stream1 = gulp.src(entryFile)
			.pipe(webpack(settings1))
			.pipe(gulp.dest(outDir))

		// build js with webpack (minify)
		var settings2 = extend(true, {}, config.webpack(), options, {
			output: {
				filename: name + ".min.js",
				sourceMapFilename: name + ".min.js.map",
				library: camelName(name),
			},
			plugins: [
				new optimize.UglifyJsPlugin({
					minimize: true,
				}),
			],
		})
		var stream2 = gulp.src(entryFile)
			.pipe(webpack(settings2))
			.pipe(gulp.dest(outDir))

		return merge(stream1, stream2)

	}

	function style(entryFile = `${srcPath}/style/${name}.scss"`, outDir = `${distPath}/css/`, options = {}) {
		
		// compile scss
		var stream1 = gulp.src(entryFile)
			.pipe(sourcemaps.init())
			.pipe(sass())
			.pipe(sourcemaps.write("./"))
			.pipe(gulp.dest(outDir))

		// compile scss and minify css
		var stream2 = gulp.src(entryFile)
			.pipe(sourcemaps.init())
			.pipe(sass())
			.pipe(cssmin())
			.pipe(rename({
				suffix: ".min",
			}))
			.pipe(sourcemaps.write("./"))
			.pipe(gulp.dest(outDir))

		return merge(stream1, stream2)

	}

	function doneMsg() {
		logger.done(`Success: ${name} has been completely built.`)
	}

}