import { Selector, RequestMock, ClientFunction } from 'testcafe';
import JWTDecode from 'jwt-decode';
import { AuthenticationClient } from 'auth0';
require('dotenv').config();

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const CLIENT_ID = process.env.CLIENT_ID;
const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;
const CALLBACK_URL = process.env.CALLBACK_URL;
const AUDIENCE = process.env.AUDIENCE;
const SCOPE = process.env.SCOPE;
const PROTECTED_URL = process.env.PROTECTED_URL;

const loginResponseMockBody = `
<!DOCTYPE html>
  <html>
  ${CALLBACK_URL}
  </body>
</html>
`;

const localStorageSet = ClientFunction((key, val) => {
  localStorage.setItem(key, val);
});

const auth0 = new AuthenticationClient({
  domain: AUTH0_DOMAIN,
  clientId: CLIENT_ID,
});

const getPasswordGrant = async (data) => {
  return new Promise((resolve, reject) => {
    auth0.passwordGrant(data, (error, authData) => { // can throw SELF_SIGNED_CERT_IN_CHAIN || DEPTH_ZERO_SELF_SIGNED_CERT if vpn connected or variables are not set properly
      if (error) {
        console.error(error);
        reject(error);
      } else {
        resolve(authData);
      }
    });
  });

};

const mockLogin = RequestMock()
  .onRequestTo(CALLBACK_URL)
  .respond(loginResponseMockBody, 200);

fixture('Log in');

test('Log in to your app via some Authentication as a Service Provider (Auth0)', async (t) => {

  const authData = {
    username: USERNAME,
    password: PASSWORD,
    audience: AUDIENCE,
    scope: SCOPE
  };

  // Authenticates via ROPC
  const accessInformation = await getPasswordGrant(authData);
  const { access_token, id_token } = accessInformation;
  const tokenData = JWTDecode(id_token);
  const { exp, iat } = tokenData;
  const expiry = exp * 1000;
  const renewed = iat * 1000;
  
  // Adds request hook to mock universal login 
  await t.addRequestHooks(mockLogin);
  const initialWindow = await t.getCurrentWindow();
  
  // Opens call back url from universal login origin on a new window to avoid infinite loop 
  const authWindow = await t.openWindow(CALLBACK_URL);
  await t.switchToWindow(authWindow);
  
  // Sets local storage and injects authentication data programatically
  await localStorageSet('amperity.login.access-token', access_token);
  await localStorageSet('amperity.login.expiry', expiry);
  await localStorageSet('amperity.login.last-renewed', renewed);
  await localStorageSet('amperity.login.id-token', id_token);
  await t.removeRequestHooks(mockLogin);
  await t.closeWindow();
  
  // Switches back to initial window once authentication data is injected on local storage
  await t.switchToWindow(initialWindow);
  
  // Navigates to protected url. At this point, authentication should have happened successfully.
  await t.navigateTo(PROTECTED_URL);
  const isUserLoggedInElement = Selector('.some-selector-for-an-element-displayed-only-when-page-is-loaded')
  await t.wait(7000) // wait for a little bit just to make sure page is completely loaded
  await t.expect(isUserLoggedInElement.visible).ok('Unable to verify  if user is logged in');
});
