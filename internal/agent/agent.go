package agent

import (
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/load"
	"github.com/shirou/gopsutil/v3/mem"
)

type CPUInfo struct {
	Cores      int       `json:"cores"`
	Usage      []float64 `json:"usage_per_core"` // Usage per core in percentage
	TotalUsage float64   `json:"total_usage"`    // Total CPU usage in percentage
}

type MemoryInfo struct {
	UsedGB      float64 `json:"used_gb"`
	TotalGB     float64 `json:"total_gb"`
	UsedPercent float64 `json:"used_percent"`
}

type DiskInfo struct {
	Device      string  `json:"device"`
	Mountpoint  string  `json:"mountpoint"`
	TotalGB     float64 `json:"total_gb"`
	UsedGB      float64 `json:"used_gb"`
	FreeGB      float64 `json:"free_gb"`
	UsedPercent float64 `json:"used_percent"`
}

type LoadAverage struct {
	Load1  float64 `json:"load_1_min"`
	Load5  float64 `json:"load_5_min"`
	Load15 float64 `json:"load_15_min"`
}

type SystemInfo struct {
	CPU         CPUInfo     `json:"cpu"`
	Memory      MemoryInfo  `json:"memory"`
	Disks       []DiskInfo  `json:"disks"`
	LoadAverage LoadAverage `json:"load_average"`
	Temperature float64     `json:"temperature"`
	Uptime      uint64      `json:"uptime"`
	Timestamp   time.Time   `json:"timestamp"`
	Hostname    string      `json:"hostname"`
}

type SystemAgent struct {
	infoChan chan SystemInfo
}

func NewSystemAgent() *SystemAgent {
	return &SystemAgent{
		infoChan: make(chan SystemInfo, 10),
	}
}

func (a *SystemAgent) GetSystemInfo() (SystemInfo, error) {
	var info SystemInfo

	// Get hostname
	hostInfo, err := host.Info()
	if err == nil {
		info.Hostname = hostInfo.Hostname
	}

	// CPU info - per core usage
	cpuCount, err := cpu.Counts(false)
	if err == nil {
		info.CPU.Cores = cpuCount
	}

	cpuPercent, err := cpu.Percent(time.Second, true) // true = per CPU
	if err == nil {
		info.CPU.Usage = cpuPercent
		// Calculate total usage
		total := 0.0
		for _, usage := range cpuPercent {
			total += usage
		}
		if len(cpuPercent) > 0 {
			info.CPU.TotalUsage = total / float64(len(cpuPercent))
		}
	}

	// Memory usage
	memInfo, err := mem.VirtualMemory()
	if err == nil {
		info.Memory.UsedGB = float64(memInfo.Used) / 1024 / 1024 / 1024
		info.Memory.TotalGB = float64(memInfo.Total) / 1024 / 1024 / 1024
		info.Memory.UsedPercent = memInfo.UsedPercent
	}

	// Disk usage for all mounted filesystems
	partitions, err := disk.Partitions(false)
	if err == nil {
		for _, partition := range partitions {
			usage, err := disk.Usage(partition.Mountpoint)
			if err == nil {
				diskInfo := DiskInfo{
					Device:      partition.Device,
					Mountpoint:  partition.Mountpoint,
					TotalGB:     float64(usage.Total) / 1024 / 1024 / 1024,
					UsedGB:      float64(usage.Used) / 1024 / 1024 / 1024,
					FreeGB:      float64(usage.Free) / 1024 / 1024 / 1024,
					UsedPercent: usage.UsedPercent,
				}
				info.Disks = append(info.Disks, diskInfo)
			}
		}
	}

	// Load average with different time intervals
	loadAvg, err := load.Avg()
	if err == nil {
		info.LoadAverage = LoadAverage{
			Load1:  loadAvg.Load1,
			Load5:  loadAvg.Load5,
			Load15: loadAvg.Load15,
		}
	}

	// Uptime
	uptime, err := host.Uptime()
	if err == nil {
		info.Uptime = uptime
	}

	info.Timestamp = time.Now()
	return info, nil
}

func (a *SystemAgent) StartMonitoring() {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		info, err := a.GetSystemInfo()
		if err == nil {
			select {
			case a.infoChan <- info:
			default:
				// Channel full, drop the message
			}
		}
	}
}

func (a *SystemAgent) GetInfoChannel() <-chan SystemInfo {
	return a.infoChan
}
