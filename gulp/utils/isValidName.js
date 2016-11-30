import logger from 'process.logger'

export default function(name) {
	if(!name) {
		logger().timestamp().error('gulp error: You should input a plugin name. e.g. `--name=your-component`')
		return false
	}

	if(!name[0].match(/[a-zA-Z]/)) {
		logger().timestamp().error('gulp error: Plugin name\'s first letter must be in [a-zA-Z].')
		return false
	}

	return true
}