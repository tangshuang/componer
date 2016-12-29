import {gulp, path, fs, args, log, config, exit, exists, read, readJSON, write} from "../loader"
import {paserTemplate, hasComponout, dashlineName, runTask, prettyHtml, getComponout, getBowerDeps, getBowerMain, getFileExt, setFileExt} from "../utils"

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
	var previewPath = path.join(componoutPath, "preview")
	var previewFile = path.join(previewPath, "index.html")

	if(!exists(previewPath)) {
		log(`${name} has no preveiw directory.`, "error")
		exit()
	}

	// build if not built
	if(!exists(distPath)) {
		runTask("build", {
			name: name
		})
	}

	/**
	 * modify preive index.html
	 */

	// paser template
	gulp.src(previewFile)
		.pipe(paserTemplate({
			componentName: name,
		}))
		.pipe(gulp.dest(path.dirname(previewFile)))

	var content = read(previewFile)

	// build dependencies
	var type = getComponout(name).type
	if(type === "bower") {
		let bowerJson = path.join(componoutPath, "bower.json")
		let deps = getBowerDeps(bowerJson)

		if(Array.isArray(deps) && deps.length > 0) {

			/**
			 * find out dependencies files
			 * compile scss to css in the same directory with scss files
			 */
			
			let compileScss = function(scssPath) {
				gulp.src(scssPath)
					.pipe(sourcemaps.init())
					.pipe(sass())
					.pipe(sourcemaps.write("./"))
					.pipe(gulp.dest(path.dirname(scssPath)))
			}

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
				else if(depMainScss) { // only compile scss when have no css
					let depFilePath = bowerBase + "/" + depMainScss
					compileScss(depFilePath)
					depsFiles.push(setFileExt(depMainScss, ".css"))
				}
			})

			/**
			 * inject dependencies files into index.html
			 */

			let depcsshtml = ""
			let depjshtml = ""
			depsFiles.forEach(function(file){
				if(getFileExt(file) === ".css") {
					depcsshtml += `<link rel="stylesheet" href="/bower_components/${file}">`
				}
				else if(getFileExt(file) === ".js") {
					depjshtml += `<script src="/bower_components/${file}"></script>`
				}
			})

			let depcssreg = new RegExp('(<!--\s*?bower:css\s*?-->)([\\s\\S]*?)(<!--\s*?endbower\s*?-->)','im')
			let depjsreg = new RegExp('(<!--\s*?bower:js\s*?-->)([\\s\\S]*?)(<!--\s*?endbower\s*?-->)','im')
			content = content.replace(depcssreg, '$1' + depcsshtml + '$3').replace(depjsreg,'$1' + depjshtml + '$3')
			
		}
	}
	
	/**
	 * inject build files inot index.html
	 */

	var componerInfo = readJSON(componoutPath + "/componer.json")
	var outputDirs = componerInfo.output
	var outputJs = outputDirs.script
	var outputCss = outputDirs.style

	if(outputJs) {
		let buildjshtml = `<script src="../${outputJs}/${componerInfo.webpack.output.filename}"></script>`
		let buildjsreg = new RegExp('(<!--\s*?build:js\s*?-->)([\\s\\S]*?)(<!--\s*?endbower\s*?-->)([\\s\\S]*?)(<!--\s*?endbuild\s*?-->)','im')
		content = content.replace(buildjsreg, "$1$2$3" + buildjshtml + "$5")
	}

	if(outputCss) {
		let buildcsshtml = `<link rel="stylesheet" href="../${outputCss}/${componerInfo.sass.output.filename}">`
		let buildcssreg = new RegExp('(<!--\s*?build:css\s*?-->)([\\s\\S]*?)(<!--\s*?endbower\s*?-->)([\\s\\S]*?)(<!--\s*?endbuild\s*?-->)','im')
		content = content.replace(buildcssreg, "$1$2$3" + buildcsshtml + "$5")
	}


	// pretty code
	content = prettyHtml(content)

	// update preview index.html
	write(previewFile, content)

	// open server
	var $server = new TsServer()
	var port = Math.floor(Math.random() * 1000) + 8000
	$server.setup({
		port: port,
		root: config.paths.root,
		open: `componouts/${name}/preview/index.html`,
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