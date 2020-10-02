/** @module Adaptor */
import {
  execute as commonExecute,
  expandReferences,
  composeNextState,
} from 'language-common';
import HttpAdaptor from 'language-http';
import { assembleError, tryJson } from './Utils';
import request from 'request';

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
export function execute(...operations) {
  const initialState = {
    references: [],
    data: null,
  };

  return state => {
    return commonExecute(
      login,
      ...operations,
      cleanupState
    )({ ...initialState, ...state });
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
  const { url, user, password } = state.configuration;

  const params = {
    method: 'POST',
    url: `${url}/api/login`,
    json: {
      user_name: user,
      password,
    },
    jar: true,
  };

  return new Promise((resolve, reject) => {
    request(params, function (error, response, body) {
      error = assembleError({ error, response, params });
      if (error) {
        reject(error);
      } else {
        const resp = tryJson(body);
        resolve({ ...state, auth: resp });
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
export function getCases(query, callback) {
  return state => {
    const { url, user, password } = state.configuration;

    const params = {
      method: 'GET',
      url: `${url}/api/cases`,
      jar: true,
      qs: query,
    };

    return new Promise((resolve, reject) => {
      request(params, function (error, response, body) {
        error = assembleError({ error, response, params });
        if (error) {
          reject(error);
        } else {
          console.log(
            `Primero says: '${response.statusCode} ${response.statusMessage}'`
          );
          const resp = tryJson(body);
          console.log(
            `${resp.length} cases retrieved from request: ${JSON.stringify(
              response.request,
              null,
              2
            )}.`
          );
          const nextState = composeNextState(state, resp);
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
export function createCase(params, callback) {
  return state => {
    const { url } = state.configuration;

    const { data } = expandReferences(params)(state);

    const requestParams = {
      method: 'POST',
      url: `${url}/api/cases`,
      json: data,
      jar: true,
    };

    return new Promise((resolve, reject) => {
      request(requestParams, (error, response, body) => {
        error = assembleError({ error, response, params: {} });
        if (error) {
          reject(error);
        } else {
          const resp = tryJson(body);
          console.log(
            `Post succeeded: ${response.statusCode} ${response.statusMessage}`
          );
          const nextState = composeNextState(state, resp.body);
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
export function updateCase(id, params, callback) {
  return state => {
    const { url } = state.configuration;
    const { data } = expandReferences(params)(state);

    const requestParams = {
      method: 'PATCH',
      url: `${url}/api/cases/${id}`,
      json: data,
      jar: true,
    };

    return new Promise((resolve, reject) => {
      request(requestParams, (error, response, body) => {
        error = assembleError({ error, response, params: {} });
        if (error) {
          reject(error);
        } else {
          const resp = tryJson(body);
          const nextState = composeNextState(state, resp);
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
 *  upsertCase({externalIds: ['case_id'], data: {...}})
 * @function
 * @param {object} params - an object with an externalId and some case data.
 * @param {function} callback - (Optional) Callback function
 * @returns {Operation}
 */
export function upsertCase(params, callback) {
  return state => {
    const { url } = state.configuration;
    const { data, externalIds } = expandReferences(params)(state);

    var qs = {
      remote: true,
      scope: {
        or: {},
      },
    };

    externalIds.map(x => {
      // For every externalId field that is provided, add a key to the
      // scope object in our qs (queryString) and set the value for that key to
      // whatever value is found IN THE DATA for the given externalId.
      return (qs.scope.or[x] = `or_op||${data[x]}`);
    });

    const requestParams = {
      method: 'GET',
      url: `${url}/api/cases`,
      jar: true,
      qs,
    };

    console.log(`Upserting: ${JSON.stringify(requestParams, null, 2)}`);

    return new Promise((resolve, reject) => {
      request(requestParams, (error, response, body) => {
        error = assembleError({ error, response, params: {} });
        if (error) {
          reject(error);
        } else {
          const resp = tryJson(body);
          if (resp.length == 0) {
            console.log('No case found. Performing create.');
            resolve(createCase({ data: state => data }, callback)(state));
          } else if (resp.length == 1) {
            console.log('Case found. Performing update.');
            resolve(
              updateCase(
                resp[0]._id,
                {
                  data: state => {
                    const { child } = data;
                    // NOTE: When performing an upsert, we only add _new_
                    // services to Primero, as defined by their "unique_id".
                    // The logic below takes the services array returned by
                    // Primero as the starting point, and concatenates it with a
                    // "newServices" array, which includes only those services
                    // whose "unique_id" values are NOT existing in the Primero
                    // services array.
                    const oldServices = resp[0].services_section;

                    if (oldServices && oldServices.length > 0) {
                      const serviceIds = oldServices.map(s => s.unique_id);

                      const newServices = child.services_section.filter(
                        os => !serviceIds.includes(os.unique_id)
                      );

                      const mergedServices = oldServices.concat(newServices);

                      return {
                        ...data,
                        child: { ...child, services_section: mergedServices },
                      };
                    }

                    return data;
                  },
                },
                callback
              )(state)
            );
          } else {
            reject(
              'Multiple cases found. Try using another externalId and ensure that it is unique.'
            );
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
export function post(path, params) {
  return state => {
    return HttpAdaptor.post(path, params)(state);
  };
}

export {
  alterState,
  dataPath,
  dataValue,
  each,
  field,
  fields,
  lastReferenceValue,
  merge,
  sourceValue,
} from 'language-common';
