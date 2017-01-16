import {gulp, path, fs, args, log, config, exit, exists, readJSON} from "../loader"
import {hasComponout, dashlineName, camelName, getFileExt, setFileExt, buildScript, buildStyle, InjectJsToHtml, InjectCssToHtml} from "../utils"

import TsServer from "ts-server"
import concat from "pipe-concat"

gulp.task("preview", () => {
	var arg = args.preview
	var name = dashlineName(arg.name)

	if(!hasComponout(name)) {
		log(`${name} not exists.`, "error")
		exit()
	}

	var componoutPath = path.join(config.paths.componouts, name)
	var srcPath = path.join(componoutPath, "src")

	if(!exists(componoutPath + "/componer.json")) {
		log("componer.json not exists.", "error")
		exit()
	}

	var settings = readJSON(componoutPath + "/componer.json")
	var previewEntry = settings.entry.preview

	if(!previewEntry) {
		log(`entry.preview option is incorrect in your componer.json.`, "error")
		exit()
	}

	var previewDir = path.join(componoutPath, previewEntry)

	if(!exists(previewDir)) {
		log(`preview directory not found.`, "error")
		exit()
	}

	var previewHtml = path.join(previewDir, "index.html")

	if(!exists(previewHtml)) {
		log("You should put a index.html in your preview directory.", "error")
		exit()
	}

	var previewScripts = []
	var previewStyles = []

	fs.readdirSync(previewDir).forEach(file => {
		let filepath = path.join(previewDir, file)
		if(getFileExt(file) === ".js") {
			previewScripts.push(filepath)
		}
		else if(getFileExt(file) === ".scss" || getFileExt(file) === ".css") {
			previewStyles.push(filepath)
		}
	})

	var host = "127.0.0.1"
	var port = Math.floor(Math.random() * 1000) + 9000
	
	var streams = []
	var streamInject = gulp.src(previewHtml)
		.pipe(InjectJsToHtml("buildjs", ".tmp/" + name + ".bundle.js"))
		.pipe(InjectCssToHtml("buildcss", ".tmp/" + name + ".bundle.css"))
		.pipe(gulp.dest(previewDir))
	streams.push(streamInject)

	function build() {
		var streams = []
		if(previewScripts.length > 0) {
			var streamScripts = buildScript(previewScripts, previewDir + "/.tmp", {
				output: {
					filename: name + ".bundle.js",
					library: camelName(name),
					sourceMapFilename: name + ".bundle.js" + ".map",
				},
			})
			streams.push(streamScripts)
		}

		if(previewStyles.length > 0) {
			var streamStyles = buildStyle(previewStyles, previewDir + "/.tmp", {
				output: {
					filename: name + ".bundle.css",
					sourcemap: true,
				},
			})
			streams.push(streamStyles)
		}

		return streams
	}

	var streamBuild = build()
	var $server = new TsServer()

	if(streamBuild.length > 0) {
		streams.concat(streamBuild)
		gulp.watch(srcPath, event => {
			concat(build()).on("end", () => $server.reload())
		})
	}

	return concat(streams)
		.on("end", () => {
			// setup static server
			$server.setup({
				host: host,
				port: port,
				root: componoutPath,
				open: path.basename(previewDir) + "/index.html",
				livereload: {
					enable: true,
					port: port + 10,
					directory: componoutPath,
					filter: function(file) {
						if(file.indexOf(".tmp") < 0 && file.indexOf("preview") > 0) {
							return true
						}
						else {
							return false
						}
					},
					onChange: function(file) {
					},
				},
			})
		})
		
})