#!/usr/bin/env node

var fs = require("fs")
var path = require("path")
var program = require("commander")
var shell = require("shelljs")
var logger = require("process.logger")
var readline = require("readline")

// ----------------------------------

var gulp = path.resolve(__dirname, "../node_modules/.bin/gulp")
var bower = path.resolve(__dirname, "../node_modules/.bin/bower")
var cwd = process.cwd()
var info = JSON.parse(fs.readFileSync(__dirname + "/../package.json"))

// ----------------------------------

function exit() {
	process.exit(0)
}

function exists(file) {
	return fs.existsSync(file)
}

function dashline(name) {
	name = name.substr(0, 1).toLowerCase() + name.substr(1)
	return name.replace(/([A-Z])/g, "-$1").toLowerCase()
}

/**
 * @param string dir: the path of directory to check whether it is a componer work directory.
 */
function isComponer(dir) {
	return exists(dir + "/package.json") && exists(dir + "/gulpfile.babel.js") && exists(dir + "/componouts")
}

/**
 * get current componer root dir path (5 up level)
 */
function current() {
	var flag = false
	var current = cwd
	num = 5

	for(var i = num;i --;) {
		if(isComponer(current)) {
			flag = true
			break
		}
		else {
			current = path.resolve(current, "..")
		}
	}
	
	return flag ? current : cwd
}

/**
 * @param string name: the name of a componout that will be check
 * @param boolean exit: whether to exit process when the result is false.
 */
function has(name) {
	cwd = current()
	if(!exists(cwd + "/componouts/" + name)) {
		return false
	}
	return true
}

function check(name) {
	cwd = current()

	if(!isComponer(cwd)) {
		logger.error("You are not in a componer directory.")
		exit()
	}

	if(name && !has(name)) {
		logger.error("You don't have a componout named " + name + " now.")
		exit()
	}
}

function type(name) {
	if(exists(cwd + "/componouts/" + name + "/package.json")) {
		return "package"
	}
	else if(exists(cwd + "/componouts/" + name + "/bower.json")) {
		return "bower"
	}
	else if(exists(cwd + "/componouts/" + name + "/componer.json")) {
		return "componer"
	}
	else {
		return "None"
	}
}

/**
 * @param string cmd: the command to run in shell
 * @param function done: callback function when run successfully
 * @param function fail: callback function when error or fail
 */
function excute(cmd, done, fail) {
	if(cmd.indexOf(gulp) > -1) {
		var rcfile = cwd + "/bin/.componerrc"
		if(!exists(rcfile)) {
			rcfile = __dirname + "/.componerrc"
		}

		var config = JSON.parse(fs.readFileSync(rcfile))
		if(config.color) {
			cmd += " --color"
		}
		if(config.silent) {
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
	rl.question(question, function(answer) {
		callback(answer)
	})
	rl.close()
}

// ======================================================

program
	.version(info.version)
	.usage("<task> [name] [options]")
	.option("-v, --version", "output the version number")

program
	.arguments('<cmd>')
	.action(function (cmd, options) {
		logger.warn("Not found " + cmd + " command, use `componer -h` to read more.")
	})

program
	.command("init")
	.description("create a componer workflow frame instance")
	.option("-i, --install", "run `npm install` automaticly after instance created")
	.action(function(options) {
		if(fs.readdirSync(cwd).length > 0) {
			logger.error("Current directory is not empty, you should begin in a new directory.")
			exit()
		}

		logger.log("Begin to copy files...")
		excute("cp -r " + path.resolve(__dirname, "..") + "/. " + cwd + "/")
		excute("cd " + cwd + " && cd bin && rm componer-cli.js")
		excute("cd " + cwd + " && mkdir bower_components && mkdir componouts")
		
		if(!options.install) {
			logger.success("Now you may need to run `npm install` to install neccessary modules.")
			return
		}

		logger.log("Begin to run `npm install` ...")
		excute("cd " + cwd + " && npm install", function() {
			logger.success("Componer has created in your current directory. Enjoy it!")
		}, function() {
			logger.error("Crash! Please run `npm install` by yourself.")
		})
	})

program
	.command("add <name>")
	.description("create a componout")
	.option("-t, --type [type]", "type of componout: bower, package or componer")
	.option("-a, --author [author]", "author of componout")
	.action(function(name, options) {
		name = dashline(name)
		check()

		var type = options.type
		var author = options.author

		if(!type) {
			logger.error("Componout type empty, please use `-t` to add a type, or use `-h` to read more.")
			exit()
		}
		if(!author) {
			logger.error("Componout author empty, please use `-h` to read more.")
			exit()
		}

		excute("cd " + cwd + " && " + gulp + " add --name=" + name + " --type=" + type + " --author=" + author)
	})

program
	.command("build <name>")
	.description("build a componout")
	.action(function(name) {
		name = dashline(name)
		check(name)

		excute("cd " + cwd + " && " + gulp + " build --name=" + name)
	})

program
	.command("preview <name>")
	.description("preview a componout")
	.action(function(name) {
		name = dashline(name)
		check(name)

		excute("cd " + cwd + " && " + gulp + " preview --name=" + name)
	})

program
	.command("test <name>")
	.description("test a componout")
	.option("-b, --browser", "which browser to test with: phantomjs, firefox or chrome")
	.option("-d, --debug", "whether to shot browser to debug")
	.action(function(name, options) {
		name = dashline(name)
		check(name)

		var sh = "cd " + cwd + " && " + gulp + " test --name=" + name
		if(options.browser) {
			sh += " --browser=" + options.browser
		}
		if(options.debug) {
			sh += " --debug"
		}

		excute(sh)
	})

program
	.command("watch <name>")
	.description("watch a componout to build it automaticly when code change")
	.action(function(name) {
		name = dashline(name)
		check(name)

		excute("cd " + cwd + " && " + gulp + " watch --name=" + name)
	})

program
	.command("remove <name>")
	.alias("rm")
	.description("remove a componout from componouts directory")
	.action(function(name) {
		name = dashline(name)
		check(name)

		if(exists(cwd + "/bower_components/" + name)) {
			excute("cd " + cwd + " && " + bower + " unlink " + name)
		}
		if(exists(cwd + "/node_modules/" + name)) {
			excute("cd " + cwd + " && npm unlink " + name)
		}

		excute("cd " + cwd + " && cd componouts && rm -rf " + name, function() {
			logger.success("Done! " + name + " has been deleted.")
		})
	})

program
	.command("list")
	.alias("ls")
	.description("list all componouts")
	.action(function() {
		check()

		excute("cd " + cwd + " && " + gulp + " ls")
	})

// ---------------------------------

program
	.command("pull <name> [params...]")
	.description("clone/pull a componout from https://github.com/componer")
	.action(function(name, options, params) {
		name = dashline(name)
		check()

		if(!has(name)) {
			excute("cd " + cwd + " && cd componouts && git clone https://github.com/componer/" + name + ".git", function() {
				logger.success("Done! Componout has been added to componouts directory.")
			}, function() {
				logger.help("You can enter componout directory and run `git clone`.")
			})

			return
		}
		else {
			var sh = "cd " + cwd + " && cd componouts && cd " + name + " && git pull"
			if(params.length > 0) {
				sh += " " + params.join(" ")
			}
			excute(sh, function() {
				logger.success("Done! Componout has been the latest code.")
			})
		}

	})

program
	.command("push <name> [params...]")
	.description("push a componout to https://github.com/componer")
	.action(function(name, params) {
		name = dashline(name)
		check(name)

		prompt("Commit message: ", function(message) {
			var sh = "cd " + cwd + " && cd componouts && cd " + name + " && git add ./. && git commit -m \"" + message + "\" && git push"
			if(params.length > 0) {
				sh += " " + params.join(" ")
			}
			excute(sh, function() {
				logger.success("Done! Componout has been push to https://github.com/componer/" + name)
				exit()
			}, function() {
				logger.help("You can enter componout/" + name + " directory to run `git push`.")
			})
		})
	})

// -----------------------------------

program
	.command("install [name]")
	.description("install bower/package dependencies of [name] componout")
	.action(function(name) {
		name = dashline(name)
		check()

		function Install(name) {
			if(exists(cwd + "/componouts/" + name + "/package.json")) {
				excute("cd " + cwd + " && cd componouts && cd " + name + " && npm install --prefix " + cwd)
			}
			if(exists(cwd + "/componouts/" + name + "/bower.json")) {
				excute("cd " + cwd + " && cd componouts && cd " + name + " && " + bower + " install --config.cwd=" + cwd)
			}
		}

		if(name === undefined) {
			fs.readdirSync(cwd + "/componouts").forEach(function(item) {
				Install(item)
			})
		}
		else{
			Install(name)
		}

	})

program
	.command("link [name]")
	.description("link local [name] componout into bower_components/node_modules directory")
	.action(function(name) {
		name = dashline(name)
		check()

		function Link(name) {
			if(exists(cwd + "/componouts/" + name + "/package.json")) {
				excute("cd " + cwd + " && cd componouts && cd " + name + " && npm link")
				excute("cd " + cwd + " && npm link " + name)
			}
			if(exists(cwd + "/componouts/" + name + "/bower.json")) {
				excute("cd " + cwd + " && cd componouts && cd " + name + " && " + bower + " link")
				excute("cd " + cwd + " && " + bower + " link " + name)
			}
		}

		if(name === undefined) {
			fs.readdirSync(cwd + "/componouts").forEach(function(item) {
				Link(item)
			})
		}
		else{
			Link(name)
		}

	})

// -----------------------------------

if(exists(current() + "/bin/custom-cli.js")) {
	require(current() + "/bin/custom-cli.js")(program)
}

// -----------------------------------

program
	.parse(process.argv)