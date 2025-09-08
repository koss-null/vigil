// Load initial data when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    fetchSystemInfo();
    
    // Auto-refresh every 5 seconds
    setInterval(fetchSystemInfo, 5000);
});

function fetchSystemInfo() {
    fetch('/api/system-info')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            updateDashboard(data);
        })
        .catch(error => {
            console.error('Error fetching system info:', error);
            showError('Failed to fetch system data');
        });
}

function updateDashboard(data) {
    updateSummaryCards(data);
    updateDetailedInfo(data);
}

function updateSummaryCards(data) {
    const uptime = formatUptime(data.uptime);
    const cards = document.getElementById('summary-cards');
    
    cards.innerHTML = `
        <div class="bg-white rounded-lg shadow p-4 card compact-card">
            <h3 class="text-lg font-semibold text-gray-700 mb-2">Host</h3>
            <p class="text-2xl font-bold text-blue-600">${escapeHtml(data.hostname)}</p>
            <p class="text-sm text-gray-600">Uptime: ${uptime}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-4 card compact-card memory-card">
            <h3 class="text-lg font-semibold text-gray-700 mb-2">Memory</h3>
            <p class="text-2xl font-bold text-orange-600">${data.memory.used_percent.toFixed(1)}%</p>
            <p class="text-sm text-gray-600">${data.memory.used_gb.toFixed(1)}/${data.memory.total_gb.toFixed(1)} GB</p>
            <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div class="bg-orange-500 h-2 rounded-full progress-bar" style="width: ${data.memory.used_percent}%"></div>
            </div>
        </div>
        ${createLoadCard(data.load_average, data.timestamp)}
    `;
}

function updateDetailedInfo(data) {
    const detailedInfo = document.getElementById('detailed-info');
    
    detailedInfo.innerHTML = `
        ${createCPUCard(data.cpu)}
        ${createDisksCard(data.disks)}
    `;
}

function createCPUCard(cpu) {
    // Only show first 8 cores for better mobile layout
    const visibleCores = cpu.usage_per_core.length;
    const coreBars = cpu.usage_per_core.slice(0, visibleCores).map((usage, index) => `
        <div class="text-center">
            <div class="text-xs text-gray-600 mb-1">C${index}</div>
            <div class="w-full bg-gray-200 rounded-full h-1 mb-1">
                <div class="bg-blue-400 h-1 rounded-full progress-bar" style="width: ${Math.min(usage, 100)}%"></div>
            </div>
        </div>
    `).join('');

    return `
        <div class="bg-white rounded-lg shadow p-4 card">
            <h3 class="text-lg font-semibold text-gray-700 mb-4">CPU Usage%</h3>
            <div class="mb-4">
                <p class="text-2xl font-bold text-green-600">${cpu.total_usage.toFixed(1)}%</p>
                <div class="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Total: ${cpu.total_usage.toFixed(1)}%</span>
                    <span>${cpu.cores} cores</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-green-500 h-2 rounded-full progress-bar" style="width: ${Math.min(cpu.total_usage, 100)}%"></div>
                </div>
            </div>
            <div class="grid grid-cols-4 gap-2">
                ${coreBars}
            </div>
        </div>
    `;
}

function createDisksCard(disks) {
    const diskItems = disks.map(disk => `
        <div class="mb-3 last:mb-0">
            <div class="flex justify-between text-sm text-gray-600 mb-1">
                <span class="font-medium text-xs">${disk.device.split('/').pop()} (${disk.mountpoint})</span>
                <span>${disk.used_gb.toFixed(1)}/${disk.total_gb.toFixed(1)} GB</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-red-500 h-2 rounded-full progress-bar" style="width: ${Math.min(disk.used_percent, 100)}%"></div>
            </div>
            <div class="text-right text-xs text-gray-600 mt-1">${disk.used_percent.toFixed(1)}% used</div>
        </div>
    `).join('');

    return `
        <div class="bg-white rounded-lg shadow p-4 card">
            <h3 class="text-lg font-semibold text-gray-700 mb-4">Disks</h3>
            ${diskItems}
        </div>
    `;
}

function createLoadCard(load, timestamp) {
    const date = new Date(timestamp);
    return `
        <div class="bg-white rounded-lg shadow p-4 card">
            <h3 class="text-lg font-semibold text-gray-700 mb-4">Load Average</h3>
            <div class="grid grid-cols-3 gap-4 text-center">
                <div>
                    <div class="text-2xl font-bold text-purple-600">${load.load_1_min.toFixed(2)}</div>
                    <div class="text-sm text-gray-600">1 min</div>
                </div>
                <div>
                    <div class="text-2xl font-bold text-purple-600">${load.load_5_min.toFixed(2)}</div>
                    <div class="text-sm text-gray-600">5 min</div>
                </div>
                <div>
                    <div class="text-2xl font-bold text-purple-600">${load.load_15_min.toFixed(2)}</div>
                    <div class="text-sm text-gray-600">15 min</div>
                </div>
            </div>
            <div class="mt-4 text-center text-sm text-gray-600">
                Last updated: ${date.toLocaleTimeString()}
            </div>
        </div>
    `;
}

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    // Remove any existing error
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded fixed top-4 right-4 z-50';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    // Remove after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}
