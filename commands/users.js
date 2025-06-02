const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { loginfo, logwarn, logerror, logdebug } = require('../utils/logger');

// Helper: update the user's warning status in the JSON file.
function updateUserWarnings(serverFilePath, serverData, member, action) {
    const warningType = action === 'add_yellow' ? 'yellow' : 'orange';
    serverData.users = serverData.users || [];
    const userEntry = serverData.users.find(u => u.user === member.user.id);
    if (userEntry) {
        if (!userEntry.role.includes(warningType)) userEntry.role.push(warningType);
    } else {
        serverData.users.push({ user: member.user.id, role: [warningType] });
    }
    fs.writeFileSync(serverFilePath, JSON.stringify(serverData, null, 2));
}

// Helper: build the embed for warning actions.
function buildWarningEmbed(member, interaction, reason) {
    return new EmbedBuilder()
        .setColor('#0099ff')
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp()
        .addFields(
            { name: 'Nickname', value: member.user.globalName || 'ไม่มี', inline: true },
            { name: 'Username', value: member.user.username, inline: true },
            { name: 'User ID', value: member.user.id, inline: true },
            { name: 'Reason', value: reason, inline: false },
            { name: 'Performed by', value: `<@${interaction.user.id}>`, inline: false }
        );
}

// Helper: prompt for a warning reason via a modal.
async function getWarningReason(actionInteraction, interaction) {
    const modal = new ModalBuilder()
        .setCustomId('warning_reason_modal')
        .setTitle('กรุณาใส่เหตุผลสำหรับการเตือน');
    const reasonInput = new TextInputBuilder()
        .setCustomId('warning_reason')
        .setLabel('เหตุผล')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);
    modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
    await actionInteraction.showModal(modal);
    const modalFilter = i => i.customId === 'warning_reason_modal' && i.user.id === interaction.user.id;
    return actionInteraction.awaitModalSubmit({ filter: modalFilter, time: 60000 });
}

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

        // Validate serverData fields...
        if (!yellow_card || !orange_card || !roleAddChannelId || !roleRemoveChannelId || !banChannelId || !admin) {
            return interaction.reply('ข้อมูลเซิร์ฟเวอร์ไม่ครบถ้วน กรุณาตรวจสอบการตั้งค่าก่อน');
        }

        // Check admin permissions...
        const hasAdminRole = interaction.member.roles.cache.some(role => admin.includes(role.id));
        const hasAdminPerms = interaction.member.permissions.has('Administrator') || hasAdminRole;
        if (!hasAdminPerms) return interaction.reply('คุณไม่มีสิทธิ์ในการใช้คำสั่งนี้');

        const selectedUser = interaction.options.getUser('user');
        const member = await interaction.guild.members.fetch(selectedUser.id).catch(() => null);
        if (!member) return interaction.reply('ไม่พบผู้ใช้ที่เลือก');

        const userEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(member.user.username)
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
        await interaction.reply({ content: `กำลังจัดการกับผู้ใช้: **${member.user.username}**`, embeds: [userEmbed], components: [actionRow] });

        const filter = i => i.customId === 'user_action' && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, max: 1 });
        
        collector.on('collect', async (actionInteraction) => {
            const action = actionInteraction.values[0];
            // Handling warning addition:
            if (action === 'add_yellow' || action === 'add_orange') {
                const modalSubmission = await getWarningReason(actionInteraction, interaction).catch(() => null);
                if (!modalSubmission) {
                    return actionInteraction.followUp({ content: 'หมดเวลาสำหรับการใส่เหตุผล', ephemeral: true });
                }
                const reason = modalSubmission.fields.getTextInputValue('warning_reason');
                const warningLevel = action === 'add_yellow' ? 'ครั้งที่ 1' : 'ครั้งที่ 2';
                const embed = buildWarningEmbed(member, interaction, reason);
                try {
                    const role = action === 'add_yellow' ? yellow_card : orange_card;
                    await member.roles.add(role);
                    updateUserWarnings(serverFilePath, serverData, member, action);
                    interaction.guild.channels.cache.get(roleAddChannelId)?.send({
                        content: `<@${member.user.id}>`,
                        embeds: [embed.setTitle(`${member.user.globalName || member.user.username} ถูกเตือน ${warningLevel}`)]
                    });
                    await modalSubmission.reply({
                        content: `ดำเนินการกับ <@${member.user.id}>: ได้รับการเตือน ${warningLevel}`,
                        embeds: [embed],
                        components: []
                    });
                } catch (error) {
                    logerror(`เกิดข้อผิดพลาด: ${error.message}`);
                    await modalSubmission.reply({
                        content: `⚠️ ไม่สามารถดำเนินการได้: ${error.message}`,
                        embeds: [],
                        components: []
                    });
                }
            } else {
                // Handling removal and ban actions
                let replyMessage = '';
                const embed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setThumbnail(member.user.displayAvatarURL())
                    .setTimestamp();
                try {
                    switch (action) {
                        case 'remove_yellow':
                            await member.roles.remove(yellow_card);
                            replyMessage = `ลบการเตือนครั้งที่ 1 แล้ว`;
                            serverData.users = serverData.users || [];
                            const removeYellowUser = serverData.users.find(u => u.user === member.user.id);
                            if (removeYellowUser) removeYellowUser.role = removeYellowUser.role.filter(r => r !== 'yellow');
                            fs.writeFileSync(serverFilePath, JSON.stringify(serverData, null, 2));
                            embed.setTitle(`${member.user.globalName || member.user.username} ถูกลบเตือนครั้งที่ 1`);
                            interaction.guild.channels.cache.get(roleRemoveChannelId)?.send({ content: `<@${member.user.id}>`, embeds: [embed] });
                            break;
                        case 'remove_orange':
                            await member.roles.remove(orange_card);
                            replyMessage = `ลบการเตือนครั้งที่ 2 แล้ว`;
                            serverData.users = serverData.users || [];
                            const removeOrangeUser = serverData.users.find(u => u.user === member.user.id);
                            if (removeOrangeUser) removeOrangeUser.role = removeOrangeUser.role.filter(r => r !== 'orange');
                            fs.writeFileSync(serverFilePath, JSON.stringify(serverData, null, 2));
                            embed.setTitle(`${member.user.globalName || member.user.username} ถูกลบเตือนครั้งที่ 2`);
                            interaction.guild.channels.cache.get(roleRemoveChannelId)?.send({ content: `<@${member.user.id}>`, embeds: [embed] });
                            break;
                        case 'ban_user':
                            await member.ban({ reason: 'โดนสั่งแบนจากผู้ดูแล' });
                            replyMessage = `ผู้ใช้นี้ถูกแบนแล้ว`;
                            embed.setTitle(`${member.user.globalName || member.user.username} ถูกแบนจากเซิร์ฟเวอร์`);
                            interaction.guild.channels.cache.get(banChannelId)?.send({ content: `<@${member.user.id}>`, embeds: [embed] });
                            break;
                        case 'cancel':
                            replyMessage = 'ยกเลิกการดำเนินการ';
                            break;
                    }
                    await actionInteraction.update({ content: `ดำเนินการกับ <@${member.user.id}>: ${replyMessage}`, embeds: [embed], components: [] });
                } catch (error) {
                    logerror(`เกิดข้อผิดพลาด: ${error.message}`);
                    await actionInteraction.update({ content: `⚠️ ไม่สามารถดำเนินการได้: ${error.message}`, embeds: [], components: [] });
                }
            }
        });
    }
};
