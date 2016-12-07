import {gulp, path, fs, args, logger, config} from "../loader"
import isValidName from "../utils/isValidName"
import {dashlineName} from "../utils/nameConvert"
import runTask from "../utils/runTask"

import {server as karma} from "gulp-karma-runner"

module.exports = function() {
	var arg = args.watch
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

	gulp.watch([srcPath + "/**/*"], event => {
		logger.set("timestamp", true).help('File ' + event.path + ' was ' + event.type + ', running tasks...')
		runTask("build", {
			name: name
		})
	})

	if(!fs.existsSync(distPath)) {
		runTask("build", {
			name: name
		})
	}

	// package
	if(fs.existsSync(componentPath + "/package.json")) {
		return gulp.src([testPath + "/**/*.js"])
			.pipe(karma(config.karma({
				port: 9000 + parseInt(Math.random() * 1000),
				browsers: ["PhantomJS", "Chrome"],
			})))
	}
	// others
	else {
		return gulp.src([testPath + "/**/*.js"])
			.pipe(karma(config.karma({
				port: 9000 + parseInt(Math.random() * 1000),
				browsers: [],
			})))
	}
}