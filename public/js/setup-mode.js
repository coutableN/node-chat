const socket = io({ reconnexion : false }).connect('http://localhost:8080');
const ncFormAddAdmin = document.querySelector('#ncFormAddAdmin');
const ncNewAdminName = document.querySelector('#ncNewAdminName');
const ncNewAdminPwd1 = document.querySelector('#ncNewAdminPwd1');
const ncNewAdminPwd2 = document.querySelector('#ncNewAdminPwd2');
// event add new admin
const addAdmin = (name, pwd) => {
    socket.emit('addAdmin', { name : name, password : pwd });
}
// add new administrator
ncFormAddAdmin.addEventListener('submit', (e) => {
    e.preventDefault();
    if (ncNewAdminPwd1.value === ncNewAdminPwd2.value && ncNewAdminName.value.length <= 10 && ncNewAdminPwd1.value.length >= 4) {
        addAdmin(ncNewAdminName.value, ncNewAdminPwd1.value);
        let p = document.createElement('p');
        p.classList.add('alert-success');
        p.classList.add('text-center');
        p.innerHTML = ncNewAdminName.value + ' : admin successfully add, please disconnect';
        ncFormAddAdmin.appendChild(p);
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
