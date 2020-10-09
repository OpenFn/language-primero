<img src="https://user-images.strikinglycdn.com/res/hrscywv4p/image/upload/c_limit,fl_lossy,h_9000,w_1200,f_auto,q_auto/195711/_IMS-logos_all_TM-02_vagcfc.png" height="100">

# Language Primero [<img src="https://avatars2.githubusercontent.com/u/9555108?s=200&v=4)" alt="alt text" height="20">](https://www.openfn.org) [![Build Status](https://travis-ci.org/OpenFn/language-primero.svg?branch=master)](https://travis-ci.org/OpenFn/language-primero)

Language Pack for building expressions and operations for use with UNICEF's
Primero API.

## Primero API Versions

### Adaptor for Primero v2.0 coming soon!

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

### Get cases from Primero with query parameters

Use this function to get cases from Primero based on a set of query parameters.
Note that in many implementations, the `remote` attribute should be set to
`true` to ensure that only cases marked for remote access will be retrieved.

```js
getCases(
  {
    remote: true,
    scope: {
      transitions_created_at: 'dateRange||17-Mar-2008.17-Mar-2008',
      service_response_types: 'list||referral_to_oscar',
    },
  },
  state => {
    console.log('Here is the callback.');
    return state;
  }
);
```

### Create a new case in Primero

Use this function to insert a new case in Primero based on a set of Data.

```js
createCase(
  {
    data: {
      remote: true,
      oscar_number: c.oscar_number,
      case_id: c.case_id,
      child: {
        date_of_birth: "2020-01-02",
        ...,
        services_section: [ ... ],
        transitions: [ ... ]
      },
    }
  }
);
```

### Update case with query Parameters

Use this function to update an existing case from Primero. In this
implementation, the function uses and ID to check for the case to update.

```js
updateCase(
  {
    id: "case_id",
    data: {
      remote: true,
      oscar_number: c.oscar_number,
      case_id: c.case_id,
      child: {
        date_of_birth: "2020-01-02",
        ...,
        services_section: [ ... ],
        transitions: [ ... ]
      },
    }
  }
);
```

### Update or Insert a case with query Parameters

Use this function to update an existing case from Primero or to insert it
otherwise. In this implementation, we first check if the case exist before
choosing the right operation to do.

```js
upsertCase(
  {
    externalIds: ["case_id"],
    data: {
      remote: true,
      oscar_number: c.oscar_number,
      case_id: c.case_id,
      child: {
        date_of_birth: "2020-01-02",
        ...,
        services_section: [ ... ],
        transitions: [ ... ]
      },
    }
  }
);
```

## Development

Clone the repo, run `npm install`.

Run tests using `npm run test` or `npm run test:watch`

Build the project using `make`.
