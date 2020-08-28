require("conference");

let conf;
let partsCounter = 0;

function checkForTermination() {
  if (partsCounter === 0) {
    conf.stop();
    conf = null;
  }
}

VoxEngine.addEventListener(AppEvents.Started, function (event) {
  conf = VoxEngine.createConference({hd_audio: true});
  conf.addEventListener(ConferenceEvents.Stopped, function (event2) {
    Logger.write('Conference was stopped!');
    VoxEngine.terminate();
  });
  conf.addEventListener(ConferenceEvents.Started, function (event2) {
    Logger.write(`Conference started ID: ${e.conference.getId()}`);
  });
});

VoxEngine.addEventListener(AppEvents.CallAlerting, function (event) {
  e.call.addEventListener(CallEvents.Disconnected, function (event2) {
    partsCounter = partsCounter - 1;
    if (partsCounter === 0) {
      setTimeout(checkForTermination, 1000 * 10); // wait for 10 seconds
    }
  });
  e.call.answer();
  partsCounter = partsCounter + 1;
  const endpoint = conf.add({
    call: e.call,
    mode: "FORWARD",
    direction: "BOTH", scheme: e.scheme
  });
  Logger.write(`New endpoint was added ID: ${e.endpoint.id()}`);
});
