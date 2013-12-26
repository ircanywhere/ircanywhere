var fs = Meteor.require('fs'),
	raw = Assets.getText('config.json'),
	dependable = Meteor.require('dependable'),
    container = dependable.container();

Clients = {};
// clients

container.register('fs', fs);
container.register('raw', raw);
application = container.resolve(Application);
// inject the config so we can mimic it in tests if needed

modeParser = container.resolve(ModeParser);
// mode parsing engine, no dependencies, just a parser class

userManager = container.resolve(UserManager);
// user manager

channelManager = container.resolve(ChannelManager);
// channel manager

eventManager = container.resolve(EventManager);
// event manager

networkManager = container.resolve(NetworkManager);
// setup network manager

ircHandler = container.resolve(IRCHandler);
// setup irc handler

ircFactory = container.resolve(IRCFactory);
// setup irc factory with its dependencies

commandManager = container.resolve(CommandManager);
// setup command manager