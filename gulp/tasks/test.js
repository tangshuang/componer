import {gulp, path, fs, logger, config, exit} from "../loader"
import {validComponent, hasComponent, dashlineName, runTask, getBowerMain, getFileExt} from "../utils"

import {server as karma} from "gulp-karma-runner"
import shell from "shelljs"
import TsServer from "ts-server"
import open from "open"

import processArgs from "process.args"

const args = processArgs({
	n: "name",
	b: "browser",
	d: "debug",
})

module.exports = function() {
	var arg = args.test
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
	var testPath = path.join(componentPath, "test")

	if(!fs.existsSync(testPath)) {
		logger.error(`Error: component ${name} has no test directory.`)
		exit()
	}

	/**
	 * if it is a package
	 */
	if(fs.existsSync(componentPath + "/package.json")) {
		
		if(!fs.existsSync(`${testPath}/${name}.js`)) {
			logger.error(`Error: can't find test entry file at ${testPath}/${name}.js, please check.`)
			exit()
		}

		let sh = `babel-node ${testPath}/${name}.js`
		shell.exec(sh)
		return

	}

	/**
	 * if it is a bower or component
	 */

	var browser = arg.browser || "phantomjs"
	if(browser === "p" || browser.toLowerCase() === "phantomjs") {
		browser = "PhantomJS"
	}
	else if(browser === "f" || browser.toLowerCase() === "firefox") {
		browser = "Firefox"
	}
	else if(browser === "c" || browser.toLowerCase() === "chrome") {
		browser = "Chrome"
	}
	
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
		let dependencies = info.dependencies || {}
		let denpendenciesFiles = []
		let bowers = []

		if(dependencies) {
			dependencies = Object.keys(dependencies)
			if(dependencies && dependencies.length > 0) {
				dependencies.forEach(dependence => bowers.push(dependence))
			}
		}

		// TODO: if this dependent bower component is dependent on other bower components, what should we do?

		if(bowers.length > 0) {
			bowers.forEach(bower => {
				let files = getBowerMain(bower)
				denpendenciesFiles = denpendenciesFiles.concat(files)
			})
			denpendenciesFiles = denpendenciesFiles.filter((e, i, arr) => arr.lastIndexOf(e) === i)
		}

		let testFiles = [...denpendenciesFiles, testPath + "/specs/*.js"]
		let preprocessors = {}
		testFiles.forEach(file => {
			if(getFileExt(file) === ".js") {
				preprocessors[file] = ["webpack"]
			}
			else if(getFileExt(file) === ".scss") {
				preprocessors[file] = ["scss"]
			}
		})

		return gulp.src(testFiles)
			.pipe(karma(config.karma({
				singleRun: !!arg.debug,
				browsers: [browser],
				preprocessors: preprocessors,
				coverageReporter: {
					reporters: [
						{
							type: "html",
							dir: testPath + "/reporters/",
						},
					],
				},
				htmlReporter: {
					outputDir: testPath + "/reporters/",
					reportName: name,
				},
			})))
			.on("end", () => {
				logger.help("Reporters ware created in " + testPath + "/reporters/")
				open(testPath + "/reporters/" + name + "/index.html")
			})

	}

	/**
	 * can't find out the type of this component
	 */
	logger.error("I don't know what is the type of this component. \nPlease follow rules of Componer.")
	exit()

}