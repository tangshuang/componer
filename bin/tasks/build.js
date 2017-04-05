import path from 'path'
import {log} from '../utils/process'
import {exists, readJSONTMPL, getFileExt} from '../utils/file'
import webpack from '../drivers/webpack'
import sass from '../drivers/sass'
import concat from 'pipe-concat'

export default function(commander) {
    commander
    .command('build')
	.description('link local componout as package')
	.action(() => {
        let cwd = process.cwd()
        let jsonfile = path.join(cwd, 'componer.json')

        if(!exists(jsonfile)) {
            log('There is no componer.json in current directory.', 'error')
            return
        }

        let info = readJSONTMPL(jsonfile, {
            'path': cwd,
        })
        let items = Array.isArray(info.build) ? info.build : typeof info.build === 'object' ? [info.build] : null
        if(!items) {
            log('Build option is not found in componer.json.', 'error')
            return
        }

        let streams = []

        items.forEach(item => {
            let from = path.join(cwd, item.from)
            let to = path.join(cwd, item.to)
            let ext = getFileExt(item.from)
            if(ext === '.js') {
                streams.push(webpack(from, to, item.options, item.settings))
            }
            else if(ext === '.scss') {
                streams.push(sass(from, to, item.options, item.settings))
            }
        })

        return concat(streams).on('end', () => log('Build complete!', 'done'))
    })
}
