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
	var previewFile = settings.entry.preview

	if(!previewFile) {
		log(`entry.preview option is incorrect in your componer.json.`, "error")
		exit()
	}

	var previewPath = path.join(componoutPath, previewFile)
	var previewDir = path.dirname(previewPath)

	if(!exists(previewPath)) {
		log(`preview entry file not found.`, "error")
		exit()
	}

	/**
	 * modify preview index.html
	 */

	if(!exists(previewPath + "~")) {
		execute(`cp ${previewPath} ${previewPath}~`)
	}

	var streams = []

	// build files
	runTask("build", {
		name: name
	})

	var outputDirs = settings.output
	var outputJs = outputDirs.script
	var outputCss = outputDirs.style
	
	var stream = gulp.src(previewPath)
		.pipe(InjectJsToHtml("buildjs", relativeUrl(`${settings.webpack.output.filename}`, previewDir, componoutPath + "/" + outputJs)))
		.pipe(InjectCssToHtml("buildcss", relativeUrl(`${settings.sass.output.filename}`, previewDir, componoutPath + "/" + outputCss)))

	// dependencies
	var bowerJson = componoutPath + "/bower.json"
	if(exists(bowerJson)) {
		let depsFiles = getBowerDepsFiles(bowerJson, true)

		if(Array.isArray(depsFiles) && depsFiles.length > 0) {

			let depsScripts = []
			let depsStyles = []

			depsFiles.forEach(depFile => {
				let ext = getFileExt(depFile)
				if(ext === ".scss" || ext === ".css") {
					depsStyles.push(depFile)
				}
				else if(ext === ".js") {
					depsScripts.push(depFile)
				}
			})

			if(depsStyles.length > 0) {
				let stream1 = buildStyle(depsStyles, previewDir, {
					output: {
						filename: name + ".css",
						sourcemap: true,
					},
				})
				streams.push(stream1)
				stream.pipe(InjectCssToHtml("bowercss", name + ".css"))
			}

			if(depsScripts.length > 0) {
				let stream2 = buildScript(depsScripts, previewDir, {
					output: {
						filename: name + ".js",
						sourceMapFilename: name + ".js.map",
					},
				})
				streams.push(stream2)
				stream.pipe(InjectJsToHtml("bowerjs", name + ".js"))
			}
			
		}

	}

	stream.pipe(gulp.dest(previewDir))
	streams.push(stream)

	// watch change
	gulp.watch([srcPath + "/**/*"], event => {
		log(`${event.path} was ${event.type}, building...`, "help")
		runTask("build", {
			name: name
		})
	})

	return pipeConcat(streams)
		.on("end", () => {
			// open static server
			var $server = new TsServer()
			var port = Math.floor(Math.random() * 1000) + 9000
			$server.setup({
				port: port,
				root: config.paths.root,
				open: `componouts/${name}/${previewFile}`,
				livereload: {
					port: port + Math.floor(Math.random() * 10),
					directory: componoutPath,
					filter: function (file) {
						var filepos = file.replace(componoutPath, "")
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
		})
		
})