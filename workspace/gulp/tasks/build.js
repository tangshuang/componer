import {gulp, fs, path, args, log, config, exit, exists, extend, clear, read, readJSON, write} from "../loader"
import {hasComponout, dashlineName, camelName, getFileExt, setFileExt, buildScript, buildStyle, InjectJsToHtml, InjectCssToHtml} from "../utils"

import concat from "pipe-concat"


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

	if(!entryFiles) {
		log("Not found `entry` option in componer.json.")
		exit()
	}

	if(!outputDirs) {
		log("Not found `output` option in componer.json.")
		exit()
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

	var webpackSettings = settings.webpack

	if(entryJs && !outputJs) {
		log("No `output.script` in your componer.json.", "error")
		exit()
	}

	if(entryScss && !outputCss) {
		log("No `output.style` in your componer.json.", "error")
		exit()
	}

	if(entryJs && !settings.webpack) {
		log("Not found `webpack` option in componer.json.", "error")
		exit()
	}

	if(entryScss && !settings.sass) {
		log("Not found `sass` option in componer.json.", "error")
		exit()
	}

	function exterPkgs(pkgfile) {
		if(!exists(pkgfile)) {
			return
		}
		var info = readJSON(pkgfile)
		var externals = {}
		var dependencies = info.dependencies

		dependencies = typeof dependencies === "object" && Object.keys(dependencies)
		if(dependencies && dependencies.length > 0) {
			dependencies.forEach(dependence => externals[dependence] = dependence)
		}

		webpackSettings.externals = typeof webpackSettings.externals === "object" ? extend(false, {}, webpackSettings.externals, externals) : externals
	}

	if(exists(componoutPath + "/bower.json")) {
		exterPkgs(componoutPath + "/bower.json")
	}
	else if(exists(componoutPath + "/package.json")) {
		exterPkgs(componoutPath + "/package.json")
	}
	
	var streams = []

	if(entryJs) {
		streams.push(buildScript(entryJs, outputJs, webpackSettings))
	}

	if(entryScss) {
		streams.push(buildStyle(entryScss, outputCss, settings.sass))
	}

	if(streams.length > 0) {
		return concat(streams).on("end", () => log(`${name} has been completely built.`, "done"))
	}
	
	log("Something is wrong. Check your componer.json.", "warn")
	exit()

})
