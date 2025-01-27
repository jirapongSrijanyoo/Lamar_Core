const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const si = require('systeminformation'); // ใช้สำหรับข้อมูลระบบ
const pidusage = require('pidusage'); // ใช้สำหรับข้อมูล CPU และ RAM ของกระบวนการ

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

        // ดึงข้อมูล CPU และ RAM ของกระบวนการปัจจุบัน
        const usage = await pidusage(process.pid);

        // ข้อมูล OS
        const osName = `${osInfo.distro} ${osInfo.release}`; // เช่น Windows 11 Home Single Language 23H2

        // ข้อมูล CPU
        const cpuModel = cpuInfo.manufacturer + ' ' + cpuInfo.brand;

        // ข้อมูล Memory
        const totalMem = (memInfo.total / 1024 / 1024 / 1024).toFixed(2); // GB
        const usedMem = (usage.memory / 1024 / 1024).toFixed(2); // MB

        // ข้อมูล Disk
        const totalDisk = diskInfo.reduce((total, disk) => total + disk.size, 0) / 1024 / 1024 / 1024; // GB
        const usedDisk = diskInfo.reduce((used, disk) => used + disk.used, 0) / 1024 / 1024 / 1024; // GB

        // ตรวจสอบ runtime environment (Node.js หรือ Bun)
        let runtimeName = 'Unknown';
        let runtimeVersion = 'Unknown';

        if (typeof Bun !== 'undefined') {
            runtimeName = 'Bun';
            runtimeVersion = Bun.version;
        } else if (process.release && process.release.name === 'node') {
            runtimeName = 'Node.js';
            runtimeVersion = process.version;
        }

        // ข้อมูลเวอร์ชัน
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
                `┊ **Memory Usage:** ${usedMem} MB / ${totalMem} GB\n` +
                `┊ **Disk Usage:** ${usedDisk.toFixed(2)} GB / ${totalDisk.toFixed(2)} GB\n` +
                `┊ **Runtime:** ${runtimeName} ${runtimeVersion}\n` +
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