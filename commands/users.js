const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js'); 
const fs = require('fs');
const path = require('path');

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

        // ตรวจสอบว่าไฟล์เซิร์ฟเวอร์มีอยู่หรือไม่
        let serverData = {};
        if (fs.existsSync(serverFilePath)) {
            serverData = JSON.parse(fs.readFileSync(serverFilePath, 'utf-8'));
        }

        // ตรวจสอบว่า role ที่ต้องการมีอยู่ในไฟล์หรือไม่
        const yellowRoleId = serverData.yellow;
        const orangeRoleId = serverData.orange;
        const roleAddChannelId = serverData.roleAddChannelId;
        const roleRemoveChannelId = serverData.roleRemoveChannelId;
        const banChannelId = serverData.banChannelId;
        const adminRoleId = serverData.admin;  // เพิ่มการอ่านข้อมูลบทบาท Admin

        if (!yellowRoleId || !orangeRoleId || !roleAddChannelId || !roleRemoveChannelId || !adminRoleId || !banChannelId) {
            return interaction.reply('ข้อมูลเซิร์ฟเวอร์ไม่ครบถ้วน กรุณาตรวจสอบการตั้งค่าก่อน');
        }

        // ตรวจสอบบทบาทของผู้ที่ใช้คำสั่ง
        const userRoles = interaction.member.roles.cache;
        if (!userRoles.has(adminRoleId)) {
            return interaction.reply('คุณไม่มีสิทธิ์ในการใช้คำสั่งนี้');
        }

        const selectedUser = interaction.options.getUser('user');
        const member = interaction.guild.members.cache.get(selectedUser.id);

        if (!member) {
            return interaction.reply('ไม่พบผู้ใช้ที่เลือก');
        }

        // สร้าง Embed สำหรับรายละเอียดผู้ใช้
        const userEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`${member.user.username}`)
            .setDescription(`ต้องการดำเนินอะไรการกับผู้ใช้ ${member.user.username}`)
            .setThumbnail(member.user.displayAvatarURL())
            .addFields(
                { name: 'ID ผู้ใช้', value: member.user.id, inline: true },
            )
            .setTimestamp()
            .setFooter({ text: 'เลือกการกระทำด้านล่าง' });

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('user_action')
                    .setPlaceholder('เลือกการกระทำ')
                    .addOptions(
                        { label: 'เพิ่มเตือนครั้งที่ 1', value: 'add_yellow' },
                        { label: 'เพิ่มเตือนครั้งที่ 2', value: 'add_orange' },
                        { label: 'ลบเตือนครั้งที่ 1', value: 'remove_yellow' },
                        { label: 'ลบเตือนครั้งที่ 2', value: 'remove_orange' },
                        { label: 'แบนผู้ใช้', value: 'ban_user' },
                        { label: 'ยกเลิก', value: 'cancel' },
                    ),
            );

        await interaction.reply({
            content: `จัดการผู้ใช้: ${member.user.username}`,
            embeds: [userEmbed],
            components: [actionRow],
        });

        // รอให้ผู้ใช้เลือกการกระทำ
        const filter = i => i.customId === 'user_action' && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter });

        collector.on('collect', async (actionInteraction) => {
            // ตรวจสอบว่าการเลือกการกระทำนี้ได้รับการตอบกลับแล้วหรือไม่
            if (actionInteraction.replied || actionInteraction.deferred) {
                return;  // หยุดทำงานหากได้ตอบกลับแล้ว
            }

            const action = actionInteraction.values[0];
            const guild = interaction.guild;

            let replyMessage = '';
            let embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`การจัดการกับผู้ใช้: @${member.user.username}`)
                .addFields(
                    { name: 'User Nick', value: member.nickname || 'ไม่มี', inline: true },
                    { name: 'User Name', value: member.user.username, inline: true },
                    { name: 'User ID', value: member.user.id, inline: true },
                    { name: 'จัดการโดย', value: `${interaction.user}`, inline: false },
                )
                .setTimestamp()
                .setThumbnail(member.user.displayAvatarURL())

            switch (action) {
                case 'add_yellow':
                    await member.roles.add(yellowRoleId);
                    replyMessage = `ได้รับเตือนครั้งที่ 1 แล้ว`;

                    // ส่งข้อมูลไปยังห้อง roleAddChannelId
                    const roleAddChannel = guild.channels.cache.get(roleAddChannelId);
                    if (roleAddChannel) {
                        roleAddChannel.send({content: `${member.user}`, embeds: [embed.setTitle(`@${member.user.username} ถูกเพิ่มเตือนครั้งที่ 1`)] });
                    }
                    break;

                case 'add_orange':
                    await member.roles.add(orangeRoleId);
                    replyMessage = `ได้รับเตือนครั้งที่ 2 แล้ว`;

                    // ส่งข้อมูลไปยังห้อง roleAddChannelId
                    const roleAddOrangeChannel = guild.channels.cache.get(roleAddChannelId);
                    if (roleAddOrangeChannel) {
                        roleAddOrangeChannel.send({content: `${member.user}`, embeds: [embed.setTitle(`@${member.user.username} ถูกเพิ่มเตือนครั้งที่ 2`)] });
                    }
                    break;

                case 'remove_yellow':
                    await member.roles.remove(yellowRoleId);
                    replyMessage = `ลบเตือนครั้งที่ 1 แล้ว`;

                    // ส่งข้อมูลไปยังห้อง roleRemoveChannelId
                    const roleRemoveChannel = guild.channels.cache.get(roleRemoveChannelId);
                    if (roleRemoveChannel) {
                        roleRemoveChannel.send({content: `${member.user}`, embeds: [embed.setTitle(`@${member.user.username} ถูกลบเตือนครั้งที่ 1`)] });
                    }
                    break;

                case 'remove_orange':
                    await member.roles.remove(orangeRoleId);
                    replyMessage = `ลบเตือนครั้งที่ 2 แล้ว`;

                    // ส่งข้อมูลไปยังห้อง roleRemoveChannelId
                    const roleRemoveOrangeChannel = guild.channels.cache.get(roleRemoveChannelId);
                    if (roleRemoveOrangeChannel) {
                        roleRemoveOrangeChannel.send({content: `${member.user}`, embeds: [embed.setTitle(`@${member.user.username} ถูกลบเตือนครั้งที่ 2`)] });
                    }
                    break;

               case 'ban_user':
   					 await member.ban({ reason: 'แบนจากการใช้คำสั่งจัดการผู้ใช้' });
   					 replyMessage = `ถูกแบนแล้ว`;

    				// ส่งข้อมูลไปยังห้อง banChannelId
   					 const banChannel = guild.channels.cache.get(banChannelId); // เปลี่ยนชื่อเป็น banChannel
   					 if (banChannel) {
   				     	banChannel.send({ 
        		   		 	   content: `${member.user}`, 
        		   		       embeds: [embed.setTitle(`@${member.user.username} ถูกแบน`)] 
        					});
   					 }
    				 break;


                case 'cancel':
                    replyMessage = 'การกระทำถูกยกเลิก';
                    break;
            }

            // ตอบกลับครั้งเดียว
            await actionInteraction.update({
                content: `<@${interaction.user.id}> ${replyMessage}`,
                embeds: [embed],
                components: [],
            });
        });
    },
};
