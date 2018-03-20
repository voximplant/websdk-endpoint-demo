'use strict';

// logger in the right column
const logger = new cLogger(document.querySelector('.js__logarea'));

const loginForm = document.querySelector('.js__login-form');
const callForm = document.querySelector('.js__call-form');
const callDisconnect  = document.querySelector('.js__call-disconnect');

// disable calling form until login
callForm.style.display = 'none';

// hide disconnect form
callDisconnect.style.display = 'none';

const sdk = VoxImplant.getInstance();

// set EventListener for the form submission;
// we can send form to server by pressing the Enter key or the "Connect&Login" button
loginForm.addEventListener('submit', async function (e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  // we must check current SDK state to prevent exception in case of repeated init and connect
  if(sdk.getClientState()!=='CONNECTED') {
    // init SDK
    await sdk.init({remoteVideoContainerId:'js__workbench'});
    logger.write('[WebSDk] Init completed');
    // connecting to the Voximplant Cloud;
    // "false" argument disables checking UDP connection (for fastest connect)
    await sdk.connect(false);
    logger.write('[WebSDk] Connected');
  }
  try {
    // logging in
    await sdk.login(formData.get('login'), formData.get('password'));
    logger.write('[WebSDk] Auth completed');
    // change form visibility
    loginForm.style.display = 'none';
    callForm.style.display = 'block';
  }catch (e) {
    logger.write('[WebSDk] Wrong login or password');
  }
});
