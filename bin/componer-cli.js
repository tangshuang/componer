#!/usr/bin/env node

var fs = require("fs")
var path = require("path")
var program = require("commander")
var shell = require("shelljs")
var logger = require("process.logger")
var readline = require('readline')

var config = require("../config")
var workDir = config.dirs.work

// ----------------------------------

var gulp = path.resolve(__dirname, "../node_modules/.bin/gulp")
var bower = path.resolve(__dirname, "../node_modules/.bin/bower")
var cwd = process.cwd()
var info = JSON.parse(fs.readFileSync(__dirname + "/../package.json"))

// ----------------------------------

function _exit() {
	process.exit(0)
}

function _exists(file) {
	return fs.existsSync(file)
}

function _name(name) {
	name = name.substr(0, 1).toLowerCase() + name.substr(1)
	return name.replace(/([A-Z])/g, "-$1").toLowerCase()
}

/**
 * @param string dir: the path of directory to check whether it is a componer work directory.
 */
function _is(dir) {
	return _exists(dir + "/package.json") && _exists(dir + "/gulpfile.babel.js") && _exists(dir + "/" + workDir)
}

/**
 * @param number num: the num of directory level to check
 */
function _cwd(num) {
	var flag = false
	var current = cwd
	num = num || 5

	for(var i = num;i --;) {
		if(_is(current)) {
			flag = true
			break
		}
		else {
			current = path.resolve(current, "..")
		}
	}
	
	return flag ? current : cwd
}

function _in() {
	cwd = _cwd()
	if(!_is(cwd) || !_exists(cwd + "/gulpfile.babel.js")) {
		logger.error("You are not in a componer project directory.")
		_exit()
	}
}

/**
 * @param string name: the name of a component that will be check
 * @param boolean exit: whether to exit process when the result is false.
 */
function _has(name) {
	cwd = _cwd()
	if(!_exists(cwd + "/" + workDir + "/" + name)) {
		return false
	}

	return true
}

function getType(name) {
	if(exists(cwd + "/" + workDir + "/" + name + "/package.json")) {
		return "package"
	}
	else if(exists(cwd + "/" + workDir + "/" + name + "/bower.json")) {
		return "bower"
	}
	else if(exists(cwd + "/" + workDir + "/" + name + "/componer.json")) {
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
		if(!_exists(rcfile)) {
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
		_exit()
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
		rl.close()
		callback(answer)
	})
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
			process.exit(1)
		}

		logger.log("Begin to copy files...")
		console.log("cp -r " + path.resolve(__dirname, "..") + "/. " + cwd + "/")

		excute("cp -r " + path.resolve(__dirname, "..") + "/. " + cwd + "/")
		excute("cd " + cwd + " && cd bin && rm componer-cli.js")
		excute("cd " + cwd + " && mkdir bower_components && mkdir components")
		
		if(!options.install) {
			logger.success("Now you may need to run `npm install` to install neccessary modules.")
			return true
		}

		logger.log("Begin to run `npm install`")
		excute("cd " + cwd + " && npm install", function() {
			logger.success("Componer has copy to your current directory. Enjoy it!")
		}, function(error) {
			logger.error(error + "\nInit break! Run npm install again.")
		})
	})

program
	.command("add <name>")
	.description("create a component")
	.option("-t, --type [type]", "type of component")
	.option("-a, --author [author]", "author of component")
	.action(function(name, options) {
		inComponer()
		name = __name(name)

		var type = options.type || "default"
		var author = options.author

		excute("cd " + cwd + " && " + gulp + " add --name=" + name + " --type=" + type + " --author=" + author)
	})

program
	.command("build <name>")
	.description("build a component")
	.action(function(name) {
		inComponer()
		name = __name(name)
		hasComponent(name, true)

		excute("cd " + cwd + " && " + gulp + " build --name=" + name)
	})

program
	.command("preview <name>")
	.description("preview a component")
	.action(function(name) {
		inComponer()
		name = __name(name)
		hasComponent(name, true)

		excute("cd " + cwd + " && " + gulp + " preview --name=" + name)
	})

program
	.command("test <name>")
	.description("test a component")
	.option("-b, --browser", "which browser to test with")
	.option("-d, --debug", "whether to shot browser to debug")
	.action(function(name, options) {
		inComponer()
		name = __name(name)
		hasComponent(name, true)

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
	.description("watch a component to build it automaticly when it change")
	.action(function(name) {
		inComponer()
		name = __name(name)
		hasComponent(name, true)


		
		if(stop) {
			logger.error(name + " is not exists in " + workDir + " directory.")
			exit()
		}

		excute("cd " + cwd + " && " + gulp + " watch --name=" + name)
	})

program
	.command("remove <name>")
	.alias("rm")
	.description("remove a component from components directory")
	.action(function(name) {
		inComponer()
		name = __name(name)
		hasComponent(name, true)

		excute("cd " + cwd + " && " + bower + " unlink " + name)
		excute("cd " + cwd + " && cd components && rm -rf " + name, function() {
			logger.success("Done! " + name + " has been deleted.")
		})
	})

program
	.command("list")
	.alias("ls")
	.description("list all components")
	.action(function() {
		inComponer()

		excute("cd " + cwd + " && " + gulp + " ls")
	})

// ---------------------------------

program
	.command("pull <name> [params...]")
	.description("clone/pull a component from https://github.com/componer")
	.action(function(name, options, params) {
		inComponer()
		name = __name(name)

		if(!hasComponent(name)) {
			excute("cd " + cwd + " && cd components && git clone https://github.com/componer/" + name + ".git", function() {
				logger.success("Done! Component has been added to components directory.")
			})

			return
		}
		else {
			var sh = "cd " + cwd + " && cd components && cd " + name + " && git pull"
			if(params.length > 0) {
				sh += " " + params.join(" ")
			}
			excute(sh, function() {
				logger.success("Done! Component has been the latest code.")
			})
		}

	})

program
	.command("push <name> [params...]")
	.description("push a component to https://github.com/componer")
	.action(function(name, params) {
		inComponer()
		name = __name(name)
		hasComponent(name, true)

		prompt("Commit message: ", function(message) {
			var sh = "cd " + cwd + " && cd components && cd " + name + " && git add * && git commit -m \"" + message + "\" && git push"
			if(params.length > 0) {
				sh += " " + params.join(" ")
			}
			excute(sh, function() {
				logger.success("Done! Component has been push to https://github.com/componer/" + name)
				exit()
			})
		})
	})

// -----------------------------------

program
	.command("install [name]")
	.description("install bower/package dependencies of [name] component")
	.action(function(name) {
		inComponer()
		name = __name(name)

		var componentsPath = cwd + "/components"

		function Install(name) {
			if(exists(componentsPath + "/" + name + "/package.json")) {
				excute("cd " + cwd + " && cd components && cd " + name + " && npm install --prefix " + cwd)
			}
			if(exists(componentsPath + "/" + name + "/bower.json")) {
				excute("cd " + cwd + " && cd components && cd " + name + " && " + bower + " install --config.cwd=" + cwd)
			}
		}

		if(name === undefined) {
			fs.readdirSync(componentsPath).forEach(function(component) {
				Install(component)
			})
		}
		else{
			Install(name)
		}

	})

program
	.command("link [name]")
	.description("link local [name] component into bower_components directory")
	.action(function(name) {
		inComponer()
		name = __name(name)



		var bower = path.resolve(__dirname, "../node_modules/.bin/bower")
		var componentsPath = cwd + "/components"

		function bowerLink(name) {
			if(!exists(componentsPath + "/" + name + "/bower.json")) {
				logger.error(name + " is not a component with bower.json")
			}
			else {
				excute("cd " + cwd + " && cd components && cd " + name + " && " + bower + " link")
				excute("cd " + cwd + " && " + bower + " link " + name)
			}
		}

		if(name === undefined) {
			fs.readdirSync(componentsPath).forEach(function(component) {
				bowerLink(component)
			})
		}
		else{
			bowerLink(name)
		}

	})

// -----------------------------------

if(exists(__cwd() + "/bin/custom-cli.js")) {
	require(__cwd() + "/bin/custom-cli.js")(program)
}

// -----------------------------------

program
	.parse(process.argv)