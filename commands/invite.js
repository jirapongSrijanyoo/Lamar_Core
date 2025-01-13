const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Get the invite link to add the bot to your server'),
    async execute(interaction) {
        // สร้างลิงค์เชิญโดยใช้ Client ID ของบอท
        const inviteLink = `https://discord.com/oauth2/authorize?client_id=${interaction.client.user.id}&permissions=8&scope=bot%20applications.commands`;

        // ข้อมูลบอท
        const botName = interaction.client.user.username;
        const botAvatar = interaction.client.user.displayAvatarURL();

        // สร้าง Embed สำหรับคำเชิญ
        const embed = new EmbedBuilder()
            .setAuthor({ name: `${botName} | invite`, iconURL: botAvatar })
            .setThumbnail(botAvatar)
            .setTitle('คลิกปุ่ม **Invite Bot** เพื่อเชิญบอทเข้าเซิร์ฟเวอร์')
            .setDescription('ขอบคุณที่ใช้งานบอท')
            .setColor('#B6A3FF')
            .setTimestamp()
            .setFooter({ text: 'Powered by Lamar Core' });

        // สร้างปุ่มเชิญ
        const inviteButton = new ButtonBuilder()
            .setLabel('Invite Bot')
            .setStyle(5)  // ปุ่มลิงค์
            .setURL(inviteLink);  // ลิงค์เชิญที่สร้างขึ้น

        // สร้าง ActionRow สำหรับปุ่ม
        const row = new ActionRowBuilder().addComponents(inviteButton);

        // ตอบกลับด้วย Embed และปุ่ม
        await interaction.reply({ embeds: [embed], components: [row] });
    },
};
