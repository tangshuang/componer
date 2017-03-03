/**
 * convert name string to be separated by custom sign, e.g. myName => my-name, your-name => your name, HostName => host_name
 * @param string name: the name to be converted, which has separated characteristics
 * @param string sep: separate sign, e.g. -_~...
 * @param boolean capital: whether to upper case first letter, true e.g. test-name => TestName, you name => Your Name
 */
export function separateName(name, sep, capital = false) {
	// 1. separate sign
	let reg = new RegExp('( |　|\s|\-|\/|;|\||_|!|?|~)', 'g')
	let tmpSep = '$<o>$'
	name = name.replace(reg, tmpSep)
	// 2. capital letter
	name = name.replace(/([A-Z])/g, tmpSep + '$1')

	// now, name is separated by tmpSep

	// 3. to lower case
	name = name.toLowerCase()
	// 4. capital
	if(capital) {
		name = name.replace((new RegExp(tmpSep + '([a-z])', 'g')), (all, letter) => letter.toUpperCase())
		name = name.substr(0, 1).toUpperCase() + name.substr(1)
	}
	// 5. use sep
	name = name.replace((new RegExp(tmpSep, 'g')), sep)

	return name
}

/**
 * convert name string to be camelName, e.g. test-name => testName, you name => yourName
 * @param string name: the name to be converted
 * @param boolean capital: whether to upper case first letter, true e.g. test-name => TestName, you name => YourName
 */
export function camelName(name, capital = false) {
	return separateName(name, '', capital)
}

/**
 * convert name string to be separated by a dash line, e.g. TestName => test-name, your name => your-name
 * @param string name: the name to be converted
 * @param boolean capital: whether to upper case first letter of each word, true e.g. TestName => Test-Name, your name => Your-Name
 */
export function dashName(name, capital = false) {
	return separateName(name, '-', capital)
}

/**
 * convert name string to be separated by a space, e.g. TestName => test name, your-name => your name
 * @param string name: the name to be converted
 * @param boolean capital: whether to upper case first letter of each word, true e.g. TestName => Test Name, your-name => Your Name
 */
export function spaceName(name, capital = false) {
	return separateName(name, ' ', capital)
}
