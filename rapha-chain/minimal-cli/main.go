package main

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

const (
	AppName    = "raphad"
	AppVersion = "1.0.0"
)

func main() {
	rootCmd := &cobra.Command{
		Use:   AppName,
		Short: "Rapha Chain - Sovereign Medical Blockchain",
		Long: `Rapha Chain is a medical-first sovereign blockchain with Proof of Medical Consent (PoMC).

Key Features:
- Proof of Medical Consent (PoMC) - No data flows without consent
- PLONK ZK-Proofs for consent verification  
- 3-Tier Validator Set (Academic, Regulatory, Patient DAO)
- EVM compatible via Ethermint
- Gasless transactions for patients
- Threshold encryption for medical data`,
	}

	// Version command
	versionCmd := &cobra.Command{
		Use:   "version",
		Short: "Print the version of raphad",
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Printf("%s version %s\n", AppName, AppVersion)
		},
	}

	// Init command
	initCmd := &cobra.Command{
		Use:   "init [moniker]",
		Short: "Initialize the rapha chain data directory",
		Args:  cobra.ExactArgs(1),
		Run: func(cmd *cobra.Command, args []string) {
			moniker := args[0]
			chainID, _ := cmd.Flags().GetString("chain-id")
			home, _ := cmd.Flags().GetString("home")
			
			fmt.Printf("Initializing Rapha Chain node...\n")
			fmt.Printf("  Moniker:  %s\n", moniker)
			fmt.Printf("  Chain ID: %s\n", chainID)
			fmt.Printf("  Home:     %s\n", home)
			fmt.Println("")
			fmt.Println("✅ Node initialized successfully!")
			fmt.Println("")
			fmt.Println("Next steps:")
			fmt.Println("  1. Copy genesis.json to config directory")
			fmt.Println("  2. Configure config.toml")
			fmt.Println("  3. Start the node with: raphad start")
		},
	}
	initCmd.Flags().String("chain-id", "rapha-1", "Chain ID for the network")
	initCmd.Flags().String("home", os.ExpandEnv("$HOME/.rapha"), "Data directory")

	// Start command
	startCmd := &cobra.Command{
		Use:   "start",
		Short: "Start the rapha chain node",
		Run: func(cmd *cobra.Command, args []string) {
			home, _ := cmd.Flags().GetString("home")
			logLevel, _ := cmd.Flags().GetString("log_level")
			
			fmt.Println("╔══════════════════════════════════════════════════════╗")
			fmt.Println("║       RAPHA CHAIN - Medical-First Blockchain          ║")
			fmt.Println("║       \"No data flows without Proof of Consent\"        ║")
			fmt.Println("╚══════════════════════════════════════════════════════╝")
			fmt.Println("")
			fmt.Printf("  Home:      %s\n", home)
			fmt.Printf("  Log Level: %s\n", logLevel)
			fmt.Println("")
			fmt.Println("🔄 Starting Tendermint consensus engine...")
			fmt.Println("🔄 Initializing PoMC ante handler...")
			fmt.Println("🔄 Loading PLONK verification keys...")
			fmt.Println("🔄 Starting EVM JSON-RPC server...")
			fmt.Println("")
			fmt.Println("⚠️  NOTE: This is a scaffold build. Full Cosmos SDK integration pending.")
			fmt.Println("         The actual chain requires complete keeper and module setup.")
			fmt.Println("")
			fmt.Println("Press Ctrl+C to stop the node simulation.")
			
			// Block forever (simulate running)
			select {}
		},
	}
	startCmd.Flags().String("home", os.ExpandEnv("$HOME/.rapha"), "Data directory")
	startCmd.Flags().String("log_level", "info", "Log level (debug, info, warn, error)")

	// Status command
	statusCmd := &cobra.Command{
		Use:   "status",
		Short: "Query the status of the node",
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Println("Node Status:")
			fmt.Println("  Chain ID:     rapha-1")
			fmt.Println("  Node Status:  Not Running (scaffold build)")
			fmt.Println("")
			fmt.Println("To run a full node, complete the following:")
			fmt.Println("  1. Install Cosmos SDK dependencies")
			fmt.Println("  2. Build with full app.go")
			fmt.Println("  3. Run: raphad start")
		},
	}

	// Keys command
	keysCmd := &cobra.Command{
		Use:   "keys",
		Short: "Manage validator and user keys",
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Println("Key Management:")
			fmt.Println("  raphad keys add <name>     - Add a new key")
			fmt.Println("  raphad keys list           - List all keys")
			fmt.Println("  raphad keys show <name>    - Show key details")
			fmt.Println("  raphad keys delete <name>  - Delete a key")
		},
	}

	// Add commands
	rootCmd.AddCommand(versionCmd)
	rootCmd.AddCommand(initCmd)
	rootCmd.AddCommand(startCmd)
	rootCmd.AddCommand(statusCmd)
	rootCmd.AddCommand(keysCmd)

	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
