import Stream from 'stream'
import {gulp, fs, path, args, log, config, exit, exists, scandir, readJSONTMPL, hasComponout, getComponoutConfig, dashName, run, getFileExt} from '../loader'
import webpack from '../drivers/webpack'
import sass from '../drivers/sass'

import concat from 'pipe-concat'

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

	if(!exists(componoutPath + '/componer.json')) {
		log('componer.json not exists.', 'error')
		exit()
	}

	/**
	 * begin to compress build settings
	 */

	var info = getComponoutConfig(name)
	var files = info.build
	if(!files) {
		log('build option in componer.json not found.', 'error')
		exit()
	}

	var streams = []
	files.forEach(file => {
		let from = path.join(componoutPath, file.from)
		let to = path.join(componoutPath, file.to)
		let settings = file.settings
		let options = file.options
		let ext = getFileExt(from)

		if(ext === '.js') {
			streams.push(webpack(from, to, options, settings))
		}
		else if(ext === '.scss') {
			streams.push(sass(from, to, options, settings))
		}
	})

	if(streams.length > 0) {
		return concat(streams).on('end', () => log(`${name} has been completely built.`, 'done'))
	}

	// build fail
	log('Something is wrong. Check your componer.json.', 'warn')
	exit()

})
