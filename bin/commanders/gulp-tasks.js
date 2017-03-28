import {dash} from '../libs/convert'
import {fixname, check, config, root} from '../libs/componer'
import {execute, log} from '../libs/process'
import {exists} from '../libs/file'

let cwd = root()
let gulp = cwd + '/node_modules/.bin/gulp'

export default function(commander) {
    var cwd = root()

    commander
	.command('add <name>')
	.description('create a componout')
	.option('-t, --template [template]', 'template of componout')
	.option('-a, --author [author]', 'author of componout')
	.action((name, options) => {
		name = dash(name)
		name = fixname(name)
        check()

		let configs = config()
		let template = options.template || configs.defaults.template
		let author = options.author || configs.project.author

		if(!template || template === '') {
			log('You must input a template name, use `-h` to read more.', 'error')
			return
		}
		if(!author) {
			log('Componout author needed, use `-h` to read more.', 'error')
			return
		}

		if(!exists(`${cwd}/gulp/templates/${template}`)) {
			log('This template is not available.', 'error')
			return
		}

		execute(`cd "${cwd}" && "${gulp}" add --name=${name} --template=${template} --author=${author}`)
	})

    commander
	.command('build [name]')
	.description('build a componout')
	.action(name => {
		if(name === undefined) {
			check()
			execute(`cd "${cwd}" && "${gulp}" build`)
            return
		}

        name = dash(name)
        name = fixname(name)
        check(name)

        execute(`cd "${cwd}" && "${gulp}" build --name=${name}`)
	})

    commander
	.command('preview <name>')
	.description('preview a componout')
	.option('-p, --port [port]', 'use custom port')
	.action((name, options) => {
		name = dash(name)
		name = fixname(name)
		check(name)

		let cmd = `cd "${cwd}" && "${gulp}" preview --name=${name}`
		if(options.port) cmd += ` --port=${options.port}`
		execute(cmd)
	})

    commander
	.command('test [name]')
	.description('test a componout')
	.option('-D, --debug', 'whether to use browser to debug code')
	.option('-b, --browser [browser]', 'which browser to use select one from [PhantomJS|Chrome|Firefox]')
	.action((name, options) => {
		let cmd = `cd "${cwd}" && "${gulp}" test`

		if(name === undefined) {
			check()
		}
		else {
			name = dash(name)
			name = fixname(name)
			check(name)

			cmd += ` --name=${name}`
			if(options.debug) {
				cmd += ' --debug'
			}
		}

		if(options.browser) {
			cmd += ` --browser=${options.browser}`
		}

		execute(cmd)
	})

    commander
	.command('watch [name]')
	.description('watch a componout to build it automaticly when code change')
	.action(name => {
		if(name === undefined) {
			check()
			execute(`cd "${cwd}" && "${gulp}" watch`)
		}
		else {
			name = dash(name)
			name = fixname(name)
			check(name)
			execute(`cd "${cwd}" && "${gulp}" watch --name=${name}`)
		}
	})

    commander
	.command('list')
	.alias('ls')
	.description('list all componouts')
	.action(() => {
		check()
		execute(`cd "${cwd}" && "${gulp}" list`)
	})
}
