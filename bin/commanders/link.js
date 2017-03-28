import {exists, link, readJSON, scandir, remove} from '../libs/file'
import {check, fixname, root} from '../libs/componer'
import {dash} from '../libs/convert'
import {execute} from '../libs/process'

export default function(commander) {
    commander
    .command('link [name]')
	.description('link local componout as package')
	.action(name => {
        let cwd = root()
		let LinkPkg = (name) => {
			let info = readJSON(`${cwd}/componouts/${name}/componer.json`)
			let type = info.type
			if(type === 'bower' && exists(`${cwd}/componouts/${name}/bower.json`)) {
                remove(`${cwd}/bower_components/${name}`)
				link(`${cwd}/componouts/${name}`, `${cwd}/bower_components/${name}`)
			}
			else if(type === 'npm' && exists(`${cwd}/componouts/${name}/package.json`)) {
                remove(`${cwd}/node_modules/${name}`)
				link(`${cwd}/componouts/${name}`, `${cwd}/node_modules/${name}`)
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
