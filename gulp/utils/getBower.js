import {config, path, fs} from "../loader"

export function getBowerMain(bower) {
	
	var rootPath = config.paths.root
	var bowerFiles = []
	var bowerPath = path.join(rootPath, "bower_components", bower)

	if(!fs.existsSync(bowerPath)) {
		return false
	}

	var bowerInfo = JSON.parse(fs.readFileSync(bowerPath + "/bower.json"))
	var main = bowerInfo.main
	bowerFiles = Array.isArray(main) ? main.map(file => path.join(bowerPath, file)) : [main]

	return bowerFiles

}