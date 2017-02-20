#!/usr/bin/env node

import fs from "fs"
import path from "path"
import readline from "readline"

import commander from "commander"
import shell from "shelljs"
import logger from "process.logger"

var argvs = process.argv

if(argvs.length <= 2) {
	execute("componer -h")
	exit()
}

// ----------------------------------
var generator = path.resolve(__dirname, "../generator")
var cwd = process.cwd()
var info = readJSON(__dirname + "/../package.json")

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

function fixname(name) {
	var prefix = config("prefix")
	if(prefix) {
		name = prefix + name
	}
	return name
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
	if(cmd.indexOf("gulp") > -1) {
		if(config("color")) {
			cmd += " --color"
		}
		if(!config("silent")) {
			cmd += " --silent"
		}
	}

	var result = shell.exec(cmd)
	if(result.code === 0) {
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

function config(key) {
	var config = exists(`${cwd}/.componerrc`) ? readJSON(`${cwd}/.componerrc`) : {}
	return key ? config[key] : config
}

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
	.option("-i, --install", "whether to run `npm install` after files created.")
	.action(options => {

		function modify(isEmpty) {

			prompt("What is your github user `name` in url? ", author => {
				if(!author || author === "") {
					log("You must input your github name to create github address.", "error")
					exit()
				}

				var pkgInfo = readJSON(cwd + "/package.json")
				pkgInfo.author = author

				var dirname = path.basename(cwd)

				prompt("What is your current project name? (" + dirname + ") ", project => {
					if(!project || project === "") {
						project = dirname
					}
					project = dashline(project)

					pkgInfo.name = project

					writeJSON(cwd + "/package.json", pkgInfo)

					if(isEmpty) {
						if(options.install) {
							log("npm install...")
							execute(`cd ${cwd} && npm install`)
						}
						else {
							log("Done! Do NOT forget to run `npm install` before you begin.", "done")
						}
					}

					exit()
				})
			})

		}

		if(isComponer(cwd)) {
			modify()
			return
		}

		if(fs.readdirSync(cwd).length > 0) {
			log("Current directory is not empty, you should begin in a new directory.", "error")
			exit()
		}

		log("copying files...")
		execute("cp -r " + generator + "/. " + cwd + "/")
		execute(`cd ${cwd} && mkdir componouts`, () => {}, () => {
			log("You should create `componouts` directory by yourself.", "warn")
			log("Do NOT forget to run `npm install`.", "warn")
		})
		modify(true)

	})

commander
	.command("add <name>")
	.description("(gulp) create a componout")
	.option("-t, --template [template]", "template of componout")
	.option("-a, --author [author]", "author of componout")
	.option("-g, --git", "run `git init` after ready")
	.action((name, options) => {
		name = dashline(name)
		name = fixname(name)
		check()

		var template = options.template || "default"
		var author = options.author || readJSON(cwd + "/package.json").author

		if(!exists(`${cwd}/gulp/templates/${template}`)) {
			log("This type of componout is not available.", "warn")
			exit()
		}
		if(!author) {
			log("Componout author needed, please use `-h` to read more.", "error")
			exit()
		}

		execute(`cd ${cwd} && gulp add --name=${name} --template=${template} --author=${author}`, () => {
			// git init
			if(options.git) {
				var url = `https://github.com/${author}/${name}.git`
				execute(`cd ${cwd} && cd componouts && cd ${name} && git init && git remote add origin ${url}`)
			}
		})
	})

commander
	.command("build [name]")
	.description("(gulp) build a componout")
	.action(name => {
		if(name === undefined) {
			check()
			execute(`cd ${cwd} && gulp build`)
		}
		else {
			name = dashline(name)
			name = fixname(name)
			check(name)
			execute(`cd ${cwd} && gulp build --name=${name}`)
		}

	})

commander
	.command("preview <name>")
	.description("(gulp) preview a componout")
	.action(name => {
		name = dashline(name)
		name = fixname(name)
		check(name)
		execute(`cd ${cwd} && gulp preview --name=${name}`)
	})

commander
	.command("test [name]")
	.description("(gulp) test a componout")
	.option("-D, --debug", "whether to use browser to debug code")
	.option("-b, --browser", "which browser to use select one from [PhantomJS|Chrome|Firefox]")
	.action((name, options) => {
		var cmd = `cd ${cwd} && gulp test`

		if(options.browser) {
			cmd += ` --browser=${browser}`
		}
		if(options.debug) {
			cmd += " --debug"
		}

		if(name === undefined) {
			check()
			if(options.debug) {
				log("`debug` option is not allowed when testing all componouts", "error")
				exit()
			}
		}
		else {
			name = dashline(name)
			name = fixname(name)
			check(name)
			cmd += ` --name=${name}`
		}

		execute(cmd)
	})

commander
	.command("watch [name]")
	.description("(gulp) watch a componout to build it automaticly when code change")
	.action(name => {
		if(name === undefined) {
			check()
			execute(`cd ${cwd} && gulp watch`)
		}
		else {
			name = dashline(name)
			name = fixname(name)
			check(name)
			execute(`cd ${cwd} && gulp watch --name=${name}`)
		}
	})

commander
	.command("list")
	.alias("ls")
	.description("(gulp) list all componouts")
	.action(() => {
		check()
		execute(`cd ${cwd} && gulp list`)
	})

commander
	.command("install [name]")
	.description("(gulp) install componouts [dev]dependencies")
	.action(name => {
		if(name === undefined) {
			check()
			execute(`cd ${cwd} && gulp install`)
		}
		else {
			name = dashline(name)
			name = fixname(name)
			check(name)
			execute(`cd ${cwd} && gulp install --name=${name}`)
		}
	})

commander
	.command("link [name]")
	.description("(gulp) link local [name] componout as package")
	.action(name => {
		if(name === undefined) {
			check()
			execute(`cd ${cwd} && gulp link`)
		}
		else {
			name = dashline(name)
			name = fixname(name)
			check(name)
			execute(`cd ${cwd} && gulp link --name=${name}`)
		}
	})

commander
	.command("remove <name>")
	.alias("rm")
	.description("(gulp) remove a componout from componouts directory")
	.action(name => {
		name = dashline(name)
		name = fixname(name)
		check(name)
		prompt("Are you sure to remove " + name + " componout? yes/No  ", choice => {
			if(choice.toLowerCase() === "yes") {
				execute(`cd ${cwd} && gulp remove --name=${name}`)
			}
			exit()
		})
	})

// ----------------------------------------------------

commander
	.command("pull <name> [params...]")
	.description("clone/pull a componout from https://github.com/componer or your own registry")
	.option("-u, --url", "registry url")
	.action((name, options, params) => {
		name = dashline(name)
		name = fixname(name)
		check()

		if(!has(name)) {
			var url = options.url || `https://github.com/componer/${name}.git`
			execute(`cd ${cwd} && cd componouts && git clone ${url} ${name}`, () => {
				log("Done! Componout has been added to componouts directory.", "done")
			}, () => {
				log("Fail! You can enter componout directory and run `git clone`.", "help")
			})
		}
		else {
			var sh = `cd ${cwd} && cd componouts && cd ${name} && git pull`
			if(params.length > 0) {
				sh += " " + params.join(" ")
			}
			execute(sh, () => {
				log("Done! Componout has been the latest code.", "done")
			})
		}

	})

commander
	.command("push <name> [params...]")
	.description("push a componout to remote registry")
	.action((name, params) => {
		name = dashline(name)
		name = fixname(name)
		check(name)

		prompt("Commit message: ", message => {
			var sh = `cd ${cwd} && cd componouts && cd ${name} && git add ./. && git commit -m "${message}" && git push`
			if(params.length > 0) {
				sh += " " + params.join(" ")
			}
			execute(sh, () => {
				log("Done! Componout has been push to remote registry", "done")
			}, () => {
				log("You can cd to componouts/" + name + " directory to run `git push`.", "help")
			})

			exit()
		})
	})

// -----------------------------------

commander
	.parse(argvs)
