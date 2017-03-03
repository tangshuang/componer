import {gulp, fs, path, args, log, config, exit, exists, scandir, load, readJSON, writeJSON} from '../loader'
import {hasComponout, dashName, run} from '../utils'

import concat from 'pipe-concat'
import Stream from 'stream'

gulp.task('build', () => {
	var arg = args.build

	// if there is no name option, build all components
	if(arg.name === undefined) {
		scandir(config.paths.componouts).forEach(item => run('build', {
			name: item,
		}))
		return
	}

	// build named component
	var name = dashName(arg.name)
	if(!hasComponout(name)) {
		log(`${name} not exists.`, 'error')
		exit()
	}

	var componoutPath = path.join(config.paths.componouts, name)

	if(!exists(componoutPath + '/componer.config.js')) {
		log('componer.config.js not exists.', 'error')
		exit()
	}

	/**
	 * begin to compress build settings
	 */

	var info = load(componoutPath + '/componer.config.js')
	var files = info.build
	if(!files) {
		log('build option in componer.config.js not found.', 'error')
		exit()
	}

	var streams = []
	files.forEach(file => {
		let from = path.join(componoutPath, file.from)
		let to = path.join(componoutPath, file.to)
		let driver = file.driver
		let settings = file.settings
		let options = file.options
		let driverfile = path.join(config.paths.drivers, driver + '.js')

		if(!exists(driverfile)) {
			log('Can NOT found driver ' + driver, 'error')
			return
		}

		driver = load(driverfile)
		streams.push(driver({from, to, settings, options}))
	})

	// update package json info
	var streamx = new Stream()
	streamx.writable = streamx.readable = true
	var jsonfiles = ['bower.json', 'package.json']
	jsonfiles.forEach(json => {
		let jsonfile = path.join(componoutPath, json)
		if(exists(jsonfile)) {
			let jsoncontent = readJSON(jsonfile)
			jsoncontent.name = info.name || name
			jsoncontent.version = info.version || '0.0.1'
			jsoncontent.description = info.description || ''
			writeJSON(jsonfile, jsoncontent)
		}
	})
	streamx.emit('end')
	streams.push(streamx)


	if(streams.length > 0) {
		return concat(streams).on('end', () => log(`${name} has been completely built.`, 'done'))
	}

	// build fail
	log('Something is wrong. Check your componer.json.', 'warn')
	exit()

})
