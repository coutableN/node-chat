# node-chat

A simple file based, real time chat in node.js, ready to be deployed in your applications in two lines.
Including :
	_ Real time communication based on web sockets
	_ Administration panel
	_ Ban users by IP address
	_ Manage administrators with login and passwords
	_ Full log and history


SERVER SIDE :

Authentication as admin :

	Users should be registered in the 'users' file.
	Then, go to the url :

	<DOMAIN | @IP>/node-chat-login

	and enter correct pseudo/password association.

banned-addresses [file] :

	Always edit this file from /node-chat-admin
	Or restart the node server after. 

	banned-addresses stores all @IP that are banned from the chat server
	the syntax is the following :

	@ip1
	@ip2

users [file] :
	
	users is a file where all admin are registered with this syntax :

	name1 password1
	name2 password2

log [file] :

	type :	INFO_CONN -- datetime -- client @IP
	type :	NEW_MSG -- datetime -- client @IP -- client pseudo -- client message
	type :	ADMIN_MSG -- datetime -- admin pseudo -- admin message
	type :	ADMIN_BAN -- datetime -- @IP banned

	/!\ admin name is auto set by authentication but can be changed by the admin, 
	this is the only case where you can see an admin pseudo that is not registered
	in the [users] file in your logs. /!\

Made in France by Nicolas Coutable
coutable.n@hotmail.fr
