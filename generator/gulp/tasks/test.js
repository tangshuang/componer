import {gulp, path, fs, args, log, config, exit, exists, extend, readJSON} from "../loader"
import {hasComponout, dashlineName, runTask} from "../utils"

import {server as karma} from "gulp-karma-runner"
import jasmine from "gulp-jasmine-node"

gulp.task("test", () => {
	var arg = args.test
	var debug = arg.debug
	var browser = arg.browser
	var componoutsPath = config.paths.componouts

	if(arg.name === undefined) {
		fs.readdirSync(componoutsPath).forEach(item => {
			runTask("test", {
				name: item,
				browser: "PhantomJS"
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
	var srcPath = path.join(componoutPath, "src")
	var distPath = path.join(componoutPath, "dist")

	if(!exists(componoutPath + "/componer.json")) {
		log("componer.json not exists.", "error")
		exit()
	}

	var settings = readJSON(componoutPath + "/componer.json")
	if(!settings.test) {
		log(`test option is incorrect in your componer.json.`, "error")
		exit()
	}

	var testEntry = settings.test.entry
	if(!testEntry) {
		log(`test.entry option is not correct in your componer.json.`, "error")
		exit()
	}

	var entryfile = path.join(componoutPath, testEntry)
	if(!exists(entryfile)) {
		log(`test entry file not found.`, "error")
		exit()
	}


	/**
	 * if it is a package, run test with jasmine-node
	 */
	if(exists(componoutPath + "/package.json") && !exists(componoutPath + "/bower.json")) {
		return gulp.src(entryfile).pipe(jasmine({
			timeout: 10000,
			includeStackTrace: false,
			color: process.argv.indexOf("--color")
		}))
	}


	/**
	 * if it is normal package can be run in browser
	 */

	var reportersDir = settings.test.reporters
	if(!reportersDir) {
		log(`test.reporters option is not correct in your componer.json.`, "error")
		exit()
	}

	var reportersPath = path.join(componoutPath, reportersDir)
	if(!exists(reportersPath)) {
		fs.mkdir(reportersPath)
	}

	var preprocessors = {}
	preprocessors[testPath + "/**/*.js"] = ["webpack", "sourcemap"]
	preprocessors[testPath + "/**/*.scss"] = ["scss"]

	var karmaSettings = {
			singleRun: !debug || !settings.test.debug,
			browsers: browser || settings.test.browsers,
			preprocessors: preprocessors,
			coverageReporter: {
				reporters: [
					{
						type: "html",
						dir: reportersPath,
					},
				],
			},
			htmlReporter: {
				outputDir: reportersPath,
				reportName: name,
			},
		}

	return gulp.src(entryfile)
		.pipe(karma(config.karma(karmaSettings)))
		.on("end", () => {
			log("Reporters ware created in componouts/" + name + "/" + reportersDir, "help")
		})

})
