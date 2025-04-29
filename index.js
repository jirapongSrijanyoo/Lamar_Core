console.log(`
    ██╗      █████╗ ███╗   ███╗ █████╗ ██████╗      ██████╗ ██████╗ ██████╗ ███████╗
    ██║     ██╔══██╗████╗ ████║██╔══██╗██╔══██╗    ██╔════╝██╔═══██╗██╔══██╗██╔════╝
    ██║     ███████║██╔████╔██║███████║██████╔╝    ██║     ██║   ██║██████╔╝█████╗  
    ██║     ██╔══██║██║╚██╔╝██║██╔══██║██╔══██╗    ██║     ██║   ██║██╔══██╗██╔══╝  
    ███████╗██║  ██║██║ ╚═╝ ██║██║  ██║██║  ██║    ╚██████╗╚██████╔╝██║  ██║███████╗
    ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝     ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝
        `);
    
    console.log(`Copyright © 2024-2025 Lamar Core`);
    console.log(`--------------------------------------------------------------------------------------------------------------------------------------------------`);

require('dotenv').config();
const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
const { syncCommands } = require('./utils/commandManager');
const fs = require('fs');
const path = require('path');
const { saveServerData, deleteServerData } = require('./utils/serverDataManager');
const { loginfo, logwarn, logerror } = require('./utils/logger'); 
const axios = require('axios'); 
const { loadUtils } = require('./utils/loadUtils');  // เพิ่มการนำเข้า loadUtils

const client = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
] });
client.commands = new Collection();

const sendHeartbeat = async () => {
    const heartbeatUrl = 'https://sm.hetrixtools.net/hb/?s=5db297bfa86b673f1274ad98923d6630';
    try {
        const response = await axios.get(heartbeatUrl);
        loginfo(`Heartbeat sent successfully: ${response.status}`);
    } catch (error) {
        logerror(`Error sending heartbeat: ${error.message}`);
    }
};

client.once('ready', async () => {
    loginfo(`Logged in as ${client.user.tag}!`);

    // บันทึกข้อมูลเซิร์ฟเวอร์ทั้งหมด
    client.guilds.cache.forEach(guild => {
        saveServerData(guild.id, guild.name);
    });

    // โหลด utils (ตอนนี้โหลด utils แล้ว)
    loadUtils();  // เรียกใช้ฟังก์ชัน loadUtils

    // โหลดคำสั่งทั้งหมด
    const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));
    const commands = [];
    
    for (const file of commandFiles) {
        const command = require(path.join(__dirname, 'commands', file));
        commands.push(command);
        client.commands.set(command.data.name, command);
    }

    // ซิงค์คำสั่งกับเซิร์ฟเวอร์
    try {
        await syncCommands(commands, client.guilds.cache.map(guild => guild.id), process.env.TOKEN, client.user.id, loginfo);
    } catch (error) {
        logerror(`Error syncing commands: ${error.message}`);
    }

    // อัปเดตข้อมูลเซิร์ฟเวอร์ทุก 10 วินาที
    setInterval(() => {
        const currentGuilds = client.guilds.cache.map(guild => guild.id);
        const existingFiles = fs.readdirSync(path.join(__dirname, 'discord_server')).map(file => file.replace('.json', ''));

        currentGuilds.forEach(guildId => {
            if (!existingFiles.includes(guildId)) {
                const guild = client.guilds.cache.get(guildId);
                if (guild) {
                    saveServerData(guild.id, guild.name);
                    loginfo(`Added new server: ${guild.name}`);
                }
            }
        });

        existingFiles.forEach(guildId => {
            if (!currentGuilds.includes(guildId)) {
                deleteServerData(guildId);
                logwarn(`Removed server with ID: ${guildId}`);
            }
        });
    }, 10000);

    // ✅ ส่ง Heartbeat หลังจากทุกอย่างเสร็จ
    sendHeartbeat();

    // ส่ง Heartbeat ทุก 1 นาทีหลังจากนั้น
    setInterval(sendHeartbeat, 60000);
});

client.on('guildDelete', guild => {
    deleteServerData(guild.id);
    logwarn(`Removed server: ${guild.name}`);
});

client.on('guildCreate', guild => {
    saveServerData(guild.id, guild.name);
    loginfo(`Added new server: ${guild.name}`);
});

client.on('guildMemberAdd', async member => {
    loginfo(`New member joined: ${member.user.tag} in guild ${member.guild.name}`);
    try {
        const serverDataPath = path.join(__dirname, 'discord_server', `${member.guild.id}.json`);
        if (fs.existsSync(serverDataPath)) {
            const embed = new EmbedBuilder()
              .setColor("#0099ff")
              .setTitle(`${member.user.username} ถูกเพิ่มยศคืน`)
              .addFields(
                {
                  name: "ชื่อเล่น",
                  value: member.nickname || "ไม่มี",
                  inline: true,
                },
                {
                  name: "ชื่อผู้ใช้",
                  value: member.user.username,
                  inline: true,
                },
                {
                  name: "ID ผู้ใช้",
                  value: member.user.id,
                  inline: true,
                },
                {
                  name: "ดำเนินการโดย",
                  value: `ระบบอัตโนมัติ`,
                  inline: false,
                }
              )
              .setThumbnail(member.user.displayAvatarURL())
              .setTimestamp();
            
            const serverData = JSON.parse(fs.readFileSync(serverDataPath, 'utf8'));
            const userData = serverData.users?.find(user => user.user === member.id);

            if (userData) {
                const rolesAdded = [];
                const rolePromises = userData.role.map(async roleId => {
                    const role = member.guild.roles.cache.get(serverData[roleId + '_card']);
                    if (role) {
                        try {
                            await member.roles.add(role);
                            rolesAdded.push(roleId + '_card');
                            loginfo(`Added role "${roleId}_card" to user ${member.user.tag}`);
                        } catch (err) {
                            logerror(`Error adding role "${roleId}_card" to user ${member.user.tag}: ${err.message}`);
                        }
                    }
                });

                await Promise.all(rolePromises); // Wait for all role additions to complete

                if (rolesAdded.length > 0) {
                    embed.setDescription(`ถูกเพิ่มยศคืนหลังจากเข้าเซิร์ฟเวอร์ใหม่! ยศที่ถูกเพิ่ม: ${rolesAdded.map(roleId => `<@&${serverData[roleId]}>`).join(', ')}`);
                    const channel = member.guild.channels.cache.get(serverData.roleAddChannelId);
                    if (channel) {
                        channel.send({ content: `<@${member.user.id}>`, embeds: [embed] });
                    } else {
                        logwarn(`Channel "roleAddChanelId" not found in guild ${member.guild.name}`);
                    }
                } else {
                    logwarn(`No roles to add for user ${member.user.tag} in guild ${member.guild.name}`);
                }
            }
        }
    } catch (error) {
        logerror(`Error assigning role to user ${member.user.tag}: ${error.message}`);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;
    const command = client.commands.get(commandName);

    if (command) {
        try {
            await command.execute(interaction);
            loginfo(`${interaction.user.tag} used /${commandName} in ${interaction.guild.name}`);
        } catch (error) {
            logerror(`Error executing /${commandName}: ${error.message}`);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

client.login(process.env.TOKEN);
