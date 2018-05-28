## Step 0 – Introduction

Our team proudly presents a brand new video conference functionality,
which includes:

* centralized server-based conferencing (<a href="https://webrtcglossary.com/sfu/">SFU</a>)
* up to 100 members (depends on bandwidth)
* Endpoints
* managing each Endpoint's media elements
* MediaRenderers inside Endpoints

The functionality provides vast opportunities to make one-to-many or
many-to-many video conferences with the versatile management of media elements,
streams etc. This article will help you to understand all features and advantages
of the functionality: step by step, you'll learn how to work with Endpoints and
MediaRenderers, and how to create server-based video conferences.

**You need Web SDK 4.3.0 or later to use this functionality.**


## Step 1 – Layout

First of all, let's grab a simple demo to demonstrate all further concepts
and tricks. You can get the demo layout
<a href="https://github.com/voximplant/websdk-endpoint-demo">here</a>, see the <b>Step 1</b>.

Note that in this demo we use <a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template">HTML templates</a> and <a href="https://necolas.github.io/normalize.css/">normalize.css</a>
(in addition to the main <i>style.css</i> file).

<b>We recommend using <a href="https://github.com/kzahel/web-server-chrome">Web Server for Chrome</a>
as it makes development and debugging easier.</b> Install and open the app, click "Choose folder" and specify the folder
with your project. After that you'll see the Web Server URL, that's it.

## Step 2 – Init and Login

To use Web SDK, you have to:
 * create the
<a href="https://voximplant.com/docs/references/websdk/globals.html#getinstance">Voximplant class</a> instance;
 * then <a href="https://voximplant.com/docs/references/websdk/classes/client.html#init">initialize it</a>; 
 * and <a href="https://voximplant.com/docs/references/websdk/classes/client.html#connect">connect</a> to the Voximplant cloud.
 
We are also going to use two JS files: <b>index.js</b> and <b>helper.js</b>.
The <b>index.js</b> will contain necessary code related to described concepts; the code which
is not related to the theme is placed in <b>helper.js</b>  
 
So, create <b>index.js</b> in the project's root and add first lines there to create a logger
and define variables to control form: 

```javascript
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
```

Next, we have to get the Voximplant SDK instance:
```javascript
const sdk = VoxImplant.getInstance();
```

Add a handler for the <b>submit</b> action:

```javascript
// set EventListener for the form submission;
// we can send form to server by pressing the Enter key or the "Connect&Login" button
loginForm.addEventListener('submit', async function (e) {
  e.preventDefault();
  const formData = new FormData(e.target);
});
``` 
Then we have to add a condition to that handler to make our web client connect to the Voximplant cloud:

```javascript
// we must check current SDK state to prevent an exception in case of repeated init and connect
  if(sdk.getClientState()!=='CONNECTED') {
    // init SDK
    await sdk.init({remoteVideoContainerId:'js__workbench'});
    logger.write('[WebSDk] Initialization completed');
    // connecting to the Voximplant Cloud;
    // "false" argument disables checking of UDP connection (for fastest connect)
    await sdk.connect(false);
    logger.write('[WebSDk] Connected');
  }
```

Finally, we have to log in. In case of login error, it will be mentioned in the log. To do this, add the
following code to the same handler:

```javascript
try {
    // logging in
    await sdk.login(formData.get('login'), formData.get('password'));
    logger.write('[WebSDk] Authorization completed');
    // change form visibility
    loginForm.style.display = 'none';
    callForm.style.display = 'block';
  }catch (e) {
    logger.write('[WebSDk] Wrong login or password');
  }
```



## Step 3 – Call processing

There are methods and events in Web SDK to handle incoming calls. The following code allows
to handle calls and do appropriate actions in case of call is disconnected or failed.
The <b>callForm</b> initiates a call after submission while <b>callDisconnect</b>
hangs up. Each call status reflects in a console (see the column under the forms).

Add the following blocks of code to the <b>index.js</b> to implement described logic.
Start with making a new call and hanging up a call:

```javascript
// link to current active call
let currentCall;

// create new call
callForm.addEventListener('submit', function (e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  currentCall = sdk.callConference({number: formData.get('number'), video: {sendVideo: true, receiveVideo: true}});
  bindCallCallbacks();
});

// action on disconnect form
callDisconnect.addEventListener('submit', function (e) {
  e.preventDefault();
  currentCall.hangup();
});
```

To handle incoming calls add this handler:

```javascript
sdk.on(VoxImplant.Events.IncomingCall, function (e) {
  logger.write(`[WebSDk] New incoming call with ID: ${e.call.id()}`);
  // if call already exists – hangup
  if(currentCall){
    logger.write('[WebSDk] You already have active call. Hangup.');
    e.call.hangup();
  }else{
    currentCall = e.call;
    bindCallCallbacks();
    currentCall.answer();
  }
});
```
Great! There's only one thing to do in this step – add the handlers for call's states Connected,
Disconnected and Failed: 
```javascript
// bind primary callbacks
function bindCallCallbacks(e){
  logger.write(`[WebSDk] Set up listeners for ID: ${currentCall.id()}`);
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
}

function onCallFailed(e) {
  logger.write(`[WebSDk] Call failed ID: ${e.call.id()}`);
  currentCall = null;
}
```  

Now web client is able to answer first incoming and decline other incoming calls
while the first one is active. It also handles connected/disconnected/failed call's states
and provides logging.

## Step 4 - VoxEngine: create cloud JS scenarios
Web SDK code can't perform call management by itself, without cloud JS scenario. That is why we
have to create a scenario. 
 
Create the <b>conf_local</b> scenario with the following blocks of code.
Firstly load the
<a href="https://voximplant.com/docs/references/appengine/Module_Conference.html">conference</a> module
and define variables for a conference and participants' counter:
```javascript
require("conference");

let conf;
let partsCounter = 0;

```
Now add a handler for the very first call which creates a conference. Note that the conference
creating executes once in a session.

```javascript
VoxEngine.addEventListener(AppEvents.Started, function (event) {
  conf = VoxEngine.createConference({hd_audio: true});
  conf.addEventListener(ConferenceEvents.Stopped, function (event2) {
    Logger.write('Conference was stopped!');
    VoxEngine.terminate();
  });
  conf.addEventListener(ConferenceEvents.Started, function (event2) {
    Logger.write(`Conference is started ID: ${event2.conference.getId()}`);
  });
});
```

Create another handler for further incoming calls. The handler answers a call and connects it to the conference.
It also increases participants' counter:
```javascript
VoxEngine.addEventListener(AppEvents.CallAlerting, function (e) {
  e.call.answer();
  partsCounter = partsCounter + 1;
  const endpoint = conf.add({
    call: e.call,
    mode: "FORWARD",
    direction: "BOTH", scheme: e.scheme
  });
  Logger.write(`New endpoint was added ID: ${e.endpoint.id()}`);
});
```

Put these lines to the same handler to create a function which stops
a conference if there are no participants:
```javascript
function checkForTermination() {
  if (partsCounter === 0) {
    conf.stop();
    conf = null;
  }
}

e.call.addEventListener(CallEvents.Disconnected, function (event2) {
    partsCounter = partsCounter - 1;
    if (partsCounter === 0) {
      setTimeout(checkForTermination, 1000 * 10); // wait for 10 ceconds
    }
  });
```
 

## Step 5 – VoxEngine: set up Voximplant application

To make the scenario work,
we have to create an application and two rules in it.
Go to the <a href="https://manage.voximplant.com/#applications">Applications tab</a>, click <b>Create application</b>,
type the name of a new application (“conference-app”, for example) and then click <b>Create</b>.

<img src="https://voximplant.com/assets/images/2018/03/13/new-app.jpg" align="center"/>

Then add a new rule to your <b>conference-app</b> application; you can name it <b>Incoming call</b>.
Use the <b>conf_local</b> JS scenario in this rule. Pay attention to the following details:

* The value in the <b>Pattern</b> field should be the same as an argument in the <b>conf_call</b> scenario.
In our case, it is "myconf". If a pattern isn't the same, the <b>conf_call</b> scenario won't be able
to connect incoming calls to the conference.  

* Select the <b>Video conference</b> checkbox to allow video streams in conferences.

<img src="https://voximplant.com/assets/images/2018/03/13/conf-local-rule.jpg" align="center"/>

To use the application, you need to create at least one user. Go to the <a href="https://manage.voximplant.com/#users">Users tab</a>, create a user named **user1**, set a password for it and choose the **conference-app** application; the **is active** checkbox should be selected. Click **Save**.

<img src="https://voximplant.com/assets/images/2018/04/13/new-user_2.jpg" align="center">

That's it! We have prepared the Voximplant cloud to serve video conferences.

## Step 6 – Endpoint introduction
<a href="https://voximplant.com/docs/references/websdk/classes/endpoint.html">Endpoint</a> is
one of the new concepts in the latest release. It represents any remote media unit
in a call. Endpoint can be:

* another <a href="//voximplant.com/docs/references/appengine/Call.html">call</a>
(e.g. which is joined to the conference)
* <a href="https://voximplant.com/docs/references/appengine/Module_Player.html">Player</a>
* <a href="https://voximplant.com/docs/references/appengine/Module_ASR.html">ASR</a>
* <a href="https://voximplant.com/docs/references/appengine/Module_Recorder.html">Recorder</a>

Each call from Web SDK includes only Endpoints,
which send audio/video stream to a call. That means there wouldn't be 
<a href="https://voximplant.com/docs/references/appengine/Module_ASR.html">ASR</a>'s
and <a href="https://voximplant.com/docs/references/appengine/Module_Recorder.html">Recorder</a>'s Endpoints
in a call from Web SDK. 
Voxengine conference in the cloud contains Endpoints for <b>all</b> participants:

<img src="https://voximplant.com/assets/images/2018/03/14/websdkendpoint_3.png">

Call from Web SDK also includes local audio/video and Endpoints with MediaRenderers:

<img src="https://voximplant.com/assets/images/2018/03/14/websdkendpoint-details-f.png">

There are
<a href="https://voximplant.com/docs/references/websdk/enums/endpointevents.html">events
for Endpoints</a>, which allows tracking Endpoints' behavior.
For example, we can catch the moment when another participant joined the conference
and create the container for video rendering. Accordingly, we can delete this container
when the participant left the conference.

Add a handler for the
<a href="https://voximplant.com/docs/references/websdk/enums/callevents.html#endpointadded">EndpointAdded</a>
event to the <b>bindCallCallbacks</b> function:
```javascript
currentCall.on(VoxImplant.CallEvents.EndpointAdded, onEndpointAdded);
```

Then create the <b>onEndpointAdded</b> function which sets up a rendering container for a new participant:
```javascript
function onEndpointAdded(e) {
  logger.write(`[WebSDk] New endpoint ID: ${e.endpoint.id} (${e.endpoint.isDefault?'default':'regular'}) for Call ID: ${e.call.id()}`);
  // create the display element for this endpoint
  const node = renderTemplate(e.endpoint);
  const container = document.getElementById('js__workbench');
  container.appendChild(node);
  // remove the display element with this endpoint
  e.endpoint.on(VoxImplant.EndpointEvents.Removed,onEndpointRemoved)
}
```

And the second function which deletes rendering container:
```javascript
function onEndpointRemoved(e) {
  logger.write(`[WebSDk] Endpoint was removed ID: ${e.endpoint.id} (${e.endpoint.isDefault?'default':'regular'}) for Call ID: ${e.call.id()}`);
  const container = document.getElementById('js__workbench');
  const node = document.getElementById(e.endpoint.id);
  if(node) {
    container.removeChild(node);
  }
}
```

## Step 7 – Working with MediaRenderer

It is possible to create container for video rendering
when web client started to receive remote video stream. Accordingly, we can delete
this container when remote video stream is stopped. 

When remote video is started, we have access to the
<a href="https://voximplant.com/docs/references/websdk/classes/mediarenderer.html">MediaRenderer</a>
instance. Let's use it for extended logging. Add the handlers for the
<a href="https://voximplant.com/docs/references/websdk/enums/endpointevents.html#remotemediaadded">RemoteMediaAdded</a> and
<a href="https://voximplant.com/docs/references/websdk/enums/endpointevents.html#remotemediaremoved">RemoteMediaRemoved</a>
events to the <b>onEndpointAdded</b> function:

```javascript
e.endpoint.on(VoxImplant.EndpointEvents.RemoteMediaAdded, onRemoteMediaAdded);
e.endpoint.on(VoxImplant.EndpointEvents.RemoteMediaRemoved, onRemoteMediaRemoved);

function onRemoteMediaAdded(e) {
  logger.write(`[WebSDk] New MediaRenderer ID: ${e.mediaRenderer.id} in ${e.endpoint.id} for Call ID: ${e.call.id()}`);
}

function onRemoteMediaRemoved(e) {
  logger.write(`[WebSDk] MediaRenderer was removed ID: ${e.mediaRenderer.id} in ${e.endpoint.id} for Call ID: ${e.call.id()}`);}
```

When you subscribe to the
<a href="https://voximplant.com/docs/references/websdk/enums/endpointevents.html#remotemediaadded">RemoteMediaAdded</a>
event, Web SDK will no longer render remote audio/video stream automatically,
so you have to call the
<a href="https://voximplant.com/docs/references/websdk/classes/mediarenderer.html#render">MediaRenderer.render</a>
method with optional container parameter. To do so, add the following lines to the <b>onRemoteMediaAdded</b>
function.
 
```javascript
const endpointNode = document.getElementById(e.endpoint.id);
  if(endpointNode){
    const container = endpointNode.querySelector('.endpoint__media');
    e.mediaRenderer.element.width="200";
    e.mediaRenderer.element.height="150";
    e.mediaRenderer.render(container);
  }
```

## How to use it

1. Clone this repo to your local machine.
1. Open the <a href="https://github.com/kzahel/web-server-chrome">Web Server for Chrome</a>, click **Choose folder** and specify the **Step 7** folder. Open the suggested **Web Server URL** in your browser.<br/><img src="https://voximplant.com/assets/images/2018/04/13/webchrome.jpg" width="45%"><br/>
1. Type in the **Full login** in the right column. The Full login consists of a user name (**user1**) + **@** + application name (**conference-app**) + your Voximplant account name + **voximplant.com**. Then type in the password for the **user1** and click **Connect&Login**.<br/><img src="https://voximplant.com/assets/images/2018/04/13/connect-login.jpg"><br/> Allow access to your microphone and camera.
1. Then specify **Conference name/number** as a **myconf** and click **Call**.<br/><img src="https://voximplant.com/assets/images/2018/05/28/conf-name.png"><br/> Nice, now you are the conference participant! Ask your friends to do the same steps on their machines and then enjoy your conference call.
