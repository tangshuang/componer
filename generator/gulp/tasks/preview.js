import {gulp, path, fs, args, log, config, exit, exists, clear, load, read, readJSON} from '../loader'
import {hasComponout, dashName, camelName, getFileExt} from '../utils'
import GulpBuffer from '../utils/gulp-buffer'

import glob from 'glob'
import browsersync from 'browser-sync'

import webpack from 'webpack'
import webpackStream from 'webpack-stream'
import webpackConfig from '../drivers/webpack.config'

import sass from 'gulp-sass'
import sassConfig from '../drivers/sass.config'
import sourcemap from 'gulp-sourcemaps'
import cssCopyAssets from '../utils/gulp-css-copy-assets'
import postcss from 'gulp-postcss'
import cssnext from 'postcss-cssnext'
import rename from 'gulp-rename'

gulp.task('preview', () => {
	let arg = args.preview
	let name = dashName(arg.name)

	if(!hasComponout(name)) {
		log(`${name} not exists.`, 'error')
		exit()
	}

	let componoutPath = path.join(config.paths.componouts, name)
	let srcPath = path.join(componoutPath, 'src')

	if(!exists(componoutPath + '/componer.config.js')) {
		log('componer.config.js not exists.', 'error')
		exit()
	}

	let info = load(componoutPath + '/componer.config.js').preview
	if(!info) {
		log('preview option in componer.config.js not found.', 'error')
		exit()
	}

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
 		let deps = readJSON(pkgfile).dependencies
 		return Object.keys(deps)
 	}
 	let vendors = getDeps(bowerJson).concat(getDeps(pkgJson))
	if(Array.isArray(info.vendors)) {
		vendors = vendors.concat(info.vendors)
	}

	if(scriptfile && exists(scriptfile)) {
		// create vendor bundle
		if(vendors.length > 0) webpack(webpackConfig({
			entry: {
				vendor: vendors,
			},
			output: {
				path: tmpdir,
				filename: name + '.vendor.js',
				library: name + '-vendor',
				sourceMapFilename: name + '.vendor.js.map',
			},
			devtool: 'source-map',
			plugins: [
				new webpack.DllPlugin({
					path: tmpdir + `/${name}.vendor.js.json`,
					name: name + '-vendor',
					context: tmpdir,
				}),
			],
		})).run((error, handle) => {})
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
					.pipe(GulpBuffer(html => {
						html = html.toString()
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
	if(stylefile && exists(stylefile)) {
		middlewares.unshift({
			route: `/${name}.css`,
			handle: function (req, res, next) {
				if(req.originalUrl !== `/${name}.css` && req.originalUrl.indexOf(`/${name}.css?`) === -1) {
					next()
					return
				}
				res.setHeader('content-type', 'text/css')
				gulp.src(stylefile)
					.pipe(sourcemap.init())
					.pipe(sass(sassConfig()))
					.pipe(postcss([cssnext()]))
					.pipe(rename(`/${name}.css`))
					.pipe(sourcemap.write('.'))
					.pipe(cssCopyAssets({
						srcdirs: glob.sync([
							path.join(componoutPath, '**/'),
							'!' + tmpdir,
						]),
					}))
					.pipe(GulpBuffer((content, file) => {
						if(getFileExt(file.path) === '.css') {
							content = content.toString()
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
				if(req.originalUrl !== `/${name}.js` && req.originalUrl.indexOf(`/${name}.js?`) === -1) {
					next()
					return
				}
				res.setHeader('content-type', 'application/javascript')
				gulp.src(scriptfile)
					.pipe(webpackStream(webpackConfig({
						output: {
							filename: name + '.js',
							library: camelName(name),
							sourceMapFilename: name + '.js.map',
						},
						devtool: 'source-map',
						plugins: [
							vendors.length > 0 ? new webpack.DllReferencePlugin({
								context: tmpdir,
								manifest: load(tmpdir + `/${name}.vendor.js.json`),
							}) : undefined,
						],
					})))
					.pipe(GulpBuffer((content, file) => {
						if(getFileExt(file.path) === '.js') {
							content = content.toString()
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

	app.init({
		server: {
			baseDir: tmpdir,
		},
		files: watchFiles,
		watchOptions: info.watchOptions ? info.watchOptions : {},
		middleware: middlewares,
	})

})
