IRCAnywhere Daemon
==================

*(c) 2013-2014 http://ircanywhere.com*

**Author:** Ricki Hastings

IRCAnywhere server/sockets.js

XXX: I want to rename this to observer/rpc at some point in 0.2.0 final
and merge the commands into a more RPC style which are probably defined
in websocket.js, because the majority of this code is handling the mongo
observer stuff and handling allow rules. Little of it is socket based
code, and only a bit of it is socket managing code.

I also want to incorporate it all (especially the allow rules) into a
more DI based style where any modules can inject their own RPC methods
and allow rules by just putting items into the prototype (is this
possible?) or extend based, for example;

::

CustomModule = \_.extend(BaseModule, { 'allow.collection': { insert:
function() { ... } }, rpc: { mySocketCommand: function() { ... } } });

These would just inject the rpc methods / allow rules into the main RPC
manager (this). Or something similar. I'll spend time ironing out the
details at some point

update()
--------

An allow rule for updates to the user record, we can only change the
selectedTab value here and it only works for the logged in user.

update()
--------

An update rule to execute when we've passed the allow rules

update()
--------

An allow rule for updates to the tab collections, checks the correct
properties are being updated and their type, also then checks if they
are allowed to update the specific document.

insert()
--------

An allow rule for inserts to the tab collection, we check for target,
type and network id

update()
--------

An update rule to execute when we've passed the allow rules

insert()
--------

An insert rule for the tab collection

insert()
--------

An allow rule for inserts to the commands collection, similar to the one
above checks for parameters then their uid to see if they can insert a
command into that tab

insert()
--------

An insert date rule to execute when we've passed the allow rules

update()
--------

An update rule to execute when we've passed the allow rules

update()
--------

An update rule to execute when we've passed the allow rules

class SocketManager
-------------------

**Methods**

SocketManager.SocketManager()
-----------------------------

Responsible for handling all the websockets and their RPC-style commands

**Returns**

void

SocketManager.update(uid, query, update)
----------------------------------------

An allow rule for updates to the user record, we can only change the
selectedTab value here and it only works for the logged in user.

**Parameters**

**uid**: *ObjectID*,

**query**: *Object*,

**update**: *Object*,

SocketManager.update(uid, query, update)
----------------------------------------

An update rule to execute when we've passed the allow rules

**Parameters**

**uid**: *ObjectID*,

**query**: *Object*,

**update**: *Object*,

**Returns**

void

SocketManager.update(uid, query, update)
----------------------------------------

An allow rule for updates to the tab collections, checks the correct
properties are being updated and their type, also then checks if they
are allowed to update the specific document.

**Parameters**

**uid**: *ObjectID*,

**query**: *Object*,

**update**: *Object*,

SocketManager.update(uid, insert)
---------------------------------

An allow rule for inserts to the tab collection, we check for target,
type and network id

**Parameters**

**uid**: *ObjectID*,

**insert**: *Object*,

SocketManager.update(uid, query, update)
----------------------------------------

An update rule to execute when we've passed the allow rules

**Parameters**

**uid**: *ObjectID*,

**query**: *Object*,

**update**: *Object*,

**Returns**

void

SocketManager.insert(uid, insert)
---------------------------------

An insert rule for the tab collection

**Parameters**

**uid**: *ObjectID*,

**insert**: *Object*,

**Returns**

void

SocketManager.insert(uid, insert)
---------------------------------

An allow rule for inserts to the commands collection, similar to the one
above checks for parameters then their uid to see if they can insert a
command into that tab

**Parameters**

**uid**: *ObjectID*,

**insert**: *Object*,

SocketManager.insert(uid, update)
---------------------------------

An insert date rule to execute when we've passed the allow rules

**Parameters**

**uid**: *ObjectID*,

**update**: *Object*,

**Returns**

void

SocketManager.update(uid, query, update)
----------------------------------------

An update rule to execute when we've passed the allow rules

**Parameters**

**uid**: *ObjectID*,

**query**: *Object*,

**update**: *Object*,

**Returns**

void

SocketManager.update(uid, query, update)
----------------------------------------

An update rule to execute when we've passed the allow rules

**Parameters**

**uid**: *ObjectID*,

**query**: *Object*,

**update**: *Object*,

**Returns**

void

SocketManager.allow(collection, object)
---------------------------------------

Responsible for setting allow rules on collection modifications from the
client side currently only compatible with inserts and updates.

**Parameters**

**collection**: *String*,

**object**: *Object*,

**Returns**

void

SocketManager.rules(collection, object)
---------------------------------------

Responsible for setting operation rules on how to update things

**Parameters**

**collection**: *String*,

**object**: *Object*,

**Returns**

void

SocketManager.init()
--------------------

Called when the application is ready, sets up an observer on our
collections so we can figure out whether we need to propogate them to
clients and who to.

We also setup the websocket connection handlers and everything relating
to that here.

**Returns**

void

SocketManager.onSocketOpen(socket)
----------------------------------

Handles a new websocket opening

**Parameters**

**socket**: *Object*,

**Returns**

void

SocketManager.handleAuth(socket, data, callback)
------------------------------------------------

Handles the authentication command sent to us from websocket clients
Authenticates us against login tokens in the user record, disconnects if
expired or incorrect.

**Parameters**

**socket**: *Object*,

**data**: *Object*,

**callback**: *Function*,

**Returns**

void

SocketManager.handleConnect(socket)
-----------------------------------

Handles new websocket clients, this is only done after they have been
authenticated and it's been accepted.

**Parameters**

**socket**: *Object*,

**Returns**

void

SocketManager.handleEvents(socket, data)
----------------------------------------

Handles queries to the events collection

**Parameters**

**socket**: *Object*,

**data**: *Object*,

**Returns**

void

SocketManager.handleInsert(socket, data)
----------------------------------------

Handles insert rpc calls

**Parameters**

**socket**: *Object*,

**data**: *Object*,

**Returns**

void

SocketManager.handleUpdate(socket, data)
----------------------------------------

Handles update rpc calls

**Parameters**

**socket**: *Object*,

**data**: *Object*,

**Returns**

void
