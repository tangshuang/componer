import path from "path"

export function relativeUrl(file, where, from) {
	var relative = path.relative(where, from)
	relative = relative.replace(/\\/g, "/")
	return relative + "/" + file
}