import path from 'path'
import {log, execute} from '../utils/process'
import {check, fixname, root} from '../utils/componer'
import {getLocalPackagesByType, PackagesPicker, installPackages} from '../utils/package'
import {dashName} from '../../generator/gulp/utils/convert-name'
import {exists, readJSON, writeJSON, scandir} from '../../generator/gulp/utils/file'

const cwd = root()
const bower = path.resolve(__dirname, '../../node_modules/.bin/bower')
const yarn = path.resolve(__dirname, '../../node_modules/.bin/yarn')

export default function(commander) {
    commander
    .command('install [pkg] [to] [name]')
    .description('install a pacakge to a componout')
	.option('-D, --dev', 'save to .json devDependencies (default dependencies)')
	.option('-F, --force', 'force to install packages no matter exists in local')
    .action((pkg, to, name, options) => {

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

            if(!options.force && !version && localBowerPkgs[pkg]) {
                updateVersion(jsonfile, pkg, localBowerPkgs[pkg].version, options.dev)
                return true
            }

            let cmd = `cd "${cwd}/componouts/${componout}" && "${bower}" install --config.directory="${cwd}/bower_components" ${pkg}`
            cmd += version ? `#${version}` : ''
            cmd += options.dev ? ' --save-dev' : ' --save'
            return execute(cmd)
        }
        let npmInstall = (componout, pkg, version) => {
            let jsonfile = `${cwd}/componouts/${componout}/package.json`
            if(!exists(jsonfile)) return false

            if(!options.force && !version && localNpmPkgs[pkg]) {
                updateVersion(jsonfile, pkg, localNpmPkgs[pkg].version, options.dev)
                return
            }

            let cmd = `cd "${cwd}/componouts/${componout}" && "${yarn}" add --modules-folder="${cwd}/node_modules" ${pkg}`
            cmd += version ? `@${version}` : ''
            cmd += options.dev ? ' --dev' : ''
            return execute(cmd)
        }

        // install pkg for name
        if(name && pkg) {
            if(to !== 'for' && to !== 'to') {
                log(`Use 'componer install package-name[@version] for|to componout-name' please.`, 'warn')
                return
            }

            name = dashName(name)
            name = fixname(name)
            check(name)

            let [pkgName, pkgVer] = pkg.split(/[#@]/)
            log('Installing ' + pkgName + ' for ' + name + '...')
            npmInstall(name, pkgName, pkgVer) || bowerInstall(name, pkgName, pkgVer) ? log('Package has been installed.', 'done') : log('Package install fail.', 'warn')
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
            name = dashName(name)
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

        // install packages
		let installer = PackagesInstaller()
        installer.install(picker.use())
		log('All (dev)dependencies have been installed.', 'done')
        let conflicts = installer.conflict()
        if(conflicts) {
            // TODO: tell the user which packages are in conflicts
        }
	})
}
