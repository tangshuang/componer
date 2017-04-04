import fs from 'fs'
import path from 'path'

import gulp from 'gulp'
import browsersync from 'browser-sync'

import bufferify from 'gulp-bufferify'
import glob from 'glob'

import webpackVendor from '../drivers/webpack-vendor'
import webpackStream from '../drivers/webpack-stream'
import sassStream from '../drivers/sass-stream'

import {log, exit} from '../utils/process'
import {exists, clear, read, load, readJSON, getFileExt} from '../utils/file'
import {dash, camel} from '../utils/convert'

export default function(commander) {
    commander
    .command('preview')
	.description('preview componout')
	.action(() => {
        let cwd = process.cwd()
        let jsonfile = path.join(cwd, 'componer.json')

        if(!exists(jsonfile)) {
            log('There is no componer.json in current directory.', 'error')
            return
        }

        let info = readJSONTMPL(jsonfile, {
            'path': cwd,
        })
        let settings = info.preview

        if(!settings) {
            log('preview option is not found in componer.json.', 'error')
            return
        }

	    let srcPath = path.join(cwd, 'src')
    	let indexfile = path.join(cwd, info.index)
    	let scriptfile = info.script ? path.join(cwd, info.script) : false
    	let stylefile = info.style ? path.join(cwd, info.style) : false
    	let serverfile = info.server ? path.join(cwd, info.server) : false
    	let tmpdir = info.tmpdir ? path.join(cwd, info.tmpdir) : path.join(cwd, '.preview_tmp')

    	if(!exists(indexfile)) {
    		log('preview index file is not found.', 'error')
    		exit()
    	}

    	// clear tmp dir
    	clear(tmpdir)


        /**
    	 * pre build dependencies vendors
    	 */
        let vendorsSettings = null
      	let vendors = info.vendors
     	let hasVendors = () => Array.isArray(vendors) && vendors.length > 0

     	if(vendors === true) {
     		let bowerJson = path.join(cwd, 'bower.json')
     	 	let pkgJson = path.join(cwd, 'package.json')
     	 	let getDeps = function(pkgfile) {
     	 		if(!exists(pkgfile)) {
     	 			return []
     	 		}
     	 		let info = readJSON(pkgfile)
     	 		return Object.keys(info.dependencies).concat(Object.keys(info.devDependencies))
     	 	}
     	 	vendors = getDeps(bowerJson).concat(getDeps(pkgJson))
     	}

     	if(scriptfile && exists(scriptfile) && hasVendors()) {
     		vendorsSettings = webpackVendor({
     			vendors,
     			to: `${tmpdir}/${name}.vendors.js`,
     			options: {
     				sourcemap: true,
     				minify: false,
     			},
     			settings: {
     				path: `${tmpdir}/${name}.vendors.js.json`,
     				name: camel(name, true) + 'Vendor',
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
    							if(hasVendors() > 0) {
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
    					minify: false,
    					process(content, file) {
    						if(getFileExt(file.path) === '.css') {
    							res.end(content)
    						}
    					},
    				}, {
    					assets: {
    						srcdirs: glob.sync(path.join(cwd, '**/')),
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
    					process(content, file) {
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
}
