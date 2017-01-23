import {gulp, path, fs, args, log, config, exit, exists, readJSON} from "../loader"
import {hasComponout, dashlineName, camelName, getFileExt, setFileExt, buildScript, buildStyle, InjectJsToHtml, InjectCssToHtml} from "../utils"

import TsServer from "ts-server"
import concat from "pipe-concat"
import md5File from "md5-file"

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

	function buildScripts() {
		return buildScript(previewScript, previewTmp, {
				output: {
					filename: name + ".bundle.js",
					library: camelName(name),
					sourceMapFilename: name + ".bundle.js" + ".map",
				},
				devtool: "inline-source-map",
			})
	}
	streams.push(buildScripts())

	function buildStyles() {
		return buildStyle(previewStyle, previewTmp, {
				output: {
					filename: name + ".bundle.css",
					sourcemap: "inline",
				},
			})
	}
	if(exists(previewStyle)) {
		streams.push(buildStyles())
	}

	function buildHtml() {
		return gulp.src(previewHtml)
			.pipe(InjectJsToHtml("buildjs", name + ".bundle.js"))
			.pipe(InjectCssToHtml("buildcss", name + ".bundle.css"))
			.pipe(gulp.dest(previewTmp))
	}
	streams.push(buildHtml())

	var lastMd5
	var status = {}
	var timer
	gulp.watch([previewDir + "/**/*", srcPath + "/**/*"], event => {
		if(timer) {
			clearTimeout(timer)
		}
		timer = setTimeout(() => {
			let changeFile = event.path
			let newMd5 = md5File.sync(changeFile)
			if(lastMd5 === newMd5) {
				return
			}

			let ext = getFileExt(changeFile)
			if(ext === ".js") {
				if(status.script) {
					return
				}
				status.script = true
				buildScripts().on("end", () => status.script = false)
			}
			else if(ext === ".scss" || ext === ".css") {
				if(status.style) {
					return
				}
				status.style = true
				buildStyles().on("end", () => status.style = false)
			}
			else if(changeFile.indexOf("index.html") > -1) {
				if(status.html) {
					return
				}
				status.html = true
				buildHtml().on("end", () => status.html = false)
			}
		}, 500)
	})

	var $server = new TsServer()
	return concat(streams)
		.on("end", () => {
			// backend server
			var backendServer
			if(exists(previewDir + "/server.js")) {
				let serv = require(previewDir + "/server.js")
				if(typeof serv === "function") {
					backendServer = serv
				}
				else if(typeof serv === "object" && typeof serv.default === "function") {
					backendServer = serv.default
				}
			}
			// setup static server
			$server.setup({
				host: host,
				port: port,
				root: previewTmp,
				open: "index.html",
				backendServer,
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

					onChange: function(file) {},
				},
				onOpen: function(url) {
					log("opening: " + url, "help")
				},
			})
		})
		
})