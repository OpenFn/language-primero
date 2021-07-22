"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.execute = execute;
exports.getCases = getCases;
exports.createCase = createCase;
exports.updateCase = updateCase;
exports.upsertCase = upsertCase;
exports.getReferrals = getReferrals;
exports.createReferrals = createReferrals;
Object.defineProperty(exports, "alterState", {
  enumerable: true,
  get: function get() {
    return _languageCommon.alterState;
  }
});
Object.defineProperty(exports, "fn", {
  enumerable: true,
  get: function get() {
    return _languageCommon.fn;
  }
});
Object.defineProperty(exports, "combine", {
  enumerable: true,
  get: function get() {
    return _languageCommon.combine;
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
Object.defineProperty(exports, "http", {
  enumerable: true,
  get: function get() {
    return _languageCommon.http;
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

var _languageCommon = require("@openfn/language-common");

var _Utils = require("./Utils");

var _request = _interopRequireDefault(require("request"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

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
 * Generate an auth string to support multiple types of auth credentials.
 * @example
 * generateAuthString(state)
 * @function
 * @param {State} state
 * @returns {string}
 */


function generateAuthString(state) {
  var auth = state.auth,
      configuration = state.configuration;

  if (configuration.basicAuth) {
    var user = configuration.user,
        password = configuration.password;
    return 'Basic ' + Buffer.from("".concat(user, ":").concat(password)).toString('base64');
  }

  var token = auth.token;
  return "Bearer ".concat(token);
}
/**
 * Logs in to Primero.
 * @example
 * login(state)
 * @function
 * @param {State} state - Runtime state.
 * @returns {State}
 */


function login(state) {
  var _state$configuration = state.configuration,
      url = _state$configuration.url,
      user = _state$configuration.user,
      password = _state$configuration.password;
  var body = JSON.stringify({
    user: {
      user_name: user,
      password: password
    }
  });
  var params = {
    method: 'POST',
    url: "".concat(url, "/api/v2/tokens"),
    headers: {
      'Content-Type': 'application/json'
    },
    body: body
  };
  return new Promise(function (resolve, reject) {
    (0, _request["default"])(params, function (error, response, body) {
      response = (0, _Utils.scrubResponse)(response);
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
 * cleanupState(state)
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
 * getCases({
 *   remote: true,
 *   case_id: '6aeaa66a-5a92-4ff5-bf7a-e59cde07eaaz'
 *   query: 'sex=male' // optional
 * }, callback)
 * @function
 * @param {object} query - an object with a query param at minimum.
 * @param {function} callback - (Optional) Callback function
 * @returns {Operation}
 */


function getCases(query, callback) {
  return function (state) {
    var url = state.configuration.url;
    var params = {
      method: 'GET',
      url: "".concat(url, "/api/v2/cases"),
      headers: {
        Authorization: generateAuthString(state),
        'Content-Type': 'application/json'
      },
      qs: query
    };
    return new Promise(function (resolve, reject) {
      (0, _request["default"])(params, function (error, response, body) {
        response = (0, _Utils.scrubResponse)(response);
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
          console.log("".concat(resp.data.length, " cases retrieved from request: ").concat(JSON.stringify(response.request, null, 2), "."));
          var nextState = (0, _languageCommon.composeNextState)(state, resp.data);
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
 * createCase({
 *   data: state => data {
 *     "enabled": true,
 *     "age": 15,
 *     "sex": "male",
 *     "name": "Alex",
 *     "status": "open",
 *     "case_id": "6aeaa66a-5a92-4ff5-bf7a-e59cde07eaaz",
 *     "owned_by": "primero_cp"
 *   }}, callback)
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
      url: "".concat(url, "/api/v2/cases"),
      headers: {
        Authorization: generateAuthString(state),
        'Content-Type': 'application/json',
        options: {
          successCodes: [200, 201, 202, 203, 204]
        }
      },
      json: {
        data: data
      }
    };
    return new Promise(function (resolve, reject) {
      (0, _request["default"])(requestParams, function (error, response, body) {
        response = (0, _Utils.scrubResponse)(response);
        error = (0, _Utils.assembleError)({
          error: error,
          response: response,
          params: requestParams
        });

        if (error) {
          reject(error);
        } else {
          var _resp$body;

          var resp = (0, _Utils.tryJson)(body);
          console.log("Post succeeded: ".concat(response.statusCode, " ").concat(response.statusMessage));
          var nextState = (0, _languageCommon.composeNextState)(state, (_resp$body = resp.body) === null || _resp$body === void 0 ? void 0 : _resp$body.data);
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
 * updateCase("7ed1d49f-14c7-4181-8d83-dc8ed1699f08", {
 *   data: state => data {
 *     "age": 20,
 *     "sex": "male",
 *     "name": "Alex",
 *     "status": "open",
 *     "case_id": "6aeaa66a-5a92-4ff5-bf7a-e59cde07eaaz",
 *   }}, callback)
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
      url: "".concat(url, "/api/v2/cases/").concat(id),
      headers: {
        Authorization: generateAuthString(state),
        'Content-Type': 'application/json'
      },
      json: {
        data: data
      }
    };
    return new Promise(function (resolve, reject) {
      (0, _request["default"])(requestParams, function (error, response, body) {
        response = (0, _Utils.scrubResponse)(response);
        error = (0, _Utils.assembleError)({
          error: error,
          response: response,
          params: {}
        });

        if (error) {
          reject(error);
        } else {
          var _resp$body2;

          var resp = (0, _Utils.tryJson)(body);
          var nextState = (0, _languageCommon.composeNextState)(state, (_resp$body2 = resp.body) === null || _resp$body2 === void 0 ? void 0 : _resp$body2.data);
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
 * upsertCase({
 *    externalIds: ['case_id'],
 *    data: state => data {
 *      "age": 20,
 *      "sex": "male",
 *      "name": "Alex",
 *      "status": "open",
 *      "case_id": "6aeaa66a-5a92-4ff5-bf7a-e59cde07eaaz",
 *    }}, callback);
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
      scope: {}
    };
    externalIds.map(function (x) {
      // For every externalId field that is provided, add a key to the
      // scope object in our qs (queryString) and set the value for that key to
      // whatever value is found IN THE DATA for the given externalId.
      return qs[x] = "".concat(_data[x]);
    });
    var requestParams = {
      method: 'GET',
      url: "".concat(url, "/api/v2/cases"),
      headers: {
        Authorization: generateAuthString(state),
        'Content-Type': 'application/json'
      },
      qs: qs
    };
    console.log("Upserting: ".concat(JSON.stringify(requestParams, null, 2)));
    return new Promise(function (resolve, reject) {
      (0, _request["default"])(requestParams, function (error, response, body) {
        response = (0, _Utils.scrubResponse)(response);
        error = (0, _Utils.assembleError)({
          error: error,
          response: response,
          params: {}
        });

        if (error) {
          reject(error);
        } else {
          var resp = (0, _Utils.tryJson)(body);

          if (resp.data.length == 0) {
            console.log('No case found. Performing create.');
            resolve(createCase({
              data: function data(state) {
                return _data;
              }
            }, callback)(state));
          } else if (resp.data.length == 1) {
            console.log('Case found. Performing update.');
            resolve(updateCase(resp.data[0].id, {
              data: function data(state) {
                // =========== Need clarification on this. Should we test when 'child' does not exist? ===========
                var child = _data.child; // NOTE: When performing an upsert, we only add _new_
                // services to Primero, as defined by their "unique_id".
                // The logic below takes the services array returned by
                // Primero as the starting point, and concatenates it with a
                // "newServices" array, which includes only those services
                // whose "unique_id" values are NOT existing in the Primero
                // services array.

                var oldServices = resp.data[0].services_section;

                if (oldServices && oldServices.length > 0) {
                  var serviceIds = oldServices.map(function (s) {
                    return s.unique_id;
                  });
                  var newServices = child.services_section.filter(function (os) {
                    return !serviceIds.includes(os.unique_id);
                  });
                  var mergedServices = oldServices.concat(newServices);
                  return _objectSpread({}, _data, {
                    child: _objectSpread({}, child, {
                      services_section: mergedServices
                    })
                  });
                }

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
 * Get referrals for a specific case in Primero
 * @public
 * @example
 * getReferrals("7ed1d49f-14c7-4181-8d83-dc8ed1699f08", callback)
 * @function
 * @param {string} recordId - an ID to use for fetching referrals.
 * @param {function} callback - (Optional) Callback function
 * @returns {Operation}
 */


function getReferrals(recordId, callback) {
  return function (state) {
    var url = state.configuration.url;
    var params = {
      method: 'GET',
      url: "".concat(url, "/api/v2/cases/").concat(recordId, "/referrals"),
      headers: {
        Authorization: generateAuthString(state),
        'Content-Type': 'application/json'
      }
    };
    return new Promise(function (resolve, reject) {
      (0, _request["default"])(params, function (error, response, body) {
        response = (0, _Utils.scrubResponse)(response);
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
          console.log("".concat(resp.data.length, " referrals retrieved from request: ").concat(JSON.stringify(response.request, null, 2), "."));
          var nextState = (0, _languageCommon.composeNextState)(state, resp.data);
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
 * createReferrals({
 *   data: {
 *    "ids": ['case_id'],
 *    "transitioned_to": "primero_cp",
 *    "notes": "Creating a referral"
 *   }}, callback)
 * @function
 * @param {object} params - an object with some case data.
 * @param {function} callback - (Optional) Callback function
 * @returns {Operation}
 */


function createReferrals(params, callback) {
  return function (state) {
    var url = state.configuration.url;

    var _expandReferences4 = (0, _languageCommon.expandReferences)(params)(state),
        data = _expandReferences4.data;

    var requestParams = {
      method: 'POST',
      url: "".concat(url, "/api/v2/cases/referrals"),
      headers: {
        Authorization: generateAuthString(state),
        'Content-Type': 'application/json',
        options: {
          successCodes: [200, 201, 202, 203, 204]
        }
      },
      json: {
        data: data
      }
    };
    return new Promise(function (resolve, reject) {
      (0, _request["default"])(requestParams, function (error, response, body) {
        response = (0, _Utils.scrubResponse)(response);
        error = (0, _Utils.assembleError)({
          error: error,
          response: response,
          params: requestParams
        });

        if (error) {
          reject(error);
        } else {
          var resp = (0, _Utils.tryJson)(body);
          console.log("Post succeeded: ".concat(response.statusCode, " ").concat(response.statusMessage));
          var nextState = (0, _languageCommon.composeNextState)(state, resp.data.body);
          if (callback) resolve(callback(nextState));
          resolve(nextState);
        }
      });
    });
  };
}