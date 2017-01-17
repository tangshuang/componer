#!/usr/bin/env node
"use strict";

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _readline = require("readline");

var _readline2 = _interopRequireDefault(_readline);

var _commander = require("commander");

var _commander2 = _interopRequireDefault(_commander);

var _shelljs = require("shelljs");

var _shelljs2 = _interopRequireDefault(_shelljs);

var _process = require("process.logger");

var _process2 = _interopRequireDefault(_process);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var argvs = process.argv;

if (argvs.length <= 2) {
	execute("componer -h");
	exit();
}

// ----------------------------------
var instance = _path2.default.resolve(__dirname, "../workspace");
var cwd = process.cwd();
var info = readJSON(__dirname + "/../package.json");

// ----------------------------------

function exit() {
	process.exit(0);
}

function exists(file) {
	return _fs2.default.existsSync(file);
}

function read(file) {
	return _fs2.default.readFileSync(file);
}

function readJSON(file) {
	return JSON.parse(read(file));
}

function write(file, content) {
	var charset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "utf8";

	return _fs2.default.writeFileSync(file, content, charset);
}

function writeJSON(file, json) {
	var charset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "utf8";

	return write(file, JSON.stringify(json, null, 4), charset);
}

function dashline(name) {
	name = name.substr(0, 1).toLowerCase() + name.substr(1);
	return name.replace(/([A-Z])/g, "-$1").toLowerCase();
}

/**
 * @param string dir: the path of directory to check whether it is a componer work directory.
 */
function isComponer(dir) {
	return exists(dir + "/package.json") && exists(dir + "/gulpfile.babel.js") && exists(dir + "/componouts");
}

/**
 * get current componer root dir path (5 up level)
 */
function current() {
	var flag = false;
	var current = cwd;

	for (var i = 5; i--;) {
		if (isComponer(current)) {
			flag = true;
			break;
		} else {
			current = _path2.default.resolve(current, "..");
		}
	}

	return flag && current;
}

/**
 * @param string name: the name of a componout that will be check
 * @param boolean exit: whether to exit process when the result is false.
 */
function has(name) {
	if (!exists(cwd + "/componouts/" + name)) {
		return false;
	}
	return true;
}

function check(name) {
	cwd = current();

	if (!cwd) {
		log("You are not in a componer directory, or files are missing.", "error");
		exit();
	}

	if (name && !has(name)) {
		log("You don't have a componout named " + name + " now.", "error");
		exit();
	}
}

/**
 * @param string cmd: the command to run in shell
 * @param function done: callback function when run successfully
 * @param function fail: callback function when error or fail
 */
function execute(cmd, done, fail) {
	if (cmd.indexOf("gulp") > -1 && exists(cwd + "/.componerrc")) {
		var config = readJSON(cwd + "/.componerrc");
		if (config.color) {
			cmd += " --color";
		}
		if (!config.silent) {
			cmd += " --silent";
		}
	}

	var result = _shelljs2.default.exec(cmd);
	if (result.code === 0) {
		typeof done === "function" && done();
	} else {
		typeof fail === "function" && fail(result.stderr);
		exit();
	}
}

/**
 * @param string question: display before input something
 * @param function callback: what to do after input, with answer as a parameter
 */
function prompt(question, callback) {
	var rl = _readline2.default.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	rl.question(question, function (answer) {
		rl.close();
		callback(answer);
	});
}

function log(msg, level) {
	var config = exists(cwd + "/.componerrc") ? readJSON(cwd + "/.componerrc") : {};
	config.color && _process2.default[level] ? _process2.default[level](msg) : console.log(msg);
}

// ======================================================

_commander2.default.version(info.version).usage("<task> [options] [name] [param...]").option("-v, --version", "same as `-V`");

_commander2.default.arguments('<cmd>').action(function (cmd, options) {
	log("Not found `" + cmd + "` command, use `componer -h` to read more.", "warn");
});

_commander2.default.command("init").description("create a componer workflow frame instance").action(function (options) {

	function modify() {

		prompt("What is your github user `name` in url? ", function (author) {
			if (!author || author === "") {
				log("You must input your github name to create github address.", "error");
				exit();
			}

			var pkgInfo = readJSON(cwd + "/package.json");
			pkgInfo.author = author;

			var dirname = _path2.default.basename(cwd);

			prompt("What is your current project name? (" + dirname + ") ", function (project) {
				if (!project || project === "") {
					project = dirname;
				}
				project = dashline(project);

				pkgInfo.name = project;

				writeJSON(cwd + "/package.json", pkgInfo);

				log("Done! Do NOT forget to run `npm install` before you begin.", "done");

				exit();
			});
		});
	}

	if (isComponer(cwd)) {
		modify();
		return;
	}

	if (_fs2.default.readdirSync(cwd).length > 0) {
		log("Current directory is not empty, you should begin in a new directory.", "error");
		exit();
	}

	log("copying files...");
	execute("cp -r " + instance + "/. " + cwd + "/");
	execute("cd " + cwd + " && mkdir bower_components && mkdir componouts", function () {}, function () {
		log("You should create `bower_components` and `componouts` directories by yourself.", "warn");
		log("Do NOT forget to run `npm install`.", "warn");
	});
	modify();
});

_commander2.default.command("add <name>").description("(gulp) create a componout").option("-t, --template [template]", "template of componout").option("-a, --author [author]", "author of componout").option("-g, --git", "run `git init` after ready").action(function (name, options) {
	name = dashline(name);
	check();

	var template = options.template || "default";
	var author = options.author || readJSON(cwd + "/package.json").author;

	if (!exists(cwd + "/gulp/templates/" + template)) {
		log("This type of componout is not available.", "warn");
		exit();
	}
	if (!author) {
		log("Componout author needed, please use `-h` to read more.", "error");
		exit();
	}

	execute("cd " + cwd + " && gulp add --name=" + name + " --template=" + template + " --author=" + author, function () {
		// git init
		if (options.git) {
			var url = "https://github.com/" + author + "/" + name + ".git";
			execute("cd " + cwd + " && cd componouts && cd " + name + " && git init && git remote add origin " + url);
		}
	});
});

_commander2.default.command("build [name]").description("(gulp) build a componout").action(function (name) {
	if (name === undefined) {
		check();
		execute("cd " + cwd + " && gulp build");
	} else {
		name = dashline(name);
		check(name);
		execute("cd " + cwd + " && gulp build --name=" + name);
	}
});

_commander2.default.command("preview <name>").description("(gulp) preview a componout").action(function (name) {
	name = dashline(name);
	check(name);
	execute("cd " + cwd + " && gulp preview --name=" + name);
});

_commander2.default.command("test [name]").description("(gulp) test a componout").option("-D, --debug", "whether to use browser to debug code").option("-b, --browser", "which browser to use select one from [PhantomJS|Chrome|Firefox]").action(function (name, options) {
	var cmd = "cd " + cwd + " && gulp test";

	if (options.browser) {
		cmd += " --browser=" + browser;
	}
	if (options.debug) {
		cmd += " --debug";
	}

	if (name === undefined) {
		check();
		if (options.debug) {
			log("`debug` option is not allowed when testing all componouts", "error");
			exit();
		}
	} else {
		name = dashline(name);
		check(name);
		cmd += " --name=" + name;
	}

	execute(cmd);
});

_commander2.default.command("watch [name]").description("(gulp) watch a componout to build it automaticly when code change").action(function (name) {
	if (name === undefined) {
		check();
		execute("cd " + cwd + " && gulp watch");
	} else {
		name = dashline(name);
		check(name);
		execute("cd " + cwd + " && gulp watch --name=" + name);
	}
});

_commander2.default.command("list").alias("ls").description("(gulp) list all componouts").action(function () {
	check();
	execute("cd " + cwd + " && gulp list");
});

_commander2.default.command("install [name]").description("(gulp) install componouts [dev]dependencies").action(function (name) {
	if (name === undefined) {
		check();
		execute("cd " + cwd + " && gulp install");
	} else {
		name = dashline(name);
		check(name);
		execute("cd " + cwd + " && gulp install --name=" + name);
	}
});

_commander2.default.command("link [name]").description("(gulp) link local [name] componout as package").action(function (name) {
	if (name === undefined) {
		check();
		execute("cd " + cwd + " && gulp link");
	} else {
		name = dashline(name);
		check(name);
		execute("cd " + cwd + " && gulp link --name=" + name);
	}
});

_commander2.default.command("remove <name>").alias("rm").description("(gulp) remove a componout from componouts directory").action(function (name) {
	name = dashline(name);
	check(name);
	execute("cd " + cwd + " && gulp remove " + name);
});

// ----------------------------------------------------

_commander2.default.command("pull <name> [params...]").description("clone/pull a componout from https://github.com/componer").option("-u, --url", "resgtry url").action(function (name, options, params) {
	name = dashline(name);
	check();

	if (!has(name)) {
		var url = options.url || "https://github.com/componer/" + name + ".git";
		execute("cd " + cwd + " && cd componouts && git clone " + url + " " + name, function () {
			log("Done! Componout has been added to componouts directory.", "done");
		}, function () {
			log("You can enter componout directory and run `git clone`.", "help");
		});
	} else {
		var sh = "cd " + cwd + " && cd componouts && cd " + name + " && git pull";
		if (params.length > 0) {
			sh += " " + params.join(" ");
		}
		execute(sh, function () {
			log("Done! Componout has been the latest code.", "done");
		});
	}
});

_commander2.default.command("push <name> [params...]").description("push a componout to https://github.com/componer").action(function (name, params) {
	name = dashline(name);
	check(name);

	prompt("Commit message: ", function (message) {
		var sh = "cd " + cwd + " && cd componouts && cd " + name + " && git add ./. && git commit -m \"" + message + "\" && git push";
		if (params.length > 0) {
			sh += " " + params.join(" ");
		}
		execute(sh, function () {
			log("Done! Componout has been push to https://github.com/componer/" + name, "done");
		}, function () {
			log("You can cd to componouts/" + name + " directory to run `git push`.", "help");
		});

		exit();
	});
});

// -----------------------------------

_commander2.default.parse(argvs);
