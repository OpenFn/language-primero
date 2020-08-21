# Language Primero [![Build Status](https://travis-ci.org/OpenFn/language-primero.svg?branch=master)](https://travis-ci.org/OpenFn/language-primero)

Language Pack for building expressions and operations for use with UNICEF's
Primero API.

## Primero API Versions

`v1.0.7` of this adaptor was built for the Primero `v1.1` API. In the future, we
may be able to provide complete `v1` and `v2` Primero API compatibility in
`language-primero-v1.1` but are waiting to see if significant changes are
required related to authentication.

[Primero API v1.1 Documentation](https://docs.google.com/document/d/1jpaT2_UBBnc3PxPYlLMBEzNUkyfuxRZiksywG5MKM0Q/edit)

#### Primero Authentication Strategies

The Primero team is considering a shift to Microsoft Azure Active Directory B2C
for auth. We can likely accommodate this with a similar pattern as has been used
in our Microsoft Dynamics, Github, or Google Sheets adaptors, but we'll need to
await final doucmentation for Primero's `v2` API before making changes.

[Azure Active Directory B2C](https://docs.microsoft.com/en-us/azure/active-directory-b2c/)

## Technical Documentation

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

#### sample fetch expression

```js
fetch({
  getEndpoint: 'api/v1/forms/data/wide/json/mod_coach',
  query: function (state) {
    return { date: dataValue('_json[(@.length-1)].SubmissionDate')(state) };
  },
  postUrl: 'http://localhost:4000/inbox/8ad63a29-5c25-4d8d-ba2c-fe6274dcfbab',
});
```

#### sample custom GET and then POST

```js
get('forms/data/wide/json/form_id', {
  query: function (state) {
    return { date: state.lastSubmissionDate || 'Aug 29, 2016 4:44:26 PM' };
  },
  callback: function (state) {
    // Pick submissions out in order to avoid `post` overwriting `response`.
    var submissions = state.response.body;
    // return submissions
    return submissions
      .reduce(function (acc, item) {
        // tag submissions as part of the "form_id" form
        item.formId = 'form_id';
        return acc.then(
          post('https://www.openfn.org/inbox/very-very-secret', { body: item })
        );
      }, Promise.resolve(state))
      .then(function (state) {
        if (submissions.length) {
          state.lastSubmissionDate =
            submissions[submissions.length - 1].SubmissionDate;
        }
        return state;
      })
      .then(function (state) {
        delete state.response;
        return state;
      });
  },
});
```

### Sample post with existing data

```js
postData({
  url: 'INSERT_URL_HERE',
  body: function (state) {
    return {
      field_1: 'some_data',
      field_2: 'some_more_data',
      field_id: dataValue('Some.Json.Object.Id')(state),
    };
  },
  headers: {
    Authorization: 'AUTH_KEY',
    'Content-Type': 'application/json',
  },
});
```

[Docs](docs/index)

## Development

Clone the repo, run `npm install`.

Run tests using `npm run test` or `npm run test:watch`

Build the project using `make`.
