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
import {exists, clear, read, load, readJSON, readJSONTMPL, getFileExt} from '../utils/file'
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

        let name = info.name || path.dirname(cwd)
        let index = path.join(cwd, settings.index)
    	let script = settings.script ? path.join(cwd, settings.script) : false
    	let style = settings.style ? path.join(cwd, settings.style) : false
    	let server = settings.server ? path.join(cwd, settings.server) : false
    	let tmpdir = settings.tmpdir ? path.join(cwd, settings.tmpdir) : path.join(cwd, '.preview_tmp')

    	if(!exists(index)) {
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
    				name: camel(name, true) + 'Vendors',
    				context: tmpdir,
    			},
    		)
    	}

        if(exists(style) && hasVendors()) {
            sassStream(style, `${tmpdir}/${name}.vendors.css`, {
                sourcemap: true,
                minify: false,
                vendors: {
                    enable: 1,
                    modules: vendors,
                },
            })
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
                                if(hasVendors()) {
    								html = html.replace('<!--stylevendors-->', `<link rel="stylesheet" href="${name}.vendors.css">`)
    							}
    							html = html.replace('<!--styles-->', `<link rel="stylesheet" href="${name}.css">`)
    						}
    						if(exists(script)) {
    							if(hasVendors()) {
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
    				sassStream(style, `${tmpdir}/${name}.css`, {
    					sourcemap: true,
    					minify: false,
                        vendors: hasVendors() ? {
    						enable: -1,
    						modules: vendors,
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
    	let port = 8000 + parseInt(Math.random() * 1000)
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
}
