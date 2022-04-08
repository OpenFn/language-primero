"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setUrl = setUrl;
exports.setAuth = setAuth;
exports.scrubResponse = scrubResponse;
exports.assembleError = assembleError;
exports.tryJson = tryJson;

function setUrl(configuration, path) {
  console.log(configuration);
  if (configuration && configuration.url) return configuration.url + path;else return path;
}

function setAuth(configuration, manualAuth) {
  if (manualAuth) return manualAuth;else if (configuration && configuration.username) return {
    username: configuration.username,
    password: configuration.password,
    sendImmediately: configuration.authType != 'digest'
  };else return null;
}

function scrubResponse(response) {
  if (response) response.request.headers.Authorization = '--REDACTED--';
  return response;
}

function assembleError({
  response,
  error,
  params
}) {
  if (response) {
    const customCodes = params.options && params.options.successCodes;
    if ((customCodes || [200, 201, 202, 204]).indexOf(response.statusCode) > -1) return false;
  }

  if (error) return error;
  return new Error(`Server responded with:\n${JSON.stringify(response, null, 2)}`);
}

function tryJson(data) {
  try {
    return JSON.parse(data);
  } catch (e) {
    return {
      body: data
    };
  }
}