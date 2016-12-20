export function strPadLeft(str, sep, len) {
	str = str.toString()
	if(str.length >= len) {
		return str
	}
	else {
		return strPadLeft(sep + str, sep, len)
	}
}

export function strPadRight(str, sep, len) {
	str = str.toString()
	if(str.length >= len) {
		return str
	}
	else {
		return strPadRight(str + sep, sep, len)
	}
}