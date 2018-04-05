# node-chat

A simple file based, real time chat client-server solution in node.js, ready to be deployed in your applications in two lines.

## table of content
* [Intro](#intro)
* [Deploy](#deploy)
* [Administration](#administration)
* [Auth](#auth)
* [Files](#files)
	* [banned-addresses](#banned-addresses)
	* [users](#users)
	* [log](#log)
* [Create a chat client in another page](#configclient)

## Intro

node-chat is a node.js package to deploy a mono-room chat server that includes :

* Real time communication based on web sockets
* Administration panel
* Ban users by @IP address
* Manage administrators with login and password
* Log system

The solution comes with a single page application as the chat room at **<your_domain>/chat**, with the client javascript file you can implement a chat instance in all your pages.

## Deploy

**First of all you need the node-chat folder in your node_modules.**

Then, you can createChatServer.

```javascript
const app = require('express')();
const server = require('http').createServer(app);
// create a chat server
const nodeChat = require('node-chat');
nodeChat.createChatServer(app, server);
```
Now your application has 3 new urls
* **/chat** : a single page application which is the chat room.
* **/node-chat-login** : the login page.
* **/node-chat-admin** : the administration panel, you need to auth on /node-chat-login to get here.

All clients can now chat in real time either at **<your_domain>/chat** or anywhere in a page configured. see [create a chat client in another page](#configclient)

## Administration

You can manage your chat server :
* add new administrators
* ban @IP addresses
* talk as an admin

First, you have to be authentified.

## Auth

Go to **/node-chat-login** and log with a correct user/password to get **/node-chat-admin**. Users are specified in the node-chat/users file and can be added in the admin panel or directly in the file, see [users](#users)

## Files

### banned-addresses

Always edit this file from /node-chat-admin
Or restart the node server after. 

banned-addresses stores all @IP that are banned from the chat server
the syntax is the following :

@ip1

@ip2

### users
	
users is a file where all admins are registered with this syntax :

name1 password1

name2 password2

When creating an admin from the admin panel, name must be less than 10 chars and password more than 4.
But you can do what you want in the users file.

Exemple : "   "/n (three space and a new line) will allow you to login without user name or password. **DON'T DO THIS IN PRODUCTION OR ANYONE CAN ACCESS THE ADMIN PANEL**

### log

type :	INFO_CONN -- datetime -- client @IP

type :	NEW_MSG -- datetime -- client @IP -- client pseudo -- client message

type :	ADMIN_MSG -- datetime -- admin pseudo -- admin message

type :	ADMIN_BAN -- datetime -- @IP banned

admin name is auto set by authentication but **can be changed by the admin**, 
this is the only case where you can see an admin pseudo that is not registered
in the [users] file in your logs.

Made in France by Nicolas Coutable
coutable.n@hotmail.fr
