import Stream from 'stream'
import {gulp, fs, path, args, log, config, exit, exists, scandir, readJSONTMPL, hasComponout, getComponoutConfig, dashName, run, getFileExt} from '../loader'
import webpack from '../drivers/webpack'
import sass from '../drivers/sass'

import concat from 'pipe-concat'

gulp.task('build', () => {
	let arg = args.build

	// if there is no name option, build all components
	if(arg.name === undefined) {
		scandir(config.paths.componouts).forEach(item => run('build', {
			name: item,
		}))
		return
	}

	// build named component
	let componout = dashName(arg.name)
	if(!hasComponout(componout)) {
		log(`${componout} not exists.`, 'error')
		return
	}

	let cwd = path.join(config.paths.componouts, componout)
	if(!exists(cwd + '/componer.json')) {
		log(componout + ' componer.json not exists.', 'error')
		return
	}

	/**
	 * begin to compress build settings
	 */

	let info = getComponoutConfig(componout)
	let files = info.build
	if(!files) {
		log(componout + ' build option in componer.json not found.', 'error')
		return
	}

	let streams = []
	files.forEach(file => {
		let from = path.join(cwd, file.from)
		let to = path.join(cwd, file.to)
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
		return concat(streams).on('end', () => log(componout + ' has been completely built.', 'done'))
	}

	// build fail
	log('Something is wrong. Check your componer.json.', 'warn')
})
