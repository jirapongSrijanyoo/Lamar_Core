const { SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { loginfo, logwarn, logerror, logdebug } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set_report_channel')
        .setDescription('สร้างห้องรายงานการใส่บทบาท'),

    async execute(interaction) {
        const guild = interaction.guild;
        const guildId = guild.id;
        const serverFilePath = path.join(__dirname, '..', 'discord_server', `${guildId}.json`);

        try {
            let serverData = {};
            if (fs.existsSync(serverFilePath)) {
                serverData = JSON.parse(fs.readFileSync(serverFilePath, 'utf-8'));
            }

            const adminIds = serverData.admin || [];

            // ✅ เช็คสิทธิ์: เป็นเจ้าของเซิร์ฟเวอร์ หรือ มี permission Administrator หรือ อยู่ใน list admin
            const isOwner = interaction.user.id === guild.ownerId;
            const isAdminUser = adminIds.includes(interaction.user.id);
            const hasAdminPermission = interaction.member.permissions.has(PermissionFlagsBits.Administrator);

            if (!isOwner && !isAdminUser && !hasAdminPermission) {
                logwarn(`User ${interaction.user.tag} unauthorized to run /set_report_channel`);
                return interaction.reply('คุณไม่มีสิทธิ์ในการใช้งานคำสั่งนี้');
            }

            const channelsToCreate = [
                { name: '│・📘⁺。role-add', reason: 'บันทึกการเพิ่ม role', key: 'roleAddChannelId' },
                { name: '│・📘⁺。role-remove', reason: 'บันทึกการลบ role', key: 'roleRemoveChannelId' },
                { name: '│・📘⁺。𝑩𝑨𝑵', reason: 'บันทึกการแบนผู้ใช้', key: 'banChannelId' },
            ];

            const createdChannels = [];

            for (const ch of channelsToCreate) {
                const channel = await guild.channels.create({
                    name: ch.name,
                    type: ChannelType.GuildText,
                    reason: ch.reason,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: [PermissionFlagsBits.ViewChannel],
                        },
                        // ✅ ให้ทุกคนใน list admin (userId) เข้าถึงได้
                        ...adminIds.map(id => ({
                            id,
                            allow: [PermissionFlagsBits.ViewChannel],
                        }))
                    ],
                });

                serverData[ch.key] = channel.id;
                createdChannels.push({ name: ch.name, id: channel.id });
            }

            fs.writeFileSync(serverFilePath, JSON.stringify(serverData, null, 2));

            const embed = new EmbedBuilder()
                .setColor('#d6a3ff')
                .setTitle('สร้างห้องรายงานสำเร็จ')
                .setDescription(createdChannels.map(c => `- ${c.name}: <#${c.id}>`).join('\n'))
                .setTimestamp()
                .setFooter({
                    text: `จัดการโดย ${interaction.user.username}`,
                    iconURL: interaction.user.displayAvatarURL(),
                });

            await interaction.reply({ embeds: [embed] });

            loginfo(`[${guild.name}] ${interaction.user.tag} ได้สร้างห้องรายงานทั้งหมดแล้ว`);

        } catch (error) {
            logerror(`Error in /set_report_channel for guild ${guildId}: ${error.message}`);
            return interaction.reply({ content: '❌ เกิดข้อผิดพลาดขณะสร้างห้องรายงาน กรุณาลองใหม่อีกครั้ง', ephemeral: true });
        }
    }
};
