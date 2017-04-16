import path from 'path'
import extend from 'extend'
import concat from 'pipe-concat'
import {log} from '../utils/process'
import {exists, readJSON, readJSONTMPL, getFileExt} from '../../generator/gulp/utils/file'
import webpack from '../../generator/gulp/drivers/webpack'
import sass from '../../generator/gulp/drivers/sass'
import {webpack as extendSettings} from '../extend-config'

const cwd = process.cwd()
const jsonfile = path.join(cwd, 'componer.json')

export default function(commander) {
    commander
    .command('build')
	.description('link local componout as package')
	.action(() => {
        if(!exists(jsonfile)) {
            log('There is no componer.json in current directory.', 'error')
            return
        }

        let name = readJSON(jsonfile).name
        let info = readJSONTMPL(jsonfile, {
            name,
            path: cwd,
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
                extend(true, item.settings, extendSettings)
                streams.push(webpack(from, to, item.options, item.settings))
            }
            else if(ext === '.scss') {
                streams.push(sass(from, to, item.options, item.settings))
            }
        })

        if(streams.length > 0) {
    		return concat(streams).on('end', () => log(name + ' has been completely built.', 'done'))
    	}

    	// build fail
    	log('Something is wrong. Check your componer.json.', 'warn')
    })
}
