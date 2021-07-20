"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setUrl = setUrl;
exports.setAuth = setAuth;
exports.assembleError = assembleError;
exports.tryJson = tryJson;

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

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

function assembleError(_ref) {
  var response = _ref.response,
      error = _ref.error,
      params = _ref.params;

  if (response) {
    var customCodes = params.options && params.options.successCodes;
    if ((customCodes || [200, 201, 202, 204]).indexOf(response.statusCode) > -1) return false;
  }

  if (error) return error;

  var safeRequest = _objectSpread({}, response.request, {
    headers: 'REDACTED',
    body: 'REDACTED'
  });

  return new Error("Server responded with:  \n".concat(JSON.stringify(_objectSpread({}, response, {
    request: safeRequest
  }), null, 2)));
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
