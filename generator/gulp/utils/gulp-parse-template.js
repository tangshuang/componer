import {camelName, dashName, spaceName} from './convert-name'

import bufferify from 'gulp-bufferify'

export default function(parsers) {
	return bufferify(content => {
		if(parsers && typeof parsers === 'object') {
			let keys = Object.keys(parsers)
			keys.forEach(key => {
				let value = parsers[key]
				content = content
					.replace((new RegExp('{{' + camelName(key) + '}}','g')), camelName(value))
					.replace((new RegExp('{{' + camelName(key, true) + '}}','g')), camelName(value, true))
					.replace((new RegExp('{{' + dashName(key) + '}}','g')), dashName(value))
					.replace((new RegExp('{{' + dashName(key, true) + '}}','g')), dashName(value, true))
					.replace((new RegExp('{{' + spaceName(key) + '}}','g')), spaceName(value))
					.replace((new RegExp('{{' + spaceName(key, true) + '}}', 'g')), spaceName(value, true))
			})
		}

		// remove explanatory note in template
		content = content.replace((new RegExp('\\/\\/\\[.*?\\]\\/\\/', 'g')), '')

		return content
	})
}
