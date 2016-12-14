import {gulp, path, fs, args, logger, config} from "../loader"
import isValidName from "../utils/isValidName"
import hasComponent from "../utils/hasComponent"
import {dashlineName} from "../utils/nameConvert"
import runTask from "../utils/runTask"

import {server as karma} from "gulp-karma-runner"
import shell from "shelljs"
import TsServer from "ts-server"

module.exports = function() {
	var arg = args.test
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
		var entryFiles = []
		// bower
		if(fs.existsSync(componentPath + "/bower.json")) {
			var bowerInfo = JSON.parse(fs.readFileSync(componentPath + "/bower.json"))
			entryFiles = bowerInfo.main
		}
		// component
		else if(fs.existsSync(componentPath + "/componer.json")) {
			var componentInfo = JSON.parse(fs.readFileSync(componentPath + "/componer.json"))
			componentInfo.entry.js && entryFiles.push(componentInfo.entry.js)
			componentInfo.entry.style && entryFiles.push(componentInfo.entry.style)
		}
		// other
		else {
			entryFiles = [srcPath + "/**/*.js"]
		}

		console.log(entryFiles)

		return gulp.src([...entryFiles, testPath + "/specs/*.js"])
			.pipe(karma(config.karma({
				port: 9000 + parseInt(Math.random() * 1000),
				browsers: ["Firefox"],
				preprocessors: {
					"**/src/**/*.js": ["webpack"],
					"**/test/specs/*.js": ["webpack"],
				},
				coverageReporter: {
					type : "html",
					dir : testPath + "/reports/",
				},
			}))).on("end", () => {
				var $server = new TsServer()
				var port = Math.floor(Math.random() * 1000) + 8000
				$server.setup({
					port: port,
					root: config.paths.root,
					open: `${config.dirs.components}/${name}/test/reports/`,
					livereload: false,
					indexes: true,
				})
			})
	}
}