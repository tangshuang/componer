import bufferify from 'gulp-bufferify'

import {camelName, dashName, spaceName} from './convert-name'
import {getFileExt, setFileExt} from './file'

function matchAll(str, reg) {
    var res = []
    var match
    while(match = reg.exec(str)) {
        res.push(match)
    }
    return res
}

export default function() {
	return bufferify((content, file, context) => {
        // if not contains @import tag
        if(content.indexOf('@import') === -1) return

        let scss = ''
        let matches = matchAll(content, /@import (\S+?)\n/gi)
        if(Array.isArray(matches)) matches.forEach(match => {
            let find = match[1].toString()
            let mod = find.replace(/'/g, '').replace(/"/g, '')

            scss += `@import "${mod}"\r\n`
        })

        let newfile = file.clone()
        newfile.contents = new Buffer(scss)

        let ext =  getFileExt(file.path)
        newfile.path = setFileExt(file.path, '.vendors' + ext)

        context.push(newfile)
	})
}
