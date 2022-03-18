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
exports.updateReferrals = updateReferrals;
Object.defineProperty(exports, "alterState", {
  enumerable: true,
  get: function get() {
    return _languageCommon.alterState;
  }
});
Object.defineProperty(exports, "beta", {
  enumerable: true,
  get: function get() {
    return _languageCommon.beta;
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
    return _languageCommon.execute.apply(void 0, [generateAuthString].concat(operations, [cleanupState]))(_objectSpread(_objectSpread({}, initialState), state));
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
  var configuration = state.configuration;

  if (configuration.basicAuth) {
    var user = configuration.user,
        password = configuration.password;
    var auth = {
      token: 'Basic ' + Buffer.from("".concat(user, ":").concat(password)).toString('base64')
    };
    return _objectSpread(_objectSpread({}, state), {}, {
      auth: auth
    });
  }

  return login(state);
}
/**
 * Execute custom query
 * @param {State} state
 * @param {object} params
 * @param {function} callback
 * @returns {State}
 */


function queryHandler(state, params, callback) {
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

        if (params.method === 'GET') {
          console.log("".concat(resp.data.length, " referrals retrieved from request: ").concat(JSON.stringify(response.request, null, 2)));
        } else if (params.method === 'PATCH') {
          console.log('Referral updated.');
        }

        var nextState = (0, _languageCommon.composeNextState)(state, resp.data || resp);
        if (callback) resolve(callback(nextState));
        resolve(nextState);
      }
    });
  });
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
        resp.token = "Bearer ".concat(resp.token);
        resolve(_objectSpread(_objectSpread({}, state), {}, {
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
    var auth = state.auth;
    var url = state.configuration.url;
    var params = {
      method: 'GET',
      url: "".concat(url, "/api/v2/cases"),
      headers: {
        Authorization: auth.token,
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
          console.log("".concat(resp.data.length, " cases retrieved from request: ").concat(JSON.stringify(response.request, null, 2)));
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
    var auth = state.auth;
    var url = state.configuration.url;

    var _expandReferences = (0, _languageCommon.expandReferences)(params)(state),
        data = _expandReferences.data;

    var requestParams = {
      method: 'POST',
      url: "".concat(url, "/api/v2/cases"),
      headers: {
        Authorization: auth.token,
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
    var auth = state.auth;
    var url = state.configuration.url;

    var _expandReferences2 = (0, _languageCommon.expandReferences)(params)(state),
        data = _expandReferences2.data;

    var requestParams = {
      method: 'PATCH',
      url: "".concat(url, "/api/v2/cases/").concat(id),
      headers: {
        Authorization: auth.token,
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
          console.log("PATCH succeeded: ".concat(response.statusCode, " ").concat(response.statusMessage));
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
    var auth = state.auth;
    var url = state.configuration.url;

    var _expandReferences3 = (0, _languageCommon.expandReferences)(params)(state),
        data = _expandReferences3.data,
        externalIds = _expandReferences3.externalIds;

    var qs = {
      remote: true,
      scope: {}
    };
    externalIds.filter(function (x) {
      return data[x];
    }).forEach(function (x) {
      // For every externalId field that is provided, add a key to the
      // scope object in our qs (queryString) and set the value for that key to
      // whatever value is found IN THE DATA for the given externalId.
      return qs[x] = "".concat(data[x]);
    });
    var requestParams = {
      method: 'GET',
      url: "".concat(url, "/api/v2/cases"),
      headers: {
        Authorization: auth.token,
        'Content-Type': 'application/json'
      },
      qs: qs
    }; // NOTE: while record_id is used in the GET, it must be dropped before -----
    // subsequent create or update calls are made as it's not valid in Primero.

    delete data['record_id']; // -------------------------------------------------------------------------

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
              data: data
            }, callback)(state));
          } else if (resp.data.length > 0) {
            console.log('Case found. Performing update.');
            resolve(updateCase(resp.data[0].id, {
              data: state.data
            }, callback)(state));
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
 * getReferrals(
 *  {
 *    externalId: "record_id",
 *    id: "7ed1d49f-14c7-4181-8d83-dc8ed1699f08"
 *  }, callback)
 * @function
 * @param {object} params - an object with an externalId value to use and the id.
 * @param {function} callback - (Optional) Callback function
 * @returns {Operation}
 */


function getReferrals(params, callback) {
  return function (state) {
    var auth = state.auth;
    var url = state.configuration.url;

    var _expandReferences4 = (0, _languageCommon.expandReferences)(params)(state),
        externalId = _expandReferences4.externalId,
        id = _expandReferences4.id;

    var requestParams = {};

    if (externalId === 'record_id') {
      console.log('Fetching by record id...');
      requestParams = {
        method: 'GET',
        url: "".concat(url, "/api/v2/cases/").concat(id, "/referrals"),
        headers: {
          Authorization: auth.token,
          'Content-Type': 'application/json'
        }
      };
      return queryHandler(state, requestParams, callback);
    } else {
      console.log('Fetching by case id...');
      var qs = {
        case_id: "".concat(id)
      };
      requestParams = {
        method: 'GET',
        url: "".concat(url, "/api/v2/cases"),
        headers: {
          Authorization: auth.token,
          'Content-Type': 'application/json'
        },
        qs: qs
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
            var resp = (0, _Utils.tryJson)(body);

            if (resp.data.length == 0) {
              // console.log('No case found.');
              reject('No case found');
              return state;
            } else if (resp.data.length === 1) {
              console.log('Case found. Fetching referrals.');
              var _id = resp.data[0].id;
              requestParams = {
                method: 'GET',
                url: "".concat(url, "/api/v2/cases/").concat(_id, "/referrals"),
                headers: {
                  Authorization: auth.token,
                  'Content-Type': 'application/json'
                }
              };
              resolve(queryHandler(state, requestParams, callback));
            } else {
              reject('Multiple cases found. Try using another externalId and ensure that it is unique.');
            }
          }
        });
      });
    }
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
    var auth = state.auth;
    var url = state.configuration.url;

    var _expandReferences5 = (0, _languageCommon.expandReferences)(params)(state),
        data = _expandReferences5.data;

    var requestParams = {
      method: 'POST',
      url: "".concat(url, "/api/v2/cases/referrals"),
      headers: {
        Authorization: auth.token,
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
/**
 * Update referrals for a specific case in Primero
 * @public
 * @example
 * updateReferrals(
 *  {
 *    externalId: "record_id",
 *    id: "7ed1d49f-14c7-4181-8d83-dc8ed1699f08"
 *    referral_id: "37612f65-3bda-48eb-b526-d31383f94166",
 *    data: state => state.data
 *  },
 *  callback)
 * @function
 * @param {object} params - an object with an externalId value to use, the id and the referral id to update.
 * @param {function} callback - (Optional) Callback function
 * @returns {Operation}
 */


function updateReferrals(params, callback) {
  return function (state) {
    var auth = state.auth;
    var url = state.configuration.url;

    var _expandReferences6 = (0, _languageCommon.expandReferences)(params)(state),
        externalId = _expandReferences6.externalId,
        id = _expandReferences6.id,
        referral_id = _expandReferences6.referral_id,
        data = _expandReferences6.data;

    var requestParams = {};

    if (externalId === 'record_id') {
      console.log('Updating by record id...');
      requestParams = {
        method: 'PATCH',
        url: "".concat(url, "/api/v2/cases/").concat(id, "/referrals/").concat(referral_id),
        headers: {
          Authorization: auth.token,
          'Content-Type': 'application/json'
        },
        json: {
          data: data
        }
      };
      return queryHandler(state, requestParams, callback);
    } else {
      console.log('Updating by case id...');
      var qs = {
        case_id: "".concat(id)
      };
      requestParams = {
        method: 'GET',
        url: "".concat(url, "/api/v2/cases"),
        headers: {
          Authorization: auth.token,
          'Content-Type': 'application/json'
        },
        qs: qs
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
            var resp = (0, _Utils.tryJson)(body);

            if (resp.data.length == 0) {
              console.log('No case found.');
              resolve(state);
              return state;
            } else if (resp.data.length === 1) {
              console.log('Case found. Fetching referrals.');
              var _id2 = resp.data[0].id;
              requestParams = {
                method: 'PATCH',
                url: "".concat(url, "/api/v2/cases/").concat(_id2, "/referrals/").concat(referral_id),
                headers: {
                  Authorization: auth.token,
                  'Content-Type': 'application/json'
                },
                json: {
                  data: data
                }
              };
              resolve(queryHandler(state, requestParams, callback));
            } else {
              reject('Multiple cases found. Try using another externalId and ensure that it is unique.');
            }
          }
        });
      });
    }
  };
}