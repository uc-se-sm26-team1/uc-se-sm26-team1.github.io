/* =============================================================================
 * EECE/CS 3093C Software Engineering — Lab 1
 * client.js — code skeleton provided by Dr. Phu Phung
 * Code complete implementation by [Your Name]
 * ===============================================================================
 */
var socket = io(); //connect to the Socket.io Server
socket.on("connect", () => { //connected to the server
  console.log(`Connected to Socket.io server: 
    ${socket.io.opts.hostname}, port: ${socket.io.opts.port}`);
});

/**
 * code blocks below have been implemented in Lecture 8
 */
// UI DOM references
var sendBtnElm = document.getElementById('send-button');
if(!sendBtnElm) {
    console.log("Error in getting 'send-button' button");
}
// AC-01.2 (UI): Send button click triggers sendMessage()
sendBtnElm.addEventListener('click', sendMessage);

var chatMessageInput = document.getElementById('chat-message');
if(!chatMessageInput) {
    console.log('Error in getting "chat-message" input');
}
// AC-01.2 (UI): pressing Enter also triggers sendMessage()
chatMessageInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter'){
    e.preventDefault();
    sendMessage();
  }
});

var linkifyTimer;
chatMessageInput.addEventListener('input', refreshComposerLinks);
chatMessageInput.addEventListener('click', openComposerLink);

// =============================================================================
// Use-Case-01: Send Message
// =============================================================================

function sendMessage() {
  var messageText = chatMessageInput.innerText.trim();
  if (!messageText) return;   // AC-02.2: empty messages are ignored

  clearTimeout(linkifyTimer);
  linkifyComposer(false);

  var message = chatMessageInput.innerHTML.trim();
  console.log(`Debug>Chat message: ${message}`); //for UI testing only
  socket.emit('message', message);// other AC will be implemented
  chatMessageInput.innerHTML = ''; // AC-01.5: clear input after sending
  chatMessageInput.focus();
}

// =============================================================================
// Use-Case-02: Receive message 
// =============================================================================

//TODO: code to implement AC-02.1: display incoming chat messages without page refresh


//TODO: code to implement AC-02.1: display system status events (join/leave) in the status area
// AC-02.2: shows timestamp for each message
socket.on('message', displayMessage);
function displayMessage(data){
    var d = document.createElement('div');
    //AC-02.2: shows timestamp for each message
    var timeStamp = new Date().toLocaleTimeString();
    d.innerHTML ='['+ timeStamp +'] ' + data;
    document.getElementById('responses').appendChild(d);
}
// AC-02.3 (UI): auto-scroll to the latest message

//AC-02.1: display system status events join/leave in the status area
socket.on('status', function(data) {
    var statusElm = document.getElementById('status');
    //AC-02.2 shows timestamp for each message
    var timeStamp = new Date().toLocaleTimeString();
    statusElm.innerHTML = statusElm.innerHTML + '<br>['+timeStamp+'] ' + data;
    //AC-02.3 UI: auto scroll to the latest message
    statusElm.scrollTop = statusElm.scrollHeight;
  });

  function JoinChat(){
    const username = document.getElementById('username').value;
    const pattern = /^\w{3,20}$/;
    if(!username || !pattern.test(username)){
      alert("Username cannot be empty and must be between 3-20 characters long");
      return;
    }
    document.getElementById('loginUI').style.display = 'none';
    document.getElementById('chatUI').style.display = '';
    socket.emit('joinedUser', username);
  }
  document.getElementById('joinBtn').addEventListener('click', JoinChat)

  //when user joins/leave update list 
socket.on('user-list', function(data){
var userlist = document.getElementById('user-list')
//clear
userlist.innerHTML = '';
//iterate through array of users and append
data.forEach(user => {
  var list = document.createElement('div');
  list.innerHTML = user;
  userlist.appendChild(list);
});

})

//helper functions for links

function refreshComposerLinks(e) { //converts pasted links instantly but waits for typed out links
  var isDelete = e && e.inputType && e.inputType.indexOf('delete') === 0;
  var isPaste = e && e.inputType === 'insertFromPaste';
  var delay = isPaste || isDelete ? 0 : 500;

  clearTimeout(linkifyTimer);

  linkifyTimer = setTimeout(function() {
    linkifyComposer(isDelete, isPaste);
  }, delay);
}

function linkifyComposer(isDelete, allowEndOfText) { //convert to link (but deleting characters doesnt change link/href)
  if (!isDelete) {
    updateExistingLinkHrefs(chatMessageInput);
  }

  var oldHtml = chatMessageInput.innerHTML;
  var newHtml = linkifyHtml(oldHtml, allowEndOfText);

  if (oldHtml !== newHtml) {
    chatMessageInput.innerHTML = newHtml;
    placeCursorAtEnd(chatMessageInput);
  }
}

function linkifyHtml(html, allowEndOfText) { //make text not in <a> links w/o changing existing <a> tags
  var urlPattern = allowEndOfText
    ? /https?:\/\/(?=[^\s<]*\.)[^\s<]+(?=\s|&nbsp;|<|$)/g
    : /https?:\/\/(?=[^\s<]*\.)[^\s<]*?(?=\s|&nbsp;)/g;

  return html.split(/(<a\b[^>]*>.*?<\/a>)/gi).map(function(part) {
    if (part.indexOf('<a') === 0) {
      return part;
    }

    return part.replace(urlPattern, function(url) {
      return '<a href="' + url + '" target="_blank">' + url + '</a>';
    });
  }).join('');
}

function openComposerLink(e) { //open in new tab
  var link = e.target.closest('a');

  if (link && chatMessageInput.contains(link)) {
    e.preventDefault();
    window.open(link.href, '_blank');
  }
}

function updateExistingLinkHrefs(root) {
  var links = root.querySelectorAll('a');

  links.forEach(function(link) {
    var visibleText = link.innerText.trim();

    if (/^https?:\/\/(?=[^\s<]*\.)[^\s<]+$/.test(visibleText)) {
        link.href = visibleText;
    }
  });
}

function placeCursorAtEnd(element) {
  var range = document.createRange();
  var selection = window.getSelection();

  range.selectNodeContents(element);
  range.collapse(false);

  selection.removeAllRanges();
  selection.addRange(range);
}
