VoxEngine.addEventListener(AppEvents.CallAlerting, function(e) {
  const call = VoxEngine.callConference("myconf",
    e.callerid,
    e.displayName,
    {},
    e.scheme);
  VoxEngine.easyProcess(e.call, call);
});
