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
	if(!isComponer(cwd)) {
		logger.error("You are not in a componer project directory.")
		process.exit(0)
	}
	if(!fs.existsSync(cwd + "/node_modules/.bin/gulp")) {
		logger.error("You have not install completely, run `npm install` to finish it.")
		process.exit(0)
	}
}

function HasComponent(name) {
	cwd = __cwd()
	if(!fs.existsSync(cwd + "/components/" + dashlineName(name))) {
		logger.error(`Component ${name} is not exists.`)
		process.exit(0)
	}
}

function excute(cmd, done, fail) {
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

var info = JSON.parse(fs.readFileSync(__dirname + "/../package.json"))

// -----------------------------------

program
	.version(info.version)
	.usage("<task> [name] [options]")
	.option("-v, --version", "output the version number")

program
	.arguments('<cmd>')
	.action(function (cmd) {
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
		excute("cp -r " + __dirname + "/../. " + cwd + "/")
		excute("cd " + cwd + " && mkdir components")
		
		if(!options.install) {
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
		excute("cd " + cwd + " && npm run -s gulp -- add --name=" + name + " --type=" + type + " --author=" + author + " --color")
	})

program
	.command("build <name>")
	.description("build a component")
	.action(function(name) {
		ValidComponer()
		HasComponent(name)

		excute("cd " + cwd + " && npm run -s gulp -- build --name=" + name + " --color")
	})

program
	.command("preview <name>")
	.description("preview a component")
	.action(function(name) {
		ValidComponer()
		HasComponent(name)

		excute("cd " + cwd + " && npm run -s gulp -- preview --name=" + name + " --color")
	})

program
	.command("test <name>")
	.description("test a component")
	.option("-b, --browser", "which browser to test with")
	.option("-d, --debug", "whether to shot browser to debug")
	.action(function(name, options) {
		ValidComponer()
		HasComponent(name)

		var browser = options.browser || "phantomjs"
		var sh = "cd " + cwd + " && npm run -s gulp -- test --name=" + name + " --browser=" + browser + (options.debug ? " --debug" : "") + " --color"
		excute()
	})

program
	.command("watch <name>")
	.description("watch a component to build it automaticly when it change")
	.action(function(name) {
		ValidComponer()
		HasComponent(name)

		excute("cd " + cwd + " && npm run -s gulp -- watch --name=" + name + " --color")
	})

program
	.command("remove <name>")
	.alias("rm")
	.description("remove a component from components directory")
	.action(function(name) {
		ValidComponer()
		HasComponent(name)

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

		excute("cd " + cwd + " && npm run -s gulp -- ls --color")
	})

// ---------------------------------

program
	.command("clone <name>")
	.description("clone a component from https://github.com/componer")
	.option("-u, --url", "git remote registry url, only `https://` supported")
	.action(function(name, options) {
		ValidComponer()

		var url = options.url || "https://github.com/componer/" + name + ".git"
		excute("cd " + cwd + " && cd components && git clone " + url + " " + name, function() {
			logger.success("Done! Component has been add to components directory.")
		})
	})

program
	.command("pull <name> [params...]")
	.description("pull a component from https://github.com/componer")
	.action(function(name, options) {
		ValidComponer()
		HasComponent(name)

		var sh = "cd " + cwd + " && cd components && cd " + name + " && git pull"
		if(params.length > 0) {
			sh += " " + params.join(" ")
		}
		excute(sh, function() {
			logger.success("Done! Component has been pulled to components directory.")
		})
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

// -----------------------------------

if(fs.existsSync(__cwd() + "/bin/custom-cli.js")) {
	require(__cwd() + "/bin/custom-cli.js")(program)
}

// -----------------------------------

program
	.parse(process.argv)