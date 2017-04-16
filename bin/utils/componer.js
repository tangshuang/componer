import path from 'path'
import {exists, readJSON} from './file'
import {log, exit} from './process'

export function is(dir) {
	return exists(`${dir}/package.json`) && exists(`${dir}/.componerrc`)
}

export function root() {
	var flag = false
	var current = process.cwd()
    var level = 5

	for(var i = level;i --;) {
		if(is(current)) {
			flag = true
			break
		}
		else {
			current = path.resolve(current, "..")
		}
	}

	return flag && current
}

export function check(name) {
    var cwd = root()

	if(!cwd) {
		log("You are not in a componer directory.", "error")
		exit()
	}

	if(name && !has(name)) {
		log('You don\'t have a componout named ' + name + '.', "error")
		exit()
	}
}

export function has(name) {
    var cwd = root()
	if(!exists(cwd + '/componouts/' + name)) {
		return false
	}
	return true
}

export function fixname(name) {
    var cwd = root()
    if(!exists(cwd + '/.componerrc')) {
        return name
    }

    var config = readJSON(cwd + '/.componerrc')
    var prefix = config.project.prefix
	if(prefix) {
		name = prefix + name
	}

	return name
}

export function config() {
    var cwd = root()
    if(!exists(cwd + '/.componerrc')) {
        return {}
    }

    var config = readJSON(cwd + '/.componerrc')
    return config
}
