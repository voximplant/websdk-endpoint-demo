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

// set EventListener for the form submimission;
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


//Link to current active call
let currentCall;

//create new call
callForm.addEventListener('submit', function (e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  currentCall = sdk.callConference({number: formData.get('number'), video: {sendVideo: true, receiveVideo: true}});
  bindCallCallbacks();
});

//Action on disconnect form
callDisconnect.addEventListener('submit', function (e) {
  e.preventDefault();
  currentCall.hangup();
});

//Bind primary callbacks
function bindCallCallbacks(e){
  logger.write(`[WebSDk] Setup listeners for ID: ${currentCall.id()}`);
  currentCall.on(VoxImplant.CallEvents.Connected,onCallConnected);
  currentCall.on(VoxImplant.CallEvents.Disconnected,onCallDisconnected);
  currentCall.on(VoxImplant.CallEvents.Failed,onCallFailed);
  callForm.style.display = 'none';
  callDisconnect.style.display = 'block';
}

function onCallConnected(e) {
  logger.write(`[WebSDk] Call connected ID: ${e.call.id()}`);
}

function onCallDisconnected(e) {
  logger.write(`[WebSDk] Call ended ID: ${e.call.id()}`);
  currentCall = null;
  callForm.style.display = 'block';
  callDisconnect.style.display = 'none';
}

function onCallFailed(e) {
  logger.write(`[WebSDk] Call failed ID: ${e.call.id()}`);
  currentCall = null;
  callForm.style.display = 'block';
  callDisconnect.style.display = 'none';
}
