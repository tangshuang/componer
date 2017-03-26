import readline from 'readline'
import {config} from './componer'

import shell from 'shelljs'
import logger from 'process.logger'

export function exit() {
    process.exit()
}

export function execute(cmd, done, fail) {
    var settings = config()
    var gulp = 'npm run gulp --'

    if(cmd.indexOf(gulp) === 0 || cmd.indexOf(' ' + gulp + ' ') > 0) {
		if(settings.color) {
			cmd += ' --color'
		}
		if(!settings.slient) {
			cmd += ' --silent'
		}
	}

	var result = shell.exec(cmd)
	if(result && result.code === 0) {
		if(typeof done === 'function') done()
		return true
	}
	else {
		if(typeof fail === 'function') fail(result.stderr)
        if(typeof done === 'boolean' && done === true) exit()
		return false
	}
}

export function prompt(question, callback) {
    var rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	})
	rl.question(question, answer => {
		rl.close()
		callback(answer)
	})
}

export function log(msg, level) {
    var settings = config()
    settings.color && logger[level] ? logger[level](msg) : console.log(msg)
}
