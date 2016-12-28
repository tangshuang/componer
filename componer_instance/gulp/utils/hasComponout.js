import {config, exists} from "../loader"

export function hasComponout(name) {

	if(!exists(config.paths.componouts + "/" + name)) {
		return false
	}

	return true

}