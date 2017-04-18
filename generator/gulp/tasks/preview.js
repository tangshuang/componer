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

	let index = path.join(cwd, settings.index)
	let script = settings.script ? path.join(cwd, settings.script) : false
	let style = settings.style ? path.join(cwd, settings.style) : false
	let server = settings.server ? path.join(cwd, settings.server) : false
	let tmpdir = settings.dir ? path.join(cwd, settings.dir) : path.join(cwd, '.preview_tmp')

	if(!exists(index.from)) {
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

	// script vendors
	let scriptVendorsSettings = null
	if(exists(script.from) && script.options.vendors) {
		let options = script.options
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
	if(exists(style.from) && style.options.vendors) {
		let options = script.options
		let vendors = options.vendors
		if(vendors === true) {
			vendors = getDeps(bowerJson).concat(getDeps(pkgJson))
		}
		if(Array.isArray(vendors) && vendors.length > 0) {
			styleVendors = vendors
			sassStream(style.from, `${tmpdir}/${name}.vendors.css`, {
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
				gulp.src(index.from)
					.pipe(bufferify(html => {
						if(exists(style)) {
							if(scriptVendorsSettings) {
								html = html.replace('<!--stylevendors-->', `<link rel="stylesheet" href="${name}.vendors.css">`)
							}
							html = html.replace('<!--styles-->', `<link rel="stylesheet" href="${name}.css">`)
						}
						if(exists(script)) {
							if(styleVendors) {
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
		exists(style) ? {
			route: `/${name}.css`,
			handle: function (req, res, next) {
				// for hot reload
				if(req.originalUrl !== `/${name}.css` && req.originalUrl.indexOf(`/${name}.css?`) === -1) {
					next()
					return
				}
				// http response
				res.setHeader('content-type', 'text/css')
				sassStream(style.from, `${tmpdir}/${name}.css`, {
					sourcemap: style.options.sourcemap,
					minify: style.options.minify,
					vendors: styleVendors ? {
						enable: -1,
						modules: styleVendors,
					} : undefined,
					process(content, file) {
						if(getFileExt(file.path) === '.css') {
							res.end(content)
						}
					},
				})
			},
		} : undefined,
		exists(script) ? {
			route: `/${name}.js`,
			handle: function (req, res, next) {
				// for hot reload
				if(req.originalUrl !== `/${name}.js` && req.originalUrl.indexOf(`/${name}.js?`) === -1) {
					next()
					return
				}
				// http response
				res.setHeader('content-type', 'application/javascript')
				webpackStream(script.from, `${tmpdir}/${name}.js`, {
					sourcemap: script.options.sourcemap,
					minify: script.options.minify,
					vendors: scriptVendorsSettings,
					process(content, file) {
						if(getFileExt(file.path) === '.js') {
							res.end(content)
						}
					},
				})
			},
		} : undefined,
	]

	// filter undefined
	middlewares = middlewares.filter(item => !!item)

	// build server
	if(server && exists(server)) {
		let serverware = load(server)
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

	app.init({
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
	})

})
