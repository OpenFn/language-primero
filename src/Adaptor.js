/** @module Adaptor */
import {
  execute as commonExecute,
  expandReferences,
  composeNextState,
} from 'language-common';
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
  const body = JSON.stringify({
    user: {
      user_name: user,
      password,
    },
  });

  const params = {
    method: 'POST',
    url: `${url}/api/v2/tokens`,
    headers: {
      'Content-Type': 'application/json',
    },
    body,
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
 *    case_id: '6aeaa66a-5a92-4ff5-bf7a-e59cde07eaaz' 
 *    query: 'sex=male' // optional
 *  }, callback)
 * @function
 * @param {object} query - an object with a query param at minimum.
 * @param {function} callback - (Optional) Callback function
 * @returns {Operation}
 */
export function getCases(query, callback) {
  return state => {
    const { url } = state.configuration;
    const { token } = state.auth;

    const params = {
      method: 'GET',
      url: `${url}/api/v2/cases`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
            `${resp.data.length} cases retrieved from request: ${JSON.stringify(
              response.request,
              null,
              2
            )}.`
          );
          const nextState = composeNextState(state, resp.data);
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
 *  createCase({
 *    data: state => data {
 *      "enabled": true,
 *      "age": 15,
 *      "sex": "male",
 *      "name": "Alex",
 *      "status": "open",
 *      "case_id": "6aeaa66a-5a92-4ff5-bf7a-e59cde07eaaz",
 *      "owned_by": "primero_cp"
 *    }}, callback)
 * @function
 * @param {object} params - an object with some case data.
 * @param {function} callback - (Optional) Callback function
 * @returns {Operation}
 */
export function createCase(params, callback) {
  return state => {
    const { url } = state.configuration;

    const { data } = expandReferences(params)(state);
    const { token } = state.auth;

    const body = JSON.stringify({ data: data });
    const requestParams = {
      method: 'POST',
      url: `${url}/api/v2/cases`,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        options: {
          successCodes: [200, 201, 202, 203, 204],
        },
      },
      body,
    };

    return new Promise((resolve, reject) => {
      request(requestParams, (error, response, body) => {
        error = assembleError({ error, response, params: requestParams });
        if (error) {
          reject(error);
        } else {
          const resp = tryJson(body);
          console.log(
            `Post succeeded: ${response.statusCode} ${response.statusMessage}`
          );
          const nextState = composeNextState(state, resp.data.body);
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
 *  updateCase("7ed1d49f-14c7-4181-8d83-dc8ed1699f08", {
 *    data: state => data {
 *      "age": 20,
 *      "sex": "male",
 *      "name": "Alex",
 *      "status": "open",
 *      "case_id": "6aeaa66a-5a92-4ff5-bf7a-e59cde07eaaz",
 *    }}, callback)
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
    const { token } = state.auth;

    const requestParams = {
      method: 'PATCH',
      url: `${url}/api/v2/cases/${id}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    };

    return new Promise((resolve, reject) => {
      request(requestParams, (error, response, body) => {
        error = assembleError({ error, response, params: {} });
        if (error) {
          reject(error);
        } else {
          const resp = tryJson(body);
          const nextState = composeNextState(state, resp.data);
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
export function upsertCase(params, callback) {
  return state => {
    const { url } = state.configuration;
    const { data, externalIds } = expandReferences(params)(state);
    const { token } = state.auth;

    var qs = {
      remote: true,
      scope: {},
    };

    externalIds.map(x => {
      // For every externalId field that is provided, add a key to the
      // scope object in our qs (queryString) and set the value for that key to
      // whatever value is found IN THE DATA for the given externalId.
      return (qs[x] = `${data[x]}`);
    });

    const requestParams = {
      method: 'GET',
      url: `${url}/api/v2/cases`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
          if (resp.data.length == 0) {
            console.log('No case found. Performing create.');
            resolve(createCase({ data: state => data }, callback)(state));
          } else if (resp.data.length == 1) {
            console.log('Case found. Performing update.');
            resolve(
              updateCase(
                resp.data[0].id,
                {
                  data: state => {
                    // =========== Need clarification on this. Should we test when 'child' does not exist? ===========
                    const { child } = data;
                    // NOTE: When performing an upsert, we only add _new_
                    // services to Primero, as defined by their "unique_id".
                    // The logic below takes the services array returned by
                    // Primero as the starting point, and concatenates it with a
                    // "newServices" array, which includes only those services
                    // whose "unique_id" values are NOT existing in the Primero
                    // services array.
                    const oldServices = resp.data[0].services_section;

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
 * Get referrals for a specific case in Primero
 * @public
 * @example
 *  getReferrals("7ed1d49f-14c7-4181-8d83-dc8ed1699f08", callback)
 * @function
 * @param {string} recordId - an ID to use for fetching referrals.
 * @param {function} callback - (Optional) Callback function
 * @returns {Operation}
 */
export function getReferrals(recordId, callback) {
  return state => {
    const { url } = state.configuration;
    const { token } = state.auth;

    const params = {
      method: 'GET',
      url: `${url}/api/v2/cases/${recordId}/referrals`,
      headers: {
        Authorization: `Bearer ${token}`,
      }
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
            `${resp.data.length} referrals retrieved from request: ${JSON.stringify(
              response.request,
              null,
              2
            )}.`
          );
          const nextState = composeNextState(state, resp.data);
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
 *  createReferrals({   
 *    data: {
 *     "ids": ['case_id'],
 *     "transitioned_to": "primero_cp",
 *     "notes": "Creating a referral"
 *    }}, callback)
 * @function
 * @param {object} params - an object with some case data.
 * @param {function} callback - (Optional) Callback function
 * @returns {Operation}
 */
export function createReferrals(params, callback) {
  return state => {
    const { url } = state.configuration;

    const { data } = expandReferences(params)(state);
    const { token } = state.auth;

    const body = JSON.stringify({ data: data });
    const requestParams = {
      method: 'POST',
      url: `${url}/api/v2/cases/referrals`,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        options: {
          successCodes: [200, 201, 202, 203, 204],
        },
      },
      body,
    };

    return new Promise((resolve, reject) => {
      request(requestParams, (error, response, body) => {
        error = assembleError({ error, response, params: requestParams });
        if (error) {
          reject(error);
        } else {
          const resp = tryJson(body);
          console.log(
            `Post succeeded: ${response.statusCode} ${response.statusMessage}`
          );
          const nextState = composeNextState(state, resp.data.body);
          if (callback) resolve(callback(nextState));
          resolve(nextState);
        }
      });
    });
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
