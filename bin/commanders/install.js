import {dash} from '../utils/convert'
import {check, fixname, root} from '../utils/componer'
import {log, execute} from '../utils/process'
import {exists, readJSON, writeJSON} from '../utils/file'
import {getLocalPackagesByType} from '../utils/package'

export default function(commander) {
    commander
    .command('install <pkg> <to> <name>')
    .description('install a pacakge to a componout')
	.option('-S, --save', 'save to .json dependencies (default)')
	.option('-D, --savedev', 'save to .json devDependencies')
	.option('-F, --force', 'force to install packages if exists in local')
    .action((pkg, to, name, options) => {
		name = dash(name)
		name = fixname(name)
		check(name)

        let cwd = root()
        let bower = cwd + '/node_modules/.bin/bower'

		let updateVersion = (file, name, version = null, dev = false) => {
 			// add dependencies into package.json of componout
 			let info = readJSON(file)

 			if(!version) {
				let bowerJson = `${cwd}/bower_components/${name}/bower.json`
				let npmJson = `${cwd}/node_modules/${name}/package.json`
				let jsonFile = exists(npmJson) ? npmJson : exists(bowerJson) ? bowerJson : null
 				if(jsonFile) {
					version = readJSON(jsonFile).version
				}
 			}

 			if(dev) {
 				info.devDependencies[name] = version
 			}
 			else {
 				info.dependencies[name] = version
 			}

 			writeJSON(file, info)
 		}
		let localBowerPkgs = getLocalPackagesByType('bower')
		let localNpmPkgs = getLocalPackagesByType('npm')
		let npmJson = `${cwd}/componouts/${name}/package.json`
		let bowerJson = `${cwd}/componouts/${name}/bower.json`

		let bowerInstall = (pkg, version) => {
 			if(!exists(bowerJson)) return

			if(!options.force && !version && localBowerPkgs[pkg]) {
				updateVersion(bowerJson, pkg, localBowerPkgs[pkg].version, options.savedev)
				return
			}

			let cmd = `cd "${cwd}" && cd componouts && cd ${name} && "${bower}" install --config.directory="${cwd}/bower_components" ${pkg}`
			cmd += version ? `@${version}` : ''
			cmd += options.savedev ? ' --save-dev' : ' --save'
			return execute(cmd)
 		}
		let npmInstall = (pkg, version) => {
			if(!exists(npmJson)) return

			if(!options.force && !version && localNpmPkgs[pkg]) {
				updateVersion(npmJson, pkg, '^' + localNpmPkgs[pkg].version, options.savedev)
				return
			}

			let cmd = `cd "${cwd}" && npm install ${pkg}`
			cmd += version ? `@${version}` : ''
			return execute(cmd, () => updateVersion(npmJson, pkg, '^' + version, options.savedev))
		}

		let [pkgName, pkgVer] = pkg.split(/[#@]/)
		if(exists(bowerJson)) {
			bowerInstall(pkgName, pkgVer) || npmInstall(pkgName, pkgVer)
		}
		else if(exists(npmJson)) {
			npmInstall(pkgName, pkgVer)
		}
        else {
            log('Your componout type is not bower or npm.', 'warn')
            return
        }

		log('Package has been installed.', 'done')
	})
}
