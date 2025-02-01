const { SlashCommandBuilder } = require('discord.js');
const { loginfo, logwarn, logerror, logdebug } = require('../utils/logger'); // นำเข้า logger ทั้งหมด

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dev-profile')
        .setDescription('เปลี่ยนโปรไฟล์ของบอท เฉพาะผู้พัฒนา')
        .addAttachmentOption(option => 
            option.setName('รูปภาพ')
                .setDescription('อัพโหลดรูปภาพเพื่อเปลี่ยนรูปโปรไฟล์ของบอท')
                .setRequired(true)),
    
    async execute(interaction) {
        const userId = '722659207958102046'; // จำกัดผู้ใช้ที่สามารถใช้คำสั่งนี้

        try {
            // ตรวจสอบสิทธิ์ของผู้ใช้
            if (interaction.user.id !== userId) {
                logwarn(`User ${interaction.user.id} tried to use dev-profile without permission.`); // บันทึก log กรณีไม่มีสิทธิ์
                return interaction.reply({ content: '<:Remove:1287071943769460759> คุณไม่มีสิทธิ์ในการใช้คำสั่งนี้', ephemeral: true });
            }

            const attachment = interaction.options.getAttachment('รูปภาพ'); // รับไฟล์ที่แนบมา
            if (!attachment || !attachment.contentType.startsWith('image/')) {
                logwarn(`User ${interaction.user.id} uploaded an invalid file type.`); // บันทึก log กรณีอัพโหลดไฟล์ไม่ถูกต้อง
                return interaction.reply({ content: '<:Remove:1287071943769460759> กรุณาอัพโหลดไฟล์รูปภาพที่ถูกต้อง', ephemeral: true });
            }

            // แจ้งให้ Discord รู้ว่าบอทกำลังดำเนินการและจะใช้เวลา
            logdebug(`User ${interaction.user.tag} is changing the bot profile picture to ${attachment.url}`); // Log debug เพื่อแสดง URL รูปภาพที่อัพโหลด
            await interaction.deferReply({ ephemeral: true });

            // เปลี่ยนรูปโปรไฟล์ของบอท
            await interaction.client.user.setAvatar(attachment.url);

            // อัปเดตข้อความเมื่อบอทเปลี่ยนรูปโปรไฟล์เสร็จแล้ว
            await interaction.editReply({ content: '<:Tick:1287071940401434654> รูปโปรไฟล์ของบอทถูกเปลี่ยนแล้ว' });
            
            // บันทึกใน log เมื่อดำเนินการสำเร็จ
            loginfo(`Bot profile picture updated by ${interaction.user.tag}.`);

        } catch (error) {
            // หากเกิดข้อผิดพลาด
            logerror(`Error changing bot profile picture: ${error.message}`); // บันทึก log ในกรณีที่เกิดข้อผิดพลาด
            await interaction.editReply({ content: '<:info:1279064953210273914> เกิดข้อผิดพลาดในการเปลี่ยนรูปโปรไฟล์ของบอท' });
        }
    },
};
