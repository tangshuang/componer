import {config, path, exists, readJSON} from "../loader"

export function getBowerJson(bower) {
	var rootPath = config.paths.root
	var bowerPath = path.join(rootPath, "bower_components", bower)

	if(!exists(bowerPath)) {
		return false
	}

	var jsonfile = path.join(bowerPath, "bower.json")

	if(!exists(jsonfile)) {
		return false
	}

	return jsonfile
}

export function getBowerMain(bower) {
	
	var bowerJson = getBowerJson(bower)

	if(!bowerJson) {
		return false
	}

	var bowerInfo = readJSON(bowerJson)
	var main = bowerInfo.main
	
	if(!main) {
		return false
	}
	
	var rootPath = config.paths.root
	var bowerPath = path.join(rootPath, "bower_components", bower)
	var bowerFiles = Array.isArray(main) ? main.map(file => path.resolve(bowerPath, file)) : [path.resolve(bowerPath, main)]
 
	return bowerFiles

}

function _arrayUnique(arr) {
	return arr.filter((value, index, self) => self.indexOf(value) === index)
}

export function getBowerDeps(bowerJson, dev) {
	
	if(!exists(bowerJson)) {
		return false
	}

	var bowerInfo = readJSON(bowerJson)
	var dependencies = []

	function getDeps(bowerInfo, key) {

		if(bowerInfo[key]) {
			let deps = bowerInfo[key]
			deps = Object.keys(deps)

			if(!Array.isArray(deps) || deps.length === 0) {
				return []
			}

			let _deps = [...deps]
			deps.forEach(dep => {
				let jsonfile = getBowerJson(dep)
				let jsoninfo = readJSON(jsonfile)
				let _subDeps = getDeps(jsoninfo, key)

				// to make sure that all subdeps are before current deps
				let index = _deps.indexOf(dep)
				if(index > 0) {
					_deps.splice(index -1, 0, ..._subDeps)
				}
				else {
					_deps = [..._subDeps, ..._deps]
				}
			})
			deps = _arrayUnique(_deps)

			return deps
		}
		else {
			return []
		}

	}

	if(dev) {
		dependencies = dependencies.concat(getDeps(bowerInfo, "devDependencies"))
	}
	dependencies = dependencies.concat(getDeps(bowerInfo, "dependencies"))
	dependencies = _arrayUnique(dependencies)

	return dependencies

}

export function getBowerDepsFiles(bowerJson, dev) {
	
	var dependencies = getBowerDeps(bowerJson, dev)
	
	if(!dependencies) {
		return false
	}

	var files = []
	dependencies.forEach(bower => files = files.concat(getBowerMain(bower)))

	files = _arrayUnique(files)

	return files

}