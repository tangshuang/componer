import {gulp, path, fs, args, log, config, exit, exists, scandir, mkdir, load} from '../loader'
import {hasComponout, dashName, run} from '../utils'

import karma from 'gulp-karma-runner'
import jasmine from 'gulp-jasmine-node'
import karmaConfig from '../drivers/karma.config'

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

	var componoutPath = path.join(config.paths.componouts, name)
	var srcPath = path.join(componoutPath, 'src')

	if(!exists(componoutPath + '/componer.config.js')) {
		log('componer.config.js not exists.', 'error')
		exit()
	}

	var info = load(componoutPath + '/componer.config.js').test
	if(!info) {
		log('test option in componer.config.js not found.', 'error')
		exit()
	}

	if(!info.entry) {
		log('test.entry option in componer.config.js not found.', 'error')
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

	return gulp.src(entryfile)
		.pipe(karma.server(karmaConfig(karmaSettings)))
		.on('end', () => {
			log('Reporters ware created in componouts/' + name + '/' + reportersDir, 'help')
			exit()
		})

})
