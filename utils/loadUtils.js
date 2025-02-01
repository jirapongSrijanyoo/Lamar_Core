const fs = require('fs');
const path = require('path');
const { loginfo } = require('./logger'); // นำเข้า loginfo จาก logger

// ฟังก์ชันสำหรับโหลดไฟล์ทั้งหมดในโฟลเดอร์
const loadFiles = (dir, type) => {
    const files = fs.readdirSync(dir).filter(file => file.endsWith('.js'));

    for (const file of files) {
        const filePath = path.join(dir, file);
        require(filePath); // โหลดไฟล์
        loginfo(`Loaded ${type}: ${file}`); // ใช้ loginfo
    }
};

// โหลดไฟล์ในโฟลเดอร์ utils
const loadUtils = () => {
    const utilsDir = path.join(__dirname);
    loadFiles(utilsDir, 'Event');
};

// ส่งออกฟังก์ชัน
module.exports = { loadUtils };
