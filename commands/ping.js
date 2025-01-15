const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('เช็คค่าปิงของบอท'),
    async execute(interaction) {
        const latency = Date.now() - interaction.createdTimestamp;
        const uptime = process.uptime();
        const uptimeString = new Date(uptime * 1000).toISOString().substr(11, 8);

        // สร้าง Embed สำหรับแสดงข้อมูล
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🏓 Pong!')
            .addFields(
                { name: 'Latency', value: `${latency}ms`, inline: true },
                { name: 'Uptime', value: uptimeString, inline: true }
            )
            .setTimestamp()

        // ตอบกลับด้วย embed
        await interaction.reply({ embeds: [embed] });
    },
};
