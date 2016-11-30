import {gulp, path, fs, args, logger, config} from "../loader"
import isValidName from "../utils/isValidName"
import {dashlineName} from "../utils/nameConvert"
import runTask from "../utils/runTask"

module.exports = function() {
	var arg = args.watch
	var name = arg.name
	
	if(!isValidName(name)) {
		return
	}

	name = dashlineName(name)
	var componentPath = path.join(config.paths.components, name)
	var srcPath = path.join(componentPath, "src")

	var watcher = gulp.watch([srcPath + "/**/*"], event => {
		logger().help('File ' + event.path + ' was ' + event.type + ', running tasks...')
		runTask("build", {
			name: name
		})
	})
}