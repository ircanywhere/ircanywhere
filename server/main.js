/**
 * IRCAnywhere server/main.js
 *
 * @title IRCAnywhere Daemon
 * @copyright (c) 2013-2014 http://ircanywhere.com
 * @license GPL v2
 * @author Ricki Hastings
*/

var Application = require('./app').Application,
	ModeParser = require('./modeparser').ModeParser,
	UserManager = require('./users').UserManager,
	ChannelManager = require('./channels').ChannelManager,
	EventManager = require('./events').EventManager,
	NetworkManager = require('./networks').NetworkManager,
	IRCHandler = require('./irchandler').IRCHandler,
	IRCFactory = require('./factory').IRCFactory,
	CommandManager = require('./commands').CommandManager,
	SocketManager = require('./sockets').SocketManager;
	fibrous = require('fibrous');

Sockets = {};
Clients = {};
Users = {};
// global object holders

application = new Application();
// inject the config so we can mimic it in tests if needed

userManager = new UserManager();
// user manager

socketManager = new SocketManager();
// websocket engine

modeParser = new ModeParser();
// mode parsing engine, no dependencies, just a parser class

networkManager = new NetworkManager();
// setup network manager

ircFactory = new IRCFactory();
// setup irc factory

ircHandler = new IRCHandler();
// setup irc handler

channelManager = new ChannelManager();
// channel manager

eventManager = new EventManager();
// event manager

commandManager = new CommandManager();
// command manager