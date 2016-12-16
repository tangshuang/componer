import {gulp, path, fs, logger, config} from "../loader"
import isValidName from "../utils/isValidName"
import hasComponent from "../utils/hasComponent"
import {dashlineName} from "../utils/nameConvert"
import runTask from "../utils/runTask"
import getBowerFiles from "../utils/getBowerStatic"

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
	var browser = arg.browser || "phantomjs"

	if(!isValidName(name)) {
		return
	}
	if(!hasComponent(name)) {
		return
	}
	
	if(browser === "p" || browser.toLowerCase() === "phantomjs") {
		browser = "PhantomJS"
	}
	else if(browser === "f" || browser.toLowerCase() === "firefox") {
		browser = "Firefox"
	}
	else if(browser === "c" || browser.toLowerCase() === "chrome") {
		browser = "Chrome"
	}
	
	name = dashlineName(name)
	var componentPath = path.join(config.paths.components, name)
	var srcPath = path.join(componentPath, "src")
	var distPath = path.join(componentPath, "dist")
	var testPath = path.join(componentPath, "test")

	if(!fs.existsSync(testPath)) {
		logger.error(`Error: component ${name} has no test directory.`)
		return
	}

	if(!fs.existsSync(distPath)) {
		runTask("build", {
			name: name
		})
	}

	// package
	if(fs.existsSync(componentPath + "/package.json")) {
		shell.exec("babel-node " + testPath + "/index.js --color")
	}
	// others
	else {
		var denpendenciesFiles = []
		var bowers = []
		// bower
		if(fs.existsSync(componentPath + "/bower.json")) {
			var bowerInfo = JSON.parse(fs.readFileSync(componentPath + "/bower.json"))
			var dependencies = bowerInfo.dependencies

			if(dependencies) {
				dependencies = Object.keys(dependencies)
				if(dependencies.length > 0) {
					dependencies.forEach(dependence => bowers.push(dependence))
				}
			}
		}
		// component
		else if(fs.existsSync(componentPath + "/componer.json")) {
			var componentInfo = JSON.parse(fs.readFileSync(componentPath + "/componer.json"))
			var dependencies = componentInfo.dependencies

			if(dependencies) {
				dependencies = Object.keys(dependencies)
				if(dependencies.length > 0) {
					dependencies.forEach(dependence => bowers.push(dependence))
				}
			}
		}

		if(bowers.length > 0) {
			bowers.forEach(bower => {
				let files = getBowerFiles(bower)
				denpendenciesFiles = denpendenciesFiles.concat(files)
			})
		}

		denpendenciesFiles = denpendenciesFiles.filter((e, i, arr) => arr.lastIndexOf(e) === i)

		var testFiles = testPath + "/specs/*.js"
		var preprocessors = {}
		
		preprocessors[testFiles] = ["webpack"]

		return gulp.src([...denpendenciesFiles, testFiles])
			.pipe(karma(config.karma({
				browsers: [browser],
				preprocessors: preprocessors,
				coverageReporter: {
					reporters: [
						{
							type: "html",
							dir: testPath + "/reporters/"
						}
					]
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
}