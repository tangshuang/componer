import path from 'path'
import extend from 'extend'
import concat from 'pipe-concat'
import {log} from '../utils/process'
import {exists, readJSON, readJSONTMPL, getFileExt} from '../utils/file'
import webpack from '../drivers/webpack'
import sass from '../drivers/sass'
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

        let info = readJSON(jsonfile)
        let name = info.name
        info = readJSONTMPL(jsonfile, {
            node_modules: path.join(cwd, 'node_modules'),
    		bower_components: path.join(cwd, 'bower_components'),
            path: cwd,
    		name: info.name,
    		type: info.type,
    		version: info.version,
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
    		let settings = item.settings
    		let options = item.options

            let todir = path.dirname(to)
    		let tofile = path.basename(to, ext)
    		remove(path.join(todir, tofile.substr(0, tofile.length - 4) + '*'))

            if(ext === '.js') {
                settings.output = settings.output || {}
    			settings.output.library = settings.output.library || camelName(info.name, true)
                extend(true, item.settings, extendSettings)
                streams.push(webpack(from, to, options, settings))
            }
            else if(ext === '.scss') {
                streams.push(sass(from, to, options, settings))
            }
        })

        if(streams.length > 0) {
    		return concat(streams).on('end', () => log(name + ' has been completely built.', 'done'))
    	}

    	// build fail
    	log('Something is wrong. Check your componer.json.', 'warn')
    })
}
