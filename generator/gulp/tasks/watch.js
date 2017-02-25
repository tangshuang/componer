import {gulp, path, fs, args, log, config, read} from "../loader"
import {hasComponout, dashlineName, runTask} from "../utils"

gulp.task("watch", () => {
	var arg = args.watch
	var entryfiles = []
	var componoutsPath = config.paths.componouts

	if(arg.name === undefined) {
		fs.readdirSync(componoutsPath).forEach(item => {
			let srcPath = path.join(componoutsPath, item, "src")
			entryfiles.push(srcPath + "/**/*")
		})
	}
	else {
		var name = dashlineName(arg.name)
		if(!hasComponout(name)) {
			log(`${name} not exists.`, "error")
			exit()
		}

		var srcPath = path.join(componoutsPath, name, "src")
		entryfiles.push(srcPath + "/**/*")
	}

	log("Watching, when code changed, componer will build it automaticly...", "help")

	let contents = {}
	gulp.watch(entryfiles, event => {
		// if file content not changed, do not run build task
		let file = event.path
		let content = read(file)
		if(contents[file] && contents[file] === content) return
		contents[file] = content

		log(`${event.path} was ${event.type}, building...`, "help")

		let relativePath = path.relative(componoutsPath, file).replace(/\\/g, "/")
		let componoutName = relativePath.split("/")[0]

		runTask("build", {
			name: componoutName
		})
	})
})
