import fs from "fs"
import path from "path"
import gulp from "gulp"

var files = fs.readdirSync("./gulp/tasks")
files.forEach(file => {
    let filePath = path.join(__dirname, "gulp/tasks", file)
    require(filePath)
})