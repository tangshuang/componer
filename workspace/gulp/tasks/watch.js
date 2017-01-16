import {gulp, path, fs, args, log, config} from "../loader"
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

	gulp.watch(entryfiles, event => {
		log(`${event.path} was ${event.type}, building...`, "help")
		runTask("build", {
			name: name
		})
	})
})