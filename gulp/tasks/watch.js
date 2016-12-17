import {gulp, path, fs, args, logger, config} from "../loader"
import {isValidName, hasComponent, dashlineName, runTask} from "../utils"

module.exports = function() {
	var arg = args.watch
	var name = arg.name
	
	if(!isValidName(name)) {
		return
	}
	if(!hasComponent(name)) {
		return
	}
	
	name = dashlineName(name)
	var componentPath = path.join(config.paths.components, name)
	var srcPath = path.join(componentPath, "src")

	gulp.watch([srcPath + "/**/*"], event => {
		logger.help(`File ${event.path} was ${event.type}, running tasks...`)
		runTask("build", {
			name: name
		})
	})

	return new Promise((resolve, reject) => {})
}