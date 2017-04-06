import {dash} from '../utils/convert'
import {check, fixname, root} from '../utils/componer'
import {log, execute} from '../utils/process'
import {exists, readJSON, writeJSON, scandir} from '../utils/file'
import {getLocalPackagesByType, PackagesPicker, installPackages} from '../utils/package'

export default function(commander) {
    commander
    .command('install [pkg] [to] [name]')
    .description('install a pacakge to a componout')
	.option('-S, --save', 'save to .json dependencies (default)')
	.option('-D, --savedev', 'save to .json devDependencies')
	.option('-F, --force', 'force to install packages if exists in local')
    .option('-R, --resolve', 'install packages one by one if your computer has no enough memory.')
    .action((pkg, to, name, options) => {
        let cwd = root()
        let bower = cwd + '/node_modules/.bin/bower'
        let localBowerPkgs = getLocalPackagesByType('bower')
        let localNpmPkgs = getLocalPackagesByType('npm')

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

        let bowerInstall = (componout, pkg, version) => {
            let jsonfile = `${cwd}/componouts/${componout}/bower.json`

            if(!exists(jsonfile)) return false

            if(!localBowerPkgs[pkg] && localNpmPkgs[pkg]) return false

            if(!options.force && !version && localBowerPkgs[pkg]) {
                updateVersion(jsonfile, pkg, localBowerPkgs[pkg].version, options.savedev)
                return true
            }

            let cmd = `cd "${cwd}/componouts/${componout}" && "${bower}" install --config.directory="${cwd}/bower_components" ${pkg}`
            cmd += version ? `@${version}` : ''
            cmd += options.savedev ? ' --save-dev' : ' --save'
            return execute(cmd)
        }
        let npmInstall = (componout, pkg, version) => {
            let jsonfile = `${cwd}/componouts/${componout}/package.json`

            if(!exists(jsonfile)) return

            if(!options.force && !version && localNpmPkgs[pkg]) {
                updateVersion(jsonfile, pkg, '^' + localNpmPkgs[pkg].version, options.savedev)
                return
            }

            let cmd = `cd "${cwd}" && npm install ${pkg}`
            cmd += version ? `@${version}` : ''
            return execute(cmd, () => updateVersion(jsonfile, pkg, '^' + version, options.savedev))
        }

        // install pkg for name
        if(name && pkg) {
            if(to !== 'for' && to !== 'to') {
                log(`Use 'componer install package-name[@version] for|to componout-name' please.`, 'warn')
                return
            }

            name = dash(name)
            name = fixname(name)
            check(name)

            let [pkgName, pkgVer] = pkg.split(/[#@]/)
            log('Installing ' + pkgName + ' for ' + name + '...')
            bowerInstall(name, pkgName, pkgVer) || npmInstall(name, pkgName, pkgVer) ? log('Package has been installed.', 'done') : log('Package install fail.', 'warn')
            return
        }

        let picker = PackagesPicker()
        let pick = name => {
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

        // install for name
        if(to && pkg) {
            if(pkg !== 'for') {
                log(`Use 'componer install for componout-name' please.`, 'warn')
                return
            }

            name = to
            name = dash(name)
            name = fixname(name)
            check(name)
            pick(name)
            log('Installing all dependencies for ' + name + '...')
        }
        // install all
        else {
            if(pkg) {
                log(`Use 'componer install' please.`, 'warn')
                return
            }

            check()
			scandir(cwd + '/componouts').forEach(pick)
            log('Install all dependencies for all componouts...')
        }

        // install npm packages
		installPackages(picker.use(), options)

		log('All (dev)dependencies have been installed.', 'done')

	})
}
