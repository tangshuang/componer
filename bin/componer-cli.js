#!/usr/bin/env node

var program = require("commander")
var fs = require("fs")
var shell = require("shelljs")
var logger = require("process.logger")
var cwd = process.cwd()
var local = __dirname

function isComponer() {
	if(!fs.existsSync(cwd + "/gulpfile.babel.js")) {
		logger.error("\nYou are not in a componer project directory.")
		process.exit(1)
		return false
	}
	return true
}

var info = JSON.parse(fs.readFileSync(local + "/../package.json"))

program
	.version(info.version)
	.usage("<task> [component] [options]")
	.description(info.description)
	.option("-v, --version", "output the version number")

program
	.command("init")
	.description("clone componer work frame")
	.action(function() {
		if(fs.readdirSync(cwd).length > 0) {
			logger.error("\nCurrent directory is not empty, you should begin in a new directory.")
			process.exit(1)
		}
		shell.exec("cp -r " + local + "/../. " + cwd + "/")
		shell.exec("cd " + cwd + " && mkdir components")
		var result = shell.exec("cd " + cwd + " && npm install")
		if(result.code === 0) {
			logger.success("\nComponer has copy to your current directory. Enjoy it!")
		}
		else {
			logger.error("\nInit break! Run npm install again.")
		}
	})

program
	.command("add <component>")
	.description("create a component")
	.option("-t, --type [type]", "type of component")
	.option("-a, --author [author]", "author of component")
	.action(function(component, options) {
		if(!isComponer()) {
			return
		}
		var type = options.type || "default"
		var author = options.author
		shell.exec("cd " + cwd + " && gulp add --name=" + component + " --type=" + type + " --author=" + author + " --color")
	})

program
	.command("build <component>")
	.description("build a component")
	.action(function(component) {
		if(!isComponer()) {
			return
		}
		shell.exec("cd " + cwd + " && gulp build --name=" + component + " --color")
	})

program
	.command("preview <component>")
	.description("preview a component")
	.action(function(component) {
		if(!isComponer()) {
			return
		}
		shell.exec("cd " + cwd + " && gulp preview --name=" + component + " --color")
	})

program
	.command("test <component>")
	.description("test a component")
	.action(function(component) {
		if(!isComponer()) {
			return
		}
		shell.exec("cd " + cwd + " && gulp test --name=" + component + " --color")
	})

program
	.command("watch <component>")
	.description("watch a component to build it automaticly when it change")
	.action(function(component) {
		if(!isComponer()) {
			return
		}
		shell.exec("cd " + cwd + " && gulp watch --name=" + component + " --color")
	})

program
	.command("list")
	.alias("ls")
	.description("list all components")
	.action(function(component) {
		if(!isComponer()) {
			return
		}
		shell.exec("cd " + cwd + " && gulp ls --color")
	})

program
	.parse(process.argv)