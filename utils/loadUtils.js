const fs = require('fs');
const path = require('path');
const { loginfo } = require('./logger'); // ตรวจสอบ loginfo

// ฟังก์ชันสำหรับโหลดไฟล์ทั้งหมดในโฟลเดอร์
const loadFiles = (dir, type) => {
    try {
        const files = fs.readdirSync(dir).filter(file => file.endsWith('.js'));
        for (const file of files) {
            const filePath = path.join(dir, file);
            if (filePath !== __filename) { // ป้องกันการโหลดตัวเอง
                require(filePath);
                loginfo(`Loaded ${type}: ${file}`);
            }
        }
    } catch (error) {
        console.error(`Error loading ${type}:`, error.message);
    }
};

// โหลดไฟล์ในโฟลเดอร์ utils
const loadUtils = () => {
    const utilsDir = path.join(__dirname);
    loginfo('Loading utility modules...');
    loadFiles(utilsDir, 'Utility');
};

// ส่งออกฟังก์ชัน
module.exports = { loadUtils };
