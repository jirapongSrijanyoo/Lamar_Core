const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { loginfo, logwarn, logerror, logdebug } = require('../utils/logger'); // นำเข้า logger ทั้งหมด

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('เชิญบอทเข้าเซิร์ฟเวอร์'),
    async execute(interaction) {
        try {
            loginfo('Start executing the /invite command.');
            await interaction.deferReply(); // ป้องกัน interaction หมดอายุ

            // สร้างลิงค์เชิญโดยใช้ Client ID ของบอท
            const inviteLink = `https://discord.com/oauth2/authorize?client_id=${interaction.client.user.id}&permissions=8&scope=bot%20applications.commands`;

            logdebug(`Create an invitation link: ${inviteLink}`);

            // ข้อมูลบอท
            const botName = interaction.client.user.username;
            const botAvatar = interaction.client.user.displayAvatarURL();

            logdebug(`Fetch bot data: ${botName}`);

            // สร้าง Embed สำหรับคำเชิญ
            const embed = new EmbedBuilder()
                .setAuthor({ name: `${botName} | invite`, iconURL: botAvatar })
                .setThumbnail(botAvatar)
                .setTitle('คลิกปุ่ม **Invite Bot** เพื่อเชิญบอทเข้าเซิร์ฟเวอร์')
                .setDescription('ขอบคุณที่ใช้งานบอท')
                .setColor('#B6A3FF')
                .setTimestamp()
                .setFooter({ text: 'Powered by Lamar Core' });

            logdebug('Finished creating the Embed for the invitation.');

            // สร้างปุ่มเชิญ
            const inviteButton = new ButtonBuilder()
                .setLabel('Invite Bot')
                .setStyle(5)  // ปุ่มลิงค์
                .setURL(inviteLink);  // ลิงค์เชิญที่สร้างขึ้น

            // สร้าง ActionRow สำหรับปุ่ม
            const row = new ActionRowBuilder().addComponents(inviteButton);

            loginfo('Reply with Embed and Button');
            // ตอบกลับด้วย Embed และปุ่ม
            await interaction.editReply({ embeds: [embed], components: [row] });
        } catch (error) {
            logerror(`Error executing /invite command: ${error.message}`);

            // แจ้งเตือนหากเกิดข้อผิดพลาด
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ content: "❌ มีข้อผิดพลาดเกิดขึ้น!" });
            } else {
                await interaction.reply({ content: "❌ มีข้อผิดพลาดเกิดขึ้น!", ephemeral: true });
            }
        }
    },
};