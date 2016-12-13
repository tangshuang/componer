import {logger, fs, config} from "../loader"
import {dashlineName} from "./nameConvert"

export default function(name) {
	if(!fs.existsSync(config.paths.components + "/" + dashlineName(name))) {
		logger.error("Error: component is not found.")
		return false
	}

	return true
}