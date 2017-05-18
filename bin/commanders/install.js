import path from 'path'
import {log, execute} from '../utils/process'
import {check, fixname, root} from '../utils/componer'
import {getLocalPackagesObject, PackagesPicker, PackagesInstaller} from '../utils/package'
import {dashName} from '../utils/convert-name'
import {exists, readJSON, writeJSON, scandir} from '../utils/file'

const cwd = root()
const bower = path.resolve(__dirname, '../../node_modules/.bin/bower')

export default function(pkg, to, name, options) {
    let localPkgs = getLocalPackagesObject()
    let updateVersion = (jsonFile, name, version = null, dev = false) => {
        let info = readJSON(jsonFile)

        // find out local version
        if(!version) {
            let bowerJson = `${cwd}/bower_components/${name}/bower.json`
            let npmJson = `${cwd}/node_modules/${name}/package.json`
            let pkgJson = exists(npmJson) ? npmJson : exists(bowerJson) ? bowerJson : null
            if(pkgJson) {
                version = readJSON(pkgJson).version
            }
        }

        // determine which dependencies option to input
        if(dev) {
            info.devDependencies[name] = version
        }
        else {
            info.dependencies[name] = version
        }

        writeJSON(jsonFile, info)
    }
    let npmInstall = (componout, pkg, version) => {
        let jsonFile = `${cwd}/componouts/${componout}/package.json`
        if(!exists(jsonFile)) return false

        if(!options.force && !version && localPkgs.npm[pkg]) {
            updateVersion(jsonFile, pkg, localPkgs.npm[pkg].version, options.dev)
            return true
        }

        let cmd = `cd "${cwd}" && npm install ${pkg}`
        cmd += version ? `@${version}` : ''
        return execute(cmd, () => updateVersion(jsonFile, pkg, version, options.dev))
    }
    let bowerInstall = (componout, pkg, version) => {
        let jsonFile = `${cwd}/componouts/${componout}/bower.json`
        if(!exists(jsonFile)) return false

        if(!options.force && !version && localPkgs.bower[pkg]) {
            updateVersion(jsonFile, pkg, localPkgs.bower[pkg].version, options.dev)
            return true
        }

        let cmd = `cd "${cwd}/componouts/${componout}" && "${bower}" install --config.directory="${cwd}/bower_components" ${pkg}`
        cmd += version ? `#${version}` : ''
        cmd += options.dev ? ' --save-dev' : ' --save'
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
        npmInstall(name, pkgName, pkgVer) || bowerInstall(name, pkgName, pkgVer) ? log('Package has been installed.', 'done') : log('Package installing fail.', 'warn')
        return
    }

    /**
    install all dependencies
    */
    let picker = PackagesPicker()
    let pickFrom = name => {
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
        pickFrom(name)
        log('Installing all dependencies for ' + name + '...')
    }
    // install all
    else {
        if(pkg) {
            log(`Use 'componer install' please.`, 'warn')
            return
        }

        check()
        scandir(cwd + '/componouts').forEach(pickFrom)
        log('Install all dependencies for all componouts...')
    }

    // install packages
    let pkgs = picker.use()
    let installer = PackagesInstaller({
        cwd,
        force: options.force,
    })
    if(pkgs.npm.length > 0) installer.npmInstall(pkgs.npm)
    if(pkgs.bower.length > 0) installer.bowerInstall(pkgs.bower)
    log('All (dev)dependencies have been installed.', 'done')
}
