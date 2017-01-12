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

	if(!exists(previewEntry)) {
		log(`preview file not found.`, "error")
		exit()
	}

	var previewDir = path.dirname(previewEntry)
	var previewBundle = setFileExt(path.basename(previewEntry), ".bundle.js")
	var previewHtml = path.join(previewPath, "index.html")
	var streams = []

	function build() {
		streams.push(buildScript(previewEntry, previewDir, {
			output: {
				filename: previewBundle,
				sourceMapFilename: setFileExt(previewBundle, ".js.map"),
			},
		}))
	}
	build()

	streams.push(gulp.src(previewHtml)
		.pipe(InjectJsToHtml("buildjs", previewBundle))
		.pipe(gulp.dest(previewDir)))
	
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