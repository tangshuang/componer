import {gulp, fs, path, config, log, exit, readJSON, execute, args, exists} from "../loader"
import {hasComponout, dashlineName} from "../utils"

gulp.task("install", () => {
	var arg = args.install
	var componoutsPath = config.paths.componouts
	var rootPath = config.paths.root

	function getDeps(pkgfile) {
		var info = readJSON(pkgfile)
		var deps = info.dependencies
		var devdeps = info.devDependencies
		var names = Object.keys(deps).concat(Object.keys(devdeps))
		names = names.filter((value, index, self) => self.indexOf(value) === index)

		names = names.map(name => {
			if(deps[name]) {
				return name + "@" + deps[name]
			}
			return name + "@" + devdeps[name]
		})

		return names
	}

	if(arg.name === undefined) {
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
			execute(`cd ${rootPath} && bower install ` + bowerComponents.join(" "))
		}
		if(npmPackages.length > 0) {
			execute(`cd ${rootPath} && npm install ` + npmPackages.join(" "))
		}
	}
	else {
		let name = dashlineName(arg.name)

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
	var arg = args.link
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

	if(arg.name === undefined) {
		fs.readdirSync(componoutsPath).forEach(item => Link(item))
	}
	else {
		let name = dashlineName(arg.name)
		if(!hasComponout(name)) {
			log(`${name} not exists.`, "error")
			exit()
		}
		Link(name)
	}
})