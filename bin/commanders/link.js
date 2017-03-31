import {exists, link, readJSON, scandir, remove} from '../utils/file'
import {check, fixname, root} from '../utils/componer'
import {dash} from '../utils/convert'
import {execute, log} from '../utils/process'

export default function(commander) {
    commander
    .command('link [name]')
	.description('link local componout as package')
	.action(name => {
        let cwd = root()
		let LinkPkg = name => {
            let jsonfile = `${cwd}/componouts/${name}/componer.json`
            if(!exists(jsonfile)) {
                log(name + '/componer.json not found!', 'warn')
                return
            }
			let info = readJSON(jsonfile)
			let type = info.type
			if(type === 'bower' && exists(`${cwd}/componouts/${name}/bower.json`)) {
                remove(`${cwd}/bower_components/${name}`)
				link(`${cwd}/componouts/${name}`, `${cwd}/bower_components/${name}`)
                log(name + ' is linked as bower component.', 'done')
			}
			else if(type === 'npm' && exists(`${cwd}/componouts/${name}/package.json`)) {
                remove(`${cwd}/node_modules/${name}`)
				link(`${cwd}/componouts/${name}`, `${cwd}/node_modules/${name}`)
                log(name + ' is linked as npm package.', 'done')
			}
            else {
                log(name + ' type not support link.', 'warn')
            }
		}

		if(name === undefined) {
			check()
			scandir(`${cwd}/componouts`).forEach(item => LinkPkg(item))
		}
		else {
			name = dash(name)
			name = fixname(name)
			check(name)
			LinkPkg(name)
		}
	})
}
