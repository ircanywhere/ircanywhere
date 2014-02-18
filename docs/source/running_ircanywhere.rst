Running
-------

There is multiple ways you can run ircanywhere, you probably want to run
it detaching from the console so it runs as a daemon, you can do that
with the following commands;

-  ``$ npm start``
-  **or**
-  ``$ node . start``

Note that the above commands wont restart it's self when an exception
occurs. If you want to run it attached to the console (probably for
debugging if you're developing), then you can run;

-  ``$ VERBOSE=true node . run``

The verbose environment flag is optional bug provides raw IRC events for
debugging purposes. I would avoid running it with forever as it restarts
the detached processes (irc-factory) which means your IRC connections
will be brought down on restarts. You can see logs in the ``logs``
folder, any catchable stack traces will be dropped in
``logs/error.log``. For a lightweight forever alternative I would
recommend https://github.com/visionmedia/mon. I run it with:

-  ``mon -d "node . run" -p ircanywhere.pid -l logs/mon.log``

The url is set to what you specified in the config, although it defaults
to ``http://localhost:3000``. Note that SSL is not supported yet (happy
to take PR though).

If you're running in a production environment it would be better to run
this behind a nginx proxy or similar. In the future there will be
instructions on how to do this and the possibility to serve the css/js
files via nginx. I'll also be implementing a way to sticky session via
nginx when the system is clustered.

Once you're logged in you will need to connect to the default network
with the ``/reconnect`` command. A help command will be added soon.