import {gulp, fs, path, args, log, config, exit, exists} from "../loader"
import {paserTemplate, dashlineName} from "../utils"

gulp.task("add", () => {
	const arg = args.add
	const name = dashlineName(arg.name)

	if(!name.substr(0,1).match(/[a-z]/)) {
		log("Error: component name's first letter must be in [a-z].", "error")
		exit()
	}

	var type = arg.type || "default"
	var author = arg.author
	var componoutPath = path.join(config.paths.componouts, name)
	var templatesPath = path.join(config.paths.templates, type)

	if(exists(componoutPath)) {
		log(`Error: ${name} exists, delete "componouts/${name}" before you add.`, "error")
		exit()
	}
	else {
		fs.mkdir(componoutPath)
	}

	return gulp.src([templatesPath + "/**/*", templatesPath + "/.*"])
		.pipe(paserTemplate({
			componentName: name,
			author: author,
		}))
		.pipe(gulp.dest(componoutPath))
		.on("end", () => {
			exists(componoutPath + "/src/index.js") && fs.renameSync(componoutPath + "/src/index.js", componoutPath + "/src/" + name + ".js")
			exists(componoutPath + "/test/index.js") &&fs.renameSync(componoutPath + "/test/index.js", componoutPath + "/test/" + name + ".js")
			exists(componoutPath + "/src/script/index.js") &&fs.renameSync(componoutPath + "/src/script/index.js", componoutPath + "/src/script/" + name + ".js")
			exists(componoutPath + "/src/style/index.scss") &&fs.renameSync(componoutPath + "/src/style/index.scss", componoutPath + "/src/style/" + name + ".scss")
			exists(componoutPath + "/src/template/index.hbs") &&fs.renameSync(componoutPath + "/src/template/index.hbs", componoutPath + "/src/template/" + name + ".hbs")
			exists(componoutPath + "/test/specs/index.js") &&fs.renameSync(componoutPath + "/test/specs/index.js", componoutPath + "/test/specs/" + name + ".js")

			log(`${name} has been completely created.`, "done")
		})
})