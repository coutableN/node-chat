//node-chat-client.js
const socket = io({reconnexion : false}).connect('http://localhost:8080');
const ncformChat = document.querySelector('#ncFormChat');
const ncMessage = document.querySelector('#ncMessage');
const ncName = document.querySelector('#ncName');
const ncChatZone = document.querySelector('#ncChatZone'); 

// update client number
socket.on('updateClientNumber', (data) => {
    getClientNumber(data.clientNumber);
});

// add message from server to DOM
socket.on('message', (data) => {
    appendMessageToDOM(data.name, data.message, null, data.time);
});

// add message from server (admin) to DOM
socket.on('messageFromAdmin', (data) => {
    appendMessageToDOM(data.name, data.message, 'admin', data.time);
});

// banned from chat
socket.on('banned', (data) => {
    appendMessageToDOM('BAN' , data.message, 'banned', data.time);
});

// send message to server
ncFormChat.addEventListener('submit', (e) => {
    e.preventDefault();
    socket.emit('message', { name : ncName.value, message : ncMessage.value });
    appendMessageToDOM(ncName.value, ncMessage.value, null, getLocalDate());
    ncMessage.value = "";
    ncMessage.focus();
});

const appendMessageToDOM = (name, message, style, time) => {
    if (name === '') {
        name = 'Masked';
    }
    let p = document.createElement('p');
    p.innerHTML = `${ time } -- <b>${ name }</b> : ${ message }`;

    if (style === 'banned') {
        p.style.color = 'red';
    } else if (style === 'admin') {
        p.style.color = '#007bff';
        p.style.fontWeight = 'bold';
    }
    ncChatZone.appendChild(p);
};

const getClientNumber = (clientNumber) => {
    const ncClientNumber = document.querySelector('#ncClientNumber');
    ncClientNumber.innerHTML = clientNumber;
    ncClientNumber.classList.toggle('anim-client-number');
}

const getLocalDate = () => {
    const date = new Date();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${ hours }:${ minutes }`;
}
