var Application = require('./app').Application,
	IdentdServer = require('./identd').IdentdServer,
	ModeParser = require('./modeparser').ModeParser,
	UserManager = require('./users').UserManager,
	ChannelManager = require('./channels').ChannelManager,
	EventManager = require('./events').EventManager,
	NetworkManager = require('./networks').NetworkManager,
	IRCHandler = require('./irchandler').IRCHandler,
	IRCFactory = require('./factory').IRCFactory,
	CommandManager = require('./commands').CommandManager,
	RPCHandler = require('./rpc').RPCHandler,
	ModuleManager = require('./module').ModuleManager,
	Module = require('./basemodule').Module;

Sockets = {};
Clients = {};
Users = {};
IdentdCache = {};
// global object holders

application = new Application();
// inject the config so we can mimic it in tests if needed

identdServer = new IdentdServer();
// setup the identd singleton

modeParser = new ModeParser();
// mode parsing engine, no dependencies, just a parser class

userManager = new UserManager();
// user manager

channelManager = new ChannelManager();
// channel manager

eventManager = new EventManager();
// event manager

networkManager = new NetworkManager();
// setup network manager

ircHandler = new IRCHandler();
// setup irc handler

ircFactory = new IRCFactory();
// setup irc factory

commandManager = new CommandManager();
// command manager

rpcHandler = new RPCHandler();
// websocket engine

moduleManager = new ModuleManager();
// module manager

baseModule = new Module();