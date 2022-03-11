# testcafe-auth0-login

This repo gives a workaround regarding the limitations with testcafe when it comes to test pages with multiple top level origins. Based on a great overview of [Sandrino Di Mattia](https://sandrino.dev/blog/writing-cypress-e2e-tests-with-auth0) about the mechanisms of doing automated testing on apps that use Authentication as a Service tools such as [Auth0](https://auth0.com/). This script mainly addresses an infinite redirection behavior caused by a proxied localStorage not being picked up properly by testcafe-hummerhead as it was set on a [cross-domain](https://stackoverflow.com/questions/33957477/cross-domain-localstorage-with-javascript) page using ([Universal Login](https://auth0.com/docs/login/universal-login)) whenever test is run via testcafe.

## How to run it?

### Requirements

Needs to set required variables on `.env` 

### Example

Run the following command to execute test

```
npm run test
```


## How it works

In order to overcome the cross-domain issues we mock the Universal Login, set a session programmatically in the localStorage and load the actual application on a different tab:

1. Given the user credentials we will authenticate via [ROPG](https://auth0.com/docs/login/mfa/ropg-mfa), it will give us the required data to store a session.
2. Need to set a session on the universal login page and avoid being redirected so, we'll open a new page with the login URL, mock response when being redirected and, set the session while being on the login domain.
3. Access any protected URL and wait for the app to pick the session. 
