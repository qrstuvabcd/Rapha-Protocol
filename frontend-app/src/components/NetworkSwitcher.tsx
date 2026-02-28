/**
 * Network Switcher Component
 * Allows users to switch between Rapha L2 and Polygon networks
 */

import React from 'react'
import { NETWORKS, type NetworkName, getCurrentNetwork, switchToRaphaL2 } from '../services/wallet.service'

interface NetworkSwitcherProps {
    onNetworkChange?: (network: NetworkName) => void
}

export const NetworkSwitcher: React.FC<NetworkSwitcherProps> = ({ onNetworkChange }) => {
    const [currentNetwork, setCurrentNetwork] = React.useState<NetworkName>('raphaL2')
    const [isConnecting, setIsConnecting] = React.useState(false)

    React.useEffect(() => {
        const network = getCurrentNetwork()
        const networkKey = Object.keys(NETWORKS).find(
            key => NETWORKS[key as NetworkName].chainId === network.chainId
        ) as NetworkName
        if (networkKey) setCurrentNetwork(networkKey)
    }, [])

    const handleSwitchToRaphaL2 = async () => {
        setIsConnecting(true)
        try {
            await switchToRaphaL2()
            setCurrentNetwork('raphaL2')
            onNetworkChange?.('raphaL2')
        } catch (error) {
            console.error('Failed to switch network:', error)
        } finally {
            setIsConnecting(false)
        }
    }

    const network = NETWORKS[currentNetwork]

    return (
        <div className="network-switcher">
            <div className="current-network">
                <span className="network-dot" style={{
                    backgroundColor: currentNetwork === 'raphaL2' ? '#00ff88' : '#8B5CF6'
                }} />
                <span className="network-name">{network.name}</span>
                <span className="chain-id">Chain ID: {network.chainId}</span>
            </div>

            {currentNetwork !== 'raphaL2' && (
                <button
                    className="switch-button"
                    onClick={handleSwitchToRaphaL2}
                    disabled={isConnecting}
                >
                    {isConnecting ? 'Switching...' : 'Switch to Rapha L2'}
                </button>
            )}

            <style>{`
                .network-switcher {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 8px 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .current-network {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .network-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                .network-name {
                    font-weight: 600;
                    color: #fff;
                }
                
                .chain-id {
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.5);
                }
                
                .switch-button {
                    padding: 6px 12px;
                    background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
                    border: none;
                    border-radius: 8px;
                    color: #000;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                
                .switch-button:hover {
                    transform: scale(1.05);
                }
                
                .switch-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    )
}
