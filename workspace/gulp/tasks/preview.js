import {gulp, path, fs, args, log, config, exit, exists, read, readJSON, write, execute} from "../loader"
import {paserTemplate, hasComponout, dashlineName, runTask, getBowerDepsFiles, getFileExt, setFileExt, buildStyle, buildScript, InjectJsToHtml, InjectCssToHtml, relativeUrl} from "../utils"

import TsServer from "ts-server"
import pipeConcat from "pipe-concat"

gulp.task("preview", () => {
	const arg = args.preview
	const name = dashlineName(arg.name)

	if(!hasComponout(name)) {
		log(`${name} not exists.`, "error")
		exit()
	}

	var componoutPath = path.join(config.paths.componouts, name)
	var srcPath = path.join(componoutPath, "src")
	var distPath = path.join(componoutPath, "dist")
	var settings = readJSON(componoutPath + "/componer.json")
	var previewDir = settings.entry.preview

	if(!previewDir) {
		log(`entry.preview option is incorrect in your componer.json.`, "error")
		exit()
	}

	if(!exists(previewDir)) {
		log(`preview directory not found.`, "error")
		exit()
	}

	var previewHtml = path.join(componoutPath, previewDir, "index.html")
	var previewJs = path.join(componoutPath, previewDir, "index.js")
	var previewScss = path.join(componoutPath, previewDir, "index.scss")
	
	(function build() {
		var scripts = []
		var styles = []
		var streams = []

		if(exists(componoutPath + "/bower.json")) {
			let files = getBowerDepsFiles(componoutPath + "/bower.json", true)
			if(files.length > 0) {
				files.forEach(file => {
					let ext = getFileExt(file)
					if(ext === ".scss" || ext === ".css") {
						styles.push(file)
					}
					else if(ext === ".js") {
						scripts.push(file)
					}
				})
			}
		}

		scripts.push(previewJs)
		styles.push(previewScss)

		if(styles.length > 0) {
			let stream1 = buildStyle(styles, previewDir, {
				output: {
					filename: "style.css",
					sourcemap: true,
				},
			})
			streams.push(stream1)
		}

		if(scripts.length > 0) {
			let stream2 = buildScript(scripts, previewDir, {
				output: {
					filename: "bundle.js",
					sourceMapFilename: "bundle.js.map",
				},
			})
			streams.push(stream2)
		}
	})()

	

	// watch change
	gulp.watch([srcPath + "/**/*"], event => {
		log(`${event.path} was ${event.type}, building...`, "help")
		build()
	})

	return pipeConcat(streams)
		.on("end", () => {
			// open static server
			var $server = new TsServer()
			var port = Math.floor(Math.random() * 1000) + 9000
			$server.setup({
				port: port,
				root: config.paths.root,
				open: `componouts/${name}/${previewDir}/index.html`,
				livereload: {
					port: port + Math.floor(Math.random() * 10),
					directory: previewDir,
				},
			})
		})
		
})