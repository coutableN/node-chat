//node-chat-admin-client.js
const socket = io({ reconnexion : false }).connect('http://localhost:8080');
const ncFormChat = document.querySelector('#ncFormChat');
const ncMessage = document.querySelector('#ncMessage');
const ncName = document.querySelector('#ncName');
const ncChatZone = document.querySelector('#ncChatZone');
const ncBannedAddressesZone = document.querySelector('#ncBannedAddressesZone');
const ncUsersZone = document.querySelector('#ncUsersZone');
const ncFormIpToBan = document.querySelector('#ncFormIpToBan');
const ncInputIpToBan = document.querySelector('#ncInputIpToBan');
const ncFormAddAdmin = document.querySelector('#ncFormAddAdmin');
const ncNewAdminName = document.querySelector('#ncNewAdminName');
const ncNewAdminPwd1 = document.querySelector('#ncNewAdminPwd1');
const ncNewAdminPwd2 = document.querySelector('#ncNewAdminPwd2');

// update client number
socket.on('updateClientNumber', (data) => {
    getClientNumber(data.clientNumber);
});

// add message from server to DOM
socket.on('messageForAdmin', (data) => {
    appendAdminMessageToDOM(data.name, data.message, data.ipClient, data.time);
});

// banned from chat
socket.on('banned', (data) => {
    appendMessageToDOM('BAN', data.message, 'banned', data.time);
});

// send message to server
ncFormChat.addEventListener('submit', (e) => {
    e.preventDefault();
    socket.emit('messageFromAdmin', { name : ncName.value, message : ncMessage.value });
    appendMessageToDOM(ncName.value, ncMessage.value, 'admin', getLocalDate());
    ncMessage.value = "";
    ncMessage.focus();
});

// ban @IP on submit
ncFormIpToBan.addEventListener('submit', (e) => {
    e.preventDefault();
    banIp(ncInputIpToBan.value);
    let p = document.createElement('p');
    p.innerHTML = ncInputIpToBan.value;
    ncBannedAddressesZone.appendChild(p);
    ncInputIpToBan.value="";
    ncInputIpToBan.focus();
});

// add new administrator
ncFormAddAdmin.addEventListener('submit', (e) => {
    e.preventDefault();
    if (ncNewAdminPwd1.value === ncNewAdminPwd2.value && ncNewAdminName.value.length <= 10 && ncNewAdminPwd1.value.length >= 4) {
        addAdmin(ncNewAdminName.value, ncNewAdminPwd1.value);
        let p = document.createElement('p');
        p.innerHTML = ncNewAdminName.value;
        ncUsersZone.appendChild(p);
        ncNewAdminName.value = "";
        ncNewAdminPwd1.value = "";
        ncNewAdminPwd2.value = "";
        ncNewAdminName.focus();
    } else if (ncNewAdminPwd1.value !== ncNewAdminPwd2.value) {
        alert('Error : passwords are not equal.');
    } else if (ncNewAdminName.value.length > 10) {
        alert('Error : name must be less than 10 characters.');
    } else if (ncNewAdminPwd1.value.length < 4) {
        alert('Error : password must be at least 4 characters, it is recommanded to use 8 or more special characters with uppercase and digits.')
    }
});

// event ban @IP
const banIp = (ip) => {
    socket.emit('banIp', ip);
}

// ban @IP on user @IP click on chat
const banIpClick = (ip) => {
    banIp(ip);
    let p = document.createElement('p');
    p.innerHTML = ip;
    ncBannedAddressesZone.appendChild(p);
}

// event add new admin
const addAdmin = (name, pwd) => {
    socket.emit('addAdmin', { name : name, password : pwd });
}

// function appendMessageToDOM
const appendMessageToDOM = (name, message, style, time) => {
    if (name === '') {
        name = 'Masked';
    }
    let p = document.createElement('p');
    p.innerHTML = `${ time } - <b>${ name }</b> : ${ message }`;

    if (style === 'banned') {
        p.style.color = 'red';
    } else if (style === 'admin') {
        p.style.color = '#007bff';
        p.style.fontWeight = 'bold';
    }
    ncChatZone.appendChild(p);
};

const appendAdminMessageToDOM = (name, message, ip, time) => {
    if (name === '') {
        name = 'Masked';
    }
    let p = document.createElement('p');
    p.innerHTML = `
    ${ time } - <span class="delete-ip" onclick="banIpClick(this.innerHTML)">${ ip }</span> - <b>${ name }</b> -  ${ message }
    `;
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