import {gulp, path, args, log, config} from "../loader"
import {hasComponout, dashlineName, runTask} from "../utils"

gulp.task("watch", () => {
	const arg = args.watch
	const name = dashlineName(arg.name)
	
	if(!hasComponout(name)) {
		log(`${name} not exists.`, "error")
		exit()
	}
	
	var componoutPath = path.join(config.paths.componouts, name)
	var srcPath = path.join(componoutPath, "src")

	log("Watching, when code chnge, componer will build it automaticly...", "help")
	gulp.watch([srcPath + "/**/*"], event => {
		log(`${event.path} was ${event.type}, building...`, "help")
		runTask("build", {
			name: name
		})
	})
})