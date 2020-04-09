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
 *  getCases({
 *    remote: true,
 *    scope: {
 *      transitions_created_at: 'dateRange||17-Mar-2008.17-Mar-2008',
 *      service_response_types: 'list||referral_to_oscar',
 *    },
 *  })
 * @function
 * @param {object} params - an object with a query param at minimum.
 * @returns {Operation}
 */
export function getCases(query) {
  return (state) => {
    const { url, user, password } = state.configuration;

    const params = {
      method: 'GET',
      // NOTE: these filters do not seem to work as specified in the Primero API docs.
      // url: `${url}/api/cases?remote=true&scope[transitions_created_at]=date_range||17-Mar-2020.17-Mar-2020&scope[service_response_types]=list||referral_to_oscar`,
      // url: `${url}/api/cases\?remote\=true\&scope%5Btransitions_created_at%5D\=17-Mar-2008.17-Mar-2008\&scope%5Bservice_response_types%5D\=referral_to_oscar`,
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

/**
 * Create case in Primero
 * @public
 * @example
 *  createCase(params)
 * @function
 * @param {object} params - an object with some case data.
 * @param {function} callback - (Optional) Callback function
 * @returns {Operation}
 */
export function createCase(params) {
  return (state) => {
    const { url, user, password } = state.configuration;
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
          const nextState = composeNextState(state, resp);
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
 *  updateCase(id, params)
 * @function
 * @param {object} params - an object with some case data.
 * @param {function} callback - (Optional) Callback function
 * @returns {Operation}
 */
export function updateCase(id, params) {
  return (state) => {
    const { url, user, password } = state.configuration;
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
 *  upsertCase(params)
 * @function
 * @param {object} params - an object with an externalId and some case data.
 * @param {function} callback - (Optional) Callback function
 * @returns {Operation}
 */
export function upsertCase(params, callback) {
  return (state) => {
    const { url, user, password } = state.configuration;
    const { data, externalId } = expandReferences(params)(state);

    var qs = {
      remote: true,
      locale: 'en',
      mobile: 'true',
      scope: {},
    };

    qs.scope[externalId] = `list||${data[externalId]}`;

    const requestParams = {
      method: 'GET',
      url: `${url}/api/cases`,
      jar: true,
      qs,
    };

    console.log(
      `Attempting upsert with ${JSON.stringify(requestParams, null, 2)}`
    );

    return new Promise((resolve, reject) => {
      request(requestParams, (error, response, body) => {
        error = assembleError({ error, response, params: {} });
        if (error) {
          reject(error);
        } else {
          const resp = tryJson(body);
          if (resp.length == 0) {
            console.log(
              `Resp was ${resp}, creating with ${JSON.stringify(data, null, 2)}`
            );
            resolve(createCase(data)(state));
          } else if (resp.length == 1) {
            console.log(
              `Resp was ${resp}, updating with ${JSON.stringify(data, null, 2)}`
            );
            resolve(updateCase(resp[0].id, data));
          } else {
            reject('Multiple cases found.');
          }
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
