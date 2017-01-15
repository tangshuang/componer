import {gulp, path, args, log, config, exit, exists, readJSON} from "../loader"
import {hasComponout, dashlineName, camelName, setFileExt, buildScript, InjectJsToHtml, WebpackSupportCrypto} from "../utils"

import TsServer from "ts-server"
import WebpackDevServer from "webpack-dev-server"
import webpack from "webpack"

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

	var previewFile = path.join(componoutPath, previewEntry)
	if(!exists(previewFile)) {
		log(`preview file not found.`, "error")
		exit()
	}

	var previewIndex = settings.entry.index
	var previewHtml = previewIndex ? path.join(componoutPath, previewIndex) : path.join(path.dirname(previewFile), "index.html")

	if(!exists(previewHtml)) {
		log("You should put a index.html in your preview directory.", "error")
		exit()
	}

	var previewDir = path.dirname(previewHtml)
	var previewBundle = name + ".bundle.js"

	var host = "127.0.0.1"
	var port = Math.floor(Math.random() * 1000) + 9000
	var previewBundleUrl = `http://${host}:${port}/${previewBundle}`
	return gulp.src(previewHtml)
		.pipe(InjectJsToHtml("buildjs", previewBundleUrl))
		.pipe(gulp.dest(previewDir))
		.on("end", () => {

			// setup webpack dev server
			var settings = config.webpack({
				entry: [
					// "webpack-dev-server/client?http://" + host + ":" + port + "/",
					"webpack/hot/dev-server",
					previewFile,
				],
				output: {
					filename: previewBundle,
					library: camelName(name),
					sourceMapFilename: previewBundle + ".map",
				},
				plugins: [
					new webpack.HotModuleReplacementPlugin(),
				]
			})
			var compiler = webpack(settings)
			new WebpackDevServer(compiler, {
				// contentBase: previewDir,
				hot: true,
				setup: function(app) { // backend server by express
					if(settings.entry.server) {
						let entryServer = path.join(componoutPath, settings.entry.server)
						require(entryServer)(app)
					}
				},
			}).listen(port, host)
			// TODO: use webpack hot module to reload code later

			// setup static server
			new TsServer().setup({
				host: host,
				port: port + 5,
				root: previewDir,
				open: "index.html",
				livereload: {
					enable: true, // if webpack hot module works, change this to be false
					port: port + 10,
					directory: componoutPath,
					filter: file => {
						let sep = path.sep
						if(file.indexOf(sep + "preview" + sep) >= 0 || file.indexOf(sep + "src" + sep) >= 0) {
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