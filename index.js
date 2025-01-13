require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { syncCommands } = require('./utils/commandManager');
const fs = require('fs');
const path = require('path');
const { saveServerData, deleteServerData } = require('./utils/serverDataManager');

// ฟังก์ชัน loginfo สำหรับแสดงข้อความใน console
function loginfo(message) {
    const now = new Date();
    const time = now.toLocaleTimeString('en-GB', { hour12: false }); // ใช้เวลาของเครื่อง
    console.log(`[${time} INFO] ${message}`);
}

// แสดงข้อความ ASCII Art
console.log(`
██╗      █████╗ ███╗   ███╗ █████╗ ██████╗      ██████╗ ██████╗ ██████╗ ███████╗
██║     ██╔══██╗████╗ ████║██╔══██╗██╔══██╗    ██╔════╝██╔═══██╗██╔══██╗██╔════╝
██║     ███████║██╔████╔██║███████║██████╔╝    ██║     ██║   ██║██████╔╝█████╗  
██║     ██╔══██║██║╚██╔╝██║██╔══██║██╔══██╗    ██║     ██║   ██║██╔══██╗██╔══╝  
███████╗██║  ██║██║ ╚═╝ ██║██║  ██║██║  ██║    ╚██████╗╚██████╔╝██║  ██║███████╗
╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝     ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝
`);

// สร้าง Client
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// เมื่อบอทออนไลน์
client.once('ready', async () => {
    loginfo(`Logged in as ${client.user.tag}!`);

    // ทำการบันทึกข้อมูลของทุกเซิร์ฟเวอร์ที่บอทเข้าร่วม
    client.guilds.cache.forEach(guild => {
        saveServerData(guild.id, guild.name);
    });

    // โหลดคำสั่งจากโฟลเดอร์ commands
    const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));
    const commands = [];
    
    for (const file of commandFiles) {
        const command = require(path.join(__dirname, 'commands', file));
        commands.push(command);
        client.commands.set(command.data.name, command);
    }

    // ลงทะเบียนคำสั่งแบบ global และลบคำสั่งที่ไม่ต้องการ
    try {
        await syncCommands(commands, client.guilds.cache.map(guild => guild.id), process.env.TOKEN, client.user.id, loginfo);
    } catch (error) {
        console.error('Error syncing commands:', error);
    }

    // อัปเดตข้อมูลทุก 10 วินาที
    setInterval(() => {
        const currentGuilds = client.guilds.cache.map(guild => guild.id);
        const existingFiles = fs.readdirSync(path.join(__dirname, 'discord_server')).map(file => file.replace('.json', ''));

        // เช็คเซิร์ฟเวอร์ใหม่ที่เพิ่มเข้ามา
        currentGuilds.forEach(guildId => {
            if (!existingFiles.includes(guildId)) {
                const guild = client.guilds.cache.get(guildId);
                if (guild) {
                    saveServerData(guild.id, guild.name);
                    loginfo(`Added new server: ${guild.name}`);
                }
            }
        });

        // เช็คเซิร์ฟเวอร์ที่บอทถูกออก
        existingFiles.forEach(guildId => {
            if (!currentGuilds.includes(guildId)) {
                deleteServerData(guildId);
                loginfo(`Removed server with ID: ${guildId}`);
            }
        });
    }, 10000); // อัปเดตทุก 10 วินาที
});

// เมื่อบอทออกจากเซิร์ฟเวอร์
client.on('guildDelete', guild => {
    deleteServerData(guild.id);
    loginfo(`Removed server: ${guild.name}`);
});

// เมื่อบอทเข้าร่วมเซิร์ฟเวอร์ใหม่
client.on('guildCreate', guild => {
    saveServerData(guild.id, guild.name);
    loginfo(`Added new server: ${guild.name}`);
});

// เมื่อมีการใช้คำสั่ง slash
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;
    const command = client.commands.get(commandName);

    if (command) {
        try {
            await command.execute(interaction);
            loginfo(`${interaction.user.tag} used /${commandName} in ${interaction.guild.name}`);
        } catch (error) {
            console.error(`Error executing /${commandName}:`, error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

client.login(process.env.TOKEN);
