import {exists, readJSON, scandir} from './file'
import {root} from './componer'
import {execute} from './process'

export function getLocalPackages(cwd = root()) {
    var packages = []

    if(exists(cwd + '/bower_components')) scandir(cwd + '/bower_components').forEach(item => {
        if(item.substr(0, 1) === '.') return
        let info = readJSON(cwd + '/bower_components/' + item + '/bower.json')
        packages.push({
            name: item,
            version: info.version,
            type: 'bower',
        })
    })
    scandir(cwd + '/node_modules').forEach(item => {
        let firstLetter = item.substr(0, 1)
        if(firstLetter === '.' || firstLetter === '@') return
        let info = readJSON(cwd + '/node_modules/' + item + '/package.json')
        packages.push({
            name: item,
            version: info.version,
            type: 'npm',
        })
    })
    return packages
}

export function getLocalPackagesByType(type, cwd = root()) {
    var pkgs = getLocalPackages(cwd)
    pkgs = pkgs.filter(pkg => pkg.type === type)
    var results = {}
    if(pkgs.length > 0) pkgs.forEach(pkg => results[pkg.name] = pkg)
    return results
}

// get version from version string such as `~1.3.0`, `^2.0.1`, >=6.2.1
function getVersion(ver) {
	var i = ver.search(/\d/)
	if(i > -1 && i < 3) return ver.substr(i)
	return ver
}

// get suitable item from a list
function getSuitable(list) {
    var result
    list.forEach(item => {
        // the first one
        if(!result) {
            result = item
            return
        }
        // version
        let version = getVersion(pkg.version)
        if(result.version < version) {
            result.version = version
        }
        // bower or npm
        if(item.driver === 'npm' && result.driver === 'bower') {
            result.driver = 'bower'
        }
    })
	return result
}

// get packages not repetitive/unique
export function PackagesPicker() {
	var _ = {}
	var packages = {}

	_.add = (obj, driver) => {
		let names = Object.keys(obj)
		names.forEach(name => {
			if(!packages[name]) {
				packages[name] = []
			}
			let item = obj[name]
			packages[name].push({
				name: name,
				version: obj[name],
				driver,
			})
		})
		return _
	}
	_.get = name => {
		if(name === undefined) {
			return packages
		}
		return packages[name]
	}
	_.use = () => {
		let names = Object.keys(packages)
		let results = []
		names.forEach(name => {
			let items = _.get(name)
			let item = getSuitable(items)
			results.push(item)
		})
		return results
	}

	return _
}

/**
 @desc install all packages passed in
 @param array pkgs: {name, version, driver: npm or bower}
 @param boolean resolve: if your computer memory is too small, pass true to force installing pacakges one by one
 */
export function installPackages(pkgs, options = {}) {
    var cwd = options.cwd || root()
	var localBowerPkgs = getLocalPackagesByType('bower', cwd)
	var localNpmPkgs = getLocalPackagesByType('npm', cwd)
    var allPkgs = {
        npm: [],
        bower: [],
    }
	var add = (name, version, driver) => {
        let pkg = driver === 'bower' ? name + '#' + version : name + '@' + version
        // version is a url or path
        if(version.indexOf('/') > -1) {
            pkg = version
        }
        allPkgs[driver] && allPkgs[driver].push(pkg)
	}

	pkgs.forEach(pkg => {
		let name = pkg.name
		let version = pkg.version
		let driver = pkg.driver

		// if exists this package in local, do not install it
        let localPkgVer = driver === 'bower' ? localBowerPkgs[name] : driver === 'npm' ? localNpmPkgs[name] : null
		if(!options.force && localPkgVer) {
			// if get it by git or path
			if(version.indexOf('/') > -1) return
			// if local version is bigger then wanted
			if(localPkgVer >= version) return
		}

		add(name, version, driver)
	})

    if(allPkgs.bower.length > 0) {
        let bower = __dirname + '/../../node_modules/.bin/bower'
        if(options.resolve) {
            let bowerPkgs = allPkgs.bower
            bowerPkgs.forEach(item => execute(`cd "${cwd}" && "${bower}" install ${item}`))
        }
        else {
            let bowerPkgs = allPkgs.bower.join(' ')
            execute(`cd "${cwd}" && "${bower}" install ${bowerPkgs}`)
        }
    }

    if(allPkgs.npm.length > 0) {
        if(options.resolve) {
            let npmPkgs = allPkgs.npm
            npmPkgs.forEach(item => execute(`cd "${cwd}" && npm install ${item}`))
        }
        else {
            let npmPkgs = allPkgs.npm.join(' ')
            execute(`cd "${cwd}" && npm install ${npmPkgs}`)
        }
    }
}
