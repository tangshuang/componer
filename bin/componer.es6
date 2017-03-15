#!/usr/bin/env node

import 'babel-register'

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

function exit() {
	process.exit(0)
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

function write(file, content, charset = "utf8") {
	return fs.writeFileSync(file, content, charset)
}

function writeJSON(file, json, charset = "utf8") {
	return write(file, JSON.stringify(json, null, 4), charset)
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
		exit()
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
			var componerInfo = readJSON(cwd + "/.componerrc")
			componerInfo.defaults.registries = info.registries
			componerInfo.defaults.author = info.author
			writeJSON(cwd + "/.componerrc", componerInfo)
			// update package.json
			var pkgInfo = readJSON(cwd + "/package.json")
			pkgInfo.author = info.author
			pkgInfo.name = info.project
			writeJSON(cwd + "/package.json", pkgInfo)
		}

		let modify = (isEmpty) => {
			var info = {}
			var dirname = path.basename(cwd)
			var gitbase = "http://github.com/componer"

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
			exit()
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
			exit()
		}
		if(!author) {
			log("Componout author needed, use `-h` to read more.", "error")
			exit()
		}

		if(!exists(`${cwd}/gulp/templates/${template}`)) {
			log("This type of componout is not available.", "warn")
			exit()
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
	.action((name, options) => {

		// check whether the package exists
		let existsPackage = (pkg, type) => {
			let pkgName = pkg
			let pkgVer = null
			if(pkg.indexOf('@') > -1) {
				[pkgName, pkgVer] = pkg.split('@')
			}
			if(pkg.indexOf('#') > -1) {
				[pkgName, pkgVer] = pkg.split('#')
			}

			let npmJson = path.join(cwd, 'node_modules', pkgName, 'package.json')
			let bowerJson = path.join(cwd, 'bower_components', pkgName, 'bower.json')
			let jsonFile = null

			switch(type) {
				case 'npm':
					jsonFile = exists(npmJson) ? npmJson : null
					break
				case 'bower':
					jsonFile = exists(bowerJson) ? bowerJson : null
					break
				default:
					jsonFile = exists(npmJson) ? npmJson : exists(bowerJson) ? bowerJson : null
			}

			let isExists = false
			if(jsonFile && exists(jsonFile)) {
				isExists = true

				if(pkgVer && readJSON(jsonFile).version !== pkgVer) {
					isExists = false
				}
			}

			return isExists
		}

		/**
		 * comoner install
		 * install all dependencies of all componouts
		 */
		if(name === undefined) {
			check()

			let componoutsPath = path.join(cwd, "componouts")
			let bowerComponents = {}
			let npmPackages = {}
			let conflictPackages = {}

			let setDeps = (to, deps, conflicts) => {
				let names = Object.keys(deps)
				names.forEach(name => {
					// if conflict
					if(to[name]) {
						if(deps[name] > to[name]) {
							to[name] = deps[name]
						}
						conflicts[name] = to[name]
					}
					else {
						to[name] = deps[name]
					}
				})
			}

			fs.readdirSync(componoutsPath).forEach(item => {
				let componoutPath = path.join(componoutsPath, item)
				let bowerJson = path.join(componoutPath, "bower.json")
				let npmJson = path.join(componoutPath, "package.json")

				if(exists(npmJson)) {
					let info = readJSON(npmJson)
					let deps = info.dependencies
					let devdeps = info.devDependencies

					setDeps(npmPackages, deps, conflictPackages)
					setDeps(npmPackages, devdeps, conflictPackages)
				}

				if(exists(bowerJson)) {
					let info = readJSON(bowerJson)
					let deps = info.dependencies
					let devdeps = info.devDependencies

					setDeps(bowerComponents, deps, conflictPackages)
					setDeps(bowerComponents, devdeps, conflictPackages)
				}
			})

			let npmPackageNames = Object.keys(npmPackages)
			if(npmPackageNames.length > 0) {
				let packages = npmPackageNames.filter(name => !existsPackage(name, 'npm')).map(name => name + '@' + npmPackages[name])
				execute(`cd "${cwd}" && npm install ` + packages.join(" "))
			}

			let bowerComponentNames = Object.keys(bowerComponents)
			if(bowerComponentNames.length > 0) {
				let bowers = bowerComponentNames.filter(name => existsPackage(name, 'bower')).map(name => name + '@' + bowerComponents[name])
				execute(`cd "${cwd}" && bower install ` + bowers.join(" "))
			}

			let conflictPackageNames = Object.keys(conflictPackages)
			if(conflictPackageNames.length > 0) {
				let conflicts = conflictPackageNames.map(name => name + '@' + conflictPackages[name])
				log('Conflicts appear. You should check your componouts, and fix them by manual. Componer finally use:')
				log(conflicts.join(' '))
			}

			return
		}

		/**
		 * componer install {{name}}
		 * install all packages of a componout, or install only one package by using -p option
		 */
		name = dashline(name)
		name = fixname(name)
		check(name)

		let pkg = options.package
		let npmJson = `${cwd}/componouts/${name}/package.json`
		let bowerJson = `${cwd}/componouts/${name}/bower.json`

		/**
		 * if install all packages of a componout
		 */
		if(!pkg) {
			let getDeps = (pkgfile, sep) => {
				var info = readJSON(pkgfile)
				var deps = info.dependencies
				var devdeps = info.devDependencies
				var names = Object.keys(deps).concat(Object.keys(devdeps))
				names = names.filter((value, index, self) => self.indexOf(value) === index)
				names = names.map(name => {
					if(deps[name]) {
						return name + sep + deps[name]
					}
					return name + sep + devdeps[name]
				})
				return names
			}

			if(exists(npmJson)) {
				let npmDeps = getDeps(npmJson, '@')
				if(npmDeps.length > 0) {
					npmDeps = npmDeps.filter(name => !existsPackage(name, 'npm'))
					execute(`cd "${cwd}" && npm install ` + npmDeps.join(" "))
				}
			}
			if(exists(bowerJson)) {
				let bowerDeps = getDeps(bowerJson, '#')
				if(bowerDeps.length > 0) {
					bowerDeps = bowerDeps.filter(name => !existsPackage(name, 'bower'))
					execute(`cd "${cwd}" && bower install ` + bowerDeps.join(" "))
				}
			}

			return
		}

		/**
		 * if install only one package by using -p option
		 */
		let bowerInstall = () => {
 			if(exists(bowerJson)) {
 				pkg = pkg.replace('@', '#')

				// if package exists, just update bower.json
				if(existsPackage(pkg, 'bower')) {
					let bowerInfo = readJSON(bowerJson)
					let [pkgName, pkgVer] = pkg.split('#')
					if(!pkgVer) {
						pkgVer = readJSON(`${cwd}/bower_components/${pkgName}/bower.json`).version
					}

					if(options.savedev) {
						bowerInfo.devDependencies[pkgName] = pkgVer
					}
					else {
						bowerInfo.dependencies[pkgName] = pkgVer
					}

					writeJSON(bowerJson, bowerInfo)

					return
				}

 				let cmd = `cd "${cwd}" && cd componouts && cd ${name} && bower install --config.directory="${cwd}/bower_components" ${pkg}`
 				if(options.savedev) {
 					cmd += ' --save-dev'
 				}
 				else {
 					cmd += ' --save'
 				}
 				execute(cmd)
 			}
 		}

 		if(exists(npmJson)) {
			let updateVersion = () => {
 				// add dependencies into package.json of componout
				let npmPkgInfo = readJSON(npmJson)
 				let [pkgName, pkgVer] = pkg.split('@')
				if(!pkgVer) {
					pkgVer = readJSON(`${cwd}/node_modules/${pkgName}/package.json`).version
				}

				if(options.savedev) {
 					npmPkgInfo.devDependencies[pkgName] = pkgVer
 				}
				else {
					npmPkgInfo.dependencies[pkgName] = pkgVer
				}

				writeJSON(npmJson, npmPkgInfo)
 			}
			if(existsPackage(pkg, 'npm')) {
				updateVersion()
				return
			}
 			execute(`cd "${cwd}" && npm install ${pkg}`, updateVersion, bowerInstall)
 		}
 		else bowerInstall()
	})

commander
	.command("link [name]")
	.description("link local [name] componout as package")
	.action(name => {
		let Link = (name) => {
			let configfile = `${cwd}/componouts/${name}/componer.config.js`
			if(!exists(configfile)) {
				log(name + ' does not have a componer.config.js', 'warn')
				return
			}

			let configinfo = require(configfile)
			let type = configinfo.type

			if(type === 'npm' && exists(`${cwd}/componouts/${name}/package.json`)) {
				execute(`cd "${cwd}" && cd componouts && cd ${name} && npm link`)
				execute(`cd "${cwd}" && npm link ${name}`)
			}
			else if(type === 'bower' && exists(`${cwd}/componouts/${name}/bower.json`)) {
				execute(`cd "${cwd}" && cd componouts && cd ${name} && bower link`)
				execute(`cd "${cwd}" && bower link ${name}`)
			}
			else {
				log(name + ' type not supported.', 'warn')
				return
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
	.command("clone <name>")
	.description("clone a componout from github.com/componer")
	.option("-u, --url [url]", "use your own registry url")
	.option('-I, --install', 'whether to run install task after cloned')
	.option('-L, --link', 'whether to run link task after cloned')
	.action((name, options) => {
		name = dashline(name)
		name = fixname(name)
		check()
		options = merge(options)

		if(has(name)) {
			log(`${name} has been in your componouts`)
			exit()
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
