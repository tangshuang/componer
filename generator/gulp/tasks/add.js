import {gulp, fs, path, args, log, config, exit, exists, mkdir, rename, dashName} from '../loader'
import PaserTemplate from '../utils/gulp-paser-template'

gulp.task('add', () => {
	var arg = args.add
	var name = dashName(arg.name)

	if(!name.substr(0, 1).match(/[a-z]/)) {
		log('Error: component name\'s first letter must be in [a-z].', 'error')
		exit()
	}

	var template = arg.template || 'component'
	var author = arg.author
	var componoutPath = path.join(config.paths.componouts, name)
	var templatesPath = path.join(config.paths.templates, template)

	if(exists(componoutPath)) {
		log(`Error: ${name} exists, delete ${config.dirs.componouts}/${name} before you add.`, 'error')
		exit()
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
