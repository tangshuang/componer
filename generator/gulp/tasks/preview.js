import {gulp, path, fs, args, log, config, exit, exists, load, read} from "../loader"
import {hasComponout, dashlineName, camelName, runTask, getFileExt, setFileExt} from "../utils"

import browsersync from "browser-sync"
import webpack from "webpack-stream"
import sass from "gulp-sass"
import sourcemap from "gulp-sourcemaps"
import cssmin from "gulp-cssmin"

import webpackConfig from "../drivers/webpack.config"

gulp.task("preview", () => {
	var arg = args.preview
	var name = dashlineName(arg.name)

	if(!hasComponout(name)) {
		log(`${name} not exists.`, "error")
		exit()
	}

	var componoutPath = path.join(config.paths.componouts, name)
	var srcPath = path.join(componoutPath, "src")
	var previewPath = path.join(componoutPath, "preview")

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
	var scriptfile = path.join(componoutPath, info.script)
	var stylefile = path.join(componoutPath, info.style)
	var serverfile = path.join(componoutPath, info.server)
	var tmpdir = path.join(componoutPath, "preview", ".tmp")

	if(!exists(indexfile)) {
		log("preview index file is not found.", "error")
		exit()
	}

	var app = browsersync.create()

	// if(exists(stylefile)) {
	// 	gulp.src(stylefile)
	// 		.pipe(sourcemap.init())
	// 		.pipe(sass())
	// 		.pipe(sourcemap.write())
	// 		.pipe(app.stream())
	// }
	//
	// if(exists(scriptfile)) {
	// 	gulp.src(scriptfile)
	// 		.pipe(webpack(webpackConfig({
	// 			devtool: "inline-source-map",
	// 		})))
	// 		.pipe(app.stream())
	// }

	app.init({
		server: {
			baseDir: componoutPath,
		},
		middleware: [
			{
		        route: "/",
		        handle: function (req, res, next) {
					let html = read(indexfile)
					html = html.replace("<!--styles-->", `<link href="${name}.css">`)
						.replace("<!--scripts-->", `<script src="${name}.js"></script>`)
					res.end(html)
					next()
		        },
		    },
		],
	})

	// let contents = {}
	// gulp.watch(info.watch, event => {
	// 	// if file content not changed, do not run build task
	// 	let file = event.path
	// 	let content = read(file)
	// 	if(contents[file] && contents[file] === content) return
	// 	contents[file] = content
	//
	// 	let ext = getFileExt(file)
	// 	if(file === indexfile) {
	// 		gulp.src(indexfile)
	// 			.pipe(gulp.dest(tmpdir))
	// 			.pipe(app.stream())
	// 	}
	// 	else if(ext === ".scss" && exists(stylefile)) {
	// 		gulp.src(stylefile)
	// 			.pipe(sourcemap.init())
	// 			.pipe(sass())
	// 			.pipe(cssmin())
	// 			.pipe(sourcemap.write())
	// 			.pipe(gulp.dest(tmpdir))
	// 			.pipe(app.stream())
	// 	}
	// 	else if(ext === ".js" && exists(scriptfile)) {
	// 		gulp.src(scriptfile)
	// 			.pipe(webpack(webpackConfig({
	// 				devtool: "inline-source-map",
	// 			})))
	// 			.pipe(gulp.dest(tmpdir))
	// 			.pipe(app.stream())
	// 	}
	// })

})
