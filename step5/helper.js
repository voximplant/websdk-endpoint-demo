'use strict';

//Object for logging into a textarea
const cLogger = function(element){
  const logRecords = [];
  const textArea = element;
  this.write = function(logRecord){
    logRecords.push(logRecord.toString());
    render();
  };
  function render(){
    textArea.value = logRecords.join("\r\n");
    textArea.scrollTop = textArea.scrollHeight;
  }
};

const renderTemplate = function(endPoint){
  const template = document.getElementById('js__endpoint-template');
  template.content.querySelector('.js__endpoint-header').textContent = `ID:${endPoint.id}`;
  template.content.querySelector('.js__endpoint-username').textContent = `ID:${endPoint.userName}`;
  template.content.querySelector('.js__endpoint-displayname').textContent = `ID:${endPoint.displayName}`;
  template.content.querySelector('.js__endpoint-place').textContent = `ID:${endPoint.place}`;
  template.content.querySelector('.js__endpoint-sipuri').textContent = `ID:${endPoint.sipUri}`;
  template.content.querySelector('.js__endpoint').id = endPoint.id;
  return document.importNode(template.content,true);
};

