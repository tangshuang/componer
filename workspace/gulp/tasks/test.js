import {gulp, path, fs, args, log, config, exit, exists, extend, readJSON} from "../loader"
import {getComponout, hasComponout, dashlineName, getBowerMain, getFileExt, getBowerDepsFiles} from "../utils"

import {server as karma} from "gulp-karma-runner"
import shell from "shelljs"
import open from "open"
import jasmine from "gulp-jasmine-node"

gulp.task("test", () => {
	const arg = args.test
	const name = dashlineName(arg.name)

	if(!hasComponout(name)) {
		log(`${name} not exists.`, "error")
		exit()
	}

	var componoutPath = path.join(config.paths.componouts, name)
	var srcPath = path.join(componoutPath, "src")
	var distPath = path.join(componoutPath, "dist")

	if(!exists(componoutPath + "/componer.json")) {
		log("componer.json not exists.", "error")
		exit()
	}

	var type = getComponout(name).type
	var settings = readJSON(componoutPath + "/componer.json")

	var entryFiles = settings.entry
	if(!entryFiles) {
		log("Not found `entry` option in componer.json.")
		exit()
	}

	var testDir = componoutPath + "/" + entryFiles.test
	if(!exists(testDir)) {
		log("Not found `entry.test` option in componer.json.")
		exit()
	}

	/**
	 * if it is a package
	 */
	if(type === "package") {
		return gulp.src(testDir + "/*.js").pipe(jasmine({
						timeout: 10000,
						includeStackTrace: true,
						color: process.argv.indexOf("--color")
					}))
	}

	var reportersDir = componoutPath + "/" + settings.output.reporters
	if(!exists(testDir)) {
		log("Not found `output.reporters` option in componer.json.")
		exit()
	}

	var testFiles = []

	/**
	 * if it is a bower
	 */
	var pkgfile = type === "bower" ? componoutPath + "/" + type + ".json" : false
	if(pkgfile) {
		let depsFiles = getBowerDepsFiles(pkgfile, true)
		depsFiles.forEach(file => testFiles.push(config.paths.root + "/bower_components/" + file))
	}

	testFiles.push(testDir + "/*.js")

	var preprocessors = {}
	testFiles.forEach(file => {
		if(getFileExt(file) === ".js") {
			preprocessors[file] = ["webpack"]
		}
		else if(getFileExt(file) === ".scss") {
			preprocessors[file] = ["scss"]
		}
	})

	var karmaSettings = extend(true, {}, settings.karma, {
			preprocessors: preprocessors,
			coverageReporter: {
				reporters: [
					{
						type: "html",
						dir: reportersDir,
					},
				],
			},
			htmlReporter: {
				outputDir: reportersDir,
				reportName: name,
			},
		})

	return gulp.src(testFiles)
		.pipe(karma(config.karma(karmaSettings)))
		.on("end", () => {
			log("Reporters ware created in " + reportersDir, "help")
			open(reportersDir + "/" + name + "/index.html")
		})

})