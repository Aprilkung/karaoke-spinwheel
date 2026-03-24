// ================= ตั้งค่า Firebase =================
const firebaseConfig = {
    apiKey: "AIzaSyA82xtUZsN7ZadQWmbIno5CgLZfhrD5-vc",
    authDomain: "karaoke-3d0ce.firebaseapp.com",
    databaseURL: "https://karaoke-3d0ce-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "karaoke-3d0ce",
    storageBucket: "karaoke-3d0ce.firebasestorage.app",
    messagingSenderId: "781032814827",
    appId: "1:781032814827:web:4233f807db2b03246ce6ae"
};

// เริ่มต้นเปิดใช้งาน Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ================= ข้อมูล Data =================
let songs = [];
let currentRotation = 0; 
let currentWinnerId = null; 
let isSingerMode = false; 

const punishmentsA = ["โดนปะแป้งหน้าขาว", "ต้องร้องเพี้ยนทั้งเพลง", "ร้องแบบผู้ดี (ห้ามอ้าปากกว้าง)", "เต้นไปร้องไปห้ามหยุด", "ร้องแบบกระซิบ"];
const punishmentsB = ["กินน้ำมะนาวเพียว 1 ช็อต", "ใส่แว่นดำร้องเพลง", "บีบจมูกร้องเพลงท่อนฮุค", "ร้องแบบโอเปร่า", "หันหลังให้จอร้องเพลง"];

// ================= 📡 ระบบ Real-time จาก Firebase =================
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

// ================= ระบบ UI / Modals =================
function openRequestModal() { document.getElementById('requestModal').style.display = 'block'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function openLoginModal() { 
    if(isSingerMode) {
        if(confirm('ต้องการออกจากระบบ Morbai ใช่ไหม?')) {
            isSingerMode = false;
            document.body.classList.remove('singer-mode');
            document.getElementById('loginToggleBtn').innerText = 'Morbai Only';
        }
    } else {
        document.getElementById('loginModal').style.display = 'block'; 
    }
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) event.target.style.display = "none";
}

// ================= ฝั่ง User (ขอเพลง) =================
function submitSong(e) {
    e.preventDefault();
    const name = document.getElementById('songName').value.trim();
    const link = document.getElementById('songLink').value.trim();
    const friend = document.getElementById('friendName').value.trim();
    const wA = document.getElementById('wheelA').checked;
    const wB = document.getElementById('wheelB').checked;

    if (!name && !link) return alert('กรุณากรอกชื่อเพลง หรือ Link อย่างใดอย่างหนึ่งครับ');

    // 📡 ส่งข้อมูลขึ้น Firebase
    db.ref('karaoke_songs').push({ name, link, friend, wheelA: wA, wheelB: wB });
    
    e.target.reset();
    closeModal('requestModal');
    // ลบ pop-up แจ้งเตือนออกตามที่รีเควสครับ
}

// ================= ฝั่ง Singer (Morbai Only) =================
function checkLogin() {
    if (document.getElementById('singerPass').value === '1234') { 
        isSingerMode = true;
        document.body.classList.add('singer-mode'); 
        document.getElementById('loginToggleBtn').innerText = '🔴 ออกจากระบบ';
        
        closeModal('loginModal');
        document.getElementById('singerPass').value = '';
        renderDashboard(); 
    } else {
        alert('รหัสผ่านไม่ถูกต้อง');
    }
}

function renderDashboard() {
    const tbody = document.getElementById('songListBody');
    tbody.innerHTML = '';
    songs.forEach(song => {
        const displayTitle = song.name || `Link: ${song.link.substring(0, 20)}...`;
        const displayFriend = song.friend || '-';
        
        tbody.innerHTML += `
            <tr>
                <td>${displayTitle}</td>
                <td>
                    ${displayFriend} <br>
                    <span style="font-size: 0.8rem; color: #aaa;">[ร้องแบบไหน: ${song.wheelA ? '✅' : '❌'} | ทำอะไร: ${song.wheelB ? '✅' : '❌'}]</span>
                </td>
                <td>
                    <button class="btn-edit" onclick="editSong('${song.id}')">แก้ไข</button>
                    <button class="btn-danger" onclick="deleteSong('${song.id}')">ลบ</button>
                </td>
            </tr>
        `;
    });
}

function editSong(id) {
    const song = songs.find(s => s.id === id);
    if(!song) return;

    document.getElementById('editSongId').value = song.id;
    document.getElementById('editSongName').value = song.name || '';
    document.getElementById('editSongLink').value = song.link || '';
    document.getElementById('editFriendName').value = song.friend || '';
    document.getElementById('editWheelA').checked = song.wheelA !== false; 
    document.getElementById('editWheelB').checked = song.wheelB !== false;

    document.getElementById('editModal').style.display = 'block';
}

function saveEditSong() {
    const id = document.getElementById('editSongId').value;
    
    db.ref('karaoke_songs/' + id).update({
        name: document.getElementById('editSongName').value.trim(),
        link: document.getElementById('editSongLink').value.trim(),
        friend: document.getElementById('editFriendName').value.trim(),
        wheelA: document.getElementById('editWheelA').checked,
        wheelB: document.getElementById('editWheelB').checked
    }).then(() => {
        closeModal('editModal');
    });
}

function deleteSong(id) {
    if(confirm('ลบเพลงนี้ทิ้งเลยไหม?')) {
        db.ref('karaoke_songs/' + id).remove();
    }
}

// ================= ระบบกงล้อหลัก =================
function drawMainWheel() {
    const canvas = document.getElementById('mainWheelCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (songs.length === 0) {
        ctx.fillStyle = '#2c2c2c';
        ctx.beginPath(); ctx.arc(150, 150, 150, 0, 2 * Math.PI); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '16px Arial'; ctx.textAlign = 'center';
        ctx.fillText('ยังไม่มีเพลง', 150, 155);
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

function spinMainWheel() {
    if (songs.length === 0) return alert('ไม่มีเพลงในกงล้อหลัก!');
    const canvas = document.getElementById('mainWheelCanvas');
    if (canvas.dataset.spinning === "true") return; 
    canvas.dataset.spinning = "true";

    const randomDegree = Math.floor(Math.random() * 360) + 1800; 
    currentRotation += randomDegree;
    canvas.style.transform = `rotate(${currentRotation}deg)`;
    document.getElementById('mainResult').innerText = 'กำลังสุ่ม...';

    setTimeout(() => {
        const actualDeg = currentRotation % 360;
        const arc = 360 / songs.length;
        const normalizedDeg = (270 - actualDeg + 360) % 360;
        const index = Math.floor(normalizedDeg / arc);
        const winner = songs[index];
        
        document.getElementById('mainResult').innerText = 'สุ่มเสร็จสิ้น! ดูผลลัพธ์บนหน้าจอ';
        showResultModal(winner);
        canvas.dataset.spinning = "false";
    }, 4000); 
}

function showResultModal(winner) {
    currentWinnerId = winner.id;
    const nameText = winner.name ? winner.name : '<span style="color:#aaa;">-</span>';
    const linkText = winner.link ? `<a href="${winner.link}" target="_blank" style="color:var(--secondary-color); text-decoration: underline;">เปิด Link เพลง</a>` : '<span style="color:#aaa;">-</span>';
    const friendText = winner.friend ? winner.friend : '<span style="color:#aaa;">-</span>';
    const wheelAText = winner.wheelA !== false ? '<span style="color:#03dac6;">✅ ยอมรับ</span>' : '<span style="color:#cf6679;">❌ ไม่รับ</span>';
    const wheelBText = winner.wheelB !== false ? '<span style="color:#03dac6;">✅ ยอมรับ</span>' : '<span style="color:#cf6679;">❌ ไม่รับ</span>';

    // เปลี่ยนคำให้ตรงกับหน้าเว็บ
    document.getElementById('resultDetails').innerHTML = `
        <p style="margin: 10px 0;"><strong>🎵 ชื่อเพลง:</strong> ${nameText}</p>
        <p style="margin: 10px 0;"><strong>🔗 Link:</strong> ${linkText}</p>
        <p style="margin: 10px 0;"><strong>🙋 คนขอ:</strong> ${friendText}</p>
        <hr style="border-color: #444; margin: 15px 0;">
        <p style="margin: 10px 0;"><strong>🎤 ร้องแบบไหน:</strong> ${wheelAText}</p>
        <p style="margin: 10px 0;"><strong>💃 ทำอะไรตอนร้อง:</strong> ${wheelBText}</p>
    `;
    document.getElementById('resultModal').style.display = 'block';
}

function deleteResultSong() {
    if (currentWinnerId) {
        db.ref('karaoke_songs/' + currentWinnerId).remove().then(() => {
            closeModal('resultModal');
            document.getElementById('mainResult').innerText = 'ลบเพลงออกและพร้อมสุ่มใหม่แล้ว!';
            currentWinnerId = null;
        });
    }
}

// ================= ระบบ Slot Machine =================
function updateSlotUI(type) {
    const strip = document.getElementById(`slotStrip${type}`);
    if(strip) {
        strip.style.transition = 'none';
        strip.style.transform = 'translateY(0)';
        strip.innerHTML = '<div class="slot-item">พร้อมสุ่ม...</div>';
    }
}

function spinSlot(type) {
    const list = type === 'A' ? punishmentsA : punishmentsB;
    const strip = document.getElementById(`slotStrip${type}`);
    const resultBox = document.getElementById(`result${type}`);
    
    if (strip.dataset.spinning === "true") return; 
    strip.dataset.spinning = "true";

    strip.style.transition = 'none';
    strip.style.transform = 'translateY(0)';

    let speed = 40; 
    let spinCount = Math.floor(Math.random() * 15) + 30; 
    let currentStep = 0;
    
    resultBox.innerText = 'กำลังสุ่มชาเลนจ์...';

    function swapText() {
        const randomItem = list[Math.floor(Math.random() * list.length)];
        strip.innerHTML = `<div class="slot-item">${randomItem}</div>`;
        
        currentStep++;
        if (currentStep > spinCount - 10) speed += 40; 

        if (currentStep < spinCount) {
            setTimeout(swapText, speed);
        } else {
            const winner = list[Math.floor(Math.random() * list.length)];
            strip.innerHTML = `<div class="slot-item" style="color: var(--secondary-color); font-weight: bold; font-size: 1.1rem; text-align: center; line-height: 1.4;">${winner}</div>`;
            resultBox.innerHTML = `${winner}`;
            strip.dataset.spinning = "false";
        }
    }
    swapText(); 
}

window.onload = () => {
    drawMainWheel();
    updateSlotUI('A');
    updateSlotUI('B');
};