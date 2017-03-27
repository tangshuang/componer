import {PackagesPicker, installPackages} from '../libs/package'
import {check, fixname} from '../libs/componer'
import {scandir, exists, readJSON} from '../libs/file'
import {dash} from '../libs/convert'
import {log} from '../libs/process'

export default function(commander) {
    commander
	.command("prepare [name]")
	.description("install [dev]dependencies of componout(s)")
	.option('-F, --force', 'force to install packages if exists in local')
	.action((name, options) => {
		let picker = PackagesPicker()

		/**
		 * `comoner install`
		 * install all dependencies of all componouts
		 */
		if(name === undefined) {
			check()

			// find out packages from json files
			scandir(componoutsPath).forEach(name => {
				let npmJson = `${cwd}/componouts/${name}/package.json`
				let bowerJson = `${cwd}/componouts/${name}/bower.json`
				if(exists(bowerJson)) {
					let info = readJSON(bowerJson)
					let deps = info.dependencies
					let devdeps = info.devDependencies
					picker.add(deps, bower).add(devdeps, bower)
				}
				if(exists(npmJson)) {
					let info = readJSON(npmJson)
					let deps = info.dependencies
					let devdeps = info.devDependencies
					picker.add(deps, 'npm').add(devdeps, 'npm')
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
				if(exists(bowerJson)) {
					let info = readJSON(bowerJson)
					let deps = info.dependencies
					let devdeps = info.devDependencies
					picker.add(deps, bower).add(devdeps, bower)
				}
				if(exists(npmJson)) {
					let info = readJSON(npmJson)
					let deps = info.dependencies
					let devdeps = info.devDependencies
					picker.add(deps, 'npm').add(devdeps, 'npm')
				}
			}
		}

		// install npm packages
		installPackages(picker.use())

		log('Package has been installed.', 'done')
		return
	})
}
