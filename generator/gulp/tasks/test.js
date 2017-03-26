import {gulp, path, fs, args, log, config, exit, exists, scandir, mkdir, load, hasComponout, getComponoutConfig, dashName, run} from '../loader'

import karmaConfig from '../drivers/karma.config'
import karma from 'gulp-karma-runner'
import jasmine from 'gulp-jasmine-node'

gulp.task('test', () => {
	var arg = args.test
	var debug = arg.debug
	var browser = arg.browser
	var componoutsPath = config.paths.componouts

	if(arg.name === undefined) {
		scandir(componoutsPath).forEach(item => {
			run('test', {
				name: item,
				browser: 'PhantomJS'
			})
		})
		return
	}

	var name = dashName(arg.name)
	if(!hasComponout(name)) {
		log(`${name} not exists.`, 'error')
		exit()
	}

	var rootPath = config.paths.root
	var componoutPath = path.join(config.paths.componouts, name)
	var srcPath = path.join(componoutPath, 'src')

	if(!exists(componoutPath + '/componer.json')) {
		log('componer.json not exists.', 'error')
		exit()
	}

	var info = getComponoutConfig(name)
	if(!info) {
		log('test option in componer.json not found.', 'error')
		exit()
	}
	info = info.test

	if(!info.entry) {
		log('test.entry option in componer.json not found.', 'error')
		exit()
	}
	var entryfile = path.join(componoutPath, info.entry)
	if(!exists(entryfile)) {
		log(`test entry file not found.`, 'error')
		exit()
	}


	/**
	 * if it is a npm package, run test with jasmine-node
	 */
	if(info.browsers === 'Terminal') {
		return gulp.src(entryfile).pipe(jasmine({
			timeout: 10000,
			includeStackTrace: false,
			color: process.argv.indexOf('--color')
		}))
	}


	/**
	 * if it is normal package can be run in browser
	 */

	var reportersDir = info.reporters
	if(!reportersDir) {
		log(`test.reporters option is not correct in your componer.json.`, 'error')
		exit()
	}

	var reportersPath = path.join(componoutPath, reportersDir)
	if(!exists(reportersPath)) {
		mkdir(reportersPath)
	}

	var preprocessors = {}
	preprocessors[componoutPath + '/**/*.js'] = ['webpack', 'sourcemap']
	preprocessors[componoutPath + '/**/*.scss'] = ['scss']

	var karmaSettings = {
			singleRun: debug !== undefined ? !debug : !info.debug,
			browsers: browser ? [browser] : info.browsers,
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

	var entryfiles = [entryfile]
	// if use PhantomJS to test, it do not support new functions directly, use babal-polyfill to fix
	// in fact, lower version of Chrome or Firefox are not support to. however, developer should make sure to use higher version of this browsers
	let launchers = karmaSettings.browsers
	if(launchers.indexOf('PhantomJS') > -1 || launchers.indexOf('IE') > -1 || launchers.indexOf('Safari') > -1) {
		entryfiles.unshift(path.join(rootPath, 'node_modules/babel-polyfill/lib/index.js'))
		preprocessors[path.join(rootPath, 'node_modules/babel-polyfill/**/*.js')] = ['webpack', 'sourcemap']
	}

	return gulp.src(entryfiles)
		.pipe(karma.server(karmaConfig(karmaSettings)))
		.on('end', () => {
			log('Reporters ware created in componouts/' + name + '/' + reportersDir, 'help')
			exit()
		})

})
