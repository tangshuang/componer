import {gulp, path, fs, args, log, config, exit, exists, clear, load, read, readJSON} from "../loader"
import {hasComponout, dashlineName, camelName, runTask, getFileExt, setFileExt, StreamContent} from "../utils"

import browsersync from "browser-sync"
import webpack from "webpack"
import webpackStream from "webpack-stream"
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
	var tmpdir = info.tmpdir ? path.join(componoutPath, info.tmpdir) : path.join(componoutPath, ".preview_tmp")

	if(!exists(indexfile)) {
		log("preview index file is not found.", "error")
		exit()
	}

	if(exists(tmpdir)) clear(tmpdir) // clear tmp dir

	/**
	 * pre build dependencies vendors
	 */

	if(scriptfile && exists(scriptfile)) {
		let bowerJson = path.join(componoutPath, "bower.json")
	 	let pkgJson = path.join(componoutPath, "package.json")
		let getDeps = function(pkgfile) {
			if(!exists(pkgfile)) {
				return []
			}
			let deps = readJSON(pkgfile).dependencies
			return Object.keys(deps)
		}
		let deps = getDeps(bowerJson).concat(getDeps(pkgJson))
		// create vendor bundle
		webpack(webpackConfig({
			entry: {
				vendor: deps,
			},
			output: {
				path: tmpdir,
				filename: name + ".vendor.js",
				library: camelName(name) + 'Vendor',
				sourceMapFilename: name + ".vendor.js.map",
			},
			devtool: "source-map",
			plugins: [
				new webpack.DllPlugin({
					path: tmpdir + `/${name}.vendor.js.json`,
					name: camelName(name) + 'Vendor',
					context: tmpdir,
				}),
			],
		})).run((error, handle) => {})
	}


	/**
	 * create a bs server app
	 */

	var app = browsersync.create()
	var middlewares = [
		{
			route: "/",
			handle: function (req, res, next) {
				res.setHeader('content-type', 'text/html')
				gulp.src(indexfile)
					.pipe(StreamContent(html => {
						if(stylefile && exists(stylefile)) {
							html = html.replace("<!--styles-->", `<link rel="stylesheet" href="${name}.css">`)
						}
						if(scriptfile && exists(scriptfile)) {
							html = html.replace("<!--scripts-->", `<script src="${name}.js"></script>`)
							html = html.replace("<!--vendors-->", `<script src="${name}.vendor.js"></script>`)
						}
						res.end(html)
						return html
					}))
					.pipe(gulp.dest(tmpdir))
			},
		},
	]
	if(stylefile && exists(stylefile)) {
		middlewares.unshift({
			route: `/${name}.css`,
			handle: function (req, res, next) {
				if(req.originalUrl !== `/${name}.css`) {
					next()
					return
				}
				res.setHeader('content-type', 'text/css')
				gulp.src(stylefile)
					.pipe(sourcemap.init())
					.pipe(sass())
					.pipe(sourcemap.write("."))
					.pipe(StreamContent((content, filepath) => {
						if(getFileExt(filepath) === ".css") {
							res.end(content)
						}
					}))
					.pipe(gulp.dest(tmpdir))
			},
		})
	}
	if(scriptfile && exists(scriptfile)) {
		middlewares.unshift({
			route: `/${name}.js`,
			handle: function (req, res, next) {
				if(req.originalUrl !== `/${name}.js`) {
					next()
					return
				}
				res.setHeader('content-type', 'application/javascript')
				gulp.src(scriptfile)
					.pipe(webpackStream(webpackConfig({
						output: {
							filename: name + ".js",
							library: camelName(name),
							sourceMapFilename: name + ".js.map",
						},
						devtool: "source-map",
						plugins: [
							new webpack.DllReferencePlugin({
								context: tmpdir,
								manifest: load(tmpdir + `/${name}.vendor.js.json`),
							}),
						],
					})))
					.pipe(StreamContent((content, filepath) => {
						if(getFileExt(filepath) === ".js") {
							res.end(content)
						}
					}))
					.pipe(gulp.dest(tmpdir))
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
			baseDir: tmpdir,
		},
		files: watchFiles,
		watchOptions: info.watchOptions ? info.watchOptions : {},
		middleware: middlewares,
	})

})
