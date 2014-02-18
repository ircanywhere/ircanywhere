IRCAnywhere Daemon
==================

*(c) 2013-2014 http://ircanywhere.com*

**Author:** Ricki Hastings

IRCAnywhere server/factory.js

class IRCFactory
----------------

**Methods**

IRCFactory.IRCFactory()
-----------------------

The IRCFactory object which handles communication with the irc-factory
package This object is not hookable or extendable because plugins can
deny the execution of functions when they hook into it, the results
could be disasterous. If incoming events need to be hooked onto you
could hook onto the IRCHandler object.

**Returns**

void

IRCFactory.init()
-----------------

Initiates the irc factory and it's connection and sets up an event
handler when the application is ready to run

**Returns**

void

IRCFactory.handleEvent(event, object)
-------------------------------------

Handles incoming factory events, events are expected to come in the
following format:

::

[ '52d3fc718132f8486dcde1d0', 'privmsg' ] { nickname: 'ricki-',
username: 'ia1', hostname: '127.0.0.1', target: '#ircanywhere-test',
message: '#ircanywhere-test WORD UP BROSEPTH', time:
'2014-01-22T18:20:57.323Z',

More advanced docs can be found at
https://github.com/ircanywhere/irc-factory/wiki/Events

**Parameters**

**event**: *Array*,

**object**: *Object*,

**Returns**

void

IRCFactory.create(network)
--------------------------

Sends the command to create a new irc client with the given settings

**Parameters**

**network**: *Object*,

**Returns**

void
