import {gulp, fs, config, log} from '../loader'
import {getComponouts, strPadRight} from '../utils'
import logger from 'process.logger'

gulp.task('list', () => {
	var componouts = getComponouts()
	log(strPadRight(`======================= You have ${componouts.length} componouts: ==============`, '=', 70), 'help')
	logger.put(strPadRight('name', ' ', 40)).put('\ttype').print()
	log('----------------------------------------------------------------------')
	componouts.forEach(item => {
		logger.put(strPadRight(item.name, ' ', 40), {color: 'cyan'}).put('\t' + item.type).print()
	})
	log('======================================================================', 'help')
})
