IRCAnywhere Daemon
==================

*(c) 2013-2014 http://ircanywhere.com*

**Author:** Ricki Hastings

IRCAnywhere server/irchandler.js

class IRCHandler
----------------

**Methods**

IRCHandler.IRCHandler()
-----------------------

The object responsible for handling an event from IRCFactory none of
these should be called directly, however they can be hooked onto or have
their actions prevented or replaced. The function names equal directly
to irc-factory events and are case sensitive to them.

**Returns**

void

IRCHandler.registered(client, message)
--------------------------------------

Handles a registered client

**Parameters**

**client**: *Object*,

**message**: *Object*,

**Returns**

void

IRCHandler.closed(client, message)
----------------------------------

Handles a closed connection

**Parameters**

**client**: *Object*,

**message**: *Object*,

**Returns**

void

IRCHandler.failed(client, message)
----------------------------------

Handles a failed event, which is emitted when the retry attempts are
exhaused

**Parameters**

**client**: *Object*,

**message**: *Object*,

**Returns**

void

IRCHandler.lusers(client, message)
----------------------------------

Handles an incoming lusers

**Parameters**

**client**: *Object*,

**message**: *Object*,

**Returns**

void

IRCHandler.motd(client, message)
--------------------------------

Handles an incoming motd

**Parameters**

**client**: *Object*,

**message**: *Object*,

**Returns**

void

IRCHandler.join(client, message)
--------------------------------

Handles an incoming join

**Parameters**

**client**: *Object*,

**message**: *Object*,

**Returns**

void

IRCHandler.part(client, message)
--------------------------------

Handles an incoming part

**Parameters**

**client**: *Object*,

**message**: *Object*,

**Returns**

void

IRCHandler.kick(client, message)
--------------------------------

Handles an incoming kick

**Parameters**

**client**: *Object*,

**message**: *Object*,

**Returns**

void

IRCHandler.quit(client, message)
--------------------------------

Handles an incoming quit

**Parameters**

**client**: *Object*,

**message**: *Object*,

**Returns**

void

IRCHandler.nick(client, message)
--------------------------------

Handles an incoming nick change

**Parameters**

**client**: *Object*,

**message**: *Object*,

**Returns**

void

IRCHandler.who(client, message)
-------------------------------

Handles an incoming who

**Parameters**

**client**: *Object*,

**message**: *Object*,

**Returns**

void

IRCHandler.names(client, message)
---------------------------------

Handles an incoming names

**Parameters**

**client**: *Object*,

**message**: *Object*,

**Returns**

void

IRCHandler.mode(client, message)
--------------------------------

Handles an incoming mode notify

**Parameters**

**client**: *Object*,

**message**: *Object*,

**Returns**

void

IRCHandler.mode\_change(client, message)
----------------------------------------

Handles an incoming mode change

**Parameters**

**client**: *Object*,

**message**: *Object*,

IRCHandler.topic(client, message)
---------------------------------

Handles an incoming topic notify

**Parameters**

**client**: *Object*,

**message**: *Object*,

**Returns**

void

IRCHandler.topic\_change(client, message)
-----------------------------------------

Handles an incoming topic change

**Parameters**

**client**: *Object*,

**message**: *Object*,

**Returns**

void

IRCHandler.privmsg(client, message)
-----------------------------------

Handles an incoming privmsg

**Parameters**

**client**: *Object*,

**message**: *Object*,

**Returns**

void

IRCHandler.action(client, message)
----------------------------------

Handles an incoming action

**Parameters**

**client**: *Object*,

**message**: *Object*,

**Returns**

void

IRCHandler.notice(client, message)
----------------------------------

Handles an incoming notice

**Parameters**

**client**: *Object*,

**message**: *Object*,

**Returns**

void

IRCHandler.usermode(client, message)
------------------------------------

Handles an incoming usermode

**Parameters**

**client**: *Object*,

**message**: *Object*,

**Returns**

void

IRCHandler.ctcp\_response(client, message)
------------------------------------------

Handles an incoming ctcp\_response

**Parameters**

**client**: *Object*,

**message**: *Object*,

**Returns**

void

IRCHandler.ctcp\_request(client, message)
-----------------------------------------

Handles an incoming ctcp request

**Parameters**

**client**: *Object*,

**message**: *Object*,

**Returns**

void

IRCHandler.unknown(client, message)
-----------------------------------

Handles an incoming unknown

**Parameters**

**client**: *Object*,

**message**: *Object*,

**Returns**

void
