import {gulp, fs, path, config, log, exit, readJSON, execute, args} from "../loader"
import {hasComponout} from "../utils"

gulp.task("install", () => {
	var arg = args.preview
	var name = dashlineName(arg.name)
	var componoutsPath = config.paths.componouts
	var rootPath = config.paths.root

	function getDeps(pkgfile) {
		var info = readJSON(pkgfile)
		var deps = info.dependencies
		var devdeps = info.devDependencies
		var names = Object.keys(deps).concat(Object.keys(devdeps))
		return names
	}

	if(name === undefined) {
		let bowerComponents = []
		let npmPackages = []
		fs.readdirSync(componoutsPath).forEach(item => {
			let componoutPath = path.join(componoutsPath, item)
			let bowerJson = path.join(componoutPath, "bower.json")
			if(exists(bowerJson)) {
				let deps = getDeps(bowerJson)
				if(deps.length > 0) {
					bowerComponents.concat(deps)
				}
			}
			let npmJson = path.join(componoutPath, "package.json")
			if(exists(npmJson)) {
				let deps = getDeps(npmJson)
				if(deps.length > 0) {
					npmPackages.concat(deps)
				}
			}
		})
		if(bowerComponents.length > 0) {
			bowerComponents.filter((value, index, self) => self.indexOf(value) === index)
			execute(`cd ${rootPath} && bower install ` + bowerComponents.join(" "))
		}
		if(npmPackages.length > 0) {
			npmPackages.filter((value, index, self) => self.indexOf(value) === index)
			execute(`cd ${rootPath} && npm install ` + npmPackages.join(" "))
		}
	}
	else {
		if(!hasComponout(name)) {
			log(`${name} not exists.`, "error")
			exit()
		}

		if(exists(`${componoutsPath}/${name}/bower.json`)) {
			execute(`cd ${componoutsPath} && cd ${name} && bower install --config.directory=${rootPath}/bower_components`)
		}
		if(exists(`${componoutsPath}/${name}/package.json`)) {
			execute(`cd ${cwd} && cd componouts && cd ${name} && npm install --prefix ${rootPath}`)
		}
	}
})

gulp.task("link", () => {
	var arg = args.preview
	var name = dashlineName(arg.name)
	var componoutsPath = config.paths.componouts
	var rootPath = config.paths.root

	function Link(name) {
		if(exists(`${componoutsPath}/${name}/bower.json`)) {
			execute(`cd ${componoutsPath} && cd ${name} && bower link`)
			execute(`cd ${rootPath} && bower link ${name}`)
		}
		else if(exists(`${componoutsPath}/${name}/package.json`)) {
			execute(`cd ${componoutsPath} && cd ${name} && npm link`)
			execute(`cd ${rootPath} && npm link ${name}`)
		}
	}

	if(name === undefined) {
		fs.readdirSync(componoutsPath).forEach(item => Link(item))
	}
	else {
		if(!hasComponout(name)) {
			log(`${name} not exists.`, "error")
			exit()
		}
		Link(name)
	}
})