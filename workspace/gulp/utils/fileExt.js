export function getFileExt(file) {
	return file.substr(file.lastIndexOf('.'))
}

export function setFileExt(file, tail) {
	return file.substr(0, file.lastIndexOf('.')) + tail
}