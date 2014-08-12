IRCAnywhere
===========

**IRCAnywhere** is an open source web based `IRC bonucer`_  application written in javascript. It's designed to be a free alternative to IRCCloud_. Unlike IRCCloud where you have little control over uptime and the privacy of your users, **IRCAnywhere** aims to give the control to you.

.. image:: http://ircanywhere.com/img/banner1.png

Full documentation for **IRCAnywhere** is available at `http://ircanywhere.readthedocs.org/`_

History
~~~~~~~

**IRCAnywhere** has been around for a while, and was first opened to the public as a proprietary service back in 2012. It got open sourced in May, 2013 and we quickly realized that it wasn't as simple and stable as it should be. Recently **IRCAnywhere** has undergone a massive rewrite completely from the ground up with some fundamental changes to the way it previously worked.

Installing IRCAnywhere
======================

Getting IRCAnywhere
~~~~~~~~~~~~~~~~~~~

You can either clone the github repository, or install from the ``0.2-alpha`` release. However a number of stability changes have been made since last release so the ``development`` branch is usually the most stable. To clone the development branch: ::

    $ git clone https://github.com/ircanywhere/ircanywhere.git
    $ cd ircanywhere
    $ git checkout development

**or** for `0.2-alpha`: ::

    $ wget https://github.com/ircanywhere/ircanywhere/archive/v0.2-alpha.tar.gz
    $ tar xvf v0.2-alpha.tar.gz
    $ cd ircanywhere-0.2-alpha

Pre-requisites
~~~~~~~~~~~~~~

Before we start, make sure you have `Node.js and Npm`_ installed. **IRCAnywhere** also needs gulp_ to build client files. You can install gulp by running (may need to prefix command with ``sudo`` if you get permission errors): ::

    $ npm install -g gulp

Install Script
~~~~~~~~~~~~~~

The install script will automatically install MongoDB if needed, download node dependencies, start MongoDB correctly, create a default config file and compile the client side files.

Note that the install script is only available if you downloaded the development version of **IRCAnywhere**.
Note On windows mongodb has to be installed and started manually before running the install script.

To run the install script, type this command: ::

    $ ./install.sh
    
On windows the command to start install is: ::
    
    > install.bat
    
If you already have MongoDB installed but not set up correctly with Oplog tailing, the script can do that for you as well, simply run: ::

    $ sudo ./install.sh

If this goes through with no errors you can skip to the `configuration file`_ section.

Manually Installing
~~~~~~~~~~~~~~~~~~~

**IRCAnywhere** uses MongoDB for storage. For installation instructions, see the `installing MongoDB`_ section in the documentation.

We need to first install Node dependencies: ::

    $ npm install

Next we'll build the client source: ::

    $ gulp

Finally, rename the sample configuration file ``config.example.json`` to ``config.json``.

HTTPS
~~~~~

**IRCAnywhere** can also be served via HTTPS. Setting it up involves little more than editing the configuration file and setting the ``ssl`` property to ``true``. Once this is done you will need to add the following certificate files to ``private/certs``

* ``private/certs/key.pem``
* ``private/certs/cert.pem``

Configuration File
~~~~~~~~~~~~~~~~~~

The sample configuration file has comments describing every property. A few items will need to be changed for a production environment such as the ip address and port. You'll need to include a smtp url if you want to be able to send emails out (forgot password links wont work without emails).

Running
~~~~~~~

There are multiple ways you can run **IRCAnywhere**, you probably want to run it detaching from the console so it runs on the background as a daemon, you can do that with the following commands: ::

    $ npm start

**or** ::

    $ node . start

To run attached to the console, so you can easily see console logs, use: ::

    $ node . run

Note that the above commands wont restart the service when an exception occurs. To do this you're going to want to respond to signals to restart if the system crashes or gets killed for some other reason. Traditionally node applications are ran with ``forever``, however there is a strange case causing ``irc-factory`` to reboot when the parent restarts which loses our ability to detach from IRC connections keeping them online between restarts, this is not good.

You can use a program called mon_ to keep the process running. You should use ``node . run`` and not ``node . start`` when using ``mon`` because it will go into a restart loop if you don't. ::

    $ mon -d "node . run" -p ircanywhere.pid -l logs/mon.log

If you're running in a production environment it would be better to run this behind a nginx proxy or similar. You can see install instructions at `reverse proxies`_ section in the documentation.

Connecting a client
~~~~~~~~~~~~~~~~~~~

IRCAnywhere has an built-in IRC server that allows you to connect using a regular IRC client. To enable the irc server make sure your ``ircServer.enable`` configuration is set to ``true`` and ``ircServer.port`` is set appropriately in your ``config.json`` file.

To connect a client, use the email you used to register as your login name and set your password accordingly. If you have multiple networks, you need to inform which network you're connecting to in your login by appending your login email with a ``/`` and the network name. For example ``my@email.com/freenode``.

Updating
~~~~~~~~

If you cloned the development branch, you can update **IRCAnywhere** by running the following two commands: ::

	$ git pull
	$ ./install.sh

And then restart accordingly. Client side files may be cached, a browser hard reload ``ctrl+r`` will force a full reload or try clearing your browser's cache.

Issues
~~~~~~

Any bugs (preferably) should be reported via the `issues page`_ on this repository. It would be ideal if a screenshot of the bug could be provided (if applicable) and any errors in the javascript console log.

Come talk to us on the #ircanywhere channel in freenode.

.. _`IRC bonucer`: http://en.wikipedia.org/wiki/BNC_%28software%29#IRC
.. _`configuration file`: #configuration-file
.. _IRCCloud: https://www.irccloud.com
.. _http://ircanywhere.readthedocs.org/: http://ircanywhere.readthedocs.org/
.. _`Node.js and Npm`: http://ircanywhere.readthedocs.org/en/latest/pre_requirements.html#installing-node-js-and-npm
.. _mon: https://github.com/visionmedia/mon
.. _`issues page`: https://github.com/ircanywhere/ircanywhere/issues
.. _`reverse proxies`: http://ircanywhere.readthedocs.org/en/latest/reverse_proxies.html
.. _gulp: http://gulpjs.com/
.. _`installing MongoDB`: http://ircanywhere.readthedocs.org/en/latest/pre_requirements.html#installing-mongodb
