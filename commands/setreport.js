const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set_report_channel')
        .setDescription('สร้างห้องรายงานการใส่บทบาท'),
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const serverFilePath = path.join(__dirname, '..', 'discord_server', `${guildId}.json`);

        // ตรวจสอบว่าเป็นเจ้าของเซิร์ฟเวอร์หรือมี role admin
        let serverData = {};
        if (fs.existsSync(serverFilePath)) {
            serverData = JSON.parse(fs.readFileSync(serverFilePath, 'utf-8'));
        }

        const adminRoleId = serverData.admin;
        if (!adminRoleId) {
            return interaction.reply('ไม่พบ role admin ในไฟล์ข้อมูล.');
        }

        const adminRole = interaction.guild.roles.cache.get(adminRoleId);
        if (!adminRole) {
            return interaction.reply('ไม่พบ role admin ในเซิร์ฟเวอร์.');
        }

        if (interaction.user.id !== interaction.guild.ownerId && !interaction.member.roles.cache.has(adminRoleId)) {
            return interaction.reply('คุณไม่มีสิทธิ์ในการใช้งานคำสั่งนี้');
        }

        // สร้างห้อง │・📘⁺。role-add
        const roleAddChannel = await interaction.guild.channels.create({
            name: '│・📘⁺。role-add',
            type: ChannelType.GuildText,
            reason: 'สร้างห้องสำหรับบันทึกการเพิ่ม role',
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: ['ViewChannel'],
                },
                {
                    id: adminRole.id,
                    allow: ['ViewChannel'],
                },
            ],
        });

        // สร้างห้อง │・📘⁺。role-remove
        const roleRemoveChannel = await interaction.guild.channels.create({
            name: '│・📘⁺。role-remove',
            type: ChannelType.GuildText,
            reason: 'สร้างห้องสำหรับบันทึกการลบ role',
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: ['ViewChannel'],
                },
                {
                    id: adminRole.id,
                    allow: ['ViewChannel'],
                },
            ],
        });

        // สร้างห้อง │・📘⁺。𝑩𝑨𝑵
        const banChannel = await interaction.guild.channels.create({
            name: '│・📘⁺。𝑩𝑨𝑵',
            type: ChannelType.GuildText,
            reason: 'สร้างห้องสำหรับบันทึกการแบนผู้ใช้',
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: ['ViewChannel'],
                },
                {
                    id: adminRole.id,
                    allow: ['ViewChannel'],
                },
            ],
        });

        // บันทึกข้อมูล channel IDs ลงในไฟล์ JSON
        serverData.roleAddChannelId = roleAddChannel.id;
        serverData.roleRemoveChannelId = roleRemoveChannel.id;
        serverData.banChannelId = banChannel.id;

        fs.writeFileSync(serverFilePath, JSON.stringify(serverData, null, 2));

        // สร้าง Embed แจ้งเตือน
        const embed = new EmbedBuilder()
            .setColor('#d6a3ff')
            .setTitle('ห้องสำหรับบันทึกถูกสร้างเรียบร้อยแล้ว')
            .setDescription(
                `- ห้องสำหรับการเพิ่ม role: <#${roleAddChannel.id}>\n` +
                `- ห้องสำหรับการลบ role: <#${roleRemoveChannel.id}>\n` +
                `- ห้องสำหรับการแบนผู้ใช้: <#${banChannel.id}>`
            )
            .setTimestamp()
            .setFooter({
                text: `จัดการโดย ${interaction.user.username}`,
                iconURL: interaction.user.displayAvatarURL(),
            });

        // ส่งข้อความ Embed
        await interaction.reply({ embeds: [embed] });

        // แจ้งเตือนใน console
        console.log(`[${interaction.guild.name}] ผู้ใช้ ${interaction.user.username} ได้สร้างห้อง role-add, role-remove, และ ban`);
    },
};
