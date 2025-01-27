// function formatDuration(seconds) {
//     const hours = String(Math.floor(seconds / 3600)).padStart(2, '0');
//     const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
//     const secs = String(seconds % 60).padStart(2, '0');
//     return `${hours}:${minutes}:${secs}`;
// }

function formatDuration(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSeconds % 60).padStart(2, '0');
    
    if (hours > 0) {
        return `${String(hours).padStart(2, '0')}:${minutes}:${secs}`;
    } else {
        return `${minutes}:${secs}`;
    }
}

module.exports = { formatDuration };