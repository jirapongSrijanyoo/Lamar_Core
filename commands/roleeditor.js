const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { loginfo, logwarn, logerror, logdebug } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('role_editor')
        .setDescription('เพิ่ม ลบ แก้ไข บทบาท')
        .addMentionableOption(option =>
            option.setName('role')
                .setDescription('Select a role')
                .setRequired(true)
        ),

    async execute(interaction) {
        try {
            logdebug(`Executing /role_editor command by user ${interaction.user.username}`);

            if (!interaction.member.permissions.has('Administrator')) {
                logwarn(`Unauthorized access attempt by ${interaction.user.username}`);
                return interaction.reply('❌ คุณไม่มีสิทธิ์ในการใช้งานคำสั่งนี้ (ต้องมีสิทธิ์แอดมิน)');
            }

            const role = interaction.options.getMentionable('role');
            const guildId = interaction.guild.id;
            const guildName = interaction.guild.name;
            const serverFilePath = path.join(__dirname, '..', 'discord_server', `${guildId}.json`);

            const botName = interaction.client.user.username;
            const botAvatar = interaction.client.user.displayAvatarURL();

            const actionRow = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('roleSelect')
                    .setPlaceholder('เลือกประเภทของ role หรือ ลบข้อมูล')
                    .addOptions(
                        { label: 'เตือนครั้งที่ 1', value: 'yellow_card' },
                        { label: 'เตือนครั้งที่ 2', value: 'orange_card' },
                        { label: 'แอดมิน', value: 'admin' },
                        { label: 'ลบข้อมูล', value: 'delete' }
                    )
            );

            const embed = new EmbedBuilder()
                .setColor('#d6a3ff')
                .setAuthor({ name: `${botName} | Role editor`, iconURL: botAvatar })
                .setTitle('กรุณาเลือกประเภทของ role หรือ ลบข้อมูล')
                .setDescription(`คุณได้เลือก role: **${role.name}**`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed], components: [actionRow] });

            const filter = (i) => i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async (selectInteraction) => {
                try {
                    const roleCategory = selectInteraction.values[0];
                    logdebug(`User ${interaction.user.username} selected role category: ${roleCategory}`);

                    let serverData = {
                        guildName,
                        guildId,
                        yellow_card: "",
                        orange_card: "",
                        admin: []
                    };

                    if (fs.existsSync(serverFilePath)) {
                        try {
                            const rawData = fs.readFileSync(serverFilePath, 'utf-8');
                            const parsedData = JSON.parse(rawData);

                            // ✅ auto-validate JSON structure
                            if (
                                typeof parsedData === 'object' && parsedData !== null &&
                                typeof parsedData.guildId === 'string' &&
                                typeof parsedData.guildName === 'string' &&
                                typeof parsedData.yellow_card === 'string' &&
                                typeof parsedData.orange_card === 'string' &&
                                Array.isArray(parsedData.admin)
                            ) {
                                serverData = parsedData;
                            } else {
                                logwarn(`Invalid structure in ${guildId}.json, resetting to default`);
                            }
                        } catch (err) {
                            logwarn(`Failed to parse ${guildId}.json, resetting. Error: ${err.message}`);
                        }
                    }

                    // 🔒 Safety net: force reset if any critical field is missing
                    if (typeof serverData !== 'object' || serverData === null) {
                        serverData = { guildName, guildId, yellow_card: "", orange_card: "", admin: [] };
                    }

                    // 🔒 Ensure admin is always an array
                    if (!Array.isArray(serverData.admin)) {
                        serverData.admin = [];
                    }

                    switch (roleCategory) {
                        case 'delete': {
                            let foundKey = Object.keys(serverData).find(key => {
                                if (key === 'admin') return serverData.admin.includes(role.id);
                                return serverData[key] === role.id;
                            });

                            if (foundKey) {
                                if (foundKey === 'admin') {
                                    serverData.admin = serverData.admin.filter(id => id !== role.id);
                                } else {
                                    serverData[foundKey] = "";
                                }

                                fs.writeFileSync(serverFilePath, JSON.stringify(serverData, null, 2));

                                const embed = new EmbedBuilder()
                                    .setColor('#d6a3ff')
                                    .setAuthor({ name: `${botName} | Role editor`, iconURL: botAvatar })
                                    .setTitle('ข้อมูลการลบ role')
                                    .setDescription(`Role "${role.name}" ถูกลบออกจากประเภท "${foundKey}"`)
                                    .setTimestamp()
                                    .setFooter({ text: `จัดการโดย ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

                                await selectInteraction.reply({ embeds: [embed], ephemeral: true });
                                loginfo(`[${guildName}] ลบ role: ${role.name} ออกจาก "${foundKey}"`);
                            } else {
                                await selectInteraction.reply({ content: `ไม่พบข้อมูล role "${role.name}"`, ephemeral: true });
                                logwarn(`Role "${role.name}" not found in data`);
                            }

                            break;
                        }

                        case 'yellow_card':
                        case 'orange_card': {
                            if (serverData[roleCategory] === role.id) {
                                await selectInteraction.reply({
                                    content: `Role "${role.name}" ถูกบันทึกไว้แล้วในประเภทนี้`,
                                    ephemeral: true
                                });
                                break;
                            }

                            serverData[roleCategory] = role.id;
                            fs.writeFileSync(serverFilePath, JSON.stringify(serverData, null, 2));

                            const embed = new EmbedBuilder()
                                .setColor('#d6a3ff')
                                .setAuthor({ name: `${botName} | Role editor`, iconURL: botAvatar })
                                .setTitle('เพิ่ม Role สำเร็จ')
                                .setDescription(`Role "${role.name}" ถูกกำหนดให้กับ "${roleCategory}"`)
                                .setTimestamp()
                                .setFooter({ text: `จัดการโดย ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

                            await selectInteraction.reply({ embeds: [embed], ephemeral: true });
                            loginfo(`[${guildName}] ตั้งค่า role: ${role.name} -> ${roleCategory}`);
                            break;
                        }

                        case 'admin': {
                            if (serverData.admin.includes(role.id)) {
                                await selectInteraction.reply({
                                    content: `Role "${role.name}" มีอยู่ในประเภท "admin" แล้ว`,
                                    ephemeral: true
                                });
                                break;
                            }

                            serverData.admin.push(role.id);
                            fs.writeFileSync(serverFilePath, JSON.stringify(serverData, null, 2));

                            const embed = new EmbedBuilder()
                                .setColor('#d6a3ff')
                                .setAuthor({ name: `${botName} | Role editor`, iconURL: botAvatar })
                                .setTitle('เพิ่ม Role สำเร็จ')
                                .setDescription(`Role "${role.name}" ถูกเพิ่มในประเภท "admin"`)
                                .setTimestamp()
                                .setFooter({ text: `จัดการโดย ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

                            await selectInteraction.reply({ embeds: [embed], ephemeral: true });
                            loginfo(`[${guildName}] เพิ่ม role: ${role.name} -> admin`);
                            break;
                        }

                        default:
                            await selectInteraction.reply({
                                content: `⚠️ ไม่รู้จักหมวดหมู่ role`,
                                ephemeral: true
                            });
                            logwarn(`Unknown role category selected: ${roleCategory}`);
                    }

                    collector.stop();
                } catch (error) {
                    logerror(`Error handling role selection: ${error.message}`);
                    await selectInteraction.reply({ content: 'เกิดข้อผิดพลาด!', ephemeral: true });
                }
            });

            collector.on('end', () => {
                if (!interaction.replied) {
                    interaction.followUp({ content: 'หมดเวลาในการเลือกประเภท role', ephemeral: true });
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
