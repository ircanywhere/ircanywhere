Installing
----------

There is a requirements section which I'm not going to explain how to
install these, however in the install instructions it's required to use
a specific mongodb setup to take advantage of oplog tailing. If you're
using a shared database on a provider like MongoHQ you're probably out
of luck - although I would **highly** recommend using mongo over
localhost with this application anyway if you intend to host a
reasonable amount of clients.

Requirements
^^^^^^^^^^^^

-  nodejs (I'd recommend latest stable)
-  npm (this comes with node now so you should be ok)
-  mongodb

Installing
^^^^^^^^^^

The following steps should be executed in your SSH terminal, we'll setup
mongodb first, if it's currently running you should shut it down, you
can do so with the following commands:

-  ``$ mongo``
-  ``> use admin;``
-  ``> db.shutdownServer();``
-  **or**
-  ``$ killall -12 mongod`` use with caution

We now need to start mongodb with a single replica set for oplog
tailing. Although a single mongo server wouldn't need to be a replica
set usually, they allow it for testing purposes, if you're planning on
running ircanywhere in a production environment with a good number of
users I would recommend setting up an actual cluster of servers `guide
here <https://docs.google.com/document/d/1rJ1Hi6Q9oQXPRrROJkL9xO-CQR7Unk1mPN4SHtSiY08/edit#heading=h.wivau77ttb0a>`_
(you'll hear more about clustering ircanywhere processes together soon).
The following commands will start mongodb running as a single replica
set (you may need to run these as sudo):

-  ``$ mongod --logpath /var/log/mongodb.log --replSet rs0``
-  ``$ mongo``

Once you've started the mongo instance sucessfully you can connect to it
with the ``mongo`` command, once connected you should see this:

::

    MongoDB shell version: 2.4.9
    connecting to: test
    rs0:PRIMARY>

If you see the ``:PRIMARY>`` suffix then you've set the replica set up
successfully. If you're still having trouble you can try following this
more detailed guide at
`http://meteorhacks.com/lets-scale-meteor.html <http://meteorhacks.com/lets-scale-meteor.html>`_.

The next step is to clone the github repo, or you can install from
``0.2-alpha`` however at the moment I would recommend cloning from the
development branch.

-  ``$ git clone https://github.com/ircanywhere/ircanywhere.git``
-  ``$ cd ircanywhere``
-  **or**
-  ``$ wget https://github.com/ircanywhere/ircanywhere/archive/v0.2-alpha.tar.gz``
-  ``$ tar xvf v0.2-alpha.tar.gz``
-  ``$ cd ircanywhere-0.2-alpha``

Then we need to install the dependencies (I've no idea how this runs on
windows, I'm not expecting it to run well because we use fibers. I'd
recommend unix/linux based operating systems).

-  ``$ npm install``

Next you'll need to build the client source, you'll need to make sure
``grunt-cli`` is installed via npm. Once that is done you can run these
commands. You can set grunt up to watch files if you're doing any
development work (including writing plugins) by running ``grunt watch``
after the following commands.

-  ``$ npm install -g grunt-cli``
-  ``$ grunt``

Finally, edit the configuration file ``config.example.json`` a few
things will need changed by default, the ip address and port, and you'll
need to include a smtp url if you want to be able to send emails out
(forgot password links wont work without emails). Your mongodb settings
should be fine if you've followed these instructions. Finally rename it
to ``config.json``.
