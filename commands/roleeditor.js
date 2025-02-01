const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { loginfo, logwarn, logerror, logdebug } = require('../utils/logger'); // นำเข้า logger

module.exports = {
    data: new SlashCommandBuilder()
        .setName('role_editor')
        .setDescription('เพิ่ม ลบ แก้ไข บทบาท')
        .addMentionableOption(option => option.setName('role').setDescription('Select a role').setRequired(true)),

    async execute(interaction) {
        try {
            logdebug(`Executing /role_editor command by user ${interaction.user.username}`);
            
            // ตรวจสอบว่าเป็นเจ้าของเซิร์ฟเวอร์หรือไม่
            if (interaction.user.id !== interaction.guild.ownerId) {
                logwarn(`Unauthorized access attempt by ${interaction.user.username}`);
                return interaction.reply('คุณไม่มีสิทธิ์ในการใช้งานคำสั่งนี้');
            }

            const role = interaction.options.getMentionable('role'); // ดึง role ที่เลือก
            const guildId = interaction.guild.id;
            const serverFilePath = path.join(__dirname, '..', 'discord_server', `${guildId}.json`);

            // ดึงข้อมูล botName และ botAvatar จากโปรไฟล์ของบอท
            const botName = interaction.client.user.username;
            const botAvatar = interaction.client.user.displayAvatarURL();

            // สร้างแถบเมนูให้เลือกประเภท role
            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('roleSelect')
                        .setPlaceholder('เลือกประเภทของ role หรือ ลบข้อมูล')
                        .addOptions(
                            {
                                label: 'เตือนครั้งที่ 1',
                                value: 'yellow',
                            },
                            {
                                label: 'เตือนครั้งที่ 2',
                                value: 'orange',
                            },
                            {
                                label: 'แอดมิน',
                                value: 'admin',
                            },
                            {
                                label: 'ลบข้อมูล',
                                value: 'delete',
                            }
                        ),
                );

            // สร้างข้อความ embed ที่แสดงการเลือกประเภทของ role
            const embed = new EmbedBuilder()
                .setColor('#d6a3ff')
                .setAuthor({ name: `${botName} | Role editor`, iconURL: botAvatar })
                .setTitle('กรุณาเลือกประเภทของ role หรือ ลบข้อมูล')
                .setDescription(`คุณได้เลือก role: **${role.name}**`)
                .setTimestamp();

            // ส่งข้อความ embed พร้อมแถบเมนูให้ผู้ใช้กดเลือก
            await interaction.reply({
                embeds: [embed],
                components: [actionRow]
            });

            // รอให้ผู้ใช้เลือกในเมนู
            const filter = (selectInteraction) => selectInteraction.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async (selectInteraction) => {
                try {
                    let roleCategory = selectInteraction.values[0];
                    logdebug(`User ${interaction.user.username} selected role category: ${roleCategory}`);

                    // ลบข้อมูล role จากไฟล์ JSON
                    if (roleCategory === 'delete') {
                        let serverData = {};
                        if (fs.existsSync(serverFilePath)) {
                            serverData = JSON.parse(fs.readFileSync(serverFilePath, 'utf-8'));
                        }

                        const roleFound = Object.keys(serverData).find(key => serverData[key] === role.id);

                        if (roleFound) {
                            delete serverData[roleFound];
                            fs.writeFileSync(serverFilePath, JSON.stringify(serverData, null, 2));

                            const embed = new EmbedBuilder()
                                .setColor('#d6a3ff')
                                .setAuthor({ name: `${botName} | Role editor`, iconURL: botAvatar })
                                .setTitle('ข้อมูลการลบ role')
                                .setDescription(`ข้อมูล role "${role.name}" ถูกลบออกจากไฟล์ข้อมูลเรียบร้อยแล้ว`)
                                .setTimestamp()
                                .setFooter({ text: `จัดการโดย ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

                            await selectInteraction.reply({ embeds: [embed], ephemeral: true });

                            loginfo(`[${interaction.guild.name}] ผู้ใช้ ${interaction.user.username} ได้ทำการลบข้อมูล role: ${role.name}`);
                        } else {
                            await selectInteraction.reply({
                                content: `ไม่พบข้อมูล role "${role.name}" ในไฟล์ข้อมูล`,
                                ephemeral: true
                            });
                            logwarn(`Role "${role.name}" not found in data file for ${interaction.guild.name}`);
                        }
                    } else {
                        let serverData = {};
                        if (fs.existsSync(serverFilePath)) {
                            serverData = JSON.parse(fs.readFileSync(serverFilePath, 'utf-8'));
                        }

                        const existingRoleCategory = Object.keys(serverData).find(key => serverData[key] === role.id);

                        if (existingRoleCategory) {
                            await selectInteraction.reply({
                                content: `ผิดพลาด Role "${role.name}" ถูกบันทึกไว้แล้วในประเภท "${existingRoleCategory}"`,
                                ephemeral: true
                            });
                            logwarn(`Role "${role.name}" already exists in category "${existingRoleCategory}"`);
                        } else {
                            serverData[roleCategory] = role.id;
                            fs.writeFileSync(serverFilePath, JSON.stringify(serverData, null, 2));

                            const embed = new EmbedBuilder()
                                .setColor('#d6a3ff')
                                .setAuthor({ name: `${botName} | Role editor`, iconURL: botAvatar })
                                .setTitle('ข้อมูลการตั้งค่า role')
                                .setDescription(`Role "${role.name}" ถูกบันทึกในประเภท: ${roleCategory}`)
                                .setTimestamp()
                                .setFooter({ text: `จัดการโดย ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

                            await selectInteraction.reply({ embeds: [embed], ephemeral: true });

                            loginfo(`[${interaction.guild.name}] ผู้ใช้ ${interaction.user.username} ได้บันทึก role: ${role.name} ลงในประเภท "${roleCategory}"`);
                        }
                    }

                    collector.stop();
                } catch (error) {
                    logerror(`Error handling role selection: ${error.message}`);
                    await selectInteraction.reply({
                        content: 'เกิดข้อผิดพลาดขณะเลือกประเภท role!',
                        ephemeral: true
                    });
                }
            });

            collector.on('end', () => {
                if (!interaction.replied) {
                    interaction.followUp({
                        content: 'หมดเวลาในการเลือกประเภท role',
                        ephemeral: true
                    });
                }
            });
        } catch (error) {
            logerror(`Error executing /role_editor: ${error.message}`);

            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ content: "❌ มีข้อผิดพลาดเกิดขึ้น!" });
            } else {
                await interaction.reply({ content: "❌ มีข้อผิดพลาดเกิดขึ้น!", ephemeral: true });
            }
        }
    },
};
