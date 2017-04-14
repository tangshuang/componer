import {fixname, check, root} from '../utils/componer'
import {execute, prompt, log, exit} from '../utils/process'
import {exists, unSymlink} from '../../generator/gulp/utils/file'
import {dashName} from '../../generator/gulp/utils/convert-name'

const cwd = root()

export default function(commander) {
    commander
	.command('remove <name>')
	.alias('rm')
	.description('remove a componout from componouts directory')
	.action(name => {
		name = dashName(name)
		name = fixname(name)
		check(name)

		prompt('Are you sure to remove ' + name + ' componout? yes/No  ', choice => {
			if(choice === 'yes') {
                unSymlink(`${cwd}/bower_components/${name}`)
                unSymlink(`${cwd}/node_modules/${name}`)
				execute(`cd "${cwd}/componouts" && rm -rf ${name}`, true)
				log('Done! ' + name + ' has been deleted.', 'done')
			}
			exit()
		})
	})
}
