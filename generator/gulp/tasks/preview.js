import {gulp, path, fs, args, log, config, exit, exists, clear, read, readJSON, load, hasComponout, getComponoutConfig, dashName, camelName, getFileExt} from '../loader'

import browsersync from 'browser-sync'
import bufferify from 'gulp-bufferify'
import glob from 'glob'

import webpackVendor from '../drivers/webpack-vendor'
import webpackStream from '../drivers/webpack-stream'
import sassStream from '../drivers/sass-stream'

gulp.task('preview', () => {
	let arg = args.preview
	let name = dashName(arg.name)

	if(!hasComponout(name)) {
		log(name + ' not exists.', 'error')
		return
	}

	let cwd = path.join(config.paths.componouts, name)
	if(!exists(cwd + '/componer.json')) {
		log(name + ' componer.json not exists.', 'error')
		return
	}

	let info = getComponoutConfig(name)
	let settings = info.preview
	if(!settings) {
		log(name + ' preview option in componer.json not found.', 'error')
		return
	}

	let indexfile = settings.index && settings.index.from ? path.join(cwd, settings.index.from) : false
	let scriptfile = settings.script && settings.script.from ? path.join(cwd, settings.script.from) : false
	let stylefile = settings.style && settings.style.from ? path.join(cwd, settings.style.from) : false
	let serverfile = settings.server ? path.join(cwd, settings.server) : false
	let tmpdir = settings.dir ? path.join(cwd, settings.dir) : path.join(cwd, '.preview_tmp')

	if(!exists(indexfile)) {
		log(name + ' preview index file not found.', 'error')
		return
	}

	// clear tmp dir
	clear(tmpdir)

	/**
	 * pre build dependencies vendors
	 */

	let bowerJson = path.join(cwd, 'bower.json')
 	let pkgJson = path.join(cwd, 'package.json')
 	let getDeps = function(pkgfile) {
		let deps = []
 		if(!exists(pkgfile)) {
 			return deps
 		}
 		let info = readJSON(pkgfile)
		if(info.dependencies) {
			deps = Object.keys(info.dependencies)
		}
		if(info.devDependencies) {
			deps = deps.concat(Object.keys(info.devDependencies))
		}
		if(info.peerDependencies) {
			deps = deps.concat(Object.keys(info.peerDependencies))
		}
 		return deps
 	}

	let callback = null
	let promise = new Promise((resolve, reject) => {
		callback = resolve
	})

	// script vendors
	let scriptVendorsSettings = null
	if(exists(scriptfile) && settings.script.options && settings.script.options.vendors) {
		let options = settings.script.options
		let vendors = options.vendors
		if(vendors === true) {
			vendors = getDeps(bowerJson).concat(getDeps(pkgJson))
		}
		if(Array.isArray(vendors) && vendors.length > 0) {
			scriptVendorsSettings = webpackVendor(
				vendors,
				`${tmpdir}/${name}.vendors.js`,
				{
					sourcemap: options.sourcemap,
					minify: options.minify,
					after() {
						callback()
					},
				},
				{
					path: `${tmpdir}/${name}.vendors.js.json`,
					name: camelName(name, true) + 'Vendors',
					context: tmpdir,
				},
			)
		}
	}

	// style vendors
	let styleVendors = null
	if(exists(stylefile) && settings.style.options && settings.style.options.vendors) {
		let options = settings.style.options
		let vendors = options.vendors
		if(vendors === true) {
			vendors = getDeps(bowerJson).concat(getDeps(pkgJson))
		}
		if(Array.isArray(vendors) && vendors.length > 0) {
			styleVendors = vendors
			sassStream(stylefile, `${tmpdir}/${name}.vendors.css`, {
				sourcemap: options.sourcemap,
				minify: options.minify,
				vendors: {
					enable: 1,
					modules: vendors,
				},
			})
		}
	}

	/**
	 * create a bs server app
	 */

	let app = browsersync.create()
	let middlewares = [
		{
			route: '/',
			handle: function (req, res, next) {
				res.setHeader('content-type', 'text/html')
				gulp.src(indexfile)
					.pipe(bufferify(html => {
						if(exists(stylefile)) {
							if(styleVendors) {
								html = html.replace('<!--stylevendors-->', `<link rel="stylesheet" href="${name}.vendors.css">`)
							}
							html = html.replace('<!--styles-->', `<link rel="stylesheet" href="${name}.css">`)
						}
						if(exists(scriptfile)) {
							if(scriptVendorsSettings) {
								html = html.replace('<!--scriptvendors-->', `<script src="${name}.vendors.js"></script>`)
							}
							html = html.replace('<!--scripts-->', `<script src="${name}.js"></script>`)
						}
						res.end(html)
						return html
					}))
					.pipe(gulp.dest(tmpdir))
			},
		},
		exists(stylefile) ? {
			route: `/${name}.css`,
			handle: function (req, res, next) {
				let options = settings.style.options
				// for hot reload
				if(req.originalUrl !== `/${name}.css` && req.originalUrl.indexOf(`/${name}.css?`) === -1) {
					next()
					return
				}
				// http response
				res.setHeader('content-type', 'text/css')
				sassStream(stylefile, `${tmpdir}/${name}.css`, {
					sourcemap: options.sourcemap,
					minify: options.minify,
					vendors: styleVendors ? {
						enable: -1,
						modules: styleVendors,
					} : undefined,
					process(content, file) {
						if(getFileExt(file.path) === '.css') {
							res.end(content)
						}
					},
				}, settings.style.settings)
			},
		} : undefined,
		exists(scriptfile) ? {
			route: `/${name}.js`,
			handle(req, res, next) {
				let options = settings.script.options
				let scriptSettings = settings.script.settings
				scriptSettings.output = scriptSettings.output || {}
				scriptSettings.output.library = scriptSettings.output.library || camelName(info.name, true)
				// for hot reload
				if(req.originalUrl !== `/${name}.js` && req.originalUrl.indexOf(`/${name}.js?`) === -1) {
					next()
					return
				}
				// http response
				res.setHeader('content-type', 'application/javascript')
				webpackStream(scriptfile, `${tmpdir}/${name}.js`, {
					sourcemap: options.sourcemap,
					minify: options.minify,
					vendors: scriptVendorsSettings,
					process(content, file) {
						if(getFileExt(file.path) === '.js') {
							res.end(content)
						}
					},
				}, scriptSettings)
			},
		} : undefined,
	]

	// filter undefined
	middlewares = middlewares.filter(item => !!item)

	// build server
	if(exists(serverfile)) {
		let serverware = load(serverfile)
		if(serverware instanceof Array) {
			middlewares = middlewares.concat(serverware)
		}
		else {
			middlewares.unshift(serverware)
		}
	}

	// watch files
	let watchFiles = settings.watch
	if(typeof watchFiles === 'string') {
		watchFiles = [path.join(cwd, watchFiles)]
	}
	else if(watchFiles instanceof Array) {
		watchFiles = watchFiles.map(item => path.join(cwd, item))
	}
	else {
		watchFiles = []
	}

	if(watchFiles.length > 0) {
		// only reload css files on page
		let styleWatchFiles = []
		let otherWatchFiles = []

		watchFiles.forEach(item => {
			let ext = getFileExt(item)
			if(ext === '.scss' || ext === '.css') {
				styleWatchFiles.push(item);
			}
			else {
				// use glob to find out style files in sub directory
				if(item.indexOf('*') > -1) glob.sync(item).forEach(_item => {
					let _ext = getFileExt(_item)
					if(_ext === '.scss' || _ext === '.css') {
						styleWatchFiles.push(_item)
					}
				})
				// put not style files into otherWatchFiles
				otherWatchFiles.push(item)
			}
		})

		// except style files
		watchFiles = otherWatchFiles.concat([`!${cwd}/**/*.scss`, `!${cwd}/**/*.css`])
		// watch style files by gulp, and reload css files after style files changed
		gulp.watch(styleWatchFiles, event => {
			if(event.type === 'changed') app.reload('*.css')
		})
	}

	// setup server
	let port = arg.port || 8000 + parseInt(Math.random() * 1000)
	let uiport = port + 1
	let weinreport = port + 2

	setTimeout(() => callback(), 1000)
	promise.then(() => app.init({
		port,
		ui: {
			port: uiport,
			weinre: {
				port: weinreport
			}
		},
		server: {
			baseDir: tmpdir,
		},
		files: watchFiles,
		watchOptions: settings.watchOptions ? settings.watchOptions : {},
		middleware: middlewares,
	}))

})
