import {dash} from '../libs/convert'
import {fixname, check} from '../libs/componer'
import {execute, prompt} from '../libs/process'

export default function(commander) {
    commander
    	.command('remove <name>')
    	.alias('rm')
    	.description('remove a componout from componouts directory')
    	.action(name => {
    		name = dash(name)
    		name = fixname(name)
    		check(name)

    		prompt('Are you sure to remove ' + name + ' componout? yes/No  ', choice => {
    			if(choice === 'yes') {
    				let componoutPath = `${cwd}/componouts/${name}`
    				if(exists(`${cwd}/bower_components/${name}`)) {
    					remove(`${cwd}/bower_components/${name}`)
    				}
    				if(exists(`${cwd}/node_modules/${name}`)) {
    					remove(`${cwd}/node_modules/${name}`)
    				}
    				execute(`cd '${cwd}' && cd componouts && rm -rf ${name}`, true)
    				log('Done! ' + name + ' has been deleted.', 'done')
    			}
    			exit()
    		})
    	})
}
