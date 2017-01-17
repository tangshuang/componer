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
	var previewScript = path.join(previewDir, "index.js")
	var previewStyle = path.join(previewDir, "index.scss")
	var previewTmp = path.join(componoutPath, ".tmp")

	if(!exists(previewHtml)) {
		log("You should put a index.html in your preview directory.", "error")
		exit()
	}
	if(!exists(previewScript)) {
		log("You should put a index.js in your preview directory.", "error")
		exit()
	}
	
	var host = "127.0.0.1"
	var port = Math.floor(Math.random() * 1000) + 9000
	
	var streams = []

	function buildHtml() {
		return gulp.src(previewHtml)
			.pipe(InjectJsToHtml("buildjs", name + ".bundle.js"))
			.pipe(InjectCssToHtml("buildcss", name + ".bundle.css"))
			.pipe(gulp.dest(previewTmp))
	}
	streams.push(buildHtml())

	function buildScripts() {
		return buildScript(previewScript, previewTmp, {
				output: {
					filename: name + ".bundle.js",
					library: camelName(name),
					sourceMapFilename: name + ".bundle.js" + ".map",
				},
				devtool: "source-map",
			})
	}
	streams.push(buildScripts())

	function buildStyles() {
		return buildStyle(previewStyle, previewTmp, {
				output: {
					filename: name + ".bundle.css",
					sourcemap: true,
				},
			})
	}
	if(exists(previewStyle)) {
		streams.push(buildStyles())
	}

	gulp.watch([previewDir + "/**/*", srcPath + "/**/*"], event => {
		let changefile = event.path
		let ext = getFileExt(changefile)
		if(ext === ".js") {
			buildScripts()
		}
		else if(ext === ".scss" || ext === ".css") {
			buildStyles()
		}
		else if(changefile.indexOf("index.html") > -1) {
			buildHtml()
		}
	})

	var $server = new TsServer()
	return concat(streams)
		.on("end", () => {
			// setup static server
			$server.setup({
				host: host,
				port: port,
				root: previewTmp,
				open: "index.html",
				livereload: {
					enable: true,
					port: port + 10,
					directory: previewTmp,
					filter: function(file) {
						if(file.indexOf("index.html") > -1 || file.indexOf(name + ".bundle.js") > -1 || file.indexOf(name + ".bundle.css") > -1) {
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