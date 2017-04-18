import {gulp, path, fs, args, log, config, exit, exists, scandir, mkdir, hasComponout, getComponoutConfig, dashName, run} from '../loader'

import karmaConfig from '../drivers/karma.config'
import karma from 'gulp-karma-runner'
import jasmine from 'gulp-jasmine-node'

gulp.task('test', () => {
	let arg = args.test
	let debug = arg.debug
	let browser = arg.browser
	let componoutsPath = config.paths.componouts

	if(arg.name === undefined) {
		scandir(componoutsPath).forEach(item => {
			run('test', {
				name: item,
				browser: 'PhantomJS'
			})
		})
		return
	}

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
	let settings = info.test
	if(!settings) {
		log(name + ' test option in componer.json not found.', 'error')
		return
	}
	if(!settings.entry) {
		log(name + ' test.entry option in componer.json not found.', 'error')
		return
	}

	let entryfile = path.join(cwd, settings.entry.from)
	if(!exists(entryfile)) {
		log(name + ' test entry file not found.', 'error')
		return
	}


	/**
	 * if it is a npm package, run test with jasmine-node
	 */
	if(settings.browsers === 'Terminal') {
		return gulp.src(entryfile).pipe(jasmine({
			timeout: 10000,
			includeStackTrace: false,
			color: process.argv.indexOf('--color')
		}))
	}


	/**
	 * if it is normal package can be run in browser
	 */

	let reportersDir = settings.reporters
	if(!reportersDir) {
		log(name + 'test.reporters option is not correct in your componer.json.', 'error')
		return
	}

	let reportersPath = path.join(cwd, reportersDir)
	if(!exists(reportersPath)) {
		mkdir(reportersPath)
	}

	let preprocessors = {}
	preprocessors[cwd + '/**/*.js'] = ['webpack', 'sourcemap']
	preprocessors[cwd + '/**/*.scss'] = ['scss']

	let karmaSettings = {
			singleRun: debug !== undefined ? !debug : !settings.debug,
			browsers: browser ? [browser] : settings.browsers,
			preprocessors: preprocessors,
			coverageReporter: {
				reporters: [
					{
						type: 'html',
						dir: reportersPath,
					},
				],
			},
			htmlReporter: {
				outputDir: reportersPath,
				reportName: name,
			},
		}

	let entryfiles = [entryfile]

	// if use PhantomJS to test, it do not support new functions directly, use babal-polyfill to fix
	// in fact, lower version of Chrome or Firefox are not support to. however, developer should make sure to use higher version of this browsers
	let rootPath = config.paths.root
	let launchers = karmaSettings.browsers
	if(launchers.indexOf('PhantomJS') > -1 || launchers.indexOf('IE') > -1 || launchers.indexOf('Safari') > -1) {
		entryfiles.unshift(path.join(rootPath, 'node_modules/core-js/es6/symbol.js'))
		preprocessors[path.join(rootPath, 'node_modules/core-js/**/*.js')] = ['webpack']
	}

	if(settings.entry.settings) {
		karmaSettings.webpack = settings.entry.settings
	}

	return gulp.src(entryfiles)
		.pipe(karma.server(karmaConfig(karmaSettings)))
		.on('end', () => {
			log('Reporters ware created in componouts/' + name + '/' + reportersDir, 'help')
			exit()
		})

})
