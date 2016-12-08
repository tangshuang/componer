import {gulp, path, fs, args, logger, config} from "../loader"
import isValidName from "../utils/isValidName"
import {dashlineName} from "../utils/nameConvert"
import runTask from "../utils/runTask"

import {server as karma} from "gulp-karma-runner"
import shell from "shelljs"

module.exports = function() {
	var arg = args.test
	var name = arg.name
	
	if(!isValidName(name)) {
		return
	}

	name = dashlineName(name)
	var componentPath = path.join(config.paths.components, name)
	var srcPath = path.join(componentPath, "src")
	var distPath = path.join(componentPath, "dist")
	var testPath = path.join(componentPath, "test")

	if(!fs.existsSync(testPath)) {
		logger.set("timestamp", true).error(`gulp error: component ${name} has no test directory.`)
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
		// return gulp.src([testPath + "/**/*.js"])
		// 	.pipe(karma(config.karma({
		// 		port: 9000 + parseInt(Math.random() * 1000),
		// 		browsers: [],
		// 	})))
	}
}