function formatUptime(milliseconds) {
    let days = Math.floor(milliseconds / 86400000);
    let hours = Math.floor(milliseconds / 3600000) % 24;
    let minutes = Math.floor(milliseconds / 60000) % 60;
    let seconds = Math.floor(milliseconds / 1000) % 60;
    return `${days ? days + "d " : ""}${hours ? hours + "h " : ""}${minutes ? minutes + "m " : ""}${seconds}s`;
};

module.exports = { formatUptime };