import {execute, log} from '../utils/process'
import {check, fixname, root} from '../utils/componer'
import {dashName} from '../../generator/gulp/utils/convert-name'
import {exists, link, readJSON, scandir, remove, isSymLink} from '../../generator/gulp/utils/file'

export default function(commander) {
    commander
    .command('link [name]')
	.description('link local componout as package')
    .option('-F, --force', 'force use bower/npm link to symbolic link')
	.action(name => {
        let cwd = root()
        let bower = cwd + '/node_modules/.bin/bower'

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
                if(!isSymLink(`${cwd}/bower_components/${name}`) && options.force) {
                    execute(`cd "${cwd}/componouts/${name}" && "${bower}" link`)
                    execute(`cd "${cwd}" && "${bower}" link ${name}`)
                }
                log(name + ' is linked as bower component.', 'done')
			}
			else if(type === 'npm' && exists(`${cwd}/componouts/${name}/package.json`)) {
                remove(`${cwd}/node_modules/${name}`)
				link(`${cwd}/componouts/${name}`, `${cwd}/node_modules/${name}`)
                if(!isSymLink(`${cwd}/bower_components/${name}`) && options.force) {
                    execute(`cd "${cwd}/componouts/${name}" && npm link`)
                    execute(`cd "${cwd}" && npm link ${name}`)
                }
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
			name = dashName(name)
			name = fixname(name)
			check(name)
			LinkPkg(name)
		}
	})
}
