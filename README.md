# Language Primero [![Build Status](https://travis-ci.org/OpenFn/language-primero.svg?branch=master)](https://travis-ci.org/OpenFn/language-primero)

Language Pack for building expressions and operations for use with UNICEF's Primero API.

## Documentation

## Fetch

#### sample configuration

```js
{
  "username": "taylor@openfn.org",
  "password": "supersecret",
  "baseUrl": "https://instance_name.surveycto.com",
  "authType": "digest"
}
```

### Get cases from Primero with query parameters

Use this function to get cases from Primero based on a set of query parameters. Note that in many implementations, the `remote` attribute should be set to `true` to ensure that only cases marked for remote access will be retrieved.

```js
getCases(
  {
    remote: true,
    scope: {
      transitions_created_at: "dateRange||17-Mar-2008.17-Mar-2008",
      service_response_types: "list||referral_to_oscar",
    },
  },
  (state) => {
    console.log("Here is the callback.");
    return state;
  }
);
```

[Docs](docs/index)

## Development

Clone the repo, run `npm install`.

Run tests using `npm run test` or `npm run test:watch`

Build the project using `make`.
