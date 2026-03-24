// Firebase Setup
const firebaseConfig = {
    apiKey: "AIzaSyA82xtUZsN7ZadQWmbIno5CgLZfhrD5-vc",
    authDomain: "karaoke-3d0ce.firebaseapp.com",
    databaseURL: "https://karaoke-3d0ce-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "karaoke-3d0ce",
    storageBucket: "karaoke-3d0ce.firebasestorage.app",
    messagingSenderId: "781032814827",
    appId: "1:781032814827:web:4233f807db2b03246ce6ae"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Data
let songs = [];
let currentRotation = 0; 
let currentWinnerId = null; 
let isSingerMode = false; 

const punishmentsA = ["โดนปะแป้งหน้าขาว", "ต้องร้องเพี้ยนทั้งเพลง", "ร้องแบบผู้ดี", "เต้นไปร้องไป", "ร้องแบบกระซิบ"];
const punishmentsB = ["กินน้ำมะนาวเพียว", "ใส่แว่นดำร้องเพลง", "บีบจมูกร้องท่อนฮุค", "ร้องแบบโอเปร่า", "หันหลังให้จอ"];

// Firebase Listeners
db.ref('karaoke_songs').on('value', (snapshot) => {
    songs = []; 
    snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        data.id = childSnapshot.key; 
        songs.push(data);
    });
    drawMainWheel();
    if(isSingerMode) renderDashboard();
});

// UI Modals
window.openRequestModal = () => document.getElementById('requestModal').style.display = 'block';
window.closeModal = (id) => document.getElementById(id).style.display = 'none';

window.openLoginModal = () => { 
    if(isSingerMode) {
        if(confirm('ต้องการออกจากระบบ Morbai ใช่ไหม?')) {
            isSingerMode = false;
            document.body.classList.remove('singer-mode');
            document.getElementById('loginToggleBtn').innerText = 'Morbai Only';
        }
    } else {
        document.getElementById('loginModal').style.display = 'block'; 
    }
};

window.onclick = (event) => {
    if (event.target.classList.contains('modal')) event.target.style.display = "none";
};

// User Actions
window.submitSong = (e) => {
    e.preventDefault();
    const name = document.getElementById('songName').value.trim();
    const link = document.getElementById('songLink').value.trim();
    const friend = document.getElementById('friendName').value.trim();
    const wA = document.getElementById('wheelA').checked;
    const wB = document.getElementById('wheelB').checked;
    if (!name && !link) return alert('กรุณากรอกข้อมูลให้ครบครับ');
    db.ref('karaoke_songs').push({ name, link, friend, wheelA: wA, wheelB: wB });
    e.target.reset();
    window.closeModal('requestModal');
};

// Singer Actions
window.checkLogin = () => {
    const correctPass = import.meta.env.VITE_SINGER_PASSWORD; 
    
    if (document.getElementById('singerPass').value === correctPass) { 
        isSingerMode = true;
        document.body.classList.add('singer-mode'); 
        document.getElementById('loginToggleBtn').innerText = 'Logout';
        window.closeModal('loginModal');
        document.getElementById('singerPass').value = '';
        renderDashboard(); 
    } else {
        alert('รหัสผ่านไม่ถูกต้อง');
    }
};

function renderDashboard() {
    const tbody = document.getElementById('songListBody');
    tbody.innerHTML = '';
    songs.forEach(song => {
        const title = song.name || `Link: ${song.link.substring(0, 20)}...`;
        tbody.innerHTML += `
            <tr>
                <td>${title}</td>
                <td>${song.friend || '-'} <br><small>[A:${song.wheelA?'✅':'❌'} B:${song.wheelB?'✅':'❌'}]</small></td>
                <td>
                    <button class="btn-edit" onclick="editSong('${song.id}')">แก้ไข</button>
                    <button class="btn-danger" onclick="deleteSong('${song.id}')">ลบ</button>
                </td>
            </tr>`;
    });
}

window.editSong = (id) => {
    const song = songs.find(s => s.id === id);
    if(!song) return;
    document.getElementById('editSongId').value = song.id;
    document.getElementById('editSongName').value = song.name || '';
    document.getElementById('editSongLink').value = song.link || '';
    document.getElementById('editFriendName').value = song.friend || '';
    document.getElementById('editWheelA').checked = song.wheelA !== false; 
    document.getElementById('editWheelB').checked = song.wheelB !== false;
    document.getElementById('editModal').style.display = 'block';
};

window.saveEditSong = () => {
    const id = document.getElementById('editSongId').value;
    db.ref('karaoke_songs/' + id).update({
        name: document.getElementById('editSongName').value.trim(),
        link: document.getElementById('editSongLink').value.trim(),
        friend: document.getElementById('editFriendName').value.trim(),
        wheelA: document.getElementById('editWheelA').checked,
        wheelB: document.getElementById('editWheelB').checked
    }).then(() => window.closeModal('editModal'));
};

window.deleteSong = (id) => {
    if(confirm('ลบเพลงนี้ทิ้งเลยไหม?')) db.ref('karaoke_songs/' + id).remove();
};

// Main Wheel
function drawMainWheel() {
    const canvas = document.getElementById('mainWheelCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (songs.length === 0) {
        ctx.fillStyle = '#2c2c2c'; ctx.beginPath(); ctx.arc(150, 150, 150, 0, 2 * Math.PI); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '16px Arial'; ctx.textAlign = 'center'; ctx.fillText('ยังไม่มีเพลง', 150, 155);
        return;
    }
    const arc = Math.PI * 2 / songs.length;
    const colors = ['#bb86fc', '#03dac6', '#cf6679', '#f6c342', '#4b9b69', '#d16a9a'];
    songs.forEach((song, i) => {
        const angle = i * arc;
        ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath(); ctx.moveTo(150, 150); ctx.arc(150, 150, 150, angle, angle + arc); ctx.fill(); ctx.stroke();
        ctx.save(); ctx.translate(150, 150); ctx.rotate(angle + arc / 2); ctx.textAlign = "right";
        ctx.fillStyle = "#000"; ctx.font = "bold 14px Arial";
        ctx.fillText(song.name ? song.name.substring(0, 15) : "Link", 140, 5);
        ctx.restore();
    });
}

window.spinMainWheel = () => {
    if (songs.length === 0) return alert('ไม่มีเพลงในกงล้อหลัก!');
    const canvas = document.getElementById('mainWheelCanvas');
    if (canvas.dataset.spinning === "true") return; 
    canvas.dataset.spinning = "true";
    currentRotation += Math.floor(Math.random() * 360) + 1800;
    canvas.style.transform = `rotate(${currentRotation}deg)`;
    document.getElementById('mainResult').innerText = 'กำลังสุ่ม...';
    setTimeout(() => {
        const index = Math.floor((270 - (currentRotation % 360) + 360) % 360 / (360 / songs.length));
        showResultModal(songs[index]);
        canvas.dataset.spinning = "false";
        document.getElementById('mainResult').innerText = 'สุ่มเสร็จสิ้น!';
    }, 4000); 
};

function showResultModal(winner) {
    currentWinnerId = winner.id;
    document.getElementById('resultDetails').innerHTML = `
        <p><strong>🎵 ชื่อเพลง:</strong> ${winner.name || '-'}</p>
        <p><strong>🔗 Link:</strong> ${winner.link ? `<a href="${winner.link}" target="_blank">เปิด Link</a>` : '-'}</p>
        <p><strong>🙋 คนขอ:</strong> ${winner.friend || '-'}</p>
        <hr>
        <p><strong>🎤 ร้องแบบไหน:</strong> ${winner.wheelA !== false ? '✅' : '❌'}</p>
        <p><strong>💃 ทำอะไรตอนร้อง:</strong> ${winner.wheelB !== false ? '✅' : '❌'}</p>`;
    document.getElementById('resultModal').style.display = 'block';
}

window.deleteResultSong = () => {
    if (currentWinnerId) {
        db.ref('karaoke_songs/' + currentWinnerId).remove().then(() => {
            window.closeModal('resultModal');
            currentWinnerId = null;
        });
    }
};

// Slot Machine
window.spinSlot = (type) => {
    const list = type === 'A' ? punishmentsA : punishmentsB;
    const strip = document.getElementById(`slotStrip${type}`);
    const resultBox = document.getElementById(`result${type}`);
    if (strip.dataset.spinning === "true") return; 
    strip.dataset.spinning = "true";
    let speed = 40, spinCount = 40, currentStep = 0;
    resultBox.innerText = 'กำลังสุ่ม...';
    const swapText = () => {
        strip.innerHTML = `<div class="slot-item">${list[Math.floor(Math.random() * list.length)]}</div>`;
        currentStep++;
        if (currentStep < spinCount) {
            setTimeout(swapText, speed + (currentStep * 5));
        } else {
            const winner = list[Math.floor(Math.random() * list.length)];
            strip.innerHTML = `<div class="slot-item" style="color:#03dac6; font-weight:bold;">${winner}</div>`;
            resultBox.innerHTML = `${winner}`;
            strip.dataset.spinning = "false";
        }
    };
    swapText(); 
};

window.onload = () => { drawMainWheel(); };