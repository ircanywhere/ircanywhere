IRCAnywhere Daemon
==================

*(c) 2013-2014 http://ircanywhere.com*

**Author:** Ricki Hastings

IRCAnywhere server/commands.js

class CommandManager
--------------------

**Methods**

CommandManager.CommandManager()
-------------------------------

Responsible for handling all incoming commands from websocket clients

**Returns**

void

CommandManager.init()
---------------------

Called when the application is booted and everything is ready, sets up
an observer on the commands collection for inserts and handles them
accordingly. Also sets up aliases

**Returns**

void

CommandManager.createAlias(command, aliases)
--------------------------------------------

Creates an alias from the first parameter to the remaining ones.

Examples:

commandManager.createAlias('/part', '/p', '/leave'); // sets an alias
for /p and /leave to forward to /part

**Parameters**

**command**: *String*,

**aliases**: *...*,

**Returns**

void

CommandManager.parseCommand(user, client, target, command, user, client, target, params, user, client, target, params, user, client, target, params, user, client, target, params, user, client, target, params, user, client, target, params, user, client, target, params, user, client, target, params, user, client, target, params, user, client, target, params, user, client, target, params, user, client, target, params, user, client, target, params, user, client, target, params, user, client, target, params, user, client, target, params, user, client, target, params, user, client, target, params, user, client, target, params, user, client, target, params, user, client, target, params, user, client, target, params)
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Parse a command string and determine where to send it after that based
on what it is ie just text or a string like: '/join #channel'

**Parameters**

**user**: *Object*,

**client**: *Object*,

**target**: *String*,

**command**: *String*,

**user**: *Object*,

**client**: *Object*,

**target**: *String*,

**params**: *String*,

**user**: *Object*,

**client**: *Object*,

**target**: *String*,

**params**: *String*,

**user**: *Object*,

**client**: *Object*,

**target**: *String*,

**params**: *String*,

**user**: *Object*,

**client**: *Object*,

**target**: *String*,

**params**: *String*,

**user**: *Object*,

**client**: *Object*,

**target**: *String*,

**params**: *String*,

**user**: *Object*,

**client**: *Object*,

**target**: *String*,

**params**: *String*,

**user**: *Object*,

**client**: *Object*,

**target**: *String*,

**params**: *String*,

**user**: *Object*,

**client**: *Object*,

**target**: *String*,

**params**: *String*,

**user**: *Object*,

**client**: *Object*,

**target**: *String*,

**params**: *String*,

**user**: *Object*,

**client**: *Object*,

**target**: *String*,

**params**: *String*,

**user**: *Object*,

**client**: *Object*,

**target**: *String*,

**params**: *String*,

**user**: *Object*,

**client**: *Object*,

**target**: *String*,

**params**: *String*,

**user**: *Object*,

**client**: *Object*,

**target**: *String*,

**params**: *String*,

**user**: *Object*,

**client**: *Object*,

**target**: *String*,

**params**: *String*,

**user**: *Object*,

**client**: *Object*,

**target**: *String*,

**params**: *String*,

**user**: *Object*,

**client**: *Object*,

**target**: *String*,

**params**: *String*,

**user**: *Object*,

**client**: *Object*,

**target**: *String*,

**params**: *String*,

**user**: *Object*,

**client**: *Object*,

**target**: *String*,

**params**: *String*,

**user**: *Object*,

**client**: *Object*,

**target**: *String*,

**params**: *String*,

**user**: *Object*,

**client**: *Object*,

**target**: *String*,

**params**: *String*,

**user**: *Object*,

**client**: *Object*,

**target**: *String*,

**params**: *String*,

**user**: *Object*,

**client**: *Object*,

**target**: *String*,

**params**: *String*,

**Returns**

void
