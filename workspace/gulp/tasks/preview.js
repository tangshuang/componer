import {gulp, path, fs, args, log, config, exit, exists, read, readJSON, write, execute, clear} from "../loader"
import {paserTemplate, hasComponout, dashlineName, runTask, getBowerDeps, getBowerMain, getFileExt, setFileExt, buildStyle, buildScript, InjectJsToHtml, InjectCssToHtml} from "../utils"

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

	var previewPath = path.join(componoutPath, previewDir)
	if(!exists(previewPath)) {
		log(`preview directory not found.`, "error")
		exit()
	}

	var previewHtml = path.join(previewPath, "index.html")
	var previewJs = path.join(previewPath, "index.js")
	var previewScss = path.join(previewPath, "index.scss")
	var tmp = path.join(previewPath, ".tmp")
	var streams = []
	
	function build() {
		var scripts = {}
		var styles = []

		function getFiles(file, _main) {
			var ext = getFileExt(file)
			if(ext === ".scss") {
				_main.style = file
			}
			else if(ext === ".css" && !main.style) {
				_main.style = file
			}
			else if(ext === ".js") {
				_main.script = file
			}
		}

		var bowerJson = path.join(componoutPath, "bower.json")
		if(exists(bowerJson)) {
			let deps = getBowerDeps(bowerJson, true)
			if(deps.length > 0) {
				deps.forEach(dep => {
					let files = getBowerMain(dep)
					let main = {}

					files.forEach(file => getFiles(file, main))

					if(main.style) {
						styles.push(main.style)
					}

					if(main.script) {
						scripts[dep] = main.script
					}
				})
			}
			
			let bowerInfo = readJSON(bowerJson)
			let mainFiles = bowerInfo.main
			if(Array.isArray(mainFiles)) {
				let main = {}
				mainFiles.forEach(file => getFiles(file, main))
				if(main.style) {
					styles.push(path.resolve(componoutPath, main.style))
				}

				if(main.script) {
					scripts[bowerInfo.name] = path.resolve(componoutPath, main.script)
				}
			}

		}

		styles.push(previewScss)
		var stream1 = buildStyle(styles, tmp, {
			output: {
				filename: "index.css",
				sourcemap: true,
			},
		})
		streams.push(stream1)

		var stream2 = buildScript(previewJs, tmp, {
			output: {
				filename: "index.js",
				sourceMapFilename: "index.js.map",
			},
			resolve: {
				alias: scripts
			},
		})
		streams.push(stream2)

	}

	build()

	var stream3 = gulp.src(previewHtml)
		.pipe(InjectCssToHtml("buildcss", ".tmp/index.css"))
		.pipe(InjectJsToHtml("buildjs", ".tmp/index.js"))
		.pipe(gulp.dest(previewPath))
	streams.push(stream3)
	
	return pipeConcat(streams)
		.on("end", () => {
			// watch change
			gulp.watch([srcPath + "/**/*", previewPath + "/index.*"], event => {
				log(`${event.path} was ${event.type}`, "help")
				streams = []
				build()
			})

			// open static server
			var $server = new TsServer()
			var port = Math.floor(Math.random() * 1000) + 9000
			$server.setup({
				port: port,
				root: previewPath,
				open: "index.html",
				livereload: {
					port: port + Math.floor(Math.random() * 10),
					directory: tmp,
				},
			})
			
		})

		
})