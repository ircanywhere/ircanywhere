IRCAnywhere [![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/ircanywhere/ircanywhere/trend.png)](https://bitdeli.com/free "Bitdeli Badge")
===

This is the latest version of IRCAnywhere which has been rewrote completely from the ground up. A lot of effort has gone into this over the past 3-4 month and it's still very much alpha, however in a much better state than it previously was. For the sake of moving the project on, the old code in `0.1.0-unstable` will be removed from the repository in the future, if you're interested in a copy get in touch.

The current version is at `0.2-alpha` and is lacking in a decent amount of features compared to other IRC clients but it has the ability to keep connections online. This version is being released in an effort to let people use it as they need and eliminate any critical and early arriving bugs so we can concentrate on stabilising the code and adding features as time goes on.

A list of things that you would expect right now that are not in the system but will be getting implemented in the `0.2-beta` or `0.2.0` releases are as follows, please do not open issues or raise these 'problems' in the IRC channel because they are priorities on the todo list for features.

  * The ability to handle and view channel lists / links list and all kinds of ban and exception lists
  * Tab selection in the input box
  * Loading more backlog by scrolling to the top and pressing a button
  * Automatic websocket reconnection

The next steps are to get the major issues ironed out and start work on the next [Roadmap](https://github.com/ircanywhere/ircanywhere/wiki/0.2.0-beta-Roadmap). The majority of changes between `0.2-alpha` and `0.2-beta` will be bug fixes and improvements to the API. The features outlined above will be implemented, any minor / other non critical feature requests will be moved back to the later version. There is a wiki page on [contributing](https://github.com/ircanywhere/ircanywhere/wiki/Contributing) if anyone is interested, it outlines coding standards along with the roadmap for `0.2-beta`.

Either prior to `0.2.0` final release or shortly after work will begin on a powerful plugin API allowing people to highly customise a lot of the application (backend and frontend). Some ideas have been noted, if anyone is interested in contributing or discussing this speak to me in IRC.

## Installing

There is a requirements section which I'm not going to explain how to install these, however in the install instructions it's required to use a specific mongodb setup to take advantage of oplog tailing. If you're using a shared database on a provider like MongoHQ you're probably out of luck - although I would **highly** recommend using mongo over localhost with this application anyway if you intend to host a reasonable amount of clients.

#### Requirements

  * nodejs (I'd recommend latest stable)
  * npm (this comes with node now so you should be ok)
  * mongodb

#### Installing

The following steps should be executed in your SSH terminal, we'll setup mongodb first, if it's currently running you should shut it down, you can do so with the following commands:

  * `$ mongo`
  * `> use admin;`
  * `> db.shutdownServer();`
  * **or**
  * `$ killall -12 mongod` use with caution

We now need to start mongodb with a single replica set for oplog tailing. Although a single mongo server wouldn't need to be a replica set usually, they allow it for testing purposes, if you're planning on running ircanywhere in a production environment with a good number of users I would recommend setting up an actual cluster of servers [guide here](https://docs.google.com/document/d/1rJ1Hi6Q9oQXPRrROJkL9xO-CQR7Unk1mPN4SHtSiY08/edit#heading=h.wivau77ttb0a) (you'll hear more about clustering ircanywhere processes together soon). The following commands will start mongodb running as a single replica set (you may need to run these as sudo):

  * `$ mongod --logpath /var/log/mongodb.log --replSet rs0`
  * `$ mongo`

Once you've started the mongo instance sucessfully you can connect to it with the `mongo` command, once connected you should see this:

```
MongoDB shell version: 2.4.9
connecting to: test
rs0:PRIMARY>
```

If you see the `:PRIMARY>` suffix then you've set the replica set up successfully. If you're still having trouble you can try following this more detailed guide at [http://meteorhacks.com/lets-scale-meteor.html](http://meteorhacks.com/lets-scale-meteor.html).

The next step is to clone the github repo (if you fancy living dangerously, although you can still checkout to the latest stable branch or release tags). Although I'd recommend using the tarball if you're not planning on doing any development/plugin work.

  * `$ git clone https://github.com/ircanywhere/ircanywhere.git`
  * `$ cd ircanywhere`
  * `$ git checkout v0.2-alpha`
  * **or**
  * `$ wget https://github.com/ircanywhere/ircanywhere/archive/v0.2-alpha.tar.gz`
  * `$ tar xvf v0.2-alpha.tar.gz`
  * `$ cd ircanywhere-0.2-alpha`

Then we need to install the dependencies (I've no idea how this runs on windows, I'm not expecting it to run well because we use fibers. I'd recommend unix/linux based operating systems).

  * `$ npm install`

Next you'll need to build the client source, you'll need to make sure `grunt-cli` is installed via npm. Once that is done you can run these commands. You can set grunt up to watch files if you're doing any development work (including writing plugins) by running `grunt watch` after the following commands.

  * `$ npm install -g grunt-cli`
  * `$ grunt`

Finally, edit the configuration file `config.example.json` a few things will need changed by default, the ip address and port, and you'll need to include a smtp url if you want to be able to send emails out (forgot password links wont work without emails). Your mongodb settings should be fine if you've followed these instructions. Finally rename it to `config.json`.

## Running

  * `$ node .`

The url is set to what you specified in the config, although it defaults to `http://localhost:3000`. Note that SSL is not supported yet (happy to take PR though).

Although you probably want to run it with forever to keep it online, and even better if you're running in production behind nginx.

In the future there will be instructions on how to do this and the possibility to serve the css/js files via nginx. I'll also be implementing a way to sticky session via nginx when the system is clustered.

## Issues

Any bugs (preferably) should be reported via the issues page on this repository, it would be ideal if a screenshot of the bug could be provided (if applicable) and any errors in the javascript console log.

[https://github.com/ircanywhere/ircanywhere/issues](https://github.com/ircanywhere/ircanywhere/issues)