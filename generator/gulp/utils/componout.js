import {config} from '../loader'
import {exists, scandir, readJSON} from './file'
import {dashName} from './convert-name'

export function hasComponout(name) {
	if(!exists(config.paths.componouts + '/' + name)) {
		return false
	}
	return true
}

export function getComponout(name) {
	name = dashName(name)
	var dir = `${config.paths.componouts}/${name}`
	if(!exists(dir)) {
		return false
	}

	var infofile = dir + '/componer.json'
	var info = exists(infofile) ? readJSON(infofile) : {
		type: 'config file not found!',
	}

	return {
		name,
		type: info.type || 'Not defined!',
		path: dir,
		info,
	}
}

export function getComponouts() {
	var dir = config.paths.componouts
	var componouts = []
	scandir(dir).forEach(name => componouts.push(getComponout(name)))
	return componouts.filter(item => !!item)
}
