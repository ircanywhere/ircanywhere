var Application = require('./app').Application,
	ModeParser = require('./modeparser').ModeParser,
	UserManager = require('./users').UserManager,
	ChannelManager = require('./channels').ChannelManager,
	EventManager = require('./events').EventManager,
	NetworkManager = require('./networks').NetworkManager,
	IRCHandler = require('./irchandler').IRCHandler,
	IRCFactory = require('./factory').IRCFactory,
	CommandManager = require('./commands');

Sockets = {};
Clients = {};
// clients

application = new Application();
// inject the config so we can mimic it in tests if needed

modeParser = new ModeParser();
// mode parsing engine, no dependencies, just a parser class

networkManager = new NetworkManager();
// setup network manager

userManager = new UserManager();
// user manager

ircFactory = new IRCFactory();
// setup irc factory

ircHandler = new IRCHandler();
// setup irc handler

channelManager = new ChannelManager();
// channel manager

eventManager = new EventManager();
// event manager

/*container.register('Clients', Clients);
container.register('application', application);
networkManager = container.resolve(NetworkManager);*/
// setup network manager

/*

commandManager = container.resolve(CommandManager);*/
// setup command manager