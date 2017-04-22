import {config, exists, path, scandir, readJSON, readJSONTMPL, dashName} from '../loader'

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
		version: ''
	}

	return {
		name,
		type: info.type || 'Not defined!',
		version: info.version,
		path: dir,
		info,
	}
}

export function getComponoutConfig(name) {
	var componoutPath = config.paths.componouts + '/' + name
	var data = readJSONTMPL(componoutPath + '/componer.json', {
		node_modules: path.join(config.paths.root, 'node_modules'),
		bower_components: path.join(config.paths.root, 'bower_components'),
		path: componoutPath,
		name,
	})
	return data
}

export function getComponouts() {
	var dir = config.paths.componouts
	var componouts = []
	scandir(dir).forEach(name => componouts.push(getComponout(name)))
	return componouts.filter(item => !!item)
}
