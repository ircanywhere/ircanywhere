IRCAnywhere Daemon
==================

*(c) 2013-2014 http://ircanywhere.com*

**Author:** Ricki Hastings

IRCAnywhere server/modeparser.js

class ModeParser
----------------

**Methods**

ModeParser.ModeParser()
-----------------------

Responsible for parsing mode strings into unstandable actions and also
responsible for applying those actions to a channel/user object.

None of these functions can be hooked onto or extended seen as though
it's just not needed and could be malicious if people are altering mode
string, bugs relating to this are difficult to find, if you want to hook
a mode change hook to IRCHandler.mode\_change()

**Returns**

void

ModeParser.sortModes(capabilities, modes)
-----------------------------------------

Sorts a mode string into an object of instructions that we can use to
perform actions based on what the mode string suggests, ie apply
operator to 'someone', or set +m on the channel

**Parameters**

**capabilities**: *Object*,

**modes**: *String*,

ModeParser.changeModes(capabilities, modes, modeArray)
------------------------------------------------------

Handles the object of instructions returned from sortModes, and applies
them

**Parameters**

**capabilities**: *Object*,

**modes**: *Object*,

**modeArray**: *Object*,

ModeParser.handleParams(capabilities, users, modeArray)
-------------------------------------------------------

Applies any mode changes that contain status related modes, usually
qaohv modes minus: rickibalboa: -o > will remove the o flag from the
nickname record minus: rickibalboa: +v > will set the v flag on the
nickname record

**Parameters**

**capabilities**: *Object*,

**users**: *Object*,

**modeArray**: *Object*,
