IRCAnywhere Daemon
==================

*(c) 2013-2014 http://ircanywhere.com*

**Author:** Ricki Hastings

IRCAnywhere server/networks.js

class NetworkManager
--------------------

**Methods**

NetworkManager.NetworkManager()
-------------------------------

Responsible for handling everything related to networks, such as
tracking changes removing, creating, changing tabs, creating and
deleting networks etc.

**Returns**

void

NetworkManager.init()
---------------------

Called when the application is ready to proceed, this sets up event
listeners for changes on networks and tabs collections and updates the
Client object with the changes to essentially keep the object in sync
with the collection so we can do fast lookups, but writes to the
collection will propogate through and update Clients

**Returns**

void

NetworkManager.getClients()
---------------------------

Gets a list of networks, used by IRCFactory on synchronise to determine
who to connect on startup, doesn't ever really need to be called also
can be modified with hooks to return more information if needed.

NetworkManager.getClients()
---------------------------

Handles the add network api call, basically handling authentication
validating the parameters and input, and on success passes the
information to ``addNetwork()`` which handles everything else

NetworkManager.addNetwork(user, network)
----------------------------------------

Adds a network using the settings specified to the user's set of
networks This just adds it to the database and doesn't attempt to start
it up.

**Parameters**

**user**: *Object*,

**network**: *Object*,

NetworkManager.addTab(client, target, type, [optional])
-------------------------------------------------------

Adds a tab to the client's (network unique to user) tabs, this can be a
channel or a username.

**Parameters**

**client**: *Object*,

**target**: *String*,

**type**: *String*,

**[optional]**: *Boolean*, select

**Returns**

void

NetworkManager.activeTab(client, target, [optional])
----------------------------------------------------

Changes a tabs activity (not selection) - for example when you're kicked
from a channel the tab wont be removed it will be just set to active:
false so when you see it in the interface it will appear as
(#ircanywhere) instead of #ircanywhere We can omit target and call
activeTab(client, false) to set them all to false (such as on
disconnect)

**Parameters**

**client**: *Object*,

**target**: *String*,

**[optional]**: *Boolean*, activate

**Returns**

void

NetworkManager.removeTab(client, target)
----------------------------------------

Removes the specified tab, be careful because this doesn't re-select
one, you're expected to look for a removed tab, if it's the currently
selected one, go back to a different one.

**Parameters**

**client**: *Object*,

**target**: *String*,

**Returns**

void

NetworkManager.connectNetwork(network)
--------------------------------------

Connect the specified network record, should only really be called when
creating a new network as IRCFactory will load the client up on startup
and then determine whether to connect the network itself based on the
options.

However, it's also called when it appears that there is no connected
client on the /reconnect command (and any other similar commands). We
can determine this (sloppy) from checking client.internal.status. If in
the case that it does exist, it doesn't matter if this is called really
because irc-factory will prevent a re-write if the key is the same. We
could consider looking at the response from factory synchronize but it
might not yield a good result because of newly created clients since
startup.

**Parameters**

**network**: *Object*,

**Returns**

void

NetworkManager.changeStatus(query, status)
------------------------------------------

Description

**Parameters**

**query**: *Object*,

**status**: *Boolean*,

**Returns**

void
