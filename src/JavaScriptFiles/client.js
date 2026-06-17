function sendMessage(){
    var message = chatMessageInput.value.trim();
    if(!message) {return;}
    console.log("Debug>Chat message:" + message);
    chatMessageInput.value = "";
    chatMessageInput.focus();
}
var sendBtnElm = document.getElementById("send-button");
if(!sendBtnElm) {
    console.log("Error in getting 'send-button' element");
}

sendBtnElm.addEventListener("click", sendMessage);

var chatMessageInput = document.getElementById("chat-message");
if(!chatMessageInput) {
    console.log("Error in getting 'chat-message' input");
}

chatMessageInput.addEventListener("keypress", function(e) {
    if(e.key === "Enter") {
        sendMessage();
    }
});