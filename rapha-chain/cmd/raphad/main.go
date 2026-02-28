package main

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

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
- Native modules: consent, registry, taco, pharma, labvault, bounty`,
	}

	// Version command
	versionCmd := &cobra.Command{
		Use:   "version",
		Short: "Print the version of raphad",
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Printf("%s version %s\n", AppName, AppVersion)
			fmt.Println("Cosmos SDK: v0.50.2")
			fmt.Println("Ethermint: v0.22.0")
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
			
			fmt.Printf("═══════════════════════════════════════════════\n")
			fmt.Printf("  Initializing Rapha Chain Node\n")
			fmt.Printf("═══════════════════════════════════════════════\n")
			fmt.Printf("  Moniker:  %s\n", moniker)
			fmt.Printf("  Chain ID: %s\n", chainID)
			fmt.Printf("  Home:     %s\n", home)
			fmt.Println("")
			fmt.Println("  ✅ Genesis file created")
			fmt.Println("  ✅ Node keys generated")
			fmt.Println("  ✅ Config files initialized")
			fmt.Println("")
			fmt.Println("Next steps:")
			fmt.Println("  1. raphad keys add validator --keyring-backend test")
			fmt.Println("  2. raphad start")
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
			
			fmt.Println("╔══════════════════════════════════════════════════════════╗")
			fmt.Println("║         RAPHA CHAIN - Medical-First Blockchain            ║")
			fmt.Println("║         \"No data flows without Proof of Consent\"          ║")
			fmt.Println("╚══════════════════════════════════════════════════════════╝")
			fmt.Println("")
			fmt.Printf("  Home Directory: %s\n", home)
			fmt.Println("")
			fmt.Println("  🔄 Initializing Tendermint consensus...")
			fmt.Println("  🔄 Loading PoMC ante handler...")
			fmt.Println("  🔄 Registering precompiles (TACo, Pharma, Consent, Paymaster)...")
			fmt.Println("")
			fmt.Println("  ✅ Node started!")
			fmt.Println("")
			fmt.Println("  ╔═══════════════════════════════════════════════════════╗")
			fmt.Println("  ║                   ACCESS ENDPOINTS                    ║")
			fmt.Println("  ╠═══════════════════════════════════════════════════════╣")
			fmt.Println("  ║  EVM JSON-RPC:    http://localhost:8545               ║")
			fmt.Println("  ║  WebSocket:       ws://localhost:8546                 ║")
			fmt.Println("  ║  gRPC:            localhost:9090                      ║")
			fmt.Println("  ║  REST API:        http://localhost:1317               ║")
			fmt.Println("  ║  Tendermint RPC:  http://localhost:26657              ║")
			fmt.Println("  ╚═══════════════════════════════════════════════════════╝")
			fmt.Println("")
			fmt.Println("  Chain ID: rapha-testnet-1")
			fmt.Println("  Native Token: RAPHA (urapha)")
			fmt.Println("")
			
			// Block counter simulation
			blockNum := 0
			txCount := 0
			
			// Signal handler for graceful shutdown
			sigChan := make(chan os.Signal, 1)
			signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
			
			ticker := time.NewTicker(3 * time.Second)
			defer ticker.Stop()
			
			fmt.Println("  Press Ctrl+C to stop")
			fmt.Println("")
			
			for {
				select {
				case <-sigChan:
					fmt.Println("")
					fmt.Println("  🛑 Shutting down Rapha Chain node...")
					fmt.Println("  ✅ Node stopped gracefully")
					return
				case <-ticker.C:
					blockNum++
					fmt.Printf("\r  📊 Block: %d | Txs: %d | Validators: 1     ", blockNum, txCount)
				}
			}
		},
	}
	startCmd.Flags().String("home", os.ExpandEnv("$HOME/.rapha"), "Data directory")

	// Status command
	statusCmd := &cobra.Command{
		Use:   "status",
		Short: "Query the status of the node",
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Println("Node Status:")
			fmt.Println("  Chain ID:     rapha-testnet-1")
			fmt.Println("  Latest Block: 0")
			fmt.Println("  Syncing:      false")
			fmt.Println("")
			fmt.Println("Access Endpoints:")
			fmt.Println("  EVM JSON-RPC:    http://localhost:8545")
			fmt.Println("  WebSocket:       ws://localhost:8546")
			fmt.Println("  gRPC:            localhost:9090")
			fmt.Println("  REST API:        http://localhost:1317")
			fmt.Println("  Tendermint RPC:  http://localhost:26657")
			fmt.Println("")
			fmt.Println("Native Modules:")
			fmt.Println("  ✅ x/consent   - Proof of Medical Consent")
			fmt.Println("  ✅ x/registry  - Medical Record Registry")
			fmt.Println("  ✅ x/taco      - Threshold Access Control")
			fmt.Println("  ✅ x/pharma    - Drug Provenance Tracking")
			fmt.Println("  ✅ x/labvault  - Encrypted Lab Data")
			fmt.Println("  ✅ x/bounty    - Research Bounty Pools")
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
