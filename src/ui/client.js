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

chatMessageInput.addEventListener('input', refreshComposerLinks);

// =============================================================================
// Use-Case-01: Send Message
// =============================================================================

function sendMessage() {
  linkifyElement(chatMessageInput);
  var messageText = chatMessageInput.innerText.trim();
  if (!messageText) return;   // AC-02.2: empty messages are ignored

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
    linkifyElement(d);
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

function refreshComposerLinks(e) {
  var caretPosition = getCaretPosition(chatMessageInput);
  var isDelete = e && e.inputType && e.inputType.indexOf('delete') === 0;

  if (!isDelete) {
      updateExistingLinkHrefs(chatMessageInput);
  }

  linkifyElement(chatMessageInput);
  setCaretPosition(chatMessageInput, caretPosition);
}

function linkifyElement(root) {
  var textNodes = [];
  var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function(node) {
          if (node.parentElement && node.parentElement.closest('a')) {
              return NodeFilter.FILTER_REJECT;
          }

          return /https?:\/\/[^\s<]+/.test(node.nodeValue)
              ? NodeFilter.FILTER_ACCEPT
              : NodeFilter.FILTER_REJECT;
      }
  });

  while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
  }

  textNodes.forEach(linkifyTextNode);
}

function linkifyTextNode(textNode) {
  var text = textNode.nodeValue;
  var urlRegex = /https?:\/\/[^\s<]+/g;
  var fragment = document.createDocumentFragment();
  var lastIndex = 0;
  var match;

  while ((match = urlRegex.exec(text)) !== null) {
      var url = match[0];

      fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));

      var link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.innerText = url;
      fragment.appendChild(link);

      lastIndex = match.index + url.length;
  }

  fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
  textNode.parentNode.replaceChild(fragment, textNode);
}

function updateExistingLinkHrefs(root) {
  var links = root.querySelectorAll('a');

  links.forEach(function(link) {
    var visibleText = link.innerText.trim();

    if (/^https?:\/\/[^\s<]+$/.test(visibleText)) {
        link.href = visibleText;
    }
  });
}