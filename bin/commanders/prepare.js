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
    .option('-R, --resolve', 'install packages one by one if your computer has no enough memory.')
	.action((name, options) => {
		let picker = PackagesPicker()
        let cwd = root()
        let pickPackages = name => {
            let npmJson = `${cwd}/componouts/${name}/package.json`
            let bowerJson = `${cwd}/componouts/${name}/bower.json`
            if(exists(npmJson)) {
                let info = readJSON(npmJson)
                let deps = info.dependencies
                let devdeps = info.devDependencies
                let peerdeps = info.peerDependencies
                picker.add(deps, 'npm').add(devdeps, 'npm').add(peerdeps, 'npm')
            }
            if(exists(bowerJson)) {
                // bower come first, so here bower should come behind to cover npm
                let info = readJSON(bowerJson)
                let deps = info.dependencies
                let devdeps = info.devDependencies
                picker.add(deps, 'bower').add(devdeps, 'bower')
            }
        }

		/**
		 * `comoner prepare`
		 * install all dependencies of all componouts
		 */
		if(name === undefined) {
			check()

			// find out packages from json files
			scandir(cwd + '/componouts').forEach(pickPackages)
		}
		/**
		* install all packages of a componout
		* or install only one package for one componout by using -p option
		*/
		else {
			name = dash(name)
			name = fixname(name)
			check(name)
			pickPackages(name)
		}

		// install npm packages
		installPackages(picker.use(), options)

		log('All (dev)dependencies have been installed.', 'done')
	})
}
