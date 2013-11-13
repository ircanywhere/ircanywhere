/* ============================================================
 * IRCAnywhere Confidential
 * ============================================================
 * 
 * (C) Copyright 2011 - 2012 IRCAnywhere (https://ircanywhere.com)
 * All Rights Reserved.
 * 
 * This file is subject to the terms and conditions defined in
 * file 'LICENSE.txt', which is part of this source code package.
 *
 * ============================================================ */

exports.Stats = {};

exports.Stats.report_id = null;
exports.Stats.ircDataSent = 0;
exports.Stats.ircDataRecv = 0;
exports.Stats.clientDataSent = 0;
exports.Stats.clientDataRecv = 0;
exports.Stats.maxUsers = 0;
exports.Stats.maxClients = 0;

exports.Stats.sessions = {
	logins: 0,
	logouts: 0,
	active: 0
};

const os = require('os');

var database = require('./database').Database,
	server = require('./server').Server,
	system = require('./system').System;

 /*
 * Stats::collectStatistics
 * 
 * Collect statistics and send them back to system.js which usually routes
 * the information off to the frontend or the admin panel, mainly used for reports.
 */
exports.Stats.collectStatistics = function()
{
	var _this = this,
		stats = {},
		activeUsers = 0,
		users = 0,
		clients = 0;
	// create an object that will hold our stats

	for (var key in server.clients)
		clients += Object.keys(server.clients[key]).length
	// calculate irc clients

	for (var key in server.client_data)
	{
		users++;
		if (server.client_data[key].logged_in)
			activeUsers++;
	}
	// calculate logged in clients

	stats.server = system.config.hostname;
	stats.endpoint = system.config.endpoint;
	stats.port = system.config.port;
	
	stats.users = users;
	stats.activeUsers = activeUsers;
	stats.maxUsers = _this.maxUsers;
	stats.clients = clients;
	stats.maxClients = _this.maxClients;
	
	stats.ircDataSent = _this.ircDataSent;
	stats.ircDataRecv = _this.ircDataRecv;
	stats.clientDataSent = _this.clientDataSent;
	stats.clientDataRecv = _this.clientDataRecv;

	stats.sessions = _this.sessions;
	
	stats.memoryUsage = process.memoryUsage().rss;
	stats.cpuUsage = os.loadavg();
	stats.osPlatform = process.platform;
	stats.osCPUArch = process.arch;

	return stats;
};