import {gulp, path, fs, args, log, config, exit, exists, clear, read, readJSON, write, include, hasComponout, getComponoutConfig, dashName, camelName, getFileExt, hasFileChanged} from '../loader'

import Stream from 'stream'

import browsersync from 'browser-sync'
import bufferify from 'gulp-bufferify'
import glob from 'glob'
import concat from 'pipe-concat'

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


	/**
	 * pre-compile vendors
	 */

	let prestreams = []

	// script vendors
	let scriptVendorsSettings = null
	if(exists(scriptfile) && settings.script.options && settings.script.options.vendors) {
		let options = settings.script.options
		let vendors = options.vendors
		if(vendors === true) {
			vendors = getDeps(bowerJson).concat(getDeps(pkgJson))
		}
		if(Array.isArray(vendors) && vendors.length > 0) {
			let stream = new Stream()
			prestreams.push(stream)
			scriptVendorsSettings = webpackVendor(
				vendors,
				`${tmpdir}/${name}.vendors.js`,
				{
					sourcemap: options.sourcemap,
					minify: options.minify,
					after() {
						stream.emit('end')
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
			let stream = sassStream(stylefile, `${tmpdir}/${name}.vendors.css`, {
				sourcemap: options.sourcemap,
				minify: options.minify,
				vendors: {
					extract: 1,
					modules: vendors,
				},
				after() {
					// create vendors if not exists, so that this file is exists finally
					if(!exists(`${tmpdir}/${name}.vendors.css`)) {
						write(`${tmpdir}/${name}.vendors.css`, '')
					}
				},
			})
			prestreams.push(stream)
		}
	}

	/**
	 * compile styles, scripts and index.html
	 */

	// compile
	let compileIndexHtml = () => {
		return gulp.src(indexfile)
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
				return html
			}))
			.pipe(gulp.dest(tmpdir))
	}
	let compileStyles = () => {
		let options = settings.style.options
		return sassStream(stylefile, `${tmpdir}/${name}.css`, {
			sourcemap: options.sourcemap,
			minify: options.minify,
			vendors: styleVendors ? {
				extract: -1,
				modules: styleVendors,
			} : undefined,
		}, settings.style.settings)
	}
	let compileScripts = () => {
		let options = settings.script.options
		let scriptSettings = settings.script.settings
		scriptSettings.output = scriptSettings.output || {}
		scriptSettings.output.library = scriptSettings.output.library || camelName(info.name, true)
		return webpackStream(scriptfile, `${tmpdir}/${name}.js`, {
			sourcemap: options.sourcemap,
			minify: options.minify,
			vendors: scriptVendorsSettings,
		}, scriptSettings)
	}

	let ingstreams = []
	let compileAll = () => {
		ingstreams.push(compileStyles())
		ingstreams.push(compileScripts())
		ingstreams.push(compileIndexHtml())
	}
	if(ingstreams.length > 0) {
		concat(prestreams).on('end', compileAll)
	}
	else {
		compileAll()
	}

	/**
	 * create a bs server app
	 */

	let app = browsersync.create()

	// build middlewares
	let middlewares = []
	if(exists(serverfile)) {
		let serverware = include(serverfile)
		if(Array.isArray(serverware)) {
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
	else if(Array.isArray(watchFiles)) {
		watchFiles = watchFiles.map(item => path.join(cwd, item))
	}
	else {
		watchFiles = [cwd + '/**/*']
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
		// watch style files by gulp, and reload css files after style files changed
		gulp.watch(styleWatchFiles, event => {
			if(event.type !== 'changed') return
			if(!hasFileChanged(event.path)) return
			return compileStyles()
		})
		// watch js files
		let scriptWatchFiles = otherWatchFiles.filter(file => getFileExt(file) === '.js')
		gulp.watch(scriptWatchFiles, event => {
			if(event.type !== 'changed') return
			if(!hasFileChanged(event.path)) return
			return compileScripts()
		})
		// watch index.html
		gulp.watch(indexfile, event => {
			if(event.type !== 'changed') return
			if(!hasFileChanged(event.path)) return
			return compileIndexHtml()
		})
	}

	// setup server
	let port = parseInt(arg.port) || 8000 + parseInt(Math.random() * 1000)
	let uiport = port + 1
	let weinreport = port + 2

	concat(ingstreams).on('end', () => {
		gulp.watch(tmpdir + '/**/*.css', event => {
			if(event.type !== 'changed') return
			if(!hasFileChanged(event.path)) return
			app.reload('*.css')
		})
		gulp.watch([tmpdir + '/**/*.js', tmpdir + '/**/*.html'], event => {
			if(event.type !== 'changed') return
			if(!hasFileChanged(event.path)) return
			app.reload()
		})
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
			middleware: middlewares,
			reloadDebounce: 1000,
		})
	})

})
