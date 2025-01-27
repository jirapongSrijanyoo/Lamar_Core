const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { formatUptime } = require('../utils/formatUptime'); // นำเข้า formatUptime

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('เช็คค่าปิงของบอท'),
    async execute(interaction) {
        const latency = Date.now() - interaction.createdTimestamp; // คำนวณ latency
        const uptime = process.uptime() * 1000; // แปลง uptime เป็นมิลลิวินาที
        const uptimeString = formatUptime(uptime); // จัดรูปแบบ uptime

        // สร้าง Embed สำหรับแสดงข้อมูล
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🏓 Pong!')
            .addFields(
                { name: 'Latency', value: `${latency}ms`, inline: true },
                { name: 'Uptime', value: uptimeString, inline: true }
            );

        // ตอบกลับด้วย embed
        await interaction.reply({ embeds: [embed] });
    },
};