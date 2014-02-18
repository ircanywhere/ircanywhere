IRCAnywhere Daemon
==================

*(c) 2013-2014 http://ircanywhere.com*

**Author:** Ricki Hastings

IRCAnywhere server/websocket.js

class WebSocket
---------------

**Methods**

WebSocket.WebSocket(socket)
---------------------------

Wrapper for sock.js sockets

**Parameters**

**socket**: *Object*,

**Returns**

void

WebSocket.bindEvents(raw)
-------------------------

Binds our sock.js events to \_socket

**Parameters**

**raw**: *Object*,

**Returns**

void

WebSocket.isValid(parsed)
-------------------------

Checks if an incoming message object is valid

**Parameters**

**parsed**: *Object*,

WebSocket.onMessage(raw)
------------------------

Handles an incoming message

**Parameters**

**raw**: *Object*,

**Returns**

void

WebSocket.onClose()
-------------------

Handles closing the connection

**Returns**

void

WebSocket.send(event, data, close)
----------------------------------

Sends outgoing packets

**Parameters**

**event**: *String*,

**data**: *Object*,

**close**: *Boolean*,

**Returns**

void

WebSocket.sendBurst(data)
-------------------------

Compiles a temporary GET route and sends it to a socket

**Parameters**

**data**: *Object*,

**Returns**

void
