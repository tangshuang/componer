import {gulp, path, fs, logger, config, exit} from "../loader"
import {isValidName, hasComponent, dashlineName, runTask, getBowerFiles, getFileExt} from "../utils"

import {server as karma} from "gulp-karma-runner"
import shell from "shelljs"
import TsServer from "ts-server"
import open from "open"

import processArgs from "process.args"

const args = processArgs({
	n: "name",
	b: "browser",
})

module.exports = function() {
	var arg = args.test
	var name = arg.name

	if(!isValidName(name)) {
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
		
		if(!fs.existsSync(testPath + "/index.js")) {
			logger.error(`Error: can't find test entry file at ${testPath}/index.js, please check.`)
			exit()
		}

		shell.exec("babel-node " + testPath + "/index.js")
		return
	}

	/**
	 * if it is a bower or component
	 */
	
	if(!fs.existsSync(testPath + "/specs/index.js")) {
		logger.error(`Error: can't find test entry file at ${testPath}/specs/index.js, please check.`)
		exit()
	}

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
		let dependencies = bowerInfo.dependencies
		let denpendenciesFiles = []

		if(dependencies) {
			dependencies = Object.keys(dependencies)
			if(dependencies.length > 0) {
				dependencies.forEach(dependence => bowers.push(dependence))
			}
		}

		if(bowers.length > 0) {
			bowers.forEach(bower => {
				let files = getBowerFiles(bower)
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