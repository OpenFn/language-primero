/** @module Adaptor */
import {
  execute as commonExecute,
  expandReferences,
  composeNextState,
} from 'language-common';
import { assembleError, tryJson, setUrl } from './Utils';
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

  return (state) => {
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
 *  getCases({query: {}}, state => {
 *      return state;
 *  })
 * @function
 * @param {object} params - an object with a query param at minimum.
 * @param {function} callback - (Optional) Callback function
 * @returns {Operation}
 */
export function getCases(query, callback) {
  return (state) => {
    const { url, user, password } = state.configuration;

    const params = {
      method: 'GET',
      // NOTE: these filters do not seem to work as specified in the Primero API docs.
      // url: `${url}/api/cases?remote=true&scope[transitions_created_at]=17-Mar-2008.17-Mar-2008&scope[service_response_types]=referral_to_oscar`,
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
          const resp = tryJson(body);
          console.log(
            `${resp.length} cases retreived from request: ${JSON.stringify(
              response.request,
              null,
              2
            )}.`
          );
          resolve(composeNextState(state, resp));
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
