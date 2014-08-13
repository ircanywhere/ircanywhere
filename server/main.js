var Application = require('./app').Application,
	IdentdServer = require('./identd').IdentdServer,
	ModeParser = require('./modeparser').ModeParser,
	UserManager = require('./users').UserManager,
	ChannelManager = require('./channels').ChannelManager,
	EventManager = require('./events').EventManager,
	NetworkManager = require('./networks').NetworkManager,
	IRCHandler = require('./irchandler').IRCHandler,
	IRCFactory = require('./factory').IRCFactory,
	IRCServer = require('./server').IRCServer,
	CommandManager = require('./commands').CommandManager,
	RPCHandler = require('./rpc').RPCHandler,
	ModuleManager = require('./module').ModuleManager,
	Module = require('./basemodule').Module;

/*global Sockets:true */
Sockets = {};

/*global Clients:true */
Clients = {};

/*global Users:true */
Users = {};

/*global IdentdCache:true */
IdentdCache = {};

// global object holders

/*global application:true */
application = new Application();
// inject the config so we can mimic it in tests if needed

/*global identdServer:true */
identdServer = new IdentdServer();
// setup the identd singleton

/*global modeParser:true */
modeParser = new ModeParser();
// mode parsing engine, no dependencies, just a parser class

/*global userManager:true */
userManager = new UserManager();
// user manager

/*global channelManager:true */
channelManager = new ChannelManager();
// channel manager

/*global eventManager:true */
eventManager = new EventManager();
// event manager

/*global networkManager:true */
networkManager = new NetworkManager();
// setup network manager

/*global ircHandler:true */
ircHandler = new IRCHandler();
// setup irc handler

/*global ircFactory:true */
ircFactory = new IRCFactory();
// setup irc factory

/*global commandManager:true */
commandManager = new CommandManager();
// command manager

/*global rpcHandler:true */
rpcHandler = new RPCHandler();
// websocket engine

/*global ircServer:true */
ircServer = new IRCServer();
// setup irc server

/*global moduleManager:true */
moduleManager = new ModuleManager();
// module manager

/*global baseModule:true */
baseModule = new Module();