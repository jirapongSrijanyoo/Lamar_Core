const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const si = require('systeminformation'); // ใช้สำหรับข้อมูลระบบ

module.exports = {
    data: new SlashCommandBuilder().setName('info').setDescription('ข้อมูลของบอท'),
    async execute(interaction) {
        const botName = interaction.client.user.username;
        const botTag = interaction.client.user.tag;
        const botId = interaction.client.user.id;
        const botAvatar = interaction.client.user.displayAvatarURL();
        const guildCount = interaction.client.guilds.cache.size;

        // ดึงข้อมูลระบบแบบละเอียด
        const [osInfo, memInfo, cpuInfo, diskInfo] = await Promise.all([
            si.osInfo(),
            si.mem(),
            si.cpu(),
            si.fsSize()
        ]);

        const osName = `${osInfo.distro} ${osInfo.release}`; // เช่น Windows 11 Home Single Language 23H2
        const totalRam = memInfo.total / 1024 / 1024 / 1024; // GB
        const usedRam = (memInfo.total - memInfo.available) / 1024 / 1024 / 1024; // GB
        const cpuModel = cpuInfo.manufacturer + ' ' + cpuInfo.brand;

        // คำนวณพื้นที่เก็บข้อมูล
        const totalDisk = diskInfo.reduce((total, disk) => total + disk.size, 0) / 1024 / 1024 / 1024; // GB
        const usedDisk = diskInfo.reduce((used, disk) => used + disk.used, 0) / 1024 / 1024 / 1024; // GB

        // ข้อมูลเวอร์ชัน
        const nodeVersion = process.version;
        const discordVersion = require('discord.js').version;

        // สร้าง Embed สำหรับแสดงข้อมูล
        const embed = new EmbedBuilder()
            .setAuthor({ name: `${botName} | Information`, iconURL: botAvatar })
            .setTitle(botTag)
            .setThumbnail(botAvatar)
            .setDescription(
                `┊ **ID:** ${botId}\n` +
                `┊ **Username:** ${botName}\n` +
                `┊ **Guild(s):** ${guildCount}\n` +
                `┊ **OS:** ${osName}\n` +
                `┊ **CPU:** ${cpuModel}\n` +
                `┊ **RAM Usage:** ${usedRam.toFixed(2)} GB / ${totalRam.toFixed(2)} GB\n` +
                `┊ **Disk Usage:** ${usedDisk.toFixed(2)} GB / ${totalDisk.toFixed(2)} GB\n` +
                `┊ **Node.js:** ${nodeVersion}\n` +
                `┊ **Discord.js:** ${discordVersion}`
            )
            .setColor('#b6a3ff')
            .setFooter({ text: 'Powered by Lamar Core' })
            .setTimestamp();

        // สร้างปุ่มเชิญผู้ใช้เข้าเซิร์ฟเวอร์
        const inviteButton = new ButtonBuilder()
            .setLabel('Support Server')
            .setStyle(5)  // ปุ่มแบบลิงค์
            .setURL('https://discord.gg/cF3sXPHjzn');  // ลิงค์เชิญ

        // สร้าง Action Row สำหรับปุ่ม
        const row = new ActionRowBuilder().addComponents(inviteButton);

        // ตอบกลับด้วย Embed และปุ่ม
        await interaction.reply({ embeds: [embed], components: [row] });
    },
};
