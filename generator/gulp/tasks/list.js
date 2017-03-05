import {gulp, fs, config, log} from '../loader'
import {getComponouts, strPadRight} from '../utils'

gulp.task('list', () => {
	var componouts = getComponouts()
	log(strPadRight(`======================= You have ${componouts.length} componouts: ==============`, '=', 70), 'help')
	log(strPadRight('name', ' ', 40) + 'type')
	log('----------------------------------------------------------------------', 'help')
	componouts.forEach(item => {
		log(strPadRight(item.name, ' ', 40) + item.type)
	})
	log('======================================================================', 'help')
})
