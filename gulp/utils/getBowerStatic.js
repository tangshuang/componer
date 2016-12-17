import {config, path, fs} from "../loader"

export function getBowerStatic(bower) {
	var rootPath = config.paths.root
	var bowerFiles = []
	var packageInfo = JSON.parse(fs.readFileSync(rootPath + "/package.json"))
	if(packageInfo.bowerComponents && packageInfo.bowerComponents[bower]) {
		bowerFiles = packageInfo.bowerComponents.map(file => path.join(rootPath, file))
	}
	else {
		var bowerPath = path.join(rootPath, "bower_components", bower)
		var bowerInfo = JSON.parse(fs.readFileSync(bowerPath + "/bower.json"))
		bowerFiles = bowerInfo.main.map(file => path.join(bowerPath, file))
	}

	return bowerFiles
}