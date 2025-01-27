const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('ดูรูปโปรไฟล์ของสมาชิก')
    .addUserOption(option =>
      option
        .setName('member')
        .setDescription('เลือกสมาชิกที่คุณต้องการดูโปรไฟล์')
        .setRequired(true)
    ),

  async execute(interaction) {
    // ดึงค่าผู้ใช้ที่เลือก
    const user = interaction.options.getUser('member');

    // สร้าง Embed เพื่อแสดงโปรไฟล์ผู้ใช้
    const embed = {
      color: 0x0099ff,
      title: `รูปโปรไฟล์ของ ${user.tag}`,
      image: {
        url: user.displayAvatarURL({ dynamic: true, size: 1024 })
      }
    };

    // ส่ง Embed ไปยังผู้ใช้
    await interaction.reply({ embeds: [embed] });
  }
};
