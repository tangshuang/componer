import Stream from 'stream'
import {gulp, fs, path, args, log, config, exit, exists, scandir, remove, readJSONTMPL, hasComponout, getComponoutConfig, dashName, camelName, run, getFileExt} from '../loader'
import webpack from '../drivers/webpack'
import sass from '../drivers/sass'

import concat from 'pipe-concat'

gulp.task('build', () => {
	let arg = args.build

	// if there is no name option, build all componouts
	if(arg.name === undefined) {
		scandir(config.paths.componouts).forEach(item => run('build', {
			name: item,
		}))
		return
	}

	// build named componout
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

	/**
	 * begin to compress build settings
	 */

	let info = getComponoutConfig(name)
	let items = Array.isArray(info.build) ? info.build : typeof info.build === 'object' ? [info.build] : null
	if(!items) {
		log(name + ' build option in componer.json not found.', 'error')
		return
	}

	let streams = []
	items.forEach(item => {
		let from = path.join(cwd, item.from)
		let to = path.join(cwd, item.to)
		let ext = getFileExt(from)
		let settings = item.settings || {}
		let options = item.options || {}

		let todir = path.dirname(to)
		let toext = getFileExt(to)
		let tofile = path.basename(to, toext)
		remove(to)
    	remove(path.join(todir, tofile + '.*'))

		if(ext === '.js') {
			settings.output = settings.output || {}
			settings.output.library = settings.output.library || info.name
			streams.push(webpack(from, to, options, settings))
		}
		else if(ext === '.scss') {
			streams.push(sass(from, to, options, settings))
		}
	})

	if(streams.length > 0) {
		return concat(streams).on('end', () => log(name + ' has been completely built.', 'done'))
	}

	// build fail
	log('Something is wrong. Check your componer.json.', 'warn')
})
