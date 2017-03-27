import {exists, link, readJSON, scandir} from '../libs/file'
import {check, fixname} from '../libs/componer'
import {dash} from '../libs/convert'

export default function(commander) {
    commander
    .command('link [name]')
	.description('link local componout as package')
	.action(name => {
		let LinkPkg = (name) => {
			let info = readJSON(`${cwd}/componouts/${name}/componer.json`)
			let type = info.type
			if(type === 'bower' && exists(`${cwd}/componouts/${name}/bower.json`)) {
				link(`${cwd}/componouts/${name}`, `${cwd}/bower_components/${name}`)
			}
			else if(type === 'npm' && exists(`${cwd}/componouts/${name}/package.json`)) {
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
