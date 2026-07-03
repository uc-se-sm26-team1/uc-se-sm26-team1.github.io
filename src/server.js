// =============================================================================
// EECE/CS 3093C Software Engineering — Lab 1
// server.js — code skeleton provided by Phu Phung
// complete implementation by Corey Brunner
// =============================================================================
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static(path.join(__dirname, "ui")));

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log("Server running on port " + PORT));

// In-memory store: socketId → username
const userlist = new Map();

io.on("connection", (socket) => {
  // Auto-assign a unique username from the socket ID
  //const username = 'User_' + socket.id.slice(-5);
  socket.on("joinedUser", (username) => {
    userlist.set(socket.id, username);
    console.log("New client connected - socket ID: " + socket.id);
    io.emit(
      "status",
      username +
        " joined the chat. Number of connected clients: " +
        userlist.size,
    );
    console.log(Array.from(userlist.values()));
    io.emit("user-list", Array.from(userlist.values()));
  });

  //Todo: UC-02 (AC-02.1): notify all connected clients that a new user joined
  // ---------------------------------------------------------------------------
  // Use-Case-01: Send message
  //
  // AC-01.1: a username is always assigned on connection — every sender
  //          is identified before any message can be sent
  // AC-01.2: empty or non-string messages are ignored — no broadcast is sent
  // AC-01.3: the message is broadcast to ALL connected clients
  // AC-01.4: the broadcast payload includes the sender's username and the text
  // AC-01.5: input is cleared after sending (enforced client-side)
  // ---------------------------------------------------------------------------
  //Todo: code to implement the above use case and AC items
  socket.on("message", (data) => {
    //AC-01.2: ignore empty messages
    if (!data || data.trim() === "") return;
    //AC-01.3 + AC-01.4: broadcast to all clients with sender username
    const sender = userlist.get(socket.id);
    console.log(`DEBUG>"${sender}: sent ${data}"`);
    io.emit("message", sender + " says: " + data.trim());
  });

  socket.on("private-message", (data) => {
    const sender = userlist.get(socket.id);
    if (!sender) return;
    if (
      !data ||
      typeof data.text !== "string" ||
      data.text.trim() === "" ||
      !data.to
    )
      return;

    const payload = {
      from: sender,
      to: data.to,
      text: data.text.trim(),
      timestamp: new Date().toISOString(),
    };

    const targetSocketId = [...userlist.entries()].find(
      ([id, username]) => username === data.to,
    )?.[0];

    if (targetSocketId) {
      console.log(`DEBUG> private: ${sender} -> ${data.to}: ${payload.text}`);
      io.to(targetSocketId).emit("private-message", payload);
      socket.emit("private-message", payload);
    } else {
      socket.emit("private-message-error", `${data.to} is not online.`);
    }
  });

  // (F1.8) Typing Status Indicator - Public and Private Chat
  // Public typing: show typing status to everyone except the person typing
  socket.on("public-typing", () => {
    const username = userlist.get(socket.id);
    if (!username) return;

    socket.broadcast.emit("public-typing", username);
  });

  socket.on("public-stop-typing", () => {
    const username = userlist.get(socket.id);
    if (!username) return;

    socket.broadcast.emit("public-stop-typing", username);
  });

  // Private typing: show typing status to the selected recipient
  socket.on("private-typing", (data) => {
    const sender = userlist.get(socket.id);
    if (!sender) {
      return;
    }
    if (!data || !data.to) {
      return;
    }

    const targetSocketId = [...userlist.entries()].find(
      ([id, username]) => username === data.to)?.[0];

    if (targetSocketId) {
      io.to(targetSocketId).emit("private-typing", sender);
    }

    socket.on("private-stop-typing", (data) => {
      const sender = userlist.get(socket.id);
      if (!sender) {
        return;
      }
      if (!data || !data.to) {
        return;
      }

      const targetSocketId = [...userlist.entries()].find(
        ([id, username]) => username === data.to)?.[0];

      if (targetSocketId) {
        io.to(targetSocketId).emit("private-stop-typing", sender);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Use-Case-02: Receive message — disconnect notification
  //
  // AC-02.2: all connected clients are notified when a user leaves
  // ---------------------------------------------------------------------------
  socket.on("disconnect", () => {
    const username = userlist.get(socket.id);
    userlist.delete(socket.id);
    console.log("Client disconnected - socket ID: " + socket.id);
    //todo: code to broadcast the status
    io.emit(
      "status",
      username +
        " left the chat. Number of connected clients: " +
        userlist.size,
    );
    io.emit("user-list", Array.from(userlist.values()));
  });
});
