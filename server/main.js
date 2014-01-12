var Application = require('./app').Application,
	ModeParser = require('./modeparser').ModeParser,
	UserManager = require('./users').UserManager,
	ChannelManager = require('./channels'),
	EventManager = require('./events'),
	NetworkManager = require('./networks'),
	IRCHandler = require('./irchandler'),
	IRCFactory = require('./factory'),
	CommandManager = require('./commands'),
	dependable = require('dependable'),
	container = dependable.container();
	
Clients = {};
// clients

application = container.resolve(Application);
// inject the config so we can mimic it in tests if needed

modeParser = container.resolve(ModeParser);
// mode parsing engine, no dependencies, just a parser class

container.register('application', application);
userManager = container.resolve(UserManager);
// user manager

console.log(userManager.onUserLogin());

/*channelManager = container.resolve(ChannelManager);
// channel manager

eventManager = container.resolve(EventManager);
// event manager

networkManager = container.resolve(NetworkManager);
// setup network manager

ircHandler = container.resolve(IRCHandler);
// setup irc handler

ircFactory = container.resolve(IRCFactory);
// setup irc factory with its dependencies

commandManager = container.resolve(CommandManager);*/
// setup command manager