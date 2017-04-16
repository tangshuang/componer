import {check, fixname, config, has, root} from '../utils/componer'
import {log, execute, exit} from '../utils/process'
import {dashName} from '../utils/convert-name'

const cwd = root()

export default function(commander) {
    commander
    .command("clone [name]")
    .description("clone a componout from github.com/componer")
    .option("-u, --url [url]", "use your own registry url")
    .action((name, options) => {
		name = dashName(name)
		name = fixname(name)
        check()

        if(has(name)) {
            log(name + ' exists!', 'error')
            exit()
        }

        let configs = config()
		let url = options.url
		if(!url && configs.defaults.registries) url = `${configs.defaults.registries}/${name}.git`
		if(!url) url = `https://github.com/componer/${name}.git`

		execute(`cd "${cwd}" && cd componouts && git clone ${url} ${name}`, true, () => log("Fail! You can enter componouts directory and run `git clone`.", 'error'))
        log('install dependencies...', 'help')
        execute(`cd "${cwd}" && componer install for ${name}`, true)
        log("Done! Componout has been added to componouts directory.", "done")
	})
}
