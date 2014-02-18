IRCAnywhere Daemon
==================

*(c) 2013-2014 http://ircanywhere.com*

**Author:** Ricki Hastings

IRCAnywhere server/events.js

class EventManager
------------------

**Methods**

EventManager.EventManager()
---------------------------

Description

**Returns**

void

EventManager.insertEvent(client, message, type)
-----------------------------------------------

Inserts an event into the backlog, takes a client and message object and
a type Usually 'privmsg' or 'join' etc.

**Parameters**

**client**: *Object*,

**message**: *Object*,

**type**: *String*,

**Returns**

void

EventManager.determineHighlight(client, message, type, ours)
------------------------------------------------------------

Description

**Parameters**

**client**: *Object*,

**message**: *Object*,

**type**: *String*,

**ours**: *Boolean*,

EventManager.getPrefix(client, user)
------------------------------------

Gets the prefix for the irc client and the user object.

**Parameters**

**client**: *Object*,

**user**: *Object*,
