import {gulp, path, fs, args, log, config, exit, exists, clear, load, read, readJSONTMPL, hasComponout, getComponoutConfig, dashName, camelName, getFileExt} from '../loader'

import browsersync from 'browser-sync'

import bufferify from 'gulp-bufferify'
import glob from 'glob'

import webpackVendor from '../drivers/webpack-vendor'
import webpackStream from 'webpack-stream'
import sassStream from '../drivers/sass-stream'

gulp.task('preview', () => {
	let arg = args.preview
	let name = dashName(arg.name)

	if(!hasComponout(name)) {
		log(`${name} not exists.`, 'error')
		exit()
	}

	let componoutPath = path.join(config.paths.componouts, name)
	let srcPath = path.join(componoutPath, 'src')

	if(!exists(componoutPath + '/componer.json')) {
		log('componer.json not exists.', 'error')
		exit()
	}

	var info = getComponoutConfig(name)
	if(!info) {
		log('preview option in componer.json not found.', 'error')
		exit()
	}
	info = info.preview

	let indexfile = path.join(componoutPath, info.index)
	let scriptfile = info.script ? path.join(componoutPath, info.script) : false
	let stylefile = info.style ? path.join(componoutPath, info.style) : false
	let serverfile = info.server ? path.join(componoutPath, info.server) : false
	let tmpdir = info.tmpdir ? path.join(componoutPath, info.tmpdir) : path.join(componoutPath, '.preview_tmp')

	if(!exists(indexfile)) {
		log('preview index file is not found.', 'error')
		exit()
	}

	// clear tmp dir
	clear(tmpdir)

	/**
	 * pre build dependencies vendors
	 */

	let bowerJson = path.join(componoutPath, 'bower.json')
 	let pkgJson = path.join(componoutPath, 'package.json')
 	let getDeps = function(pkgfile) {
 		if(!exists(pkgfile)) {
 			return []
 		}
 		let info = readJSON(pkgfile)
 		return Object.keys(info.dependencies).concat(Object.keys(info.devDependencies))
 	}
 	let vendors = getDeps(bowerJson).concat(getDeps(pkgJson))
	if(Array.isArray(info.vendors)) {
		vendors = vendors.concat(info.vendors)
	}
	let vendorsSettings = null
	if(scriptfile && exists(scriptfile) && vendors.length > 0) {
		vendorsSettings = webpackVendor({
			vendors,
			to: `${tmpdir}/${name}.vendors.js`,
			options: {
				sourcemap: true,
				minify: true,
			},
			settings: {
				path: `${tmpdir}/${name}.vendors.js.json`,
				name: camelName(name, true) + 'Vendor',
				context: tmpdir,
			},
		})
	}


	/**
	 * create a bs server app
	 */

	let app = browsersync.create()

	// modify index.html
	let middlewares = [
		{
			route: '/',
			handle: function (req, res, next) {
				res.setHeader('content-type', 'text/html')
				gulp.src(indexfile)
					.pipe(bufferify(html => {
						if(stylefile && exists(stylefile)) {
							html = html.replace('<!--styles-->', `<link rel="stylesheet" href="${name}.css">`)
						}
						if(scriptfile && exists(scriptfile)) {
							if(vendors.length > 0) {
								html = html.replace('<!--vendors-->', `<script src="${name}.vendor.js"></script>`)
							}
							html = html.replace('<!--scripts-->', `<script src="${name}.js"></script>`)
						}
						res.end(html)
						return html
					}))
					.pipe(gulp.dest(tmpdir))
			},
		},
	]

	// create css
	if(stylefile && exists(stylefile)) {
		middlewares.unshift({
			route: `/${name}.css`,
			handle: function (req, res, next) {
				// for hot reload
				if(req.originalUrl !== `/${name}.css` && req.originalUrl.indexOf(`/${name}.css?`) === -1) {
					next()
					return
				}
				// http response
				res.setHeader('content-type', 'text/css')
				sassStream(stylefile, `${tmpdir}/${name}.css`, {
					sourcemap: true,
					minify: true,
					process(content) {
						if(getFileExt(file.path) === '.css') {
							res.end(content)
						}
					},
				}, {
					assets: {
						srcdirs: glob.sync(path.join(componoutPath, '**/')),
					}
				})
			},
		})
	}

	// create js
	if(scriptfile && exists(scriptfile)) {
		middlewares.unshift({
			route: `/${name}.js`,
			handle: function (req, res, next) {
				// for hot reload
				if(req.originalUrl !== `/${name}.js` && req.originalUrl.indexOf(`/${name}.js?`) === -1) {
					next()
					return
				}
				// http response
				res.setHeader('content-type', 'application/javascript')
				webpackStream(scriptfile, `${tmpdir}/${name}.js`, {
					sourcemap: true,
					minify: true,
					vendors: vendorsSettings,
					process(content) {
						if(getFileExt(file.path) === '.js') {
							res.end(content)
						}
					},
				})
			},
		})
	}

	// build server
	if(serverfile && exists(serverfile)) {
		let serverware = load(serverfile)
		if(serverware instanceof Array) {
			middlewares = middlewares.concat(serverware)
		}
		else {
			middlewares.unshift(serverware)
		}
	}

	// watch files
	let watchFiles = info.watchFiles
	if(typeof watchFiles === 'string') {
		watchFiles = [path.join(componoutPath, watchFiles)]
	}
	else if(watchFiles instanceof Array) {
		watchFiles = watchFiles.map(item => path.join(componoutPath, item))
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
		watchFiles = otherWatchFiles.concat([`!${componoutPath}/**/*.scss`, `!${componoutPath}/**/*.css`])
		// watch style files by gulp, and reload css files after style files changed
		gulp.watch(styleWatchFiles, event => {
			if(event.type === 'changed') app.reload('*.css')
		})
	}

	// setup server
	var port = arg.port || 8000 + parseInt(Math.random() * 1000)
	var uiport = port + 1
	var weinreport = port + 2

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
		watchOptions: info.watchOptions ? info.watchOptions : {},
		middleware: middlewares,
	})

})
