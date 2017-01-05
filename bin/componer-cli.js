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

var gulp = path.resolve(__dirname, "../node_modules/.bin/gulp")
var bower = path.resolve(__dirname, "../node_modules/.bin/bower")
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
	return exists(`${dir}/package.json`) && exists(`${dir}/gulpfile.babel.js`) && exists(`${dir}/componouts`)
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
	if(cmd.indexOf(gulp) > -1 && exists(`${cwd}/.componerrc`)) {
		var config = readJSON(`${cwd}/.componerrc`)
		if(config.color) {
			cmd += " --color"
		}
		if(!config.debug) {
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
	var config = exists(`${cwd}/.componerrc`) ? readJSON(`${cwd}/.componerrc`) : {}
	config.color && logger[level] ? logger[level](msg) : console.log(msg)
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
	.action(options => {

		function modify() {
			
			prompt("What is your github user `name` in url? ", author => {
				if(!author || author === "") {
					log("You must input your github name to create github address.", "error")
					exit()
				}

				var pkgInfo = readJSON(cwd + "/package.json")
				pkgInfo.author = author
				dirname = path.basename(cwd)

				prompt("What is your current project name? (" + dirname + ") ", project => {
					if(!project || project === "") {
						project = dirname
					}
					project = dashline(project)

					pkgInfo.name = project

					writeJSON(cwd + "/package.json", pkgInfo)

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
		execute("cp -r " + path.resolve(__dirname, "../workspace") + "/. " + cwd + "/")
		execute(`cd ${cwd} && mkdir bower_components && mkdir componouts`, () => {}, () => {
			log("You should create `bower_components` and `componouts` directories by yourself.", "warn")
		})
		log("Done! Do NOT forget to run `npm install`.", "done")

		modify()

	})

commander
	.command("add <name>")
	.description("(gulp) create a componout")
	.option("-t, --template [template]", "template of componout")
	.option("-a, --author [author]", "author of componout")
	.option("-g, --git", "run `git init` after ready")
	.action((name, options) => {
		name = dashline(name)
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

		execute(`cd ${cwd} && ${gulp} add --name=${name} --template=${template} --author=${author}`, () => {
			// git init
			if(options.git) {
				var url = `https://github.com/${author}/${name}.git`
				execute(`cd ${cwd} && cd componouts && cd ${name} && git init && git remote add origin ${url}`)
			}
		})
	})

commander
	.command("build <name>")
	.description("(gulp) build a componout")
	.action(name => {
		name = dashline(name)
		check(name)
		execute(`cd ${cwd} && ${gulp} build --name=${name}`)
	})

commander
	.command("preview <name>")
	.description("(gulp) preview a componout")
	.action(name => {
		name = dashline(name)
		check(name)
		execute(`cd ${cwd} && ${gulp} preview --name=${name}`)
	})

commander
	.command("test <name>")
	.description("(gulp) test a componout")
	.action((name, options) => {
		name = dashline(name)
		check(name)
		execute(`cd ${cwd} && ${gulp} test --name=${name}`)
	})

commander
	.command("watch <name>")
	.description("(gulp) watch a componout to build it automaticly when code change")
	.action(name => {
		name = dashline(name)
		check(name)
		execute(`cd ${cwd} && ${gulp} watch --name=${gulp}`)
	})

commander
	.command("list")
	.alias("ls")
	.description("(gulp) list all componouts")
	.action(() => {
		check()
		execute(`cd ${cwd} && ${gulp} ls`)
	})

// ---------------------------------

commander
	.command("pull <name> [params...]")
	.description("clone/pull a componout from https://github.com/componer")
	.option("-u, --url", "resgtry url")
	.action((name, options, params) => {
		name = dashline(name)
		check()

		if(!has(name)) {
			var url = options.url || `https://github.com/componer/${name}.git`
			execute(`cd ${cwd} && cd componouts && git clone ${url} ${name}`, () => {
				log("Done! Componout has been added to componouts directory.", "done")
			}, () => {
				log("You can enter componout directory and run `git clone`.", "help")
			})
		}
		else {
			var sh = `cd ${cwd} && cd componouts && cd ${name} && git pull"`
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
	.description("push a componout to https://github.com/componer")
	.action((name, params) => {
		name = dashline(name)
		check(name)

		prompt("Commit message: ", message => {
			var sh = `cd ${cwd} && cd componouts && cd ${name} && git add ./. && git commit -m "${message}" && git push`
			if(params.length > 0) {
				sh += " " + params.join(" ")
			}
			execute(sh, () => {
				log("Done! Componout has been push to https://github.com/componer/" + name, "done")
			}, () => {
				log("You can cd to componouts/" + name + " directory to run `git push`.", "help")
			})

			exit()
		})
	})

// -----------------------------------

commander
	.command("install [name]")
	.description("install componouts [dev]dependencies")
	.action(name => {

		function Install(name) {
			if(exists(`${cwd}/componouts/${name}/package.json`)) {
				execute(`cd ${cwd} && cd componouts && cd ${name} && npm install --prefix ${cwd}`)
			}
			if(exists(`${cwd}/componouts/${name}/bower.json"`)) {
				execute(`cd ${cwd} && cd componouts && cd ${name} && ${bower} install --config.directory=${cwd}/bower_components`)
			}
		}

		if(name === undefined) {
			check()
			fs.readdirSync(cwd + "/componouts").forEach(item => Install(item))
		}
		else {
			name = dashline(name)
			check(name)
			Install(name)
		}

	})

commander
	.command("link [name]")
	.description("link local [name] componout as package")
	.action(name => {

		function Link(name) {
			if(exists(`${cwd}/componouts/${name}/package.json`)) {
				execute(`cd ${cwd} && cd componouts && cd ${name} && npm link`)
				execute(`cd ${cwd} && npm link ${name}`)
			}
			else if(exists(`${cwd}/componouts/${name}/bower.json`)) {
				execute(`cd ${cwd} && cd componouts && cd ${name} && ${bower} link`)
				execute(`cd ${cwd} && ${bower} link ${name}`)
			}
		}

		if(name === undefined) {
			check()
			fs.readdirSync(cwd + "/componouts").forEach(item => Link(item))
		}
		else {
			name = dashline(name)
			check(name)
			Link(name)
		}

	})

// -----------------------------------

commander
	.command("remove <name>")
	.alias("rm")
	.description("remove a componout from componouts directory")
	.action(name => {
		name = dashline(name)
		check(name)

		prompt("Are you sure to remove " + name + " componout? yes/No  ", choice => {
			if(choice.toLowerCase() === "yes") {
				if(exists(`${cwd}/bower_components/${name}`)) {
					execute(`cd ${cwd} && ${bower} unlink ${name}`)
				}
				if(exists(`${cwd}/node_modules/${name}`)) {
					execute(`cd ${cwd} && npm unlink ${name}`)
				}

				execute(`cd ${cwd} && cd componouts && rm -rf ${name}`, () => {
					log("Done! " + name + " has been deleted.", "done")
				})

				exit()
			}
		})
		
	})

// -----------------------------------

commander
	.parse(argvs)