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
  currentCall.on(VoxImplant.CallEvents.Connected, onCallConnected);
  currentCall.on(VoxImplant.CallEvents.Disconnected, onCallDisconnected);
  currentCall.on(VoxImplant.CallEvents.Failed, onCallFailed);
  currentCall.on(VoxImplant.CallEvents.EndpointAdded, onEndpointAdded);
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

function onEndpointAdded(e) {
  logger.write(`[WebSDk] New endpoint ID: ${e.endpoint.id} (${e.endpoint.isDefault?'default':'regular'}) for Call ID: ${e.call.id()}`);
  //Create the display element about this endpoint
  if(!e.endpoint.isDefault) {
    const node = renderTemplate(e.endpoint);
    const container = document.getElementById('js__workbench');
    container.appendChild(node);
  }
  //Remove the display element with this endpoint
  e.endpoint.on(VoxImplant.EndpointEvents.Removed, onEndpointRemoved);
  e.endpoint.on(VoxImplant.EndpointEvents.RemoteMediaAdded, onRemoteMediaAdded);
  e.endpoint.on(VoxImplant.EndpointEvents.RemoteMediaRemoved, onRemoteMediaRemoved);
}

function onEndpointRemoved(e) {
  logger.write(`[WebSDk] Endpoint was removed ID: ${e.endpoint.id} (${e.endpoint.isDefault?'default':'regular'}) for Call ID: ${e.call.id()}`);
  const container = document.getElementById('js__workbench');
  const node = document.getElementById(e.endpoint.id);
  if(node) {
    container.removeChild(node);
  }
}

function onRemoteMediaAdded(e) {
  logger.write(`[WebSDk] New MediaRenderer ID: ${e.mediaRenderer.id} in ${e.endpoint.id} for Call ID: ${e.call.id()}`);
  const endpointNode = document.getElementById(e.endpoint.id);
  if(endpointNode){
    const container = endpointNode.querySelector('.endpoint__media');
    e.mediaRenderer.element.width="200";
    e.mediaRenderer.element.height="150";
    e.mediaRenderer.render(container);

  }
}

function onRemoteMediaRemoved(e) {
  logger.write(`[WebSDk] MediaRenderer was removed ID: ${e.mediaRenderer.id} in ${e.endpoint.id} for Call ID: ${e.call.id()}`);
}
