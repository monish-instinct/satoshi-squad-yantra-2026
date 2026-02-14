import { ethers } from 'ethers';
import { getProvider as getMetaMaskProvider } from '@/lib/wallet';

const CONTRACT_ABI = [
  "function registerBatch(string batchId, string ipfsHash) external",
  "function verifyBatch(string batchId) external returns (bool exists, address currentOwner, string ipfsHash, uint256 createdAt)",
  "function transferOwnership(string batchId, address newOwner) external",
  "function getBatchOwner(string batchId) external view returns (address)",
  "event BatchRegistered(string indexed batchId, address indexed owner, string ipfsHash, uint256 timestamp)",
  "event OwnershipTransferred(string indexed batchId, address indexed from, address indexed to, uint256 timestamp)",
  "event BatchVerified(string indexed batchId, address indexed verifier, uint256 timestamp)",
];

const SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111
const SEPOLIA_CONFIG = {
  chainId: SEPOLIA_CHAIN_ID,
  chainName: 'Ethereum Sepolia Testnet',
  nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com'],
  blockExplorerUrls: ['https://sepolia.etherscan.io/'],
};

export const getContractAddress = (): string | null => {
  return localStorage.getItem('pharma_contract_address');
};

export const setContractAddress = (address: string) => {
  localStorage.setItem('pharma_contract_address', address);
};

export const isBlockchainConfigured = (): boolean => {
  const addr = getContractAddress();
  return !!addr && ethers.isAddress(addr);
};

const getProvider = () => {
  const metamask = getMetaMaskProvider();
  if (metamask) {
    return new ethers.BrowserProvider(metamask);
  }
  return null;
};

export const getCurrentNetwork = async (): Promise<string | null> => {
  const provider = getProvider();
  if (!provider) return null;
  try {
    const network = await provider.getNetwork();
    return '0x' + network.chainId.toString(16);
  } catch {
    return null;
  }
};

export const isOnSepolia = async (): Promise<boolean> => {
  const chainId = await getCurrentNetwork();
  return chainId === SEPOLIA_CHAIN_ID;
};

export const switchToSepolia = async (): Promise<boolean> => {
  const provider = getMetaMaskProvider();
  if (!provider) return false;
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: SEPOLIA_CHAIN_ID }],
    });
    return true;
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      try {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [SEPOLIA_CONFIG],
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
};

export const registerBatchOnChain = async (
  batchId: string,
  ipfsHash: string
): Promise<string | null> => {
  const addr = getContractAddress();
  if (!addr) return null;

  const provider = getProvider();
  if (!provider) return null;

  try {
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(addr, CONTRACT_ABI, signer);
    const tx = await contract.registerBatch(batchId, ipfsHash);
    await tx.wait();
    return tx.hash;
  } catch (e: any) {
    console.error('Blockchain registration failed:', e);
    const msg = e?.error?.message || e?.message || '';
    if (msg.includes('RPC endpoint returned too many errors') || e?.error?.code === -32002) {
      throw new Error('RPC rate limited. Open MetaMask → Settings → Networks → Sepolia and switch RPC to https://ethereum-sepolia-rpc.publicnode.com, then retry.');
    }
    if (e?.code === 'ACTION_REJECTED' || e?.code === 4001) {
      throw new Error('Transaction rejected by user.');
    }
    throw new Error(msg || 'Blockchain transaction failed.');
  }
};

export const verifyBatchOnChain = async (
  batchId: string
): Promise<{ exists: boolean; currentOwner?: string; ipfsHash?: string; createdAt?: number } | null> => {
  const addr = getContractAddress();
  if (!addr) return null;

  const provider = getProvider();
  if (!provider) return null;

  try {
    const contract = new ethers.Contract(addr, CONTRACT_ABI, provider);
    const result = await contract.verifyBatch.staticCall(batchId);
    return {
      exists: result[0],
      currentOwner: result[1],
      ipfsHash: result[2],
      createdAt: Number(result[3]),
    };
  } catch (e) {
    console.error('Blockchain verification failed:', e);
    return null;
  }
};

export const transferOwnershipOnChain = async (
  batchId: string,
  newOwner: string
): Promise<string | null> => {
  const addr = getContractAddress();
  if (!addr) return null;

  const provider = getProvider();
  if (!provider) return null;

  try {
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(addr, CONTRACT_ABI, signer);
    const tx = await contract.transferOwnership(batchId, newOwner);
    await tx.wait();
    return tx.hash;
  } catch (e) {
    console.error('Ownership transfer failed:', e);
    return null;
  }
};

export const generateBatchHash = async (batchId: string, manufacturer: string): Promise<string> => {
  const data = `${batchId}:${manufacturer}:${Date.now()}`;
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
};
