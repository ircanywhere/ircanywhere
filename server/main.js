var axon = Meteor.require('axon'),
	raw = Assets.getText('config.json'),
	dependable = Meteor.require('dependable'),
    container = dependable.container();

container.register('raw', raw);
application = container.resolve(Application);
// inject the config so we can mimic it in tests if needed
// XXX - maybe inject fs aswell because setupNode() causes problems in tests

modeParser = container.resolve(ModeParser);
// mode parsing engine, no dependencies, just a parser class

userManager = container.resolve(UserManager);
// user manager

channelManager = container.resolve(ChannelManager);
// channel manager

networkManager = container.resolve(NetworkManager);
// setup network manager

ircHandler = container.resolve(IRCHandler);
// setup irc handler

container.register('axon', axon);
ircFactory = container.resolve(IRCFactory);
// setup irc factory with its dependencies

// XXX - We do this all in one file so scope issues dont go tits up and so we can
//		 require these files in elsewhere like in tests and inject our own dependencies