"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.execute = execute;
exports.getCases = getCases;
exports.createCase = createCase;
exports.updateCase = updateCase;
exports.upsertCase = upsertCase;
exports.post = post;
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

var _languageHttp = _interopRequireDefault(require("language-http"));

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
 *  getCases({
 *    remote: true,
 *    scope: {
 *      transitions_created_at: 'dateRange||17-Mar-2008.17-Mar-2008',
 *      service_response_types: 'list||referral_to_oscar',
 *    },
 *  }, state => {
 *    state.lastFetch =
 *      state.data.map(x => x.updatedAt)
 *      .sort((a, b) => (b-a))
 *    return state
 *  })
 * @function
 * @param {object} query - an object with a query param at minimum.
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
          console.log("Primero says: '".concat(response.statusCode, " ").concat(response.statusMessage, "'"));
          var resp = (0, _Utils.tryJson)(body);
          console.log("".concat(resp.length, " cases retreived from request: ").concat(JSON.stringify(response.request, null, 2), "."));
          var nextState = (0, _languageCommon.composeNextState)(state, resp);
          if (callback) resolve(callback(nextState));
          resolve(nextState);
        }
      });
    });
  };
}
/**
 * Create case in Primero
 * @public
 * @example
 *  createCase(params, callback)
 * @function
 * @param {object} params - an object with some case data.
 * @param {function} callback - (Optional) Callback function
 * @returns {Operation}
 */


function createCase(params, callback) {
  return function (state) {
    var url = state.configuration.url;

    var _expandReferences = (0, _languageCommon.expandReferences)(params)(state),
        data = _expandReferences.data;

    var requestParams = {
      method: 'POST',
      url: "".concat(url, "/api/cases"),
      json: data,
      jar: true
    };
    return new Promise(function (resolve, reject) {
      (0, _request["default"])(requestParams, function (error, response, body) {
        error = (0, _Utils.assembleError)({
          error: error,
          response: response,
          params: {}
        });

        if (error) {
          reject(error);
        } else {
          var resp = (0, _Utils.tryJson)(body);
          console.log("Post succeeded. Response body from server: ".concat(JSON.stringify(resp.body, null, 2)));
          var nextState = (0, _languageCommon.composeNextState)(state, resp.body);
          if (callback) resolve(callback(nextState));
          resolve(nextState);
        }
      });
    });
  };
}
/**
 * Update case in Primero
 * @public
 * @example
 *  updateCase(id, params, callback)
 * @function
 * @param {string} id - an ID to use for the update.
 * @param {object} params - an object with some case data.
 * @param {function} callback - (Optional) Callback function
 * @returns {Operation}
 */


function updateCase(id, params, callback) {
  return function (state) {
    var url = state.configuration.url;

    var _expandReferences2 = (0, _languageCommon.expandReferences)(params)(state),
        data = _expandReferences2.data;

    var requestParams = {
      method: 'PATCH',
      url: "".concat(url, "/api/cases/").concat(id),
      json: data,
      jar: true
    };
    return new Promise(function (resolve, reject) {
      (0, _request["default"])(requestParams, function (error, response, body) {
        error = (0, _Utils.assembleError)({
          error: error,
          response: response,
          params: {}
        });

        if (error) {
          reject(error);
        } else {
          var resp = (0, _Utils.tryJson)(body);
          var nextState = (0, _languageCommon.composeNextState)(state, resp);
          if (callback) resolve(callback(nextState));
          resolve(nextState);
        }
      });
    });
  };
}
/**
 * Upsert case to Primero
 * @public
 * @example
 *  upsertCase({externalId: "123", data: {...}})
 * @function
 * @param {object} params - an object with an externalId and some case data.
 * @param {function} callback - (Optional) Callback function
 * @returns {Operation}
 */


function upsertCase(params, callback) {
  return function (state) {
    var url = state.configuration.url;

    var _expandReferences3 = (0, _languageCommon.expandReferences)(params)(state),
        _data = _expandReferences3.data,
        externalIds = _expandReferences3.externalIds;

    var qs = {
      remote: true,
      scope: {
        or: {}
      }
    };
    externalIds.map(function (x) {
      return qs.scope.or[x] = "or_op||".concat(_data[x]);
    });
    var requestParams = {
      method: 'GET',
      url: "".concat(url, "/api/cases"),
      jar: true,
      qs: qs
    };
    console.log("Upserting: ".concat(JSON.stringify(requestParams, null, 2)));
    return new Promise(function (resolve, reject) {
      (0, _request["default"])(requestParams, function (error, response, body) {
        error = (0, _Utils.assembleError)({
          error: error,
          response: response,
          params: {}
        });

        if (error) {
          reject(error);
        } else {
          var resp = (0, _Utils.tryJson)(body);

          if (resp.length == 0) {
            console.log('No case found. Performing create.');
            resolve(createCase({
              data: function data(state) {
                return _data;
              }
            }, callback)(state));
          } else if (resp.length == 1) {
            console.log('Case found. Performing update.');
            resolve(updateCase(resp[0].id, {
              data: function data(state) {
                return _data;
              }
            }, callback)(state));
          } else {
            reject('Multiple cases found. Try using another externalId and ensure that it is unique.');
          }
        }
      });
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
 *    }
 *  )
 * @function
 * @param {string} path - Path to resource
 * @param {object} params - Body, Query, Headers and Authentication parameters
 * @returns {Operation}
 */


function post(path, params) {
  return function (state) {
    return _languageHttp["default"].post(path, params)(state);
  };
}
