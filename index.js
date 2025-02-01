require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { syncCommands } = require('./utils/commandManager');
const fs = require('fs');
const path = require('path');
const { saveServerData, deleteServerData } = require('./utils/serverDataManager');
const { loginfo, logwarn, logerror } = require('./utils/logger'); 
const axios = require('axios'); 
const { loadUtils } = require('./utils/loadUtils');  // เพิ่มการนำเข้า loadUtils

console.log(`
██╗      █████╗ ███╗   ███╗ █████╗ ██████╗      ██████╗ ██████╗ ██████╗ ███████╗
██║     ██╔══██╗████╗ ████║██╔══██╗██╔══██╗    ██╔════╝██╔═══██╗██╔══██╗██╔════╝
██║     ███████║██╔████╔██║███████║██████╔╝    ██║     ██║   ██║██████╔╝█████╗  
██║     ██╔══██║██║╚██╔╝██║██╔══██║██╔══██╗    ██║     ██║   ██║██╔══██╗██╔══╝  
███████╗██║  ██║██║ ╚═╝ ██║██║  ██║██║  ██║    ╚██████╗╚██████╔╝██║  ██║███████╗
╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝     ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝
`);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
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
