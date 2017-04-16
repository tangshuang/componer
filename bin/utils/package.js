import path from 'path'
import {root} from './componer'
import {execute} from './process'
import {exists, readJSON, scandir} from '../../generator/gulp/utils/file'

const bower = path.resolve(__dirname, '../../node_modules/.bin/bower')

// get version from version string such as `~1.3.0`, `^2.0.1`, >=6.2.1 to be `1.3.0` `2.0.1` `6.2.1`
export function getVersion(ver) {
	var i = ver.search(/\d/)
	if(i > -1 && i < 3) return ver.substr(i)
	return ver
}

// get packages not repetitive/unique, use .use() to get want packages to install, ooptimized
export function PackagesPicker() {
	var _ = {}
	var packages = {}
    var getSuitable = list => {
        var result
        list.forEach(item => {
            // the first one
            if(!result) {
                result = item
                result.version = getVersion(result.version)
                return
            }
            // version
            let version = getVersion(pkg.version)
            if(result.version < version) {
                result.version = version
            }
            // bower or npm
            if(item.driver === 'bower' && result.driver === 'npm') {
                result.driver = 'npm'
            }
        })
    	return result
    }

	_.add = (obj, driver) => {
        if(!obj) return _
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
		let results = {
            npm: [],
            bower: [],
        }
		names.forEach(name => {
			let items = _.get(name)
			let item = getSuitable(items)
			results[item.driver].push(item)
		})
		return results
	}

	return _
}

// get local pacakges results: {npm:[],bower:[]}
export function getLocalPackages(cwd = root()) {
    var packages = {
        npm: [],
        bower: [],
    }
    if(exists(cwd + '/node_modules')) scandir(cwd + '/node_modules').forEach(item => {
        let firstLetter = item.substr(0, 1)
        if(firstLetter === '.' || firstLetter === '@') return
        let info = readJSON(cwd + '/node_modules/' + item + '/package.json')
        packages.npm.push({
            name: item,
            version: getVersion(info.version),
        })
    })
    if(exists(cwd + '/bower_components')) scandir(cwd + '/bower_components').forEach(item => {
        if(item.substr(0, 1) === '.') return
        let info = readJSON(cwd + '/bower_components/' + item + '/bower.json')
        packages.bower.push({
            name: item,
            version: getVersion(info.version),
        })
    })
    return packages
}

// get local pacakges results: {npm:{name:{}},bower:{name:{}}}
export function getLocalPackagesObject(cwd = root()) {
    var packages = getLocalPackages(cwd)
    var results = {
        npm: {},
        bower: {},
    }
    packages.npm.forEach(pkg => results.npm[pkg.name] = pkg)
    packages.bower.forEach(pkg => results.bower[pkg.name] = pkg)
    return results
}

// install packages, should use PackagesPicker.use() results
export function PackagesInstaller(options = {}) {
    var _ = {}
    var cwd = options.cwd || root()
    var localPkgs = getLocalPackagesObject()
    var install = (driver, pkgs) => {
        pkgs = pkgs.filter(pkg => {
    		// if exists this package in local, do not install it
            let name = pkg.name
            let version = pkg.version
            let localPkg = localPkgs[driver][name]
    		if(!options.force && localPkg) {
    			// if get it by git or path
    			if(version.indexOf('/') > -1) return false
    			// if local version is bigger then wanted
    			if(localPkg.version >= getVersion(version)) return false
    		}
            return true
    	})
        if(pkgs.length === 0) return

        let sep = driver === 'bower' ? '#' : '@'
        let installer = driver === 'bower' ? `"${bower}"` : 'npm'
        pkgs = pkgs.map(pkg => {
            if(pkg.version.indexOf('/') === -1) return pkg.name + sep + pkg.version
            return pkg.version // if get it by git or path
        })
        pkgs = pkgs.join(' ')
        execute(`cd "${cwd}" && ${installer} install ${pkgs}`)
    }

    _.npmInstall = pkgs => install('npm', pkgs)
    _.bowerInstall = pkgs => install('bower', pkgs)
    _.install = pkgs => {
        if(pkgs.npm.length > 0) _.npmInstall(pkgs.npm)
        if(pkgs.bower.length > 0) _.bowerInstall(pkgs.bower)
    }

    return _
}
