'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function processArgs(find, alias) {
  var args = process.argv;

  // if there are no parameters
  if (!args || args.length === 0) {
    return;
  }

  if ((typeof find === 'undefined' ? 'undefined' : _typeof(find)) === 'object') {
    alias = find;
    find = false;
  }

  var parameters = {};
  var commands = [];
  var cmd;

  args.forEach(function (arg) {
    // command
    if (arg.indexOf('-') !== 0) {
      cmd = arg;
      commands.push(cmd);
      parameters[cmd] = {};
    }
    // parameters
    else if (cmd && _typeof(parameters[cmd]) === 'object') {
        var obj = parameters[cmd];
        // more than 4 dash line, no use do nothing
        if (arg.indexOf('----') === 0) {
          return true;
        }
        // 3 dash line, super param
        else if (arg.indexOf('---') === 0) {
            arg = arg.substr(3);
            paserEach(parameters, arg, commands);
          }
          // 2 dash line
          else if (arg.indexOf('--') === 0) {
              arg = arg.substr(2);
              paserTo(obj, arg);
            }
            // 1 dash line
            else {
                arg = arg.substr(1);
                paserTo(obj, arg);
              }
      }
  });

  if (find) {
    if (typeof find === 'number' && commands.length > find) {
      return parameters[commands[find]];
    } else if (typeof find === 'string' && parameters[find]) {
      return parameters[find];
    }
  }

  return parameters;

  function parseAlias(str, alias) {
    return (typeof alias === 'undefined' ? 'undefined' : _typeof(alias)) === 'object' && alias[str] ? alias[str] : str;
  }

  function paserEach(obj, str, props) {
    props.forEach(function (prop) {
      return paserTo(obj[prop], str);
    });
  }

  function paserTo(obj, str) {
    var pos = str.indexOf("=");
    // with no =
    if (pos === -1) {
      str = parseAlias(str, alias);
      set(obj, str, true, true);
    }
    // begin with =, do nothing
    else if (pos === 0) {}
      // like key=value
      else {
          var key = str.substr(0, pos);
          var value = str.substr(pos + 1);
          key = parseAlias(key, alias);
          set(obj, key, value);
        }
  }

  function set(obj, key, value, cover) {
    // cover previous value
    if (cover) {
      obj[key] = value;
      return;
    }

    var prev = obj[key];
    if (prev instanceof Array) {
      prev.push(value);
    } else if ("undefined" !== typeof prev) {
      obj[key] = [prev, value];
    } else {
      obj[key] = value;
    }
  }
}

exports.default = processArgs;

module.exports = processArgs;