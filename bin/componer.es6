#!/usr/bin/env node

import fs from "fs"
import path from "path"
import readline from "readline"

import commander from "commander"
import shell from "shelljs"
import logger from "process.logger"

// ----------------------------------
//         basic parameters
// ----------------------------------

var argvs = process.argv

if(argvs.length <= 2) {
	execute("componer -h")
	exit()
}

var generator = path.resolve(__dirname, "../generator")
var cwd = process.cwd()
var info = readJSON(__dirname + "/../package.json")

// var gulp = 'glup'
// var bower = 'bower'

// ----------------------------------
//         basic functions
// ----------------------------------

function exit(code = 1) {
	process.exit(code)
}

function exists(file) {
	return fs.existsSync(file)
}

function read(file) {
	return fs.readFileSync(file)
}

function readJSON(file) {
	return JSON.parse(read(file))
}

function write(file, content) {
	fs.writeFileSync(file, content)
}

function writeJSON(file, json) {
	write(file, JSON.stringify(json, null, 4))
}

function dashline(name) {
	name = name.substr(0, 1).toLowerCase() + name.substr(1)
	return name.replace(/([A-Z])/g, "-$1").toLowerCase()
}

// ----------------------------------
//         logic functions
// ----------------------------------

/**
 * @param string dir: the path of directory to check whether it is a componer work directory.
 */
function isComponer(dir) {
	return exists(`${dir}/package.json`) && exists(`${dir}/.componerrc`)
}

/**
 * get current componer root dir path (5 up level)
 */
function current() {
	var flag = false
	var current = cwd

	for(var i = 5;i --;) {
		if(isComponer(current)) {
			flag = true
			break
		}
		else {
			current = path.resolve(current, "..")
		}
	}

	return flag && current
}

// get config information from .componerrc
function config(key) {
	var config = exists(`${cwd}/.componerrc`) ? readJSON(`${cwd}/.componerrc`) : {}
	return key ? config[key] : config
}

// add prefix to componout name
function fixname(name) {
	var prefix = config("prefix")
	if(prefix) {
		name = prefix + name
	}
	return name
}

// merge default options from .componerrc
function merge(options, pendKeys = []) {
	var cpoInfo = config("defaults")
	var pkgInfo = readJSON(cwd + "/package.json")
	var keys = Object.keys(options).concat(pendKeys)
	keys = keys.filter((key, index) => keys.indexOf(key) === index)
	keys.forEach(key => options[key] = (options[key] || cpoInfo[key] || pkgInfo[key]))
	return options
}

/**
 * @param string name: the name of a componout that will be check
 * @param boolean exit: whether to exit process when the result is false.
 */
function has(name) {
	if(!exists(`${cwd}/componouts/${name}`)) {
		return false
	}
	return true
}

// check whether in componer directory or the componout exists
function check(name) {
	cwd = current()

	if(!cwd) {
		log("You are not in a componer directory, or files are missing.", "error")
		exit()
	}

	if(name && !has(name)) {
		log(`You don't have a componout named ${name} now.`, "error")
		exit()
	}
}

/**
 * @param string cmd: the command to run in shell
 * @param function done: callback function when run successfully
 * @param function fail: callback function when error or fail
 */
function execute(cmd, done, fail) {
	if(cmd.indexOf('gulp ') === 0 || cmd.indexOf(' gulp ') > 0) {
		if(config("color")) {
			cmd += " --color"
		}
		if(!config("silent")) {
			cmd += " --silent"
		}
	}

	var result = shell.exec(cmd)
	if(result && result.code === 0) {
		typeof done === "function" && done()
	}
	else {
		typeof fail === "function" && fail(result.stderr)
	}
}

/**
 * @param string question: display before input something
 * @param function callback: what to do after input, with answer as a parameter
 */
function prompt(question, callback) {
	var rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	})
	rl.question(question, answer => {
		rl.close()
		callback(answer)
	})
}

function log(msg, level) {
	config("color") && logger[level] ? logger[level](msg) : console.log(msg)
}

// ======================================================
//                        commands
// ======================================================

commander
	.version(info.version)
	.usage("<task> [options] [name] [param...]")
	.option("-v, --version", "same as `-V`")

commander
	.arguments('<cmd>')
	.action((cmd, options) => {
		log("Not found `" + cmd + "` command, use `componer -h` to read more.", "warn")
	})

commander
	.command("init")
	.description("create a componer workflow frame instance")
	.option("-I, --install", "whether to run `npm install` after files created.")
	.action(options => {
		let update = (info) => {
			// update .componerrc
			let componerInfo = readJSON(cwd + "/.componerrc")
			componerInfo.defaults.registries = info.registries
			componerInfo.defaults.author = info.author
			writeJSON(cwd + "/.componerrc", componerInfo)
			// update package.json
			let pkgInfo = readJSON(cwd + "/package.json")
			pkgInfo.author = info.author
			pkgInfo.name = info.project
			writeJSON(cwd + "/package.json", pkgInfo)
		}

		let modify = (isEmpty) => {
			let info = {}
			let dirname = path.basename(cwd)
			let gitbase = "http://github.com/componer"

			prompt("What is your current project name? (default: " + dirname + ") ", project => {
				project = !project || project === "" ? dirname : project
				info.project = dashline(project)

				prompt("What is your project author name? (default: componer) ", author => {
					author = !author || author === "" ? "componer" : author
					info.author = dashline(author)

					prompt("What is your registries base url? (default: " + gitbase + ") ", registries => {
						registries = !registries || registries === "" ? gitbase : registries
						info.registries = registries

						// update files, install and exit
						update(info)
						if(isEmpty) {
							if(options.install) {
								log("npm install...")
								execute(`cd "${cwd}" && npm install`)
							}
							else {
								log("Done! Do NOT forget to run `npm install` before you begin.", "done")
							}
						}
						exit()
					})
				})
			})
		}

		// if this directory is a componer directory, just modify files
		if(isComponer(cwd)) {
			modify()
			return
		}

		// or do init task
		if(fs.readdirSync(cwd).length > 0) {
			log("Current directory is not empty, you should begin in a new directory.", "error")
			return
		}

		log("copying files...")
		execute("cp -rf " + generator + "/. " + cwd + "/")
		execute(`cd "${cwd}" && mkdir componouts`, () => {}, () => {
			log("You should create `componouts` directory by yourself.", "warn")
			log("Do NOT forget to run `npm install`.", "warn")
		})
		modify(true)

	})

commander
	.command("reset")
	.description("reset componer and curent project componer program")
	.option("-I, --install", "whether to run `npm install` after files reset")
	.action(options => {
		check()

		log("Reset may change componer files in your project directory.")
		prompt("Are you sure to reset? yes/No  ", choice => {
			if(choice.toLowerCase() === "yes") {
				// copy gulp relative files
				let files = [
					{
						from: generator + "/gulp/.",
						to: cwd + "/gulp/",
					},
					{
						from: generator + "/gulpfile.babel.js",
						to: cwd + "/gulpfile.babel.js",
					},
				]
				files.forEach(item => execute(`rm -rf "${item.to}" && cp -rf "${item.from}" "${item.to}"`))

				// use new package dependencies
				let pkgJson = cwd + "/package.json"
				let pkgInfo = readJSON(pkgJson)
				let newPkgInfo = readJSON(generator + "/package.json")
				pkgInfo.dependencies = newPkgInfo.dependencies
				pkgInfo.devDependencies = newPkgInfo.devDependencies
				writeJSON(pkgJson, pkgInfo)

				if(options.install) {
					log("npm install...")
					execute(`cd "${cwd}" && npm install`)
				}
				else {
					log("Done! Do NOT forget to run `npm install`", "done")
				}
			}
			exit()
		})
	})

commander
	.command("add <name>")
	.description("(gulp) create a componout")
	.option("-t, --template [template]", "template of componout")
	.option("-a, --author [author]", "author of componout")
	.action((name, options) => {
		name = dashline(name)
		name = fixname(name)
		check()
		options = merge(options, ["template", "author"])

		let template = options.template
		let author = options.author

		if(!template || template === "") {
			log("You must input a template name, use `-h` to read more.", "error")
			return
		}
		if(!author) {
			log("Componout author needed, use `-h` to read more.", "error")
			return
		}

		if(!exists(`${cwd}/gulp/templates/${template}`)) {
			log("This type of componout is not available.", "warn")
			return
		}

		execute(`cd "${cwd}" && gulp add --name=${name} --template=${template} --author=${author}`)
	})

commander
	.command("build [name]")
	.description("(gulp) build a componout")
	.action(name => {
		if(name === undefined) {
			check()
			execute(`cd "${cwd}" && gulp build`)
		}
		else {
			name = dashline(name)
			name = fixname(name)
			check(name)
			execute(`cd "${cwd}" && gulp build --name=${name}`)
		}

	})

commander
	.command("preview <name>")
	.description("(gulp) preview a componout")
	.option('-p, --port [port]', 'use custom port')
	.action((name, options) => {
		name = dashline(name)
		name = fixname(name)
		check(name)

		let cmd = `cd "${cwd}" && gulp preview --name=${name}`
		if(options.port) cmd += ` --port=${options.port}`

		execute(cmd)
	})

commander
	.command("test [name]")
	.description("(gulp) test a componout")
	.option("-D, --debug", "whether to use browser to debug code")
	.option("-b, --browser [browser]", "which browser to use select one from [PhantomJS|Chrome|Firefox]")
	.action((name, options) => {
		let cmd = `cd "${cwd}" && gulp test`

		if(name === undefined) {
			check()
			options = merge(options)
		}
		else {
			name = dashline(name)
			name = fixname(name)
			check(name)
			options = merge(options)

			cmd += ` --name=${name}`
			if(options.debug) {
				cmd += " --debug"
			}
		}
		if(options.browser) {
			cmd += ` --browser=${options.browser}`
		}

		execute(cmd)
	})

commander
	.command("watch [name]")
	.description("(gulp) watch a componout to build it automaticly when code change")
	.action(name => {
		if(name === undefined) {
			check()
			execute(`cd "${cwd}" && gulp watch`)
		}
		else {
			name = dashline(name)
			name = fixname(name)
			check(name)
			execute(`cd "${cwd}" && gulp watch --name=${name}`)
		}
	})

commander
	.command("list")
	.alias("ls")
	.description("(gulp) list all componouts")
	.action(() => {
		check()
		execute(`cd "${cwd}" && gulp list`)
	})

commander
	.command("install [name]")
	.description("install componouts [dev]dependencies")
	.option("-p, --package [package]", "package name to install")
	.option("-S, --save", "save to .json dependencies (default)")
	.option("-D, --savedev", "save to .json devDependencies")
	.option('-F, --force', 'force to install packages if exists in local')
	.action((name, options) => {

		// get all of local packages
		let getLocalPackages = () => {
			let packages = {}
			if(exists(cwd + '/bower_components')) fs.readdirSync(cwd + '/bower_components').forEach(item => {
				if(item.substr(0, 1) === '.') return
				let info = readJSON(cwd + '/bower_components/' + item + '/bower.json')
				packages[info.name] = info.version
			})
			fs.readdirSync(cwd + '/node_modules').forEach(item => {
				if(item.substr(0, 1) === '.') return
				let info = readJSON(cwd + '/node_modules/' + item + '/package.json')
				packages[info.name] = info.version
			})
			return packages
		}

		// get version from version string such as `~1.3.0`, `^2.0.1`, >=6.2.1
		let getVersion = ver => {
			let i = ver.search(/\d/)
			if(i > -1 && i < 3) return ver.substr(i)
			return ver
		}

		// get suitable item from a list
		let getSuitable = list => {
			return list[0]
		}

		// get packages not repetitive/unique
		let getPackages = objs => {
			let _ = {}
			let packages = {}

			_.add = (obj, info = null) => {
				let names = Object.keys(obj)
				names.forEach(name => {
					if(!packages[name]) {
						packages[name] = []
					}
					let item = obj[name]
					packages[name].push({
						name: name,
						version: obj[name],
						info,
					})
				})
				return _
			}
			_.get = (name) => {
				if(name === undefined) {
					return packages
				}
				return packages[name]
			}
			_.use = () => {
				let names = Object.keys(packages)
				let results = {}
				names.forEach(name => {
					let items = _.get(name)
					let item = getSuitable(items) // TODO: find out the most suitable version
					results[name] = item.version
				})
				return results
			}

			if(Array.isArray(objs)) {
				objs.forEach(_.add)
			}

			return _
		}

		let installPackages = (Packages) => {
			let pkgs = Packages.use()
			let names = Object.keys(pkgs)
			let localPkgs = getLocalPackages()
			let install = (name, version) => {
				// version is a url or path
				if(version.indexOf('/') > -1) {
					let items = Packages.get(name)
					let item = getSuitable(items)
					let type = item.info
					if(!type) return
					execute(`cd "${cwd}" && ${type} install ${version}`)
					return
				}
				// install by npm and bower when fail
				execute(`cd "${cwd}" && npm install ${name}@${version}`, () => {}, () => {
					execute(`cd "${cwd}" && bower install ${name}#${version}`)
				})
			}

			names.forEach(name => {
				let version = getVersion(pkgs[name])
				let localPkgVer = localPkgs[name]

				// if exists this package in local, do not install it
				if(localPkgVer) {
					// if get it by git or path
					if(version.indexOf('/') > -1) return
					// if local version is bigger then wanted
					if(localPkgVer >= version) return
				}

				install(name, version)
			})
		}

		/**
		 * `comoner install`
		 * install all dependencies of all componouts
		 */
		if(name === undefined) {
			check()

			// find out packages from json files
			let Packages = getPackages()
			fs.readdirSync(componoutsPath).forEach(name => {
				let npmJson = `${cwd}/componouts/${name}/package.json`
				let bowerJson = `${cwd}/componouts/${name}/bower.json`
				if(exists(bowerJson)) {
					let info = readJSON(bowerJson)
					let deps = info.dependencies
					let devdeps = info.devDependencies
					Packages.add(deps, 'bower').add(devdeps, 'bower')
				}
				if(exists(npmJson)) {
					let info = readJSON(npmJson)
					let deps = info.dependencies
					let devdeps = info.devDependencies
					Packages.add(deps, 'npm').add(devdeps, 'npm')
				}
			})

			// install npm packages
			installPackages(Packages)

			log('All packages have been installed.', 'done')
			return
		}


		/**
		 * install all packages of a componout
		 * or install only one package for one componout by using -p option
		 */

		name = dashline(name)
		name = fixname(name)
		check(name)

		let pkg = options.package
		let npmJson = `${cwd}/componouts/${name}/package.json`
		let bowerJson = `${cwd}/componouts/${name}/bower.json`

		/**
		 * `componer install {{name}}`
		 * install all packages of a componout
		 */
		if(!pkg) {
			let Packages = getPackages()
			if(exists(bowerJson)) {
				let info = readJSON(bowerJson)
				let deps = info.dependencies
				let devdeps = info.devDependencies
				Packages.add(deps, 'bower').add(devdeps, 'bower')
			}
			if(exists(npmJson)) {
				let info = readJSON(npmJson)
				let deps = info.dependencies
				let devdeps = info.devDependencies
				Packages.add(deps, 'npm').add(devdeps, 'npm')
			}
			// install npm packages
			installPackages(Packages)

			log('All packages have been installed.', 'done')
			return
		}

		/**
		 * `componer install {{name}} -p {{package}}`
		 * install only one package for one componout by using -p option
		 */
		let [pkgName, pkgVer] = pkg.split(/[#@]/)
		let existsPackage = name => {
			let localPkgs = getLocalPackages()
			return !!localPkgs[name]
		}
		let updateVersion = (file, name, version = null, dev = false) => {
 			// add dependencies into package.json of componout
 			let info = readJSON(file)

 			if(!version) {
				let bowerJson = `${cwd}/bower_components/${name}/bower.json`
				let npmJson = `${cwd}/node_modules/${name}/package.json`
				let jsonFile = exists(npmJson) ? npmJson : exists(bowerJson) ? bowerJson : null
 				if(jsonFile) {
					version = readJSON(jsonFile).version
				}
 			}

 			if(dev) {
 				info.devDependencies[name] = version
 			}
 			else {
 				info.dependencies[name] = version
 			}

 			writeJSON(file, info)
 		}
		let bowerInstall = (name, version) => {
			// bower.json not exists
 			if(!exists(bowerJson)) return

			// if package exists, just update bower.json
			if(!options.force && !version && existsPackage(name)) {
				updateVersion(bowerJson, name, false, options.savedev)
				return
			}

			let cmd = `cd "${cwd}" && cd componouts && cd ${name} && bower install --config.directory="${cwd}/bower_components" ${name}`
			cmd += version ? `@${version}` : ''
			cmd += options.savedev ? ' --save-dev' : ' --save'
			execute(cmd)
 		}

 		if(exists(npmJson)) {
			if(!options.force && !pkgVer && existsPackage(pkgName)) {
				updateVersion(npmJson, pkgName, false, options.savedev)

				log('Package has been installed.', 'done')
				return
			}

			let cmd = `cd "${cwd}" && npm install ${pkgName}`
			cmd += pkgVer ? `@${pkgVer}` : ''
			execute(cmd, () => {
				updateVersion(npmJson, pkgName, pkgVer, options.savedev)
			}, () => {
				bowerInstall(pkgName, pkgVer)
			})
 		}
 		else {
			bowerInstall(pkgName, pkgVer)
		}

		log('Package has been installed.', 'done')
		return
	})

commander
	.command("link [name]")
	.description("link local [name] componout as package")
	.action(name => {
		let Link = (name) => {
			let npmJson = `${cwd}/componouts/${name}/package.json`
			let bowerJson = `${cwd}/componouts/${name}/bower.json`
			if(exists(bowerJson) && readJSON(bowerJson).keywords.indexOf('componer') > -1) {
				execute(`cd "${cwd}" && cd componouts && cd ${name} && bower link`)
				execute(`cd "${cwd}" && bower link ${name}`)
			}
			else if(exists(npmJson) && readJSON(npmJson).keywords.indexOf('componer') > -1) {
				execute(`cd "${cwd}" && cd componouts && cd ${name} && npm link`)
				execute(`cd "${cwd}" && npm link ${name}`)
			}
		}

		if(name === undefined) {
			check()
			fs.readdirSync(`${cwd}/componouts`).forEach(item => Link(item))
		}
		else {
			name = dashline(name)
			name = fixname(name)
			check(name)
			Link(name)
		}
	})

commander
	.command("remove <name>")
	.alias("rm")
	.description("remove a componout from componouts directory")
	.action(name => {
		name = dashline(name)
		name = fixname(name)
		check(name)
		prompt("Are you sure to remove " + name + " componout? yes/No  ", choice => {
			if(choice.toLowerCase() === "yes") {
				let componoutPath = `${cwd}/componouts/${name}`
				if(exists(`${cwd}/bower_components/${name}`)) {
					execute(`cd "${cwd}" && bower unlink ${name} && cd "${componoutPath}" && bower unlink`)
				}
				if(exists(`${cwd}/node_modules/${name}`)) {
					execute(`cd "${cwd}" && npm unlink ${name} && cd "${componoutPath}" && npm unlink`)
				}
				execute(`cd "${cwd}" && cd componouts && rm -rf ${name}`, () => {
					log("Done! " + name + " has been deleted.", "done")
				})
			}
			exit()
		})
	})

// ----------------------------------------------------

commander
	.command("clone [name]")
	.description("clone a componout from github.com/componer")
	.option("-u, --url [url]", "use your own registry url")
	.option('-I, --install', 'whether to run install task after cloned')
	.option('-L, --link', 'whether to run link task after cloned')
	.action((name, options) => {
		check()

		if(name === undefined) {
			let deps = config('dependencies')
			let items = Object.keys(deps)
			if(items.length > 0) {
				items.forEach(item => execute(`componer clone ${item} -u ${deps[item]}`))
			}
			return
		}

		name = dashline(name)
		name = fixname(name)
		options = merge(options)

		if(has(name)) {
			log(`${name} has been in your componouts`)
			return
		}

		let url = options.url
		if(!url && options.registries) url = `${options.registries}/${name}.git`
		if(!url) url = `https://github.com/componer/${name}.git`

		execute(`cd "${cwd}" && cd componouts && git clone ${url} ${name}`, () => {
			// append git ignore
			// let ignores = read(cwd + '/.gitignore')
			// ignores += "\r\n" + 'componouts/' + name + '/'
			// write(cwd + '/.gitignore', ignores)

			// delete .git directory
			// execute(`cd "${cwd}" && cd componouts && cd ${name} && rm -rf .git && rm -f .gitignore`)

			// install dependencies
			if(options.install) {
				execute(`cd "${cwd}" && componer install ${name}`)
			}

			// link the package
			if(options.link) {
				execute(`cd "${cwd}" && componer link ${name}`)
			}

			log("Done! Componout has been added to componouts directory.", "done")
		}, () => {
			log("Fail! You can enter componouts directory and run `git clone`.", "help")
		})
	})

// -----------------------------------

commander
	.parse(argvs)
