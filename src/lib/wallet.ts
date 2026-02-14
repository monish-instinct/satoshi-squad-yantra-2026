import { ethers } from 'ethers';

export const isMetaMaskAvailable = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).ethereum?.isMetaMask;
};

export const getProvider = (): any | null => {
  // Explicitly use MetaMask's provider, skip Phantom even if installed
  const ethereum = (window as any).ethereum;
  if (!ethereum) return null;
  // If multiple providers exist (e.g. Phantom injects too), find MetaMask
  if (ethereum.providers?.length) {
    return ethereum.providers.find((p: any) => p.isMetaMask) ?? null;
  }
  return ethereum.isMetaMask ? ethereum : null;
};

export const connectWallet = async (): Promise<string | null> => {
  const provider = getProvider();
  if (!provider) return null;

  try {
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    return accounts[0] ?? null;
  } catch {
    return null;
  }
};

export const signMessage = async (message: string): Promise<string | null> => {
  const provider = getProvider();
  if (!provider) return null;

  try {
    const ethersProvider = new ethers.BrowserProvider(provider);
    const signer = await ethersProvider.getSigner();
    return await signer.signMessage(message);
  } catch {
    return null;
  }
};

export const shortenAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const getNonce = (): string => {
  return `Sign in to PharmaShield\n\nNonce: ${crypto.randomUUID()}\nTimestamp: ${new Date().toISOString()}`;
};
