// utils/logger.js
const { blue, green, yellow, red, white } = require('colorette');
const { formatBytes } = require('./formatByte');
const { formatDuration } = require('./formatDuration');
const process = require('process');

// ฟังก์ชันสำหรับจัดรูปแบบวันที่
function formatDate() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear() + 543; // แปลงเป็นปี พ.ศ.
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

// ฟังก์ชันสำหรับคำนวณ memory usage
function getMemoryUsage() {
    const memoryUsage = process.memoryUsage().rss; // Resident Set Size
    return formatBytes(memoryUsage);
}

// ฟังก์ชันสำหรับคำนวณ uptime
function getUptime() {
    return formatDuration(process.uptime() * 1000);
}

// ฟังก์ชันหลักสำหรับแสดงข้อความ
function loginfo(message) {
    const memoryUsage = getMemoryUsage();
    const timestamp = formatDate();
    console.log(green(`[${memoryUsage}]`) + ` [${timestamp}]` + blue(` [INFO]`) + `   >   ${message}`);
}

function logwarn(message) {
    const memoryUsage = getMemoryUsage();
    const timestamp = formatDate();
    console.log(green(`[${memoryUsage}]`) + ` [${timestamp}]` + yellow(` [WARN]`) + `   >   ${message}`);
}

function logerror(message) {
    const memoryUsage = getMemoryUsage();
    const timestamp = formatDate();
    console.log(green(`[${memoryUsage}]`) + ` [${timestamp}]` + red(` [ERROR]`) + `   >   ${message}`);
}

function logdebug(message) {
    const memoryUsage = getMemoryUsage();
    const timestamp = formatDate();
    console.log(green(`[${memoryUsage}]`) + ` [${timestamp}]` + green(` [DEBUG]`) + `   >   ${message}`);
}

module.exports = { loginfo, logwarn, logerror, logdebug };