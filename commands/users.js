const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { loginfo, logwarn, logerror, logdebug } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('manage_users')
        .setDescription('จัดการผู้ใช้ในเซิร์ฟเวอร์')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('เลือกผู้ใช้ที่ต้องการจัดการ')
                .setRequired(true)
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const serverFilePath = path.join(__dirname, '..', 'discord_server', `${guildId}.json`);

        logdebug(`Starting execution of manage_users command for guild ${guildId}...`);

        let serverData = {};
        try {
            if (fs.existsSync(serverFilePath)) {
                serverData = JSON.parse(fs.readFileSync(serverFilePath, 'utf-8'));
                logdebug(`Loaded server data for guild ${guildId}.`);
            } else {
                logwarn(`Server file not found for guild ${guildId}.`);
            }
        } catch (error) {
            logerror(`Error reading server file for guild ${guildId}: ${error.message}`);
            return interaction.reply('เกิดข้อผิดพลาดในการอ่านข้อมูลเซิร์ฟเวอร์');
        }

        const { yellow_card, orange_card, roleAddChannelId, roleRemoveChannelId, banChannelId, admin } = serverData;

        if (!yellow_card || !orange_card || !roleAddChannelId || !roleRemoveChannelId || !banChannelId || !admin) {
            return interaction.reply('ข้อมูลเซิร์ฟเวอร์ไม่ครบถ้วน กรุณาตรวจสอบการตั้งค่าก่อน');
        }

        // ✅ เช็คว่า user มีบทบาทตรงกับบทบาทใน admin ของ JSON หรือไม่
        const hasAdminRole = interaction.member.roles.cache.some(role => admin.includes(role.id));
        const hasAdminPerms = interaction.member.permissions.has('Administrator') || hasAdminRole;
        
        if (!hasAdminPerms) {
            return interaction.reply('คุณไม่มีสิทธิ์ในการใช้คำสั่งนี้');
        }

        const selectedUser = interaction.options.getUser('user');
        const member = await interaction.guild.members.fetch(selectedUser.id).catch(() => null);

        if (!member) {
            return interaction.reply('ไม่พบผู้ใช้ที่เลือก');
        }

        const userEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`${member.user.username}`)
            .setDescription(`ต้องการดำเนินการใดกับผู้ใช้ ${member.user.username}`)
            .setThumbnail(member.user.displayAvatarURL())
            .addFields({ name: 'ID ผู้ใช้', value: member.user.id, inline: true })
            .setTimestamp()
            .setFooter({ text: 'เลือกการกระทำด้านล่าง' });

        const actionRow = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('user_action')
                .setPlaceholder('เลือกการกระทำ')
                .addOptions(
                    { label: 'เพิ่มเตือนครั้งที่ 1', value: 'add_yellow' },
                    { label: 'เพิ่มเตือนครั้งที่ 2', value: 'add_orange' },
                    { label: 'ลบเตือนครั้งที่ 1', value: 'remove_yellow' },
                    { label: 'ลบเตือนครั้งที่ 2', value: 'remove_orange' },
                    { label: 'แบนผู้ใช้', value: 'ban_user' },
                    { label: 'ยกเลิก', value: 'cancel' }
                )
        );

        await interaction.reply({
            content: `กำลังจัดการกับผู้ใช้: **${member.user.username}**`,
            embeds: [userEmbed],
            components: [actionRow]
        });

        const filter = i => i.customId === 'user_action' && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, max: 1 });

        collector.on('collect', async (actionInteraction) => {
            const action = actionInteraction.values[0];
            let replyMessage = '';
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`การจัดการกับ: ${member.user.username}`)
                .addFields(
                    { name: 'ชื่อเล่น', value: member.nickname || 'ไม่มี', inline: true },
                    { name: 'ชื่อผู้ใช้', value: member.user.username, inline: true },
                    { name: 'ID ผู้ใช้', value: member.user.id, inline: true },
                    { name: 'ดำเนินการโดย', value: `<@${interaction.user.id}>`, inline: false },
                )
                .setThumbnail(member.user.displayAvatarURL())
                .setTimestamp();

            try {
                switch (action) {
                    case 'add_yellow':
                        await member.roles.add(yellow_card);
                        replyMessage = `ได้รับการเตือนครั้งที่ 1`;
                        interaction.guild.channels.cache.get(roleAddChannelId)?.send({
                            content: `<@${member.user.id}>`,
                            embeds: [embed.setTitle(`${member.user.username} ถูกเตือนครั้งที่ 1`)]
                        });
                        break;

                    case 'add_orange':
                        await member.roles.add(orange_card);
                        replyMessage = `ได้รับการเตือนครั้งที่ 2`;
                        interaction.guild.channels.cache.get(roleAddChannelId)?.send({
                            content: `<@${member.user.id}>`,
                            embeds: [embed.setTitle(`${member.user.username} ถูกเตือนครั้งที่ 2`)]
                        });
                        break;

                    case 'remove_yellow':
                        await member.roles.remove(yellow_card);
                        replyMessage = `ลบการเตือนครั้งที่ 1 แล้ว`;
                        interaction.guild.channels.cache.get(roleRemoveChannelId)?.send({
                            content: `<@${member.user.id}>`,
                            embeds: [embed.setTitle(`${member.user.username} ถูกลบเตือนครั้งที่ 1`)]
                        });
                        break;

                    case 'remove_orange':
                        await member.roles.remove(orange_card);
                        replyMessage = `ลบการเตือนครั้งที่ 2 แล้ว`;
                        interaction.guild.channels.cache.get(roleRemoveChannelId)?.send({
                            content: `<@${member.user.id}>`,
                            embeds: [embed.setTitle(`${member.user.username} ถูกลบเตือนครั้งที่ 2`)]
                        });
                        break;

                    case 'ban_user':
                        await member.ban({ reason: 'โดนสั่งแบนจากผู้ดูแล' });
                        replyMessage = `ผู้ใช้นี้ถูกแบนแล้ว`;
                        interaction.guild.channels.cache.get(banChannelId)?.send({
                            content: `<@${member.user.id}>`,
                            embeds: [embed.setTitle(`${member.user.username} ถูกแบนจากเซิร์ฟเวอร์`)]
                        });
                        break;

                    case 'cancel':
                        replyMessage = 'ยกเลิกการดำเนินการ';
                        break;
                }

                // แก้ไขตรงนี้ให้ส่งข้อมูลของสมาชิกที่ถูกกระทำ
                await actionInteraction.update({
                    content: `ดำเนินการกับ <@${member.user.id}>: ${replyMessage}`,
                    embeds: [embed],
                    components: []
                });

            } catch (error) {
                logerror(`เกิดข้อผิดพลาด: ${error.message}`);
                await actionInteraction.update({
                    content: `⚠️ ไม่สามารถดำเนินการได้: ${error.message}`,
                    embeds: [],
                    components: []
                });
            }
        });
    }
};
