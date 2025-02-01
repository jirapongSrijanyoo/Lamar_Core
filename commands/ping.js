const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { formatUptime } = require('../utils/formatUptime'); // Import formatUptime
const { loginfo, logwarn, logerror, logdebug } = require('../utils/logger'); // Import all loggers

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('เช็คค่าปิงและอัพไทม์'),
    async execute(interaction) {
        try {
            loginfo('Starting execution of /ping command');
            await interaction.deferReply(); // Prevent interaction timeout

            // Calculate latency and uptime
            const latency = Date.now() - interaction.createdTimestamp; // Calculate latency
            const uptime = process.uptime() * 1000; // Convert uptime to milliseconds
            const uptimeString = formatUptime(uptime); // Format uptime

            logdebug(`Latency: ${latency}ms, Uptime: ${uptimeString}`);

            // Create Embed to display information
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('🏓 Pong!')
                .addFields(
                    { name: 'Latency', value: `${latency}ms`, inline: true },
                    { name: 'Uptime', value: uptimeString, inline: true }
                );

            loginfo('Replying with embed');
            // Reply with the embed
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            logerror(`Error executing /ping: ${error.message}`);

            // Notify the user if an error occurs
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.editReply({ content: "❌ An error occurred!", flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ content: "❌ An error occurred!", ephemeral: true });
                }
            } catch (replyError) {
                logerror(`Failed to send error message: ${replyError.message}`);
            }
        }
    },
};