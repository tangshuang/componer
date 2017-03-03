import {config, exists, scandir, load} from '../loader'
import {dashName} from './convert-name'

export function hasComponout(name) {
	if(!exists(config.paths.componouts + '/' + name)) {
		return false
	}
	return true
}

export function getComponout(name) {
	name = dashName(name)
	var dir = config.paths.componouts
	var type = 'None'
	var path = `${dir}/${name}`

	if(!exists(path)) {
		return false
	}

	var infofile = path + '/componer.config.js'
	var info = load(infofile)

	return {
		name,
		path,
		type: info.type || 'None',
		version: info.version || 'None',
		info,
	}

}

export function getComponouts() {
	var dir = config.paths.componouts
	var componouts = []
	scandir(dir).forEach(name => componouts.push(getComponout(name)))
	return componouts
}
