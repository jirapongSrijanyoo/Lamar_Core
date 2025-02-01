const { SlashCommandBuilder } = require('discord.js');
const { loginfo, logwarn, logerror, logdebug } = require('../utils/logger'); // Import all loggers

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('ดูรูปโปรไฟล์')
    .addUserOption(option =>
      option
        .setName('member')
        .setDescription('Select the member whose profile picture you want to view')
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      loginfo('Starting execution of /profile command');
      await interaction.deferReply(); // Prevent interaction timeout

      // Get the selected user
      const user = interaction.options.getUser('member');
      logdebug(`Selected user: ${user.tag}`);

      // Create Embed to display the user's profile picture
      const embed = {
        color: 0x0099ff,
        title: `Profile picture of ${user.tag}`,
        image: {
          url: user.displayAvatarURL({ dynamic: true, size: 1024 })
        }
      };

      loginfo('Replying with embed');
      // Send the Embed to the user
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logerror(`Error executing /profile: ${error.message}`);

      // Notify the user if an error occurs
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.editReply({ content: "❌ An error occurred!" });
        } else {
          await interaction.reply({ content: "❌ An error occurred!", ephemeral: true });
        }
      } catch (replyError) {
        logerror(`Failed to send error message: ${replyError.message}`);
      }
    }
  }
};