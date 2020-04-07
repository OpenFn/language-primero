'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sourceValue = exports.merge = exports.lastReferenceValue = exports.fields = exports.field = exports.each = exports.dataValue = exports.dataPath = exports.alterState = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; /** @module Adaptor */


exports.execute = execute;
exports.get = get;
exports.post = post;
exports.put = put;
exports.patch = patch;
exports.del = del;
exports.parseXML = parseXML;
exports.parseCSV = parseCSV;
exports.request = request;

var _languageCommon = require('language-common');

Object.defineProperty(exports, 'alterState', {
  enumerable: true,
  get: function get() {
    return _languageCommon.alterState;
  }
});
Object.defineProperty(exports, 'dataPath', {
  enumerable: true,
  get: function get() {
    return _languageCommon.dataPath;
  }
});
Object.defineProperty(exports, 'dataValue', {
  enumerable: true,
  get: function get() {
    return _languageCommon.dataValue;
  }
});
Object.defineProperty(exports, 'each', {
  enumerable: true,
  get: function get() {
    return _languageCommon.each;
  }
});
Object.defineProperty(exports, 'field', {
  enumerable: true,
  get: function get() {
    return _languageCommon.field;
  }
});
Object.defineProperty(exports, 'fields', {
  enumerable: true,
  get: function get() {
    return _languageCommon.fields;
  }
});
Object.defineProperty(exports, 'lastReferenceValue', {
  enumerable: true,
  get: function get() {
    return _languageCommon.lastReferenceValue;
  }
});
Object.defineProperty(exports, 'merge', {
  enumerable: true,
  get: function get() {
    return _languageCommon.merge;
  }
});
Object.defineProperty(exports, 'sourceValue', {
  enumerable: true,
  get: function get() {
    return _languageCommon.sourceValue;
  }
});

var _Client = require('./Client');

var _Utils = require('./Utils');

var _cheerio = require('cheerio');

var _cheerio2 = _interopRequireDefault(_cheerio);

var _cheerioTableparser = require('cheerio-tableparser');

var _cheerioTableparser2 = _interopRequireDefault(_cheerioTableparser);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _csvParse = require('csv-parse');

var _csvParse2 = _interopRequireDefault(_csvParse);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

/**
 * Execute a sequence of operations.
 * Wraps `language-common/execute`, and prepends initial state for http.
 * @example
 * execute(
 *   create('foo'),
 *   delete('bar')
 * )(state)
 * @function
 * @param {Operations} operations - Operations to be performed.
 * @returns {Operation}
 */
function execute() {
  for (var _len = arguments.length, operations = Array(_len), _key = 0; _key < _len; _key++) {
    operations[_key] = arguments[_key];
  }

  var initialState = {
    references: [],
    data: null
  };

  return function (state) {
    return _languageCommon.execute.apply(undefined, operations)(_extends({}, initialState, state));
  };
}

/**
 * Make a GET request
 * @public
 * @example
 *  get("/myendpoint", {
 *      query: {foo: "bar", a: 1},
 *      headers: {"content-type": "application/json"},
 *      authentication: {username: "user", password: "pass"}
 *    },
 *    function(state) {
 *      return state;
 *    }
 *  )
 * @function
 * @param {string} path - Path to resource
 * @param {object} params - Query, Headers and Authentication parameters
 * @param {function} callback - (Optional) Callback function
 * @returns {Operation}
 */
function get(path, params, callback) {
  return function (state) {
    var url = (0, _Utils.setUrl)(state.configuration, path);

    var _expandReferences = (0, _languageCommon.expandReferences)(params)(state),
        query = _expandReferences.query,
        headers = _expandReferences.headers,
        authentication = _expandReferences.authentication,
        rest = _objectWithoutProperties(_expandReferences, ['query', 'headers', 'authentication']);

    var auth = (0, _Utils.setAuth)(state.configuration, authentication);

    return (0, _Client.req)('GET', { url: url, query: query, auth: auth, headers: headers, rest: rest }).then(function (response) {
      var nextState = (0, _languageCommon.composeNextState)(state, response);
      if (callback) return callback(nextState);
      return nextState;
    });
  };
}

/**
 * Make a POST request
 * @public
 * @example
 *  post("/myendpoint", {
 *      body: {"foo": "bar"},
 *      headers: {"content-type": "json"},
 *      authentication: {username: "user", password: "pass"},
 *    },
 *    function(state) {
 *      return state;
 *    }
 *  )
 * @function
 * @param {string} path - Path to resource
 * @param {object} params - Body, Query, Headers and Authentication parameters
 * @param {function} callback - (Optional) Callback function
 * @returns {Operation}
 */
function post(path, params, callback) {
  return function (state) {
    var url = (0, _Utils.setUrl)(state.configuration, path);

    var _expandReferences2 = (0, _languageCommon.expandReferences)(params)(state),
        query = _expandReferences2.query,
        headers = _expandReferences2.headers,
        authentication = _expandReferences2.authentication,
        body = _expandReferences2.body,
        formData = _expandReferences2.formData,
        options = _expandReferences2.options,
        rest = _objectWithoutProperties(_expandReferences2, ['query', 'headers', 'authentication', 'body', 'formData', 'options']);

    var auth = (0, _Utils.setAuth)(state.configuration, authentication);

    return (0, _Client.req)('POST', {
      url: url,
      query: query,
      body: body,
      auth: auth,
      headers: headers,
      formData: formData,
      options: options,
      rest: rest
    }).then(function (response) {
      var nextState = (0, _languageCommon.composeNextState)(state, response);
      if (callback) return callback(nextState);
      return nextState;
    });
  };
}

/**
 * Make a PUT request
 * @public
 * @example
 *  put("/myendpoint", {
 *      body: {"foo": "bar"},
 *      headers: {"content-type": "json"},
 *      authentication: {username: "user", password: "pass"},
 *    },
 *    function(state) {
 *      return state;
 *    }
 *  )
 * @function
 * @param {string} path - Path to resource
 * @param {object} params - Body, Query, Headers and Auth parameters
 * @param {function} callback - (Optional) Callback function
 * @returns {Operation}
 */
function put(path, params, callback) {
  return function (state) {
    var url = (0, _Utils.setUrl)(state.configuration, path);

    var _expandReferences3 = (0, _languageCommon.expandReferences)(params)(state),
        query = _expandReferences3.query,
        headers = _expandReferences3.headers,
        authentication = _expandReferences3.authentication,
        body = _expandReferences3.body,
        formData = _expandReferences3.formData,
        options = _expandReferences3.options,
        rest = _objectWithoutProperties(_expandReferences3, ['query', 'headers', 'authentication', 'body', 'formData', 'options']);

    var auth = (0, _Utils.setAuth)(state.configuration, authentication);

    return (0, _Client.req)('PUT', {
      url: url,
      query: query,
      body: body,
      formData: formData,
      auth: auth,
      headers: headers,
      options: options,
      rest: rest
    }).then(function (response) {
      var nextState = (0, _languageCommon.composeNextState)(state, response);
      if (callback) return callback(nextState);
      return nextState;
    });
  };
}

/**
 * Make a PATCH request
 * @public
 * @example
 *  patch("/myendpoint", {
 *      body: {"foo": "bar"},
 *      headers: {"content-type": "json"},
 *      authentication: {username: "user", password: "pass"},
 *    },
 *    function(state) {
 *      return state;
 *    }
 *  )
 * @function
 * @param {string} path - Path to resource
 * @param {object} params - Body, Query, Headers and Auth parameters
 * @param {function} callback - (Optional) Callback function
 * @returns {Operation}
 */
function patch(path, params, callback) {
  return function (state) {
    var url = (0, _Utils.setUrl)(state.configuration, path);

    var _expandReferences4 = (0, _languageCommon.expandReferences)(params)(state),
        query = _expandReferences4.query,
        headers = _expandReferences4.headers,
        authentication = _expandReferences4.authentication,
        body = _expandReferences4.body,
        formData = _expandReferences4.formData,
        options = _expandReferences4.options,
        rest = _objectWithoutProperties(_expandReferences4, ['query', 'headers', 'authentication', 'body', 'formData', 'options']);

    var auth = (0, _Utils.setAuth)(state.configuration, authentication);

    return (0, _Client.req)('PATCH', {
      url: url,
      query: query,
      body: body,
      formData: formData,
      options: options,
      auth: auth,
      headers: headers,
      rest: rest
    }).then(function (response) {
      var nextState = (0, _languageCommon.composeNextState)(state, response);
      if (callback) return callback(nextState);
      return nextState;
    });
  };
}

/**
 * Make a DELETE request
 * @public
 * @example
 *  del("/myendpoint", {
 *      body: {"foo": "bar"},
 *      headers: {"content-type": "json"},
 *      authentication: {username: "user", password: "pass"},
 *    },
 *    function(state) {
 *      return state;
 *    }
 *  )
 * @function
 * @param {string} path - Path to resource
 * @param {object} params - Body, Query, Headers and Auth parameters
 * @param {function} callback - (Optional) Callback function
 * @returns {Operation}
 */
function del(path, params, callback) {
  return function (state) {
    var url = (0, _Utils.setUrl)(state.configuration, path);

    var _expandReferences5 = (0, _languageCommon.expandReferences)(params)(state),
        query = _expandReferences5.query,
        headers = _expandReferences5.headers,
        authentication = _expandReferences5.authentication,
        body = _expandReferences5.body,
        formData = _expandReferences5.formData,
        options = _expandReferences5.options,
        rest = _objectWithoutProperties(_expandReferences5, ['query', 'headers', 'authentication', 'body', 'formData', 'options']);

    var auth = (0, _Utils.setAuth)(state.configuration, authentication);

    return (0, _Client.req)('DELETE', {
      url: url,
      query: query,
      body: body,
      formData: formData,
      options: options,
      auth: auth,
      headers: headers,
      rest: rest
    }).then(function (response) {
      var nextState = (0, _languageCommon.composeNextState)(state, response);
      if (callback) return callback(nextState);
      return nextState;
    });
  };
}

/**
 * Cheerio parser for XML and HTML
 * @public
 * @example
 *  parseXML(body, function($){
 *    return $("table[class=your_table]").parsetable(true, true, true);
 *  })
 * @function
 * @param {String} body - data string to be parsed
 * @param {function} script - script for extracting data
 * @returns {Operation}
 */
function parseXML(body, script) {
  return function (state) {
    var $ = _cheerio2.default.load(body);
    (0, _cheerioTableparser2.default)($);

    if (script) {
      var result = script($);
      try {
        var r = JSON.parse(result);
        return (0, _languageCommon.composeNextState)(state, r);
      } catch (e) {
        return (0, _languageCommon.composeNextState)(state, { body: result });
      }
    } else {
      return (0, _languageCommon.composeNextState)(state, { body: body });
    }
  };
}

/**
 * CSV-Parse for CSV conversion to JSON
 * @public
 * @example
 *  parseCSV(state.data.someCSV, {
 * 	  quoteChar: '"',
 * 	  header: false,
 * 	});
 * @function
 * @param {String} target - string or local file with CSV data
 * @param {Object} config - PapaParse config object
 * @returns {Operation}
 */
function parseCSV(target, config) {
  return function (state) {
    return new Promise(function (resolve, reject) {
      var csvData = [];

      try {
        _fs2.default.readFileSync(target);
        _fs2.default.createReadStream(target).pipe((0, _csvParse2.default)(config)).on('data', function (csvrow) {
          csvData.push(csvrow);
        }).on('end', function () {
          console.log(csvData);
          resolve((0, _languageCommon.composeNextState)(state, { records: csvData }));
        });
      } catch (err) {
        var csvString;
        if (typeof target === 'string') {
          csvString = target;
        } else {
          csvString = (0, _languageCommon.expandReferences)(target)(state);
        }
        csvData = (0, _csvParse2.default)(csvString, config, function (err, output) {
          console.log(output);
          resolve((0, _languageCommon.composeNextState)(state, { records: output }));
        });
      }
    });
  };
}

/**
 * Make a request using the 'request' node module.
 * @public
 * @example
 *  request(params);
 * @function
 * @param {object} params - Query, Headers and Authentication parameters
 * @returns {Operation}
 */
function request(params) {
  return function (state) {
    var expanded = typeof params === 'string' ? params : (0, _languageCommon.expandReferences)(params)(state);

    return (0, _Client.rawRequest)(expanded);
  };
}
