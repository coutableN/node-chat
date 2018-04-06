/*
*	node-chat
*	by Nicolas Coutable
*	nicolas-coutable.fr
*	coutable.n@hotmail.fr
*	v0.0.1
*	04/2018
*
*/
exports.createChatServer = (app, server) => {

	const express = require('express');
	const io = require('socket.io').listen(server);
	const fs = require('fs');
	const path = require('path');
	const pathToFiles = 'node_modules/node-chat/';
	const bodyParser = require('body-parser');

	// global bannedAddresses & users (out of IO scope)
	const globalBannedAddresses = fs.readFileSync(`${ pathToFiles }banned-addresses`, 'utf-8').split(/\r?\n/);
	const globalUsers = fs.readFileSync(`${ pathToFiles }users`, 'utf-8').split(/\r?\n/);
	// to render users list without password
	const globalUsersFormated = formatUsers(globalUsers);
	// const globalUsersFormated = globalUsers.map((userInfo) => {
	// 	return userInfo.split(' ')[0];
	// });

	app.set('view engine', 'ejs')
	// use node-chat ejs views
	.set('views', path.join(__dirname, '../node-chat/views'))
	// virtual path for static client files
	.use('/node-chat', express.static(__dirname + '/public'))
	.use('/bootstrap', express.static(__dirname + '/../bootstrap/dist'))
	.use(bodyParser.urlencoded({ extended : true }))
	.use(bodyParser.json())

	// render /chat
	.get('/chat', (req, res) => {
		res.render('chat.ejs');
	})

	.get('/nc-login', (req, res) => {
		res.render('nc-login.ejs', { errorLogin : false });
	})

	.post('/nc-admin', (req, res) => {
		// read users and login if user is correct
		let users = fs.readFileSync(`${ pathToFiles }users`, 'utf-8').split(/\r?\n/);

		for (let i = 0; i < users.length; i++) {
			if (req.body.login === users[i].split(' ')[0] && req.body.pwd === users[i].split(' ')[1]) {
				res.render('nc-admin.ejs', {
					name : req.body.login,
					bannedAddresses : globalBannedAddresses,
					users : globalUsersFormated
				});
			}
		}
		res.render('nc-login.ejs', { errorLogin : true });
	})

	// webSockets
	const clients = [];
	io.sockets.on('connection', (socket) => {
		// open log in append mode
		let logWriter = fs.createWriteStream(`${ pathToFiles }log`, { flags : 'a' });
		// emit and update clients number
		socket.emit('updateClientNumber', { clientNumber : Object.keys(io.sockets.connected).length });
		socket.broadcast.emit('updateClientNumber', { clientNumber : Object.keys(io.sockets.connected).length });

		// banClient function
		// (case detected @IP banned at connexion (no arg)) : @IP is not allowed to create a socket conn => disconnect
		// (case asked by admin on connected client(ip arg)) : for all socketId owned by @IP banned => disconnect
		const banClient = (ip) => {
			let bannedObject = {
				message : 'It looks like you did something wrong, you are banned from the chat',
				time : dateUtil.time()
			}
			if (!ip) {
				socket.emit('banned', bannedObject);
				socket.disconnect();
			} else {
				for (let client of clients) {
					if (client.ip === ip) {
						io.sockets.to(client.id).emit('banned', bannedObject);
						socket.disconnect();
					}
				}
			}
		}

		// get client @IP, store in const clients[] and log
		let handshake = socket.handshake;
		let ipClient = handshake.address;
		clients.push({ ip : ipClient, id : socket.id });
		logWriter.write(`INFO_CONN -- ${ dateUtil.time() } -- ${ ipClient }\n`);

		// if ipClient is in bannedAddresses => disconnect from chat
		let bannedAddresses = fs.readFileSync(`${ pathToFiles }banned-addresses`, 'utf-8').split(/\r?\n/);
		if (bannedAddresses.includes(ipClient)) {
			banClient();
		}

		// message from client => broadcast to all clients
		socket.on('message', (data) => {
			logWriter.write(`NEW_MSG -- ${ dateUtil.fullTime() } -- ${ ipClient } -- ${ data.name } -- ${ data.message }\n`);
			socket.broadcast.emit('message', { name : data.name, message : data.message, time : dateUtil.time() });
			socket.broadcast.emit('messageForAdmin', { name : data.name, message : data.message, ipClient : ipClient, time : dateUtil.time() });
		});

		// message from admin => broadcast to all clients with style
		socket.on('messageFromAdmin', (data) => {
			logWriter.write(`ADMIN_MSG -- ${ dateUtil.fullTime() } name : ${ data.name } MESSAGE : ${ data.message }\n`);
			socket.broadcast.emit('messageFromAdmin', { name : data.name, message : data.message, time : dateUtil.time() });
		});

		// ban this IP on request from an admin
		// server log, write to banned-addresses, call banClient(), push to globalBannedAddresses
		socket.on('banIp', (ip) => {
			logWriter.write(`ADMIN_BAN -- ${ dateUtil.fullTime() } -- ${ ip }\n`);
			let banWriter = fs.createWriteStream(`${ pathToFiles }banned-addresses`, { flags : 'a' });
			banWriter.write(`${ ip }\n`);
			banWriter.end();
			banClient(ip);
			globalBannedAddresses.push(ip);
		});

		// add administrator
		socket.on('addAdmin', (data) => {
			let usersWriter = fs.createWriteStream(`${ pathToFiles }users`, { flags : 'a' });
			usersWriter.write(`${ data.name } ${ data.password }\n`);
			usersWriter.end();
			globalUsersFormated.push(data.name)
		});

		// update client number on disconnect
		socket.on('disconnect', () => {
			socket.broadcast.emit('updateClientNumber', { clientNumber : Object.keys(io.sockets.connected).length });
		});
	});
};

// take array of users with password, return just name
const formatUsers = (arrayOfUsers) => {
	arrayOfUsers = arrayOfUsers.map((user) => {
		return user.split(' ')[0]
	});
	return arrayOfUsers;
};

//dateUtil object
const date = new Date();
const hour = date.getHours();
const minutes = date.getMinutes();
const fullTime = date.toLocaleString();
const dateUtil = {
	time : () => {
		return `${ hour }:${ minutes }`;
	},
	fullTime : () => {
		return `${ fullTime }`
	}
};
