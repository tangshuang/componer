#!/usr/bin/env node

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
		logger.error("\nYou are not in a componer project directory.\n")
		process.exit(0)
	}
	if(!fs.existsSync(cwd + "/node_modules/.bin/gulp")) {
		logger.error("\nYou have not install completely, run `npm install` to finish it.\n")
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

var info = JSON.parse(fs.readFileSync(__dirname + "/../package.json"))

// -----------------------------------

program
	.version(info.version)
	.usage("<task> [name] [options]")
	.option("-v, --version", "output the version number")

program
	.arguments('<cmd>')
	.action(function (cmd) {
		logger.warn("\nNot found " + cmd + " command, use `componer -h` to read more.\n")
	})

program
	.command("init")
	.description("create a componer workflow frame instance")
	.option("-i, --install", "run `npm install` automaticly after instance created")
	.action(function(options) {
		if(fs.readdirSync(cwd).length > 0) {
			logger.error("\nCurrent directory is not empty, you should begin in a new directory.\n")
			process.exit(1)
		}

		logger.log("Begin to copy files...")
		excute("cp -r " + __dirname + "/../. " + cwd + "/")
		excute("cd " + cwd + " && cd bin && rm componer-cli.js")
		excute("cd " + cwd + " && mkdir components")
		
		if(!options.install) {
			return true
		}

		logger.log("\nBegin to run `npm install`")
		excute("cd " + cwd + " && npm install", function() {
			logger.success("\nComponer has copy to your current directory. Enjoy it!\n")
		}, function(error) {
			logger.error("\n" + error + "\nInit break! Run npm install again.\n")
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
		excute("cd " + cwd + " && npm run -s gulp -- build --name=" + name + " --color")
	})

program
	.command("preview <name>")
	.description("preview a component")
	.action(function(name) {
		ValidComponer()
		excute("cd " + cwd + " && npm run -s gulp -- preview --name=" + name + " --color")
	})

program
	.command("test <name>")
	.description("test a component")
	.option("-b, --browser", "which browser to test with")
	.action(function(name, options) {
		ValidComponer()
		var browser = options.browser || "phantomjs"
		excute("cd " + cwd + " && npm run -s gulp -- test --name=" + name + " --browser=" + browser + " --color")
	})

program
	.command("watch <name>")
	.description("watch a component to build it automaticly when it change")
	.action(function(name) {
		ValidComponer()
		excute("cd " + cwd + " && npm run -s gulp -- watch --name=" + name + " --color")
	})

program
	.command("list")
	.alias("ls")
	.description("list all components")
	.action(function() {
		ValidComponer()
		excute("cd " + cwd + " && npm run -s gulp -- ls --color")
	})

program
	.command("remove <name>")
	.alias("rm")
	.description("remove a component from components directory")
	.action(function(name) {
		ValidComponer()
		excute("cd " + cwd + " && cd components && rm -rf " + name, function() {
			logger.success("\nDone! " + name + " has been deleted.\n")
		})
	})

// ---------------------------------

program
	.command("install <name>")
	.alias("i")
	.description("install a component from https://github.com/componer")
	.option("-u, --url", "git remote registry url, only https:// supported")
	.action(function(name, options) {
		ValidComponer()
		var url = options.url || "https://github.com/componer/" + name + ".git"
		excute("cd " + cwd + " && cd components && git clone " + url + " " + name, function() {
			logger.success("\nDone! Component has been add to components directory.\n")
		})
	})

program
	.command("push <name> [params...]")
	.description("push a component to https://github.com/componer")
	.action(function(name, params) {
		ValidComponer()
		prompt("Commit message: ", function(message) {
			var cmd = "cd " + cwd + " && cd components && cd " + name + " && git add * && git commit -m \"" + message + "\" && git push"
			if(params.length > 0) {
				cmd += " " + params.join(" ")
			}
			excute(cmd, function() {
				logger.success("\nDone! Component has been push to https://github.com/componer/" + name + "\n")
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