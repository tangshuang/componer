import fs from "fs"
import path from "path"
import gulp from "gulp"

var files = fs.readdirSync("./gulp/tasks")
files.forEach(file => {
    let filePath = path.join(__dirname, "gulp/tasks", file)
    require(filePath)
})

// copy some files to other directories
gulp.task("sync", () => {
	gulp.src("./gulp/templates/default/**/*")
		.pipe(gulp.dest("./gulp/templates/bower/"))
})