IRCAnywhere
===========

**This branch is not currently stable, if it runs, you're in luck, if not, don't come and ask why it's not working, use master branch**

The official IRCAnywhere virtual appliance repository. IRCAnywhere is made up of a stack of individual applications that communicate with each other to give a scalable and reliable like [Mibbit](http://mibbit.com/) service. Initially IRCAnywhere wasn't designed with the intention of ever being open sourced, like [IRCCloud](http://www.irccloud.com/) it was designed to be a premium based service, due to lack of time and interest to take this to that level and the interest I've seen in the service, I've decided to open source it rather than just let it collect dust. Initially each part of the application was developed seperately in different repositories and were almost completely independant of each other, I've spent some time combining these applications into one repository so they behave more like a single applcation.

The future plans are to turn this application into a virtual appliance package so it's easily setup and ran, however for the sake of ease, it's currently controlled using the service files in the root of the repository, which control the individual parts of the application.

The application, unlike other services such as Mibbit and IRCCloud isn't directly aimed at end users, more at small communities wishing to setup their own secure multiple user web chat interface which communicates with their IRC channel of choice.

Contributing
------------

If you're interested in contributing then please do, any help you can give is greatly appreciated. If you're contributing by reporting bugs, then please use the issue tracker with nessicary information. If you're contributing new features / fixes, then please do it in a seperate branch and perform a pull request. Please bare in mind that if you're contributing code, it would be ideal to conform to the coding standards below:

#### Javascript
* Always use semi colons to trail lines.
* Curley braces always on new lines.
* Camel case only, no _ (I know some of the code base is using non camel case, this will be migrated over time)
* Variable declaration in bulk seperated by commas
* No whitespace inbetween parenthesis
* Tabs only no double spaces
* Try and write JSLint.com happy code

Installing
----------

Follow the instructions [https://github.com/ircanywhere/ircanywhere/wiki/Installing](https://github.com/ircanywhere/ircanywhere/wiki/Installing) to install.

NOTE
----

Please note that this application needs a hell of a lot of work to be "out of the box", this means that it works, but isn't very orientated towards customisation and stuff, a lot of the stuff is in the code. An example of this is in the python code for the website frontend, it's not geared towards a custom application at all, and all the content is just manually wrote in. Ideally an install script or a larger configuration file with more options will be implemented in the future, feel free to work on this yourselves.

The project was initially designed as three different applications, which is why you'll see the boot up script individually boots all the applications up. It would be nice to work on combining them into one single application running under one or two processes. Or at least be a little more fluid. You'll also see irc-backend and irc-factory are two different applications which communicate with each other, the entire architecture revolves around this and it would be very difficult to migrate from this, it could be wise to leave it as-is. The initial boot up script could possibly run each instance through a child process instead of using forever. If anyone is interested in working on this or helping with this chat to me in IRC.
