import {gulp, fs, path, args, log, config, exit, exists, mkdir, rename, dashName} from '../loader'
import PaserTemplate from '../utils/gulp-parse-template'

gulp.task('add', () => {
	let arg = args.add
	let name = dashName(arg.name)

	if(!name.substr(0, 1).match(/[a-z]/)) {
		log('component name\'s first letter must be in [a-z].', 'error')
		return
	}

	let template = arg.template || config.componer.defaults.template
	let author = arg.author || config.componer.project.author
	let componoutPath = path.join(config.paths.componouts, name)
	let templatesPath = path.join(config.paths.templates, template)

	if(exists(componoutPath)) {
		log(`${name} exists, delete ${config.dirs.componouts}/${name} before you add.`, 'error')
		return
	}

	mkdir(componoutPath)

	return gulp.src([templatesPath + '/**/*', templatesPath + '/**/.*'])
		.pipe(PaserTemplate({
			componoutName: name,
			authorName: author,
		}))
		.pipe(gulp.dest(componoutPath))
		.on('end', () => {
			rename(componoutPath + '/src/index.js', componoutPath + '/src/' + name + '.js')
			rename(componoutPath + '/src/script/index.js', componoutPath + '/src/script/' + name + '.js')
			rename(componoutPath + '/src/style/index.scss', componoutPath + '/src/style/' + name + '.scss')

			rename(componoutPath + '/test/index.js', componoutPath + '/test/' + name + '.js')
			rename(componoutPath + '/test/specs/index.js', componoutPath + '/test/specs/' + name + '.js')

			rename(componoutPath + '/preview/index.js', componoutPath + '/preview/' + name + '.js')
			rename(componoutPath + '/preview/index.scss', componoutPath + '/preview/' + name + '.scss')

			log(`${name} has been completely created.`, 'done')
		})
})
