import {gulp, path, fs, args, log, config, exit, exists, readJSON} from "../loader"
import {hasComponout, dashlineName, camelName, runTask, getFileExt, setFileExt, buildScript, buildStyle, InjectJsToHtml, InjectCssToHtml} from "../utils"

import TsServer from "ts-server"
import concat from "pipe-concat"
import md5File from "md5-file"
import rename from "gulp-rename"
import reload from "require-reload"

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

	if(!settings.preview) {
		log(`preview option is incorrect in your componer.json.`, "error")
		exit()
	}

	var previewIndex = settings.preview.index
	var previewScript = settings.preview.script
	var previewStyle = settings.preview.style
	var previewServer = settings.preview.server
	var previewTmpdir = settings.preview.tmpdir

	if(!previewIndex) {
		log(`preview.index option is incorrect in your componer.json.`, "error")
		exit()
	}

	var indexfile = path.join(componoutPath, previewIndex)
	var scriptfile = previewScript ? path.join(componoutPath, previewScript) : false
	var stylefile = previewStyle ? path.join(componoutPath, previewStyle) : false
	var serverfile = previewServer ? path.join(componoutPath, previewServer) : false
	var tmpdir = path.join(componoutPath, previewTmpdir)

	if(!exists(indexfile)) {
		log(`preview.index file is not found.`, "error")
		exit()
	}

	if(scriptfile && !exists(scriptfile)) {
		log(`preview.script file is not found.`, "error")
		exit()
	}

	if(stylefile && !exists(stylefile)) {
		log(`preview.style file is not found.`, "error")
		exit()
	}

	if(serverfile && !exists(serverfile)) {
		log(`preview.server file is not found.`, "error")
		exit()
	}

	var host = "127.0.0.1"
	var port = Math.floor(Math.random() * 1000) + 9000

	// if there is no script and style entry files, it means preview will use built files in dist directory
	if(!previewScript && !previewStyle) {
		runTask("build", {
			name: name,
		})
	}

	var streams = []

	function buildScripts() {
		return buildScript(scriptfile, tmpdir, {
				output: {
					filename: name + ".js",
					library: camelName(name),
					sourceMapFilename: name + ".js" + ".map",
				},
				devtool: "source-map",
			})
	}
	if(scriptfile) {
		streams.push(buildScripts())
	}

	function buildStyles() {
		return buildStyle(stylefile, tmpdir, {
				output: {
					filename: name + ".css",
					sourcemap: true,
				},
			})
	}
	if(stylefile) {
		streams.push(buildStyles())
	}

	function buildHtml() {
		var stream
		if(scriptfile && stylefile) {
			stream = gulp.src(indexfile)
				.pipe(InjectJsToHtml("buildjs", name + ".js"))
				.pipe(InjectCssToHtml("buildcss", name + ".css"))
				.pipe(rename("index.html"))
				.pipe(gulp.dest(tmpdir))
		}
		else if(scriptfile) {
			stream = gulp.src(indexfile)
				.pipe(InjectJsToHtml("buildjs", name + ".js"))
				.pipe(rename("index.html"))
				.pipe(gulp.dest(tmpdir))
		}
		else if(stylefile) {
			stream = gulp.src(indexfile)
				.pipe(InjectCssToHtml("buildcss", name + ".css"))
				.pipe(rename("index.html"))
				.pipe(gulp.dest(tmpdir))
		}
		else {
			stream = gulp.src(indexfile).pipe(rename("index.html")).pipe(gulp.dest(tmpdir))
		}
		return stream
	}
	streams.push(buildHtml())

	var lastMd5
	var status = {}
	var timer
	var entryfiles = [indexfile]

	if(scriptfile) {
		entryfiles.push(scriptfile)
	}
	if(stylefile) {
		entryfiles.push(stylefile)
	}
	if(!scriptfile && !stylefile) {
		entryfiles.push(srcPath + "/**/*")
	}

	gulp.watch(entryfiles, event => {
		var changeFile = event.path
		var newMd5 = md5File.sync(changeFile)
		if(lastMd5 === newMd5) {
			return
		}

		log(`${changeFile} has changed.`)

		function rebuild() {
			var ext = getFileExt(changeFile)
			if(scriptfile && ext === ".js") {
				if(status.script) {
					return
				}
				status.script = true
				buildScripts().on("end", () => status.script = false)
			}
			else if(stylefile && (ext === ".scss" || ext === ".css")) {
				if(status.style) {
					return
				}
				status.style = true
				buildStyles().on("end", () => status.style = false)
			}
			else if(changeFile === indexfile) {
				if(status.html) {
					return
				}
				status.html = true
				buildHtml().on("end", () => status.html = false)
			}
			else if(changeFile.indexOf(srcPath) > -1) {
				runTask("build", {
					name: name
				})
			}
		}

		if(timer) {
			clearTimeout(timer)
		}
		timer = setTimeout(rebuild, 500)
	})

	function callbackend(app) {
		// backend program
		if(serverfile) {
			let serve = reload(serverfile)
			if(typeof serv === "function") {
				return serve(app)
			}
			else if(typeof serve === "object" && typeof serve.default === "function") {
				return serve.default(app)
			}
		}
	}

	var $server = new TsServer({
		host: host,
		port: port,
		root: componoutPath,
		open: previewTmpdir + "/index.html",
		livereload: {
			enable: true,
			port: port + 10,
			directory: componoutPath,
			filter: function(file) {
				var listenList = settings.preview.listen
				var hint = false
				if(listenList instanceof Array && listenList.length > 0) {
					listenList.forEach(listenfile => {
						listenfile = path.resolve(componoutPath, listenfile)
						if(listenfile.indexOf(file) > -1) {
							hint = true
						}
					})
				}
				return hint
			},
			callback: function(file, current, previous) {},
		},
		onStart: function(app) {
			log("starting...")
			callbackend(app)
		},
		onOpen: function(url) {
			log("opening: " + url, "help")
		},
		onRestart: function() {
			log("restarting...")
		},
	})

	// watch server.js to restart server
	if(serverfile) {
		let lastMd5
		gulp.watch(serverfile, event => {
			var changeFile = event.path
			var newMd5 = md5File.sync(changeFile)
			if(lastMd5 === newMd5) {
				return
			}

			if($server.status) {
				$server.restart()
				$server.reload()
			}
		})
	}

	return concat(streams)
		.on("end", () => {
			$server.start()
		})

})
