//node-chat-client.js
const socket = io({reconnexion : false}).connect('http://localhost:8080');
const formChat = document.querySelector('#formChat');
const inputField = document.querySelector('#inputField');
const pseudo = document.querySelector('#pseudo');
const chatZone = document.querySelector('#chatZone'); 

// add message from server to DOM
socket.on('message', (data) => {
    appendMessageToDOM(data.pseudo, data.message, null, data.time);
});

// add message from server (admin) to DOM
socket.on('messageFromAdmin', (data) => {
    appendMessageToDOM(data.pseudo, data.message, 'admin', data.time);
});

// banned from chat
socket.on('banned', (data) => {
    appendMessageToDOM('BAN' , data.message, 'banned', data.time);
});

// send message to server
formChat.addEventListener('submit', (e) => {
    e.preventDefault();
    socket.emit('message', { pseudo : pseudo.value, message : inputField.value });
    appendMessageToDOM(pseudo.value, inputField.value, null, getLocalDate());
    inputField.value = "";
    inputField.focus();
});

// function appendMessageToDOM
const appendMessageToDOM = (pseudo, message, style, time) => {
    if (pseudo === '') {
        pseudo = 'Masked';
    }
    let p = document.createElement('p');
    p.innerHTML = `${ time } -- <b>${ pseudo }</b> : ${ message }`;

    if (style === 'banned') {
        p.style.color = 'red';
    } else if (style === 'admin') {
        p.style.color = '#007bff';
        p.style.fontWeight = 'bold';
    }
    chatZone.appendChild(p);
};

const getLocalDate = () => {
    const date = new Date();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${ hours }:${ minutes }`;
}
