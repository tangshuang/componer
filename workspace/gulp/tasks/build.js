import {gulp, fs, path, args, log, config, exit, exists, extend, clear, read, readJSON, write} from "../loader"
import {hasComponout, dashlineName, camelName, getFileExt, setFileExt, prettyHtml} from "../utils"

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
	const dev = args.dev

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

	function exPkgs(pkgfile) {
		if(!exists(pkgfile)) {
			return
		}
		let info = readJSON(pkgfile)
		let externals = {}
		let dependencies = info.dependencies

		dependencies = typeof dependencies === "object" && Object.keys(dependencies)
		if(dependencies && dependencies.length > 0) {
			dependencies.forEach(dependence => externals[dependence] = dependence)
		}

		// if now environment is development
		//if(dev) {
		//	let devDeps = info.devDependencies
		//	devDeps = typeof devDeps === "object" && Object.keys(devDeps)
		//	if(devDeps && devDeps.length > 0) {
		//		devDeps.forEach(dep => externals[dep] = dep)
		//	}
		//}

		webpackSettings.externals = typeof webpackSettings.externals === "object" ? extend(false, {}, webpackSettings.externals, externals) : externals
	}
	if(type === "bower") {
		exPkgs(componoutPath + "/bower.json")
	}
	else if(type === "package") {
		exPkgs(componoutPath + "/package.json")
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
	var entryIndex = getPath(entryFiles.index, true)

	var outputJs = getPath(outputDirs.script)
	var outputCss = getPath(outputDirs.style)
	var outputIndex = getPath(outputDirs.index)

	if(entryJs && !webpackSettings) {
		log("Not found `webpack` option in componer.json.", "error")
		exit()
	}

	if(entryJs && !outputJs) {
		log("No `output.script` in your componer.json.", "error")
		exit()
	}

	if(entryScss && !settings.sass) {
		log("Not found `sass` option in componer.json.", "error")
		exit()
	}

	if(entryScss && !outputCss) {
		log("No `output.style` in your componer.json.", "error")
		exit()
	}

	if(entryIndex && !outputIndex) {
		log("No `output.index` in your componer.json.", "error")
		exit()
	}
	
	if(entryIndex && outputIndex) {
		html(entryIndex, outputIndex, settings)
	}

	// compile script and style
	if(entryJs && entryScss) {
		return mergeStream([
			script(entryJs, outputJs, settings),
			style(entryScss, outputCss, settings),
		]).on("end", doneMsg)
	}
	else if(entryJs && !entryScss) {
		return script(entryJs, outputJs, settings).on("end", doneMsg)
	}
	else if(entryScss && !entryJs) {
		return style(entryScss, outputCss, settings).on("end", doneMsg)
	}
	
	log("Something is wrong. Check your componer.json.", "warn")
	exit()

	// ===============================================================================

	function script(entryFile, outDir, options) {
		var settings = options.webpack

		// build js with webpack
		var stream1 = gulp.src(entryFile)
			.pipe(webpack(config.webpack(settings)))
			.pipe(gulp.dest(outDir))

		if(!settings._minify) {
			return stream1
		}

		// build js with webpack (minify)
		var filename = settings.output.filename
		var sourceMapFilename = settings.output.sourceMapFilename
		var devtool = settings.devtool

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

		if(sourceMapFilename && devtool === "source-map") {
			settings.output.sourceMapFilename = setFileExt(sourceMapFilename, ".min.js.map", [".map", ".js.map"])
		}

		var stream2 = gulp.src(entryFile)
			.pipe(webpack(config.webpack(settings)))
			.pipe(gulp.dest(outDir))

		return mergeStream(stream1, stream2)

	}

	function style(entryFile, outDir, options) {
		var settings = options.sass
		var filename = settings.output.filename
		var isSourceMap = settings.output.sourcemap
		var isMinfiy = settings._minify

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
				.pipe(rename(setFileExt(filename, ".min.css")))
				.pipe(gulp.dest(outDir))
		}

		function SourceMapMinify() {
			return gulp.src(entryFile)
				.pipe(sourcemaps.init())
				.pipe(sass())
				.pipe(cssmin())
				.pipe(rename(setFileExt(filename, ".min.css")))
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

	function html(entryFile, outDir, options) {
		return gulp.src(entryFile)
			.pipe(gulp.dest(outDir))
			.on("end", () => {
				let outputHtml = outDir + "/" + path.basename(entryFile)
				let content = read(outputHtml)
				let outputJs = settings.output.script
				let outputCss = settings.output.style

				if(outputJs) {
					let buildjshtml = `<script src="../${outputJs}/${settings.webpack.output.filename}"></script>`
					let buildjsreg = new RegExp('(<!--\s*?build:js\s*?-->)([\\s\\S]*?)(<!--\s*?endbuild\s*?-->)','im')
					content = content.replace(buildjsreg, "$1" + buildjshtml + "$3")
				}

				if(outputCss) {
					let buildcsshtml = `<link rel="stylesheet" href="../${outputCss}/${settings.sass.output.filename}">`
					let buildcssreg = new RegExp('(<!--\s*?build:css\s*?-->)([\\s\\S]*?)(<!--\s*?endbuild\s*?-->)','im')
					content = content.replace(buildcssreg, "$1" + buildcsshtml + "$3")
				}

				// pretty code
				content = prettyHtml(content)

				// update preview index.html
				write(outputHtml, content)
			})
	} 

	function doneMsg() {
		log(`${name} has been completely built.`, "done")
	}

})
