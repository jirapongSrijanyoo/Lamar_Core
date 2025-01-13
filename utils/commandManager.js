const { REST, Routes } = require('discord.js');

/**
 * ลบคำสั่งแบบเซิร์ฟเวอร์ และเพิ่มคำสั่งแบบโกบอล
 * @param {Collection} commands - คำสั่งทั้งหมดของบอท
 * @param {string[]} guildIds - รายชื่อเซิร์ฟเวอร์
 * @param {string} token - Token ของบอท
 * @param {string} clientId - Client ID ของบอท
 * @param {Function} loginfo - ฟังก์ชันสำหรับ log ข้อความ
 */
async function syncCommands(commands, guildIds, token, clientId, loginfo) {
    const rest = new REST({ version: '10' }).setToken(token);

    try {
        loginfo('Started reloading application (/) commands.');

        // ตรวจสอบคำสั่งซ้ำ
        const commandNames = commands.map(cmd => cmd.data.name);
        const duplicateCommands = commandNames.filter((name, index) => commandNames.indexOf(name) !== index);

        if (duplicateCommands.length > 0) {
            throw new Error(`พบคำสั่งที่มีชื่อซ้ำ: ${duplicateCommands.join(', ')}`);
        }

        // ลบคำสั่งแบบเซิร์ฟเวอร์
        for (const guildId of guildIds) {
            await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] });
        }

        // เพิ่มคำสั่งแบบโกบอล
        const commandData = commands.map(cmd => cmd.data.toJSON());

        // Log สำหรับคำสั่งที่กำลังจะเพิ่ม
        commandData.forEach(cmd => loginfo(`reloaded /${cmd.name}`));

        await rest.put(Routes.applicationCommands(clientId), { body: commandData });

        loginfo('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Error reloading commands:', error);
        if (error.message.includes('พบคำสั่งที่มีชื่อซ้ำ')) {
            // สามารถเพิ่มการแจ้งเตือนหรือการจัดการเมื่อพบคำสั่งซ้ำได้ที่นี่
            loginfo(`Duplicate command names detected: ${error.message}`);
        }
    }
}

module.exports = { syncCommands };
