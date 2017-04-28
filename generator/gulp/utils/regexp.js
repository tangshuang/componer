export function matchAll(str, reg) {
    var res = []
    var match
    while(match = reg.exec(str)) {
        res.push(match)
    }
    return res
}
