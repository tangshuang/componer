import {gulp, fs, path, args, log, config, exit, exists, extend, clear, readJSON} from "../loader"
import {hasComponout, dashlineName, camelName, buildScript, buildStyle, runTask, getFileExt} from "../utils"

import concat from "pipe-concat"

import webpack from "../drivers/webpack"


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

	if(!exists(componoutPath + "/componer.config.js")) {
		log("componer.config.js not exists.", "error")
		exit()
	}

	/**
	 * begin to compress build settings
	 */

	var files = load(componoutPath + "/componer.config.js").build

	if(!files) {
		log("build option in componer.config.js not found.", "error")
		exit()
	}

	var streams = []
	files.forEach(file => {
		let entryfile = path.join(componoutPath, file.from)
		let outputfile = path.join(componoutPath, file.to)
		let outputdir = path.dirname(outputfile)
		let outputfilename = path.join(outputfile)
		let library = camelName(name)
		let sourceMapFilename = outputfilename + ".map"

		let settings = extend(true, {
			entry: entryfile,
			output: {
				path: outputdir,
				filename: outputfilename,
				library: library,
				sourceMapFilename: sourceMapFilename,
			},
		}, file.settings)
		let options = file.options

		let ext = getFileExt(entryfilename)

		if(ext === ".js") {
			streams.push(webpack(settings, options))
		}
	})

	if(streams.length > 0) {
		return concat(streams).on("end", () => log(`${name} has been completely built.`, "done"))
	}

	// build fail
	log("Something is wrong. Check your componer.json.", "warn")
	exit()

})
