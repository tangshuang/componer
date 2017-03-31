import {PackagesPicker, installPackages} from '../utils/package'
import {check, fixname, root} from '../utils/componer'
import {scandir, exists, readJSON} from '../utils/file'
import {dash} from '../utils/convert'
import {log} from '../utils/process'

export default function(commander) {
    commander
	.command("prepare [name]")
	.description("install [dev]dependencies of componout(s)")
	.option('-F, --force', 'force to install packages if exists in local')
	.action((name, options) => {
		let picker = PackagesPicker()
        let cwd = root()

		/**
		 * `comoner install`
		 * install all dependencies of all componouts
		 */
		if(name === undefined) {
			check()

			// find out packages from json files
			scandir(cwd + '/componouts').forEach(name => {
				let npmJson = `${cwd}/componouts/${name}/package.json`
				let bowerJson = `${cwd}/componouts/${name}/bower.json`
				if(exists(npmJson)) {
					let info = readJSON(npmJson)
					let deps = info.dependencies
					let devdeps = info.devDependencies
					picker.add(deps, 'npm').add(devdeps, 'npm')
				}
                if(exists(bowerJson)) {
                    // bower come first, so here bower should come behind to cover npm
                    let info = readJSON(bowerJson)
                    let deps = info.dependencies
                    let devdeps = info.devDependencies
                    picker.add(deps, 'bower').add(devdeps, 'bower')
                }
			})
		}
		/**
		* install all packages of a componout
		* or install only one package for one componout by using -p option
		*/
		else {
			name = dash(name)
			name = fixname(name)
			check(name)

			let pkg = options.package
			let npmJson = `${cwd}/componouts/${name}/package.json`
			let bowerJson = `${cwd}/componouts/${name}/bower.json`

			/**
			* `componer install {{name}}`
			* install all packages of a componout
			*/
			if(!pkg) {
                if(exists(npmJson)) {
                    let info = readJSON(npmJson)
                    let deps = info.dependencies
                    let devdeps = info.devDependencies
                    picker.add(deps, 'npm').add(devdeps, 'npm')
                }
				if(exists(bowerJson)) {
                    // bower come first, so here bower should come behind to cover npm
					let info = readJSON(bowerJson)
					let deps = info.dependencies
					let devdeps = info.devDependencies
					picker.add(deps, 'bower').add(devdeps, 'bower')
				}
			}
		}

		// install npm packages
		installPackages(picker.use())

		log('All (dev)dependencies have been installed.', 'done')
	})
}
