IRCAnywhere Daemon
==================

*(c) 2013-2014 http://ircanywhere.com*

**Author:** Ricki Hastings

IRCAnywhere server/app.js

class Application
-----------------

**Methods**

Application.Application()
-------------------------

The applications's main object, contains all the startup functions. All
of the objects contained in this prototype are extendable by standard
rules.

Examples:

::

application.post('init', function(next) { console.log('do something
after init() is run'); next(); });

**Returns**

void

Application.init()
------------------

The main entry point for the application

**Returns**

void

Application.setupOplog()
------------------------

Sets up the oplog tracker

**Returns**

void

Application.setupWinston()
--------------------------

Sets up the winston loggers

**Returns**

void

Application.setupNode()
-----------------------

Checks for a node record to store in the file system and database This
is done to generate a 'unique' but always the same ID to identify the
system so we can make way for clustering in the future

**Returns**

void

Application.setupServer()
-------------------------

Sets up the express and sockjs server to handle all HTTP / WebSocket
requests

**Returns**

void
