import GulpBuffer from './gulp-buffer'
import {camelName, dashName, spaceName} from './convert-name'

export default function(pairs) {
	return GulpBuffer(content => {
		if(pairs && typeof pairs === 'object') {
			let keys = Object.keys(pairs)
			keys.forEach(key => {
				let value = pairs[key]
				content = content
					.replace((new RegExp('{{' + camelName(key) + '}}','g')), camelName(value))
					.replace((new RegExp('{{' + camelName(key, true) + '}}','g')), camelName(value, true))
					.replace((new RegExp('{{' + dashName(key) + '}}','g')), dashName(value))
					.replace((new RegExp('{{' + dashName(key, true) + '}}','g')), dashName(value, true))
					.replace((new RegExp('{{' + spaceName(key) + '}}','g')), spaceName(value))
					.replace((new RegExp('{{' + spaceName(key, true) + '}}', 'g')), spaceName(value, true))
			})
		}
		return content
	})
}
