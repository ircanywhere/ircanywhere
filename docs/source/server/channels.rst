IRCAnywhere Daemon
==================

*(c) 2013-2014 http://ircanywhere.com*

**Author:** Ricki Hastings

IRCAnywhere server/channels.js

class ChannelManager
--------------------

**Methods**

ChannelManager.ChannelManager()
-------------------------------

This object is responsible for managing everything related to channel
records, such as the handling of joins/parts/mode changes/topic changes
and such. As always these functions are extendable and can be prevented
or extended by using hooks.

**Returns**

void

ChannelManager.getChannel(network, channel)
-------------------------------------------

Gets a tab record from the passed in network and channel, this is not
specific to users

**Parameters**

**network**: *String*,

**channel**: *String*,

**Returns**

*Object*, tab object

ChannelManager.insertUsers(key, network, channel, users, force)
---------------------------------------------------------------

Inserts a user or an array of users into a channel record matching the
network key network name and channel name, with the option to force an
overwrite

**Parameters**

**key**: *ObjectID*,

**network**: *String*,

**channel**: *String*,

**users**: *Array*,

**force**: *Boolean*,

**Returns**

*Array*, array of the users inserted

ChannelManager.removeUsers(network, channel, [optional])
--------------------------------------------------------

Removes a specific user from a channel, if users is omitted, channel
should be equal to a nickname and that nickname will be removed from all
channels records on that network

**Parameters**

**network**: *String*,

**channel**: *String*,

**[optional]**: *Array*, users

**Returns**

void

ChannelManager.updateUsers(key, network, users, values)
-------------------------------------------------------

Updates a user or an array of users from the specific channel with the
values passed in

**Parameters**

**key**: *ObjectID*,

**network**: *String*,

**users**: *Array*,

**values**: *Object*,

**Returns**

void

ChannelManager.updateModes(key, capab, network, channel, mode)
--------------------------------------------------------------

Takes a mode string, parses it and handles any updates to any records
relating to the specific channel. This handles user updates and such, it
shouldn't really be called externally, however can be pre and post
hooked like all other functions in this object.

**Parameters**

**key**: *ObjectID*,

**capab**: *Object*,

**network**: *String*,

**channel**: *String*,

**mode**: *String*,

**Returns**

void

ChannelManager.updateTopic(key, channel, topic, setby)
------------------------------------------------------

Updates the specific channel's topic and setby in the internal records

**Parameters**

**key**: *ObjectID*,

**channel**: *String*,

**topic**: *String*,

**setby**: *String*,

**Returns**

void
