import {config, path, exists, readJSON} from "../loader"
import {getFileExt} from "./index"

/**
 * get bower component bower.json file path
 * @param string bower: bower name, the directory name of this component
 */
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

/**
 * get bower component main files in bower.json
 * @param string bower: bower name, the directory name of this component
 * @return array: files array, with absolute path
 */
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

/**
 * get dependencies bower components names
 * @param string bowerJson: bower.json file path which to read dependencies
 * @param boolean dev: whether to contains `devDependencies`
 * @return array: bower components names array
 */
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

/**
 * get dependencies bower components files
 * @param string bowerJson: bower.json file path which to read dependencies
 * @param boolean dev: whether to contains `devDependencies`
 * @return array: bower components files array, with absolute path
 * Notice: because some components authors do not follow the rules of bower.json main option, these files may contains repetitive code, for example, some components has both source .js and built .min.js, which is the same code in fact. Use getBowerDepsAlias instead.
 */
export function getBowerDepsFiles(bowerJson, dev) {
	var dependencies = getBowerDeps(bowerJson, dev)
	var files = []

	dependencies.forEach(bower => files = files.concat(getBowerMain(bower)))
	files = _arrayUnique(files)

	return files
}

/**
 * get dependencies bower components files divided
 * @param string bowerJson: bower.json file path which to read dependencies
 * @param boolean dev: whether to contains `devDependencies`
 * @return object: {
	object scripts: .js files alias key value pairs,
	object styles: .css or .scsss alias key value pairs,
 }
 */
export function getBowerDepsAlias(bowerJson, dev) {
	var dependencies = getBowerDeps(bowerJson, dev)
	var files = {
		scripts: {},
		styles: {}
	}

	dependencies.forEach(bower => {
		let mainfiles = getBowerMain(bower)
		mainfiles.forEach(file => {
			let ext = getFileExt(file)
			if(ext === ".js" && !main.script) {
				files.scripts[bower] = file
			}
			else if(ext === ".scss" && !main.style) {
				files.styles[bower] = file
			}
			else if(ext === ".css" && !main.style) {
				files.styles[bower] = file
			}
		})
	})

	return files
}

/**
 * get dependencies bower components .js files
 * @param string bowerJson: bower.json file path which to read dependencies
 * @param boolean dev: whether to contains `devDependencies`
 * @return array: .js files list, with absolute path
 */
export function getBowerDepsScripts(bowerJson, dev) {
	var files = getBowerDepsAlias(bowerJson, dev).scripts
	var deps = Object.keys(files)
	var scripts = deps.map(bower => files[bower])
	return scripts
}

/**
 * get dependencies bower components style files
 * @param string bowerJson: bower.json file path which to read dependencies
 * @param boolean dev: whether to contains `devDependencies`
 * @return array: style files list, with absolute path
 */
export function getBowerDepsStyles(bowerJson, dev) {
	var files = getBowerDepsAlias(bowerJson, dev).styles
	var deps = Object.keys(files)
	var styles = deps.map(bower => files[bower])
	return styles
}