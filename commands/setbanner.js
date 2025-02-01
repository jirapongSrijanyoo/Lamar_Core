const { SlashCommandBuilder } = require('discord.js');
const { loginfo, logwarn, logerror, logdebug } = require('../utils/logger'); // นำเข้า logger ทั้งหมด

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dev-banner')
        .setDescription('เปลี่ยนแบนเนอร์ของบอท เฉพาะผู้พัฒนา')
        .addAttachmentOption(option =>
            option.setName('ภาพ')
                .setDescription('อัพโหลดไฟล์รูปภาพที่ต้องการใช้เป็นแบนเนอร์')
                .setRequired(true)
        ),

    async execute(interaction) {
        // ตรวจสอบว่าเป็นผู้พัฒนา
        const developerId = '722659207958102046';
        try {
            if (interaction.user.id !== developerId) {
                logwarn(`User ${interaction.user.id} tried to use dev-banner without permission.`); // บันทึก log กรณีไม่มีสิทธิ์
                return interaction.reply({ content: '<:Remove:1287071943769460759> คุณไม่มีสิทธิ์ใช้คำสั่งนี้', ephemeral: true });
            }

            // ดึงไฟล์รูปภาพจาก input
            const image = interaction.options.getAttachment('ภาพ');
            const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
            
            if (!validTypes.includes(image.contentType)) {
                logwarn(`User ${interaction.user.id} uploaded an invalid file type for dev-banner.`); // บันทึก log กรณีอัพโหลดไฟล์ไม่ถูกต้อง
                return interaction.reply({ content: '<:Remove:1287071943769460759> กรุณาอัพโหลดไฟล์รูปภาพที่เป็น .png, .jpg หรือ .jpeg', ephemeral: true });
            }

            // เปลี่ยนแบนเนอร์ของบอท
            logdebug(`User ${interaction.user.tag} is changing the bot banner to ${image.url}`); // Log debug เพื่อแสดง URL ของแบนเนอร์ใหม่
            await interaction.client.user.setBanner(image.url);
            
            // อัปเดตข้อความเมื่อแบนเนอร์ถูกเปลี่ยน
            await interaction.reply({ content: '<:Tick:1287071940401434654> แบนเนอร์ของบอทถูกเปลี่ยนเรียบร้อยแล้ว', ephemeral: true });
            
            // บันทึกใน log เมื่อแบนเนอร์ถูกเปลี่ยนสำเร็จ
            loginfo(`Bot banner updated by ${interaction.user.tag}.`);

        } catch (error) {
            // หากเกิดข้อผิดพลาด
            logerror(`Error changing bot banner: ${error.message}`); // บันทึก log ข้อผิดพลาด
            await interaction.reply({ content: '<:info:1279064953210273914> เกิดข้อผิดพลาดขณะเปลี่ยนแบนเนอร์ กรุณาลองใหม่อีกครั้ง', ephemeral: true });
        }
    },
};
