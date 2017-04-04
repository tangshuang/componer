import {gulp, path, fs, args, log, config, exit, exists, clear, read, readJSON, load, hasComponout, getComponoutConfig, dashName, camelName, getFileExt} from '../loader'

import browsersync from 'browser-sync'

import bufferify from 'gulp-bufferify'
import glob from 'glob'

import webpackVendor from '../drivers/webpack-vendor'
import webpackStream from '../drivers/webpack-stream'
import sassStream from '../drivers/sass-stream'

gulp.task('preview', () => {
	let arg = args.preview
	let componout = dashName(arg.name)

	if(!hasComponout(componout)) {
		log(`${componout} not exists.`, 'error')
		return
	}

	let cwd = path.join(config.paths.componouts, componout)
	if(!exists(cwd + '/componer.json')) {
		log(componout + ' componer.json not exists.', 'error')
		return
	}

	let info = getComponoutConfig(componout)
	let settings = info.preview
	if(!settings) {
		log(componout + ' preview option in componer.json not found.', 'error')
		return
	}

	let name = info.name
	let index = path.join(cwd, settings.index)
	let script = settings.script ? path.join(cwd, settings.script) : false
	let style = settings.style ? path.join(cwd, settings.style) : false
	let server = settings.server ? path.join(cwd, settings.server) : false
	let tmpdir = settings.tmpdir ? path.join(cwd, settings.tmpdir) : path.join(cwd, '.preview_tmp')

	if(!exists(index)) {
		log(componout + ' preview index file not found.', 'error')
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

 	let vendors = getDeps(bowerJson).concat(getDeps(pkgJson))
	if(Array.isArray(settings.vendors)) {
		vendors = vendors.concat(settings.vendors)
	}

	let vendorsSettings = null
	let hasVendors = () => Array.isArray(vendors) && vendors.length > 0

	if(exists(script) && hasVendors()) {
		vendorsSettings = webpackVendor(
			vendors,
			`${tmpdir}/${name}.vendors.js`,
			{
				sourcemap: true,
				minify: false,
			},
			{
				path: `${tmpdir}/${name}.vendors.js.json`,
				name: camelName(name, true) + 'Vendors',
				context: tmpdir,
			},
		)
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
				gulp.src(index)
					.pipe(bufferify(html => {
						if(exists(style)) {
							html = html.replace('<!--styles-->', `<link rel="stylesheet" href="${name}.css">`)
						}
						if(exists(script)) {
							if(hasVendors()) {
								html = html.replace('<!--vendors-->', `<script src="${name}.vendors.js"></script>`)
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
				sassStream(style, `${tmpdir}/${name}.css`, {
					sourcemap: true,
					minify: false,
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
				webpackStream(script, `${tmpdir}/${name}.js`, {
					sourcemap: true,
					minify: false,
					vendors: vendorsSettings,
					process(content, file) {
						if(getFileExt(file.path) === '.js') {
							res.end(content)
						}
					},
				})
			},
		} : undefined,
	]

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
