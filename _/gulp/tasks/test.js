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
	var testDir = settings.entry.test

	if(!testDir) {
		log(`entry.test option is not correct in your componer.json.`, "error")
		exit()
	}

	var testPath = path.join(componoutPath, testDir)
	if(!exists(testPath)) {
		log(`test directory not found.`, "error")
		exit()
	}


	/**
	 * if it is a package, run test with jasmine-node
	 */
	if(exists(componoutPath + "/package.json")) {
		return gulp.src(testPath + "/*.js").pipe(jasmine({
			timeout: 10000,
			includeStackTrace: false,
			color: process.argv.indexOf("--color")
		}))
	}


	/**
	 * if it is normal package can be run in browser
	 */

	var reportersDir = settings.output.reporters
	if(!reportersDir) {
		log("Not found `output.reporters` option in componer.json.", "error")
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
	extend(true, karmaSettings, settings.karma)

	if(debug) {
		karmaSettings.singleRun = false
	}
	if(browser) {
		karmaSettings.browsers = [browser]
	}

	return gulp.src(testPath + "/*.js")
		.pipe(karma(config.karma(karmaSettings)))
		.on("end", () => {
			log("Reporters ware created in componouts/" + name + "/" + reportersDir, "help")
		})

})