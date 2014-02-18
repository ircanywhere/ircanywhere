IRCAnywhere Daemon
==================

*(c) 2013-2014 http://ircanywhere.com*

**Author:** Ricki Hastings

IRCAnywhere server/users.js

class UserManager
-----------------

**Methods**

UserManager.UserManager()
-------------------------

Responsible for handling user related actions ie registering, logging
in, forgot passwords etc

**Returns**

void

UserManager.init()
------------------

Sets up the api urls and anything else needed by the user manager class

**Returns**

void

UserManager.timeOutInactive()
-----------------------------

Responsible for disconnecting any inactive users

This function is ran every hour or so, but not perfectly precise, but it
shouldn't drift off too much because it re-corrects it self.

**Returns**

void

UserManager.isAuthenticated(data)
---------------------------------

Checks the sent in authentication string (should be "token=actualToken")
all in string format, this is how it is sent in the authentication
command and how it lies as a cookie. It also takes a full cookie string,
such as "someKey=1; someOtherKey=2; token=actualToken" and the token
will only be parsed and used.

Returns a valid user object which can be used to set on the socket for
example or HTTP request, returns false if invalid

**Parameters**

**data**: *Object*,

UserManager.registerUser(req, res)
----------------------------------

Handles user registrations, it takes req and res objects from express at
the moment however it should probably stay this way, because the api to
register a user is at /api/register I can't see a reason to change this
to take individual parameters.

**Parameters**

**req**: *Object*,

**res**: *Object*,

UserManager.userLogin(req, res)
-------------------------------

Handles the login call to /api/login and sets an appropriate cookie if
successful

**Parameters**

**req**: *Object*,

**res**: *Object*,

UserManager.userLogout(req, res)
--------------------------------

Handles the call to /api/logout which is self explanatory

**Parameters**

**req**: *Object*,

**res**: *Object*,

UserManager.forgotPassword(req, res)
------------------------------------

Handles the call to /api/forgot to send a forgot password link

**Parameters**

**req**: *Object*,

**res**: *Object*,

UserManager.resetPassword(req, res)
-----------------------------------

Handles the call to /api/reset which will be called when the reset
password link is visited Checking is done to make sure a token exists in
a user record.

**Parameters**

**req**: *Object*,

**res**: *Object*,

UserManager.updateSettings(req, res)
------------------------------------

Handles the call to /api/settings/updatesettings which will update the
settings for that user checking for authentication and validating if
necessary

**Parameters**

**req**: *Object*,

**res**: *Object*,

UserManager.resetPassword(req, res)
-----------------------------------

Handles the call to /api/settings/changepassword which is almost
identical to resetPassword however it checks for authentication and then
changes the password using that user, it doesn't take a token though.

**Parameters**

**req**: *Object*,

**res**: *Object*,

UserManager.updatePassword(user, password, confirmPassword)
-----------------------------------------------------------

Updates a users password, doesn't bypass any checkings, just doesn't
define how you select the user, so via a token or direct user object

**Parameters**

**user**: *Object*,

**password**: *Object*,

**confirmPassword**: *Object*,

UserManager.onUserLogin(me)
---------------------------

An event which is called when a successful login occurs, this logic is
kept out of the handler for /api/login because it's specific to a
different section of the application which is the networkManager and
ircFactory.

**Parameters**

**me**: *Object*,

**Returns**

void

UserManager.parse(file, replace)
--------------------------------

Looks for a template and parses the {{tags}} into the values in replace
and returns a string, used to parse emails.

**Parameters**

**file**: *String*,

**replace**: *Object*,
