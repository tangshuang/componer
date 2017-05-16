import Stream from 'stream'
import {gulp, fs, path, args, log, config, exit, exists, scandir, clear, readJSONTMPL, hasComponout, getComponoutConfig, dashName, camelName, run, getFileExt} from '../loader'
import webpack from 'webpack'
import webpackConfig from '../../webpack.config'

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
	let cname = info.name
	let items = Array.isArray(info.build) ? info.build : typeof info.build === 'object' ? [info.build] : null
	if(!items) {
		log(name + ' build option in componer.json not found.', 'error')
		return
	}

	items.forEach(item => {
		let entry = path.join(cwd, item.entry)
		let output = path.join(cwd, item.output)
		let html = path.join(cwd, item.html)
		let hash = item.hash

		let options = item.options
		let settings = webpackConfig(item.env, {
			entry,
			output: {
				path: output,
				library: camelName(cname, true),
			},
		}, {
			name: cname,
			html,
			output,
			hash,
		})

		clear(outdir)

		let compiler = webpack(settings)
		compiler.run(function(err, stats) {
		    if(err) {
				log(`build ${from} failed!`, 'error')
				return
			}
		})
	})

	if(streams.length > 0) {
		return concat(streams).on('end', () => log(name + ' has been completely built.', 'done'))
	}

	// build fail
	log('Something is wrong. Check your componer.json.', 'warn')
})
