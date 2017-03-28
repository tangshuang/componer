import shell from 'shelljs'
import logger from 'process.logger'

export function exit() {
	process.exit(0)
}

export function execute(cmd, done, fail) {
	var result = shell.exec(cmd)
	if(result.code === 0) {
		if(typeof done === 'function') {
            done()
        }
		return true
	}
	else {
		if(typeof fail === 'function') {
            fail(result.stderr)
        }
		if(typeof done === 'boolean' && done === true) {
			exit()
		}
		return false
	}
}

export function log(content, level) {
	if(process.argv.indexOf('--color') && logger[level]) {
		logger[level](content)
	}
	else {
		console.log(content)
	}
}

export function run(task, args) {
	var cmd = '"' + __dirname + '/../../node_modules/.bin/gulp" ' + task

	if(args) {
		for(let key in args) {
			let value = args[key]
			cmd += ` --${key}`
			if(value !== true && value) {
				cmd += `="${value}"`
			}
		}
	}

	if(process.argv.indexOf('--color') > -1) {
		cmd += ' --color'
	}

	if(process.argv.indexOf('--silent') > -1) {
		cmd += ' --silent'
	}

	shell.exec(cmd)
}
