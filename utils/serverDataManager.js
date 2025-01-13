const fs = require('fs');
const path = require('path');

// ฟังก์ชันสำหรับสร้างไฟล์และบันทึกข้อมูล
function saveServerData(guildId, guildName) {
    const dirPath = path.join(__dirname, '..', 'discord_server');

    // ตรวจสอบว่าโฟลเดอร์ discord_server มีหรือไม่ ถ้าไม่มีให้สร้าง
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    const filePath = path.join(dirPath, `${guildId}.json`);

    // ถ้าไฟล์ไม่มีอยู่ให้สร้างใหม่
    if (!fs.existsSync(filePath)) {
        const data = { guildName, guildId, yellow_card: [], orange_card: [], admin: [] };
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } else {
        // ถ้ามีไฟล์อยู่แล้ว ให้ตรวจสอบว่าข้อมูล guildName อัปเดตหรือยัง
        const existingData = readServerData(guildId);
        if (existingData.guildName !== guildName) {
            existingData.guildName = guildName;
            fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf8');
        }
    }
}

// ฟังก์ชันอ่านข้อมูลจากไฟล์
function readServerData(guildId) {
    const filePath = path.join(__dirname, '..', 'discord_server', `${guildId}.json`);
    if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    return null; // ถ้าไม่พบข้อมูล
}

// ฟังก์ชันลบไฟล์
function deleteServerData(guildId) {
    const filePath = path.join(__dirname, '..', 'discord_server', `${guildId}.json`);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}

module.exports = { saveServerData, readServerData, deleteServerData };
