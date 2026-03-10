import { useState } from 'react';

export const useAuthorization = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState(null);

  const connect = async () => {
    setIsConnected(true);
    setAccount({ address: 'MAGMADemo1111111111111111111111111111111111' });
  };

  const disconnect = async () => {
    setIsConnected(false);
    setAccount(null);
  };

  return { connect, disconnect, isConnected, account };
};

export default useAuthorization;
