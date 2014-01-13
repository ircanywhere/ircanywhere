var Application = require('./app').Application,
	ModeParser = require('./modeparser').ModeParser,
	UserManager = require('./users').UserManager,
	ChannelManager = require('./channels'),
	EventManager = require('./events'),
	NetworkManager = require('./networks').NetworkManager,
	IRCHandler = require('./irchandler'),
	IRCFactory = require('./factory'),
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



/*channelManager = container.resolve(ChannelManager);
// channel manager

eventManager = container.resolve(EventManager);
// event manager*/

/*container.register('Clients', Clients);
container.register('application', application);
networkManager = container.resolve(NetworkManager);*/
// setup network manager

/*ircHandler = container.resolve(IRCHandler);
// setup irc handler

ircFactory = container.resolve(IRCFactory);
// setup irc factory with its dependencies

commandManager = container.resolve(CommandManager);*/
// setup command manager