import {gulp, fs, path, args, log, config, exit, exists, load} from "../loader"
import {hasComponout, dashlineName, runTask} from "../utils"

import concat from "pipe-concat"

import webpack from "../drivers/webpack"
import sass from "../drivers/sass"


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
		let from = path.join(componoutPath, file.from)
		let to = path.join(componoutPath, file.to)
		let driver = file.driver
		let settings = file.settings
		let options = file.options

		if(!exists(config.paths.gulp + "/drivers/" + driver + ".js")) {
			log("Can NOT found driver " + driver, "error")
			return
		}

		driver = load(config.paths.gulp + "/drivers/" + driver + ".js")
		streams.push(driver({from, to, settings, options}))
	})

	if(streams.length > 0) {
		return concat(streams).on("end", () => log(`${name} has been completely built.`, "done"))
	}

	// build fail
	log("Something is wrong. Check your componer.json.", "warn")
	exit()

})
