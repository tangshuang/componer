import {config, fs} from "../loader"

export default function getComponents() {
	var componentsPath = config.paths.components
	var components = []
	fs.readdirSync(componentsPath).forEach(file => {
		components.push({
			path: file,
			get type() {
				if(fs.existsSync(file + '/bower.json')) {
					return "bower"
				}
				else if(fs.existsSync(file + '/package.json')) {
					return "package"
				}
				else {
					return "default"
				}
			},
		})
	})
	return components
}