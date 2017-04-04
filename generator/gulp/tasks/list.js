import {gulp, fs, config, log, getComponouts, strPadRight} from '../loader'

gulp.task('list', () => {
	let componouts = getComponouts()
	log(strPadRight(`======================= You have ${componouts.length} componouts: `, '=', 70), 'help')
	log(strPadRight('name', ' ', 40) + strPadRight('type', ' ', 20) + 'version')
	log('----------------------------------------------------------------------', 'help')
	componouts.forEach(item => {
		log(strPadRight(item.name, ' ', 40) + strPadRight(item.type, ' ', 20) + item.version)
	})
	log('======================================================================', 'help')
})
