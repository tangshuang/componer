import {gulp, path, fs, args, log, config, read, hasFileChanged, scandir, hasComponout, dashName, run} from '../loader'

gulp.task('watch', () => {
	let arg = args.watch
	let entryfiles = []
	let componoutsPath = config.paths.componouts

	if(arg.name === undefined) {
		scandir(componoutsPath).forEach(item => {
			let srcPath = path.join(componoutsPath, item, 'src')
			entryfiles.push(srcPath + '/**/*')
		})
	}
	else {
		let componout = dashName(arg.name)
		if(!hasComponout(componout)) {
			log(`${componout} not exists.`, 'error')
			exit()
		}

		let srcPath = path.join(componoutsPath, componout, 'src')
		entryfiles.push(srcPath + '/**/*')
	}

	log('Watching, when code changed, componer will build it automaticly...', 'help')

	let contents = {}
	gulp.watch(entryfiles, event => {
		if(event.type !== 'changed') return

		// if file content not changed, do not run build task
		let file = event.path
		if(!hasFileChanged(file)) return

		log(`${event.path} was ${event.type}, building...`, 'help')

		let relativePath = path.relative(componoutsPath, file).replace(/\\/g, '/')
		let componoutName = relativePath.split('/')[0]

		run('build', {
			name: componoutName
		})
	})
})
