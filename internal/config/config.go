package config

import (
	"fmt"
	"os"

	"gopkg.in/yaml.v3"
)

type Config struct {
	ServerAddress string   `yaml:"server_address"`
	DiscoveryPort int      `yaml:"discovery_port"`
	PollInterval  int      `yaml:"poll_interval_seconds"`
	AllowedNodes  []string `yaml:"allowed_nodes"`
}

func LoadConfig() (*Config, error) {
	data, err := os.ReadFile("/etc/vigil/config.yaml")
	if err != nil {
		fmt.Println("Failed to load config, using default values")
		return &Config{
			ServerAddress: ":6969",
			DiscoveryPort: 9069,
			PollInterval:  5,
		}, nil
	}

	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}

	return &cfg, nil
}
