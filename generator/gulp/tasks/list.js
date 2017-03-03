import {gulp, fs, config, log} from '../loader'
import {getComponouts, strPadRight} from '../utils'
import logger from 'process.logger'

gulp.task('list', () => {
	var componouts = getComponouts()
	log(strPadRight(`======================= You have ${componouts.length} componouts: ==============`, '=', 70), 'help')
	logger.put(strPadRight('name', ' ', 15)).put('\t' + strPadRight('version', ' ', 10)).put('\ttype').print()
	log('----------------------------------------------------------------------')
	componouts.forEach(item => {
		logger.put(strPadRight(item.name, ' ', 15), {color: 'cyan'}).put('\t' + strPadRight(item.version, ' ', 10)).put('\t' + item.type).print()
	})
	log('======================================================================', 'help')
})
