import {gulp, path, fs, args, log, config, exit, exists, load, read} from "../loader"
import {hasComponout, dashlineName, camelName, runTask, getFileExt, setFileExt, StreamContent} from "../utils"

import browsersync from "browser-sync"

import webpack from "webpack-stream"
import webpackConfig from "../drivers/webpack.config"

import sass from "gulp-sass"
import sourcemap from "gulp-sourcemaps"


gulp.task("preview", () => {
	var arg = args.preview
	var name = dashlineName(arg.name)

	if(!hasComponout(name)) {
		log(`${name} not exists.`, "error")
		exit()
	}

	var componoutPath = path.join(config.paths.componouts, name)
	var srcPath = path.join(componoutPath, "src")

	if(!exists(componoutPath + "/componer.config.js")) {
		log("componer.config.js not exists.", "error")
		exit()
	}

	var info = load(componoutPath + "/componer.config.js").preview
	if(!info) {
		log("preview option in componer.config.js not found.", "error")
		exit()
	}

	var indexfile = path.join(componoutPath, info.index)
	var scriptfile = info.script ? path.join(componoutPath, info.script) : false
	var stylefile = info.style ? path.join(componoutPath, info.style) : false
	var serverfile = info.server ? path.join(componoutPath, info.server) : false

	if(!exists(indexfile)) {
		log("preview index file is not found.", "error")
		exit()
	}

	/**
	 * create a bs server app
	 */

	var app = browsersync.create()
	var middlewares = [
		{
			route: "/",
			handle: function (req, res, next) {
				let html = read(indexfile)
				html = html.replace("<!--styles-->", `<link rel="stylesheet" href="${name}.css">`)
				html = html.replace("<!--scripts-->", `<script src="${name}.js"></script>`)
				res.end(html)
				next()
			},
		},
	]
	if(stylefile && exists(stylefile)) {
		middlewares.unshift({
			route: `/${name}.css`,
			handle: function (req, res, next) {
				gulp.src(stylefile)
					.pipe(sourcemap.init())
					.pipe(sass())
					.pipe(sourcemap.write())
					.pipe(StreamContent(content => {
						res.setHeader('content-type', 'text/css')
						res.end(content)
						next()
					}))
			},
		})
	}
	if(scriptfile && exists(scriptfile)) {
		middlewares.unshift({
			route: `/${name}.js`,
			handle: function (req, res, next) {
				gulp.src(scriptfile)
					.pipe(webpack(webpackConfig({
						devtool: "inline-source-map",
					})))
					.pipe(StreamContent(content => {
						res.setHeader('content-type', 'text/javascript')
						res.end(content)
						next()
					}))
			},
		})
	}
	if(serverfile && exists(serverfile)) {
		let serverware = load(serverfile)
		if(serverware instanceof Array) {
			middlewares = middlewares.concat(serverware)
		}
		else {
			middlewares.unshift(serverware)
		}
	}

	var watchFiles = info.watchFiles
	if(typeof watchFiles === "string") {
		watchFiles = path.join(componoutPath, watchFiles)
	}
	else if(watchFiles instanceof Array) {
		watchFiles = watchFiles.map(item => path.join(componoutPath, item))
	}
	else {
		watchFiles = []
	}

	app.init({
		server: {
			baseDir: config.paths.root,
		},
		files: watchFiles,
		watchOptions: info.watchOptions ? info.watchOptions : {},
		middleware: middlewares,
	})

})
