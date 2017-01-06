import {gulp, path, fs, args, log, config, exit, exists, read, readJSON, write} from "../loader"
import {paserTemplate, hasComponout, dashlineName, runTask, prettyHtml, getBowerDeps, getBowerMain, getFileExt, setFileExt, buildStyle, buildScript} from "../utils"

import sass from "gulp-sass"
import sourcemaps from "gulp-sourcemaps"
import TsServer from "ts-server"

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

	if(!settings.output.preview) {
		log(`preview option is incorrect in your componer.json.`, "error")
		exit()
	}

	// build if not built
	if(!exists(distPath)) {
		runTask("build", {
			name: name
		})
	}

	var previewFile = path.join(componoutPath, settings.output.preview)

	/**
	 * modify preview index.html
	 */

	var content = read(previewFile)

	// build dependencies
	var bowerJson = componoutPath + "/bower.json"
	if(exists(bowerJson)) {
		let deps = getBowerDeps(bowerJson)

		if(Array.isArray(deps) && deps.length > 0) {

			/**
			 * find out dependencies files
			 * compile scss to css in the same directory with scss files
			 */

			let bowerBase = path.join(config.paths.root, "bower_components")
			let depsFiles = []
			deps.forEach(dep => {
				let depMainFiles = getBowerMain(dep)
				if(typeof depMainFiles === "string") {
					depMainFiles = [depMainFiles]
				}

				let depMainScss
				let depMainCss
				let depMainJs
				depMainFiles.forEach(file => {
					let ext = getFileExt(file)
					if(ext === ".scss") {
						depMainScss = dep + "/" + file
					}
					else if(ext === ".css") {
						depMainCss = dep + "/" + file
					}
					else if(ext === ".js") {
						depMainJs = dep + "/" + file
					}
				})

				if(depMainJs) {
					depsFiles.push(depMainJs)
				}
				if(depMainCss) {
					depsFiles.push(depMainCss)
				}
				else if(depMainScss) {
					let depFilePath = bowerBase + "/" + depMainScss
					let depCss = setFileExt(depMainScss, ".css")
					!exists(bowerBase + "/" + depCss) && buildStyle(depFilePath, path.dirname(depFilePath), {
						output:  {
							filename: path.basename(depCss),
							sourcemap: true,
						},
					})
					depsFiles.push(depCss)
				}
			})

			/**
			 * inject dependencies files into index.html
			 */

			let cssfiles = []
			let jsfiles = []
			depsFiles.forEach(function(file){
				if(getFileExt(file) === ".css") {
					cssfiles.push(`/bower_components/${file}`)
				}
				else if(getFileExt(file) === ".js") {
					jsfiles.push(`/bower_components/${file}`)
				}
			})

			gulp.src(entryIndex)
				.pipe(InjectJsToHtml("bowerjs", jsfiles))
				.pipe(InjectCssToHtml("bowercss", cssfiles))
				.pipe(gulp.dest(previewDir))
			
		}
	}
	
	/**
	 * inject build files inot index.html
	 */

	var outputDirs = settings.output
	var outputJs = outputDirs.script
	var outputCss = outputDirs.style
	var previewDir = path.dirname(previewFile)

	gulp.src(entryIndex)
		.pipe(InjectJsToHtml("buildjs", path.relative(previewDir, outputJs) + `/${settings.webpack.output.filename}`))
		.pipe(InjectCssToHtml("buildcss", path.relative(previewDir, outputCss) + `/${settings.sass.output.filename}`))
		.pipe(gulp.dest(previewDir))

	// open server
	var $server = new TsServer()
	var port = Math.floor(Math.random() * 1000) + 8000
	$server.setup({
		port: port,
		root: config.paths.root,
		open: `componouts/${name}/${settings.output.preview}`,
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

	// watch change
	gulp.watch([srcPath + "/**/*"], event => {
		log(`${event.path} was ${event.type}, building...`, "help")
		runTask("build", {
			name: name
		})
	})

})