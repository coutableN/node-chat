/*
*	node-chat-js
*	by Nicolas Coutable
*	nicolas-coutable.fr
*	coutable.n@hotmail.fr
*	v0.0.4
*	04/2018
*
*/
exports.createChatServer = (app, server) => {

	const express = require('express');
	const io = require('socket.io').listen(server);
	const fs = require('fs');
	const path = require('path');
	const pathToFiles = 'node_modules/node-chat-js/';
	const bodyParser = require('body-parser');
	// create a session with a random string as secret
	const session = require('express-session')({
		secret : randomString(),
		resave : true,
		saveUninitialized : true
	});
	const sharedSession = require('express-socket.io-session');
	const bcrypt = require('bcrypt');
	// difficulty of the hash function
	const saltRounds = 10;
	// if the users file is empty, enter in setup mode
	let setupMode = fs.readFileSync(`${ pathToFiles }users`, 'utf-8') === '';
	// watch any change on the users file
	const setupModeWatcher = fs.watch(`${ pathToFiles }users`);

	setupModeWatcher.on('change', () => {
		setupMode = fs.readFileSync(`${ pathToFiles }users`, 'utf-8') === '';
	});

	// global bannedAddresses & users (out of IO scope)
	const globalBannedAddresses = fs.readFileSync(`${ pathToFiles }banned-addresses`, 'utf-8').split(/\r?\n/);
	const globalUsers = fs.readFileSync(`${ pathToFiles }users`, 'utf-8').split(/\r?\n/);
	// to render users list without password
	const globalUsersFormated = formatUsers(globalUsers);

	// session
	app.use(session);
	// share session with socket.io connections
	io.use(sharedSession(session));

	app.set('view engine', 'ejs')
	// use node-chat-js ejs views
	.set('views', path.join(__dirname, '../node-chat-js/views'))
	// virtual path for static client files
	.use('/node-chat-js', express.static(__dirname + '/public'))
	.use('/bootstrap', express.static(__dirname + '/../bootstrap/dist'))
	.use(bodyParser.urlencoded({ extended : true }))
	.use(bodyParser.json())

	// render /chat
	.get('/chat', (req, res) => {
		res.render('chat.ejs');
	})

	.get('/nc-login', (req, res) => {
		// setup mode if the file 'users' is empty else login page
		if (setupMode) {
			console.log('node-chat-js : You are in setup mode, please create an admin.');
			res.render('nc-admin.ejs', {
				name : 'setup-mode',
				bannedAddresses : null,
				users : null,
				setupMode : true
			});
		} else {
			res.render('nc-login.ejs', { errorLogin : false });
		}
	})

	.post('/nc-admin', (req, res) => {
		// read users file
		let users = fs.readFileSync(`${ pathToFiles }users`, 'utf-8').split(/\r?\n/);

		// compare login name with users in file, if name match => compare hashes
		// if hashes are equal => login, else redirect with error message (password error)
		// render error if last name is not an admin name (name error)
		for (let i = 0; i < users.length; i++) {
			if (req.body.login === users[i].split(' ')[0]) {
				bcrypt.compare(req.body.pwd, users[i].split(' ')[1], (err, bcryptRes) => {
					if (bcryptRes === true) {
						// auth admin in session
						req.session.isAdmin = true;
						res.render('nc-admin.ejs', {
							name : req.body.login,
							bannedAddresses : globalBannedAddresses,
							users : globalUsersFormated,
							setupMode : false
						});
					} else {
						res.render('nc-login.ejs', { errorLogin : true });
					}
				});
			}
			if (req.body.login != users[users.length-1].split(' ')[0]) {
				res.render('nc-login.ejs', { errorLogin : true });
			}
		}
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
			if(socket.handshake.session.isAdmin) {
				logWriter.write(`ADMIN_MSG -- ${ dateUtil.fullTime() } name : ${ data.name } MESSAGE : ${ data.message }\n`);
				socket.broadcast.emit('messageFromAdmin', { name : data.name, message : data.message, time : dateUtil.time() });
			}
		});

		// ban this IP on request from an admin
		// server log, write to banned-addresses, call banClient(), push to globalBannedAddresses
		socket.on('banIp', (ip) => {
			if(socket.handshake.session.isAdmin) {
				logWriter.write(`ADMIN_BAN -- ${ dateUtil.fullTime() } -- ${ ip }\n`);
				let banWriter = fs.createWriteStream(`${ pathToFiles }banned-addresses`, { flags : 'a' });
				banWriter.write(`\n${ ip }`);
				banWriter.end();
				banClient(ip);
				globalBannedAddresses.push(ip);
			}
		});

		// add administrator
		socket.on('addAdmin', (data) => {
			if(socket.handshake.session.isAdmin || setupMode) {
				bcrypt.hash(data.password, saltRounds, (err, hash) => {
					let usersWriter = fs.createWriteStream(`${ pathToFiles }users`, { flags : 'a' });
					usersWriter.write(`\n${ data.name } ${ hash }`);
					usersWriter.end();
				});
				globalUsersFormated.push(data.name);
			}
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

// create a random string
const randomString = () => {
	const alphanumeric = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let res = '';
	for (let i = 0; i < 10; i++) {
		res += alphanumeric.charAt(Math.floor(Math.random() * alphanumeric.length));
	}
	return res;
}

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
