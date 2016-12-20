#!/usr/bin/env node

/**
 * @package componer-cli
 * @author frustigor
 * @registry https://github.com/tangshuang/componer
 *
 * Notice: change of this file has no affects when you use global componer.
 */

var program = require("commander")
var fs = require("fs")
var shell = require("shelljs")
var logger = require("process.logger")
var path = require("path")
var readline = require('readline')

// ----------------------------------

var cwd = process.cwd()
var gulp = path.resolve(__dirname, "../node_modules/.bin/gulp")
var info = JSON.parse(fs.readFileSync(__dirname + "/../package.json"))

function __cwd(num) {
	var flag = false
	var current = cwd
	num = num || 5

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

function isComponer(dir) {
	return fs.existsSync(dir + "/package.json") && fs.existsSync(dir + "/gulpfile.babel.js") && fs.existsSync(dir + "/components")
}

function ValidComponer() {
	cwd = __cwd()
	if(!isComponer(cwd) || !fs.existsSync(cwd + "/gulpfile.babel.js")) {
		logger.error("You are not in a componer project directory.")
		process.exit(0)
	}
}

function HasComponent(name, exit) {
	cwd = __cwd()
	if(!fs.existsSync(cwd + "/components/" + dashlineName(name))) {
		
		if(exit) {
			logger.error("Component " + name + " is not exists.")
			process.exit(0)
		}

		return false
	}

	return true
}

function excute(cmd, done, fail) {
	
	if(cmd.indexOf(gulp) > -1) {
		var rcfile = cwd + "/bin/.componerrc"
		if(!fs.existsSync(rcfile)) {
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
		process.exit(0)
	}

}

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

function dashlineName(name) {
	name = name.substr(0, 1).toLowerCase() + name.substr(1)
	return name.replace(/([A-Z])/g, "-$1").toLowerCase()
}

// -----------------------------------

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
		excute("cd " + cwd + " && mkdir components")
		
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
		ValidComponer()

		var type = options.type || "default"
		var author = options.author

		var sh = "cd " + cwd + " && " + gulp + " add --name=" + name + " --type=" + type + " --author=" + author
		excute(sh)
	})

program
	.command("build <name>")
	.description("build a component")
	.action(function(name) {
		ValidComponer()
		HasComponent(name, true)

		var sh = "cd " + cwd + " && " + gulp + " build --name=" + name
		excute(sh)
	})

program
	.command("preview <name>")
	.description("preview a component")
	.action(function(name) {
		ValidComponer()
		HasComponent(name, true)

		var sh = "cd " + cwd + " && " + gulp + " preview --name=" + name
		excute(sh)
	})

program
	.command("test <name>")
	.description("test a component")
	.option("-b, --browser", "which browser to test with")
	.option("-d, --debug", "whether to shot browser to debug")
	.action(function(name, options) {
		ValidComponer()
		HasComponent(name, true)

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
		ValidComponer()
		HasComponent(name, true)

		var sh = "cd " + cwd + " && " + gulp + " watch --name=" + name
		excute(sh)
	})

program
	.command("remove <name>")
	.alias("rm")
	.description("remove a component from components directory")
	.action(function(name) {
		ValidComponer()
		HasComponent(name, true)

		excute("cd " + cwd + " && cd components && rm -rf " + name, function() {
			logger.success("Done! " + name + " has been deleted.")
		})
	})

program
	.command("list")
	.alias("ls")
	.description("list all components")
	.action(function() {
		ValidComponer()

		var sh = "cd " + cwd + " && " + gulp + " ls"
		excute(sh)
	})

// ---------------------------------

program
	.command("pull <name> [params...]")
	.description("clone/pull a component from https://github.com/componer")
	.action(function(name, options, params) {
		ValidComponer()

		if(!HasComponent(name)) {
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
		ValidComponer()
		HasComponent(name)

		prompt("Commit message: ", function(message) {
			var sh = "cd " + cwd + " && cd components && cd " + name + " && git add * && git commit -m \"" + message + "\" && git push"
			if(params.length > 0) {
				sh += " " + params.join(" ")
			}
			excute(sh, function() {
				logger.success("Done! Component has been push to https://github.com/componer/" + name)
				process.exit(0)
			})
		})
	})

program
	.parse(process.argv)

// -----------------------------------

if(fs.existsSync(__cwd() + "/bin/custom-cli.js")) {
	require(__cwd() + "/bin/custom-cli.js")(program)
}