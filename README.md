IRCAnywhere
===========

The official IRCAnywhere virtual appliance repository. IRCAnywhere is made up of a stack of individual applications that communicate with each other to give a scalable and reliable like [Mibbit](http://mibbit.com/) service. Initially IRCAnywhere wasn't designed with the intention of ever being open sourced, like [IRCCloud](http://www.irccloud.com/) it was designed to be a premium based service, due to lack of time and interest to take this to that level and the interest I've seen in the service, I've decided to open source it rather than just let it collect dust. Initially each part of the application was developed seperately in different repositories and were almost completely independant of each other, I've spent some time combining these applications into one repository so they behave more like a single applcation.

The future plans are to turn this application into a virtual appliance package so it's easily setup and ran, however for the sake of ease, it's currently controlled using the service files in the root of the repository, which control the individual parts of the application.

The application, unlike other services such as Mibbit and IRCCloud isn't directly aimed at end users, more at small communities wishing to setup their own secure multiple user web chat interface which communicates with their IRC channel of choice.

Contributing
------------

If you're interested in contributing then please do, any help you can give is greatly appreciated. If you're
