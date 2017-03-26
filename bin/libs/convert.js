export function convert(name, sep = '', capital = false) {
	var reg = new RegExp('([ |　|\\s|\\-|\\/|;|\\||_|!|?|~|\.])+', 'g')
	var tmpSep = '<@@>'
	name = name.replace(reg, tmpSep)
	name = name.replace(/([A-Z])/g, tmpSep + '$1')
	name = name.toLowerCase()
	if(capital) {
		name = name.replace((new RegExp(tmpSep + '([a-z])', 'g')), (all, letter) => tmpSep + letter.toUpperCase())
		name = name.substr(0, 1).toUpperCase() + name.substr(1)
	}
	name = name.replace((new RegExp(tmpSep, 'g')), sep)

	return name
}

export function camel(name, capital = false) {
	name = convert(name, '', true)
	if(!capital) {
		name = name.substr(0, 1).toLowerCase() + name.substr(1)
	}
	return name
}

export function dash(name, capital = false) {
	return convert(name, '-', capital)
}

export function separate(name, capital = false) {
	return convert(name, ' ', capital)
}
