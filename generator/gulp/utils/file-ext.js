export function getFileExt(file) {
	return file.substr(file.lastIndexOf('.'))
}

/**
 * @param array search: an array to put possible value to find, values behind will be used. If no match, search will be ignored.
 */
export function setFileExt(file, ext, search) {
	let last = file.lastIndexOf('.')
	if(search && search instanceof Array) {
		search.forEach(reg => last = file.lastIndexOf(reg))
	}
	return file.substr(0, last) + ext
}
