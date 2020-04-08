"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.execute = execute;
exports.getCases = getCases;
Object.defineProperty(exports, "alterState", {
  enumerable: true,
  get: function get() {
    return _languageCommon.alterState;
  }
});
Object.defineProperty(exports, "dataPath", {
  enumerable: true,
  get: function get() {
    return _languageCommon.dataPath;
  }
});
Object.defineProperty(exports, "dataValue", {
  enumerable: true,
  get: function get() {
    return _languageCommon.dataValue;
  }
});
Object.defineProperty(exports, "each", {
  enumerable: true,
  get: function get() {
    return _languageCommon.each;
  }
});
Object.defineProperty(exports, "field", {
  enumerable: true,
  get: function get() {
    return _languageCommon.field;
  }
});
Object.defineProperty(exports, "fields", {
  enumerable: true,
  get: function get() {
    return _languageCommon.fields;
  }
});
Object.defineProperty(exports, "lastReferenceValue", {
  enumerable: true,
  get: function get() {
    return _languageCommon.lastReferenceValue;
  }
});
Object.defineProperty(exports, "merge", {
  enumerable: true,
  get: function get() {
    return _languageCommon.merge;
  }
});
Object.defineProperty(exports, "sourceValue", {
  enumerable: true,
  get: function get() {
    return _languageCommon.sourceValue;
  }
});

var _languageCommon = require("language-common");

var _Utils = require("./Utils");

var _request = _interopRequireDefault(require("request"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

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
  for (var _len = arguments.length, operations = new Array(_len), _key = 0; _key < _len; _key++) {
    operations[_key] = arguments[_key];
  }

  var initialState = {
    references: [],
    data: null
  };
  return function (state) {
    return _languageCommon.execute.apply(void 0, [login].concat(operations, [cleanupState]))(_objectSpread({}, initialState, {}, state));
  };
}
/**
 * Logs in to Primero.
 * @example
 *  login(state)
 * @function
 * @param {State} state - Runtime state.
 * @returns {State}
 */


function login(state) {
  var _state$configuration = state.configuration,
      url = _state$configuration.url,
      user = _state$configuration.user,
      password = _state$configuration.password;
  var params = {
    method: 'POST',
    url: "".concat(url, "/api/login"),
    json: {
      user_name: user,
      password: password
    },
    jar: true
  };
  return new Promise(function (resolve, reject) {
    (0, _request["default"])(params, function (error, response, body) {
      error = (0, _Utils.assembleError)({
        error: error,
        response: response,
        params: params
      });

      if (error) {
        reject(error);
      } else {
        var resp = (0, _Utils.tryJson)(body);
        resolve(_objectSpread({}, state, {
          auth: resp
        }));
      }
    });
  });
}
/**
 * Removes unserializable keys from the state.
 * @example
 *  cleanupState(state)
 * @function
 * @param {State} state
 * @returns {State}
 */


function cleanupState(state) {
  delete state.auth;
  return state;
}
/**
 * Get cases from Primero
 * @public
 * @example
 *  getCases({query: {}}, state => {
 *      return state;
 *  })
 * @function
 * @param {object} params - an object with a query param at minimum.
 * @param {function} callback - (Optional) Callback function
 * @returns {Operation}
 */


function getCases(query, callback) {
  return function (state) {
    var _state$configuration2 = state.configuration,
        url = _state$configuration2.url,
        user = _state$configuration2.user,
        password = _state$configuration2.password;
    var params = {
      method: 'GET',
      // NOTE: these filters do not seem to work as specified in the Primero API docs.
      // url: `${url}/api/cases?remote=true&scope[transitions_created_at]=17-Mar-2008.17-Mar-2008&scope[service_response_types]=referral_to_oscar`,
      url: "".concat(url, "/api/cases"),
      jar: true,
      qs: query
    };
    return new Promise(function (resolve, reject) {
      (0, _request["default"])(params, function (error, response, body) {
        error = (0, _Utils.assembleError)({
          error: error,
          response: response,
          params: params
        });

        if (error) {
          reject(error);
        } else {
          var resp = (0, _Utils.tryJson)(body);
          console.log("".concat(resp.length, " cases retreived from request: ").concat(JSON.stringify(response.request, null, 2), "."));
          resolve((0, _languageCommon.composeNextState)(state, resp));
        }
      });
    });
  };
}
