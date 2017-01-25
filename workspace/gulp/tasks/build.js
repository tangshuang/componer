import {gulp, fs, path, args, log, config, exit, exists, extend, clear, readJSON} from "../loader"
import {hasComponout, dashlineName, camelName, buildScript, buildStyle, runTask} from "../utils"

import concat from "pipe-concat"

gulp.task("build", () => {
	var arg = args.build

	if(arg.name === undefined) {
		fs.readdirSync(config.paths.componouts).forEach(item => {
			runTask("build", {
				name: item,
			})
		})
		return
	}

	var name = dashlineName(arg.name)
	if(!hasComponout(name)) {
		log(`${name} not exists.`, "error")
		exit()
	}

	var componoutPath = path.join(config.paths.componouts, name)

	if(!exists(componoutPath + "/componer.json")) {
		log("componer.json not exists.", "error")
		exit()
	}

	var settings = readJSON(componoutPath + "/componer.json")

	var entryFiles = settings.entry
	var outputFiles = settings.output

	if(!entryFiles) {
		log("Not found `entry` option in componer.json.")
		exit()
	}

	if(!outputFiles) {
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
	var entryAssets = getPath(entryFiles.assets, true)
	var outputJs = getPath(outputFiles.script)
	var outputCss = getPath(outputFiles.style)
	var outputAssets = getPath(outputFiles.assets)

	if(entryJs && !outputJs) {
		log("No `output.script` in your componer.json.", "error")
		exit()
	}
	if(entryScss && !outputCss) {
		log("No `output.style` in your componer.json.", "error")
		exit()
	}
	if(entryAssets && !outputAssets) {
		log("No `output.assets` in your componer.json.", "error")
		exit()
	}

	// ------------------------------------------------------------

	var streams = []

	// scripts
	if(entryJs) {
		let webpackSettings = settings.webpack

		if(!webpackSettings) {
			log("Not found `webpack` option in your componer.json.", "error")
			exit()
		}

		function exterPkgs(pkgfile) {
			if(!exists(pkgfile)) {
				return
			}

			if(!webpackSettings.externals) {
				webpackSettings.externals = {}
			}

			var info = readJSON(pkgfile)
			var externals = webpackSettings.externals
			var dependencies = info.dependencies

			dependencies = typeof dependencies === "object" && Object.keys(dependencies)
			if(dependencies && dependencies.length > 0) {
				dependencies.forEach(dependence => externals[dependence] = dependence)
			}
		}

		if(exists(componoutPath + "/bower.json") && !exists(componoutPath + "/package.json")) {
			exterPkgs(componoutPath + "/bower.json")
		}
		else if(exists(componoutPath + "/package.json") && !exists(componoutPath + "/bower.json")) {
			exterPkgs(componoutPath + "/package.json")
		}

		streams.push(buildScript(entryJs, outputJs, webpackSettings))
	}

	// styles
	if(entryScss) {
		let sassSettings = settings.sass

		if(!sassSettings) {
			log("Not found `sass` option in your componer.json.", "error")
			exit()
		}

		streams.push(buildStyle(entryScss, outputCss, sassSettings))
	}

	// assets
	if(entryAssets && entryAssets !== outputAssets) {
		let assetsStream = gulp.src(entryAssets + "/**/*")
			.pipe(gulp.dest(outputAssets))
		streams.push(assetsStream)
	}

	if(streams.length > 0) {
		return concat(streams).on("end", () => log(`${name} has been completely built.`, "done"))
	}

	// build fail
	log("Something is wrong. Check your componer.json.", "warn")
	exit()

})
