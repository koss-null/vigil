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
        <div class="bg-solarized-base02 rounded-lg shadow p-4 card compact-card">
            <h3 class="text-lg font-semibold text-solarized-base1 mb-2">Host</h3>
            <p class="text-2xl font-bold text-solarized-blue">${escapeHtml(data.hostname)}</p>
            <p class="text-sm text-solarized-base01">Uptime: ${uptime}</p>
        </div>
        <div class="bg-solarized-base02 rounded-lg shadow p-4 card compact-card memory-card">
            <h3 class="text-lg font-semibold text-solarized-base1 mb-2">Memory</h3>
            <p class="text-2xl font-bold text-solarized-orange">${data.memory.used_percent.toFixed(1)}%</p>
            <p class="text-sm text-solarized-base01">${data.memory.used_gb.toFixed(1)}/${data.memory.total_gb.toFixed(1)} GB</p>
            <div class="w-full bg-solarized-base01 rounded-full h-2 mt-2">
                <div class="bg-solarized-orange h-2 rounded-full progress-bar" style="width: ${data.memory.used_percent}%"></div>
            </div>
        </div>
        ${createLoadCard(data.load_average, data.timestamp)}
        ${createTemperatureCard(data.temperature)}
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
    const visibleCores = Math.min(cpu.usage_per_core.length, 8);
    const coreBars = cpu.usage_per_core.slice(0, visibleCores).map((usage, index) => `
        <div class="text-center">
            <div class="text-xs text-solarized-base01 mb-1">C${index}</div>
            <div class="w-full bg-solarized-base01 rounded-full h-1 mb-1">
                <div class="bg-solarized-cyan h-1 rounded-full progress-bar" style="width: ${Math.min(usage, 100)}%"></div>
            </div>
        </div>
    `).join('');

    return `
        <div class="bg-solarized-base02 rounded-lg shadow p-4 card">
            <h3 class="text-lg font-semibold text-solarized-base1 mb-4">CPU Usage%</h3>
            <div class="mb-4">
                <p class="text-2xl font-bold text-solarized-green">${cpu.total_usage.toFixed(1)}%</p>
                <div class="flex justify-between text-sm text-solarized-base01 mb-1">
                    <span>Total: ${cpu.total_usage.toFixed(1)}%</span>
                    <span>${cpu.cores} cores</span>
                </div>
                <div class="w-full bg-solarized-base01 rounded-full h-2">
                    <div class="bg-solarized-green h-2 rounded-full progress-bar" style="width: ${Math.min(cpu.total_usage, 100)}%"></div>
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
            <div class="flex justify-between text-sm text-solarized-base01 mb-1">
                <span class="font-medium text-xs">${disk.device.split('/').pop()} (${disk.mountpoint})</span>
                <span>${disk.used_gb.toFixed(1)}/${disk.total_gb.toFixed(1)} GB</span>
            </div>
            <div class="w-full bg-solarized-base01 rounded-full h-2">
                <div class="bg-solarized-red h-2 rounded-full progress-bar" style="width: ${Math.min(disk.used_percent, 100)}%"></div>
            </div>
            <div class="text-right text-xs text-solarized-base01 mt-1">${disk.used_percent.toFixed(1)}% used</div>
        </div>
    `).join('');

    return `
        <div class="bg-solarized-base02 rounded-lg shadow p-4 card">
            <h3 class="text-lg font-semibold text-solarized-base1 mb-4">Disks</h3>
            ${diskItems}
        </div>
    `;
}

function createLoadCard(load, timestamp) {
    const date = new Date(timestamp);
    return `
        <div class="bg-solarized-base02 rounded-lg shadow p-4 card">
            <h3 class="text-lg font-semibold text-solarized-base1 mb-4">Load Average</h3>
            <div class="grid grid-cols-3 gap-4 text-center">
                <div>
                    <div class="text-2xl font-bold text-solarized-violet">${load.load_1_min.toFixed(2)}</div>
                    <div class="text-sm text-solarized-base01">1 min</div>
                </div>
                <div>
                    <div class="text-2xl font-bold text-solarized-violet">${load.load_5_min.toFixed(2)}</div>
                    <div class="text-sm text-solarized-base01">5 min</div>
                </div>
                <div>
                    <div class="text-2xl font-bold text-solarized-violet">${load.load_15_min.toFixed(2)}</div>
                    <div class="text-sm text-solarized-base01">15 min</div>
                </div>
            </div>
            <div class="mt-4 text-center text-sm text-solarized-base01">
                Last updated: ${date.toLocaleTimeString()}
            </div>
        </div>
    `;
}

function createTemperatureCard(temperature) {
    // Determine temperature status and color
    let tempStatus = "normal";
    let tempColor = "text-solarized-yellow";
    let indicatorClass = "temp-normal";
    
    if (temperature < 40) {
        tempStatus = "cool";
        tempColor = "text-solarized-cyan";
        indicatorClass = "temp-cool";
    } else if (temperature >= 40 && temperature < 60) {
        tempStatus = "normal";
        tempColor = "text-solarized-yellow";
        indicatorClass = "temp-normal";
    } else if (temperature >= 60 && temperature < 80) {
        tempStatus = "warm";
        tempColor = "text-solarized-orange";
        indicatorClass = "temp-warm";
    } else {
        tempStatus = "hot";
        tempColor = "text-solarized-red";
        indicatorClass = "temp-hot";
    }
    
    return `
        <div class="bg-solarized-base02 rounded-lg shadow p-4 card">
            <h3 class="text-lg font-semibold text-solarized-base1 mb-2">Temperature</h3>
            <div class="flex items-center">
                <p class="text-2xl font-bold ${tempColor}">${temperature}°C</p>
                <span class="temp-indicator ${indicatorClass}"></span>
            </div>
            <p class="text-sm text-solarized-base01 mt-1">Status: ${tempStatus}</p>
            <div class="w-full bg-solarized-base01 rounded-full h-2 mt-2">
                <div class="${tempColor.replace('text-', 'bg-')} h-2 rounded-full progress-bar" style="width: ${Math.min(temperature, 100)}%"></div>
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
    errorDiv.className = 'error-message bg-solarized-red border border-solarized-red text-solarized-base3 px-4 py-3 rounded fixed top-4 right-4 z-50';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    // Remove after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}
