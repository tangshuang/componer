import {logger, fs, config} from "../loader"
import {dashlineName} from "./nameConvert"

export function hasComponent(name) {
	if(!fs.existsSync(config.paths.components + "/" + dashlineName(name))) {
		logger.error("Error: component is not found.")
		return false
	}

	return true
}