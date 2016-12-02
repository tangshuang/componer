export function camelName(name) {
	name = name.replace(/[\-|\s](\w)/g, (all, letter) => letter.toUpperCase());
	name = name.substr(0,1).toLowerCase() + name.substr(1);
	return name;
}

export function capitalName(name) {
	name = camelName(name);
	return name.substr(0,1).toUpperCase() + name.substr(1);
}

export function dashlineName(name) {
	return name.replace(/([A-Z])/g,"-$1").toLowerCase();
}

export function separateName(name, capital = false) {
	name = camelName(name);
	if(capital) {
		name = name.replace(/([A-Z])/g," $1");
		name = name.substr(0,1).toUpperCase() + name.substr(1);
	}
	else {
		name = name.replace(/([A-Z])/g, (all, letter) => ' ' + letter.toLowerCase());
	}
	return name;
}