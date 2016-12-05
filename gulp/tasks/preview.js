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
	var distPath = path.join(componentPath, "dist")

	gulp.watch([srcPath + "/**/*"], event => {
		logger.set("timestamp", true).help('File ' + event.path + ' was ' + event.type + ', running tasks...')
		runTask("build", {
			name: name
		})
	})

	if(!fs.existsSync(previewPath)) {
		logger.set("timestamp", true).error(`gulp error: component ${name} has no preveiw directory.`)
		return
	}

	if(!fs.existsSync(distPath)) {
		runTask("build", {
			name: name
		})
	}

	var $server = new TsServer()
	var port = Math.floor(Math.random() * 1000) + 8000
	$server.setup({
		port: port,
		root: config.paths.root,
		open: `${config.dirs.components}/${name}/preview/index.html`,
		livereload: {
			port: port + Math.floor(Math.random() * 10),
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