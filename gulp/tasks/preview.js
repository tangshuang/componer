import {gulp, path, fs, args, logger, config} from "../loader"
import isValidName from "../utils/isValidName"
import {dashlineName} from "../utils/nameConvert"
import runTask from "../utils/runTask"

import TsServer from "ts-server"

module.exports = function() {
	var arg = args.preview
	var name = arg.name
	
	if(!isValidName(name)) {
		return
	}

	name = dashlineName(name)
	var componentPath = path.join(config.paths.components, name)
	var srcPath = path.join(componentPath, "src")
	var previewPath = path.join(componentPath, "preview")

	if(!fs.existsSync(previewPath)) {
		logger().timestamp().error(`gulp error: component ${name} has no preveiw directory.`)
		return
	}

	var watcher = gulp.watch([srcPath + "/**/*"], event => {
		logger().help('File ' + event.path + ' was ' + event.type + ', running tasks...')
		runTask("build", {
			name: name
		})
	})

	var $server = new TsServer()
	$server.setup({
		root: config.paths.root,
		open: `${config.dirs.components}/${name}/preview/`,
		livereload: {
			directory: `${componentPath}`,
			filter: function (file) {
				var filepos = file.replace(componentPath, "")
				var sep = path.sep
				if(filepos.indexOf(sep + "dist") === 0 || filepos.indexOf(sep + "preview") === 0) {
					return true
				}
				else { 
					return false
				}
			},
		},
	})

}