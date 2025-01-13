const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('role_editor')
        .setDescription('Edit and save role IDs')
        .addMentionableOption(option => option.setName('role').setDescription('Select a role').setRequired(true)),
    async execute(interaction) {
        // ตรวจสอบว่าเป็นเจ้าของเซิร์ฟเวอร์หรือไม่
        if (interaction.user.id !== interaction.guild.ownerId) {
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
                            label: 'ใบเหลือง',
                            value: 'yellow',
                        },
                        {
                            label: 'ใบส้ม',
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
            let roleCategory = selectInteraction.values[0];

            // ลบข้อมูล role จากไฟล์ JSON
            if (roleCategory === 'delete') {
                let serverData = {};
                if (fs.existsSync(serverFilePath)) {
                    serverData = JSON.parse(fs.readFileSync(serverFilePath, 'utf-8'));
                }

                // ตรวจสอบว่า role id นี้มีอยู่ในไฟล์หรือไม่
                const roleFound = Object.keys(serverData).find(key => serverData[key] === role.id);

                if (roleFound) {
                    delete serverData[roleFound]; // ลบ role id ออกจากข้อมูล
                    fs.writeFileSync(serverFilePath, JSON.stringify(serverData, null, 2));

                    // สร้างข้อความ embed แจ้งการลบ
                    const embed = new EmbedBuilder()
                        .setColor('#d6a3ff')
                        .setAuthor({ name: `${botName} | Role editor`, iconURL: botAvatar })
                        .setTitle('ข้อมูลการลบ role')
                        .setDescription(`ข้อมูล role "${role.name}" ถูกลบออกจากไฟล์ข้อมูลเรียบร้อยแล้ว`)
                        .setTimestamp()
                        .setFooter({ text: `จัดการโดย ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

                    await selectInteraction.reply({ embeds: [embed], ephemeral: true });

                    // แจ้งเตือนใน console
                    console.log(`[${interaction.guild.name}] ผู้ใช้ ${interaction.user.username} ได้ทำการลบข้อมูล role: ${role.name}`);
                } else {
                    await selectInteraction.reply({
                        content: `ไม่พบข้อมูล role "${role.name}" ในไฟล์ข้อมูล`,
                        ephemeral: true
                    });
                }
            } else {
                // โหลดข้อมูลเซิร์ฟเวอร์จากไฟล์ JSON
                let serverData = {};
                if (fs.existsSync(serverFilePath)) {
                    serverData = JSON.parse(fs.readFileSync(serverFilePath, 'utf-8'));
                }

                // ตรวจสอบว่า role id นี้มีการบันทึกในประเภทอื่นแล้วหรือไม่
                const existingRoleCategory = Object.keys(serverData).find(key => serverData[key] === role.id);

                if (existingRoleCategory) {
                    // หาก role id นี้มีอยู่แล้วในประเภทอื่น แจ้งผู้ใช้
                    await selectInteraction.reply({
                        content: `ผิดพลาด Role "${role.name}" ถูกบันทึกไว้แล้วในประเภท "${existingRoleCategory === 'yellow' ? 'ใบเหลือง' : existingRoleCategory === 'orange' ? 'ใบส้ม' : 'แอดมิน'}"`,
                        ephemeral: true
                    });
                } else {
                    // บันทึก role id ลงในประเภทที่เลือก
                    serverData[roleCategory] = role.id;
                    fs.writeFileSync(serverFilePath, JSON.stringify(serverData, null, 2));

                    // สร้างข้อความ embed
                    const embed = new EmbedBuilder()
                        .setColor('#d6a3ff')
                        .setAuthor({ name: `${botName} | Role editor`, iconURL: botAvatar })
                        .setTitle('ข้อมูลการตั้งค่า role')
                        .setDescription(`Role "${role.name}" ถูกบันทึกในประเภท: ${roleCategory === 'yellow' ? 'ใบเหลือง' : roleCategory === 'orange' ? 'ใบส้ม' : 'แอดมิน'}`)
                        .setTimestamp()
                        .setFooter({ text: `จัดการโดย ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

                    await selectInteraction.reply({ embeds: [embed], ephemeral: true });

                    // แจ้งเตือนใน console
                    console.log(`[${interaction.guild.name}] ผู้ใช้ ${interaction.user.username} ได้บันทึก role: ${role.name} ลงในประเภท "${roleCategory === 'yellow' ? 'ใบเหลือง' : roleCategory === 'orange' ? 'ใบส้ม' : 'แอดมิน'}"`);
                }
            }

            collector.stop(); // หยุดการเก็บข้อมูล
        });

        collector.on('end', () => {
            if (!interaction.replied) {
                interaction.followUp({
                    content: 'หมดเวลาในการเลือกประเภท role',
                    ephemeral: true
                });
            }
        });
    },
};
