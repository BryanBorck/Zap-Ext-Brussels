import React, { useEffect, useState, useCallback } from 'react';
import { useRequests } from '../../reducers/requests';
import { useNotarize } from './notarizeUtils';
import { useNavigate } from 'react-router';
import { BackgroundActiontype } from '../../entries/Background/rpc';
import { useDispatch } from 'react-redux';
import classNames from 'classnames';
import { urlify } from '../../utils/misc';
import { getNotaryApi, getProxyApi } from '../../utils/storage';
import { getDataFromBlockHash } from '../../utils/availUtils';
import { H256 } from '@polkadot/types/interfaces';
import { hexToU8a } from '@polkadot/util';
import { TypeRegistry } from '@polkadot/types';

let registry = new TypeRegistry();

// Function to convert hexadecimal string to H256
function hexStringToH256(hexString: string): H256 {
  if (hexString.length !== 66 || !hexString.startsWith('0x')) {
    throw new Error('Invalid hex string format for H256');
  }

  return registry.createType('H256', hexToU8a(hexString));
}

// Separate IV and encrypted data
function separateIvAndData(combinedData: Uint8Array): [Uint8Array, Uint8Array] {
  const iv = combinedData.slice(0, 12); // AES-GCM typically uses a 12-byte IV
  const encryptedData = combinedData.slice(12);
  return [iv, encryptedData];
}

export async function generateConsistentKey(
  seed: string = 'YourConstantSeedHere',
) {
  // Convert the seed string to an ArrayBuffer
  const encoder = new TextEncoder();
  const seedBuffer = encoder.encode(seed);

  // Use the seed to create a key
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    seedBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey'],
  );

  // Derive the actual key using PBKDF2
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new Uint8Array(16), // You should use a consistent salt
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );

  return key;
}

const ExampleComponent: React.FC = () => {
  const allRequests = useRequests() || [];
  const { addRequestsToQueue, startQueueProcessing } = useNotarize();
  const [finalizedRequests, setFinalizedRequests] = useState<any[]>([]);
  const [blockData, setBlockData] = useState<string | null>(null);
  const [decryptedData, setDecryptedData] = useState<string | null>(null);
  const [decryptionKey, setDecryptionKey] = useState<string>('');

  const handleFinalize = (req: any) => {
    setFinalizedRequests((prev) => [...prev, req]);
  };

  useEffect(() => {
    addRequestsToQueue(allRequests);
  }, [allRequests]);

  useEffect(() => {
    const clearProcessing = startQueueProcessing(allRequests, handleFinalize);

    return () => {
      clearProcessing();
    };
  }, [allRequests]);

  const handleGetDataFromBlockHash = async () => {
    const txHash =
      '0x1cb2443525c559de4cd102e1463588f0f414b5785baaaf23988643b49f4be448';
    const blockHash =
      '0x885e344aa5cc6be5dbee059c6f6d38111ac66eaccf44da761bae43f6d8d9d2f1';

    try {
      const data = await getDataFromBlockHash(
        blockHash,
        hexStringToH256(txHash),
      );

      console.log('Block Data', data);
      setBlockData(data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setBlockData('Error fetching data');
    }
  };

  // async function decryptData(iv: Uint8Array, encryptedData: Uint8Array) {
  //   let key = await generateConsistentKey(); // Ensure this uses the same seed as encryption
  //   try {
  //     const decryptedData = await crypto.subtle.decrypt(
  //       {
  //         name: 'AES-GCM',
  //         iv: iv,
  //       },
  //       key,
  //       encryptedData,
  //     );

  //     const decoder = new TextDecoder();
  //     return decoder.decode(decryptedData);
  //   } catch (error) {
  //     console.error('Decryption error:', error);
  //     throw error;
  //   }
  // }

  // const handleDecrypt = async () => {
  //   if (!blockData) {
  //     alert('Please fetch block data first');
  //     return;
  //   }

  //   try {
  //     // Convert hex string to Uint8Array
  //     const combinedData = hexToU8a(blockData);

  //     // Separate IV and encrypted data
  //     const [iv, encryptedData] = separateIvAndData(combinedData);

  //     // Decrypt the data
  //     const decrypted = await decryptData(iv, encryptedData);
  //     console.log('Decrypted Data', decrypted);
  //     setDecryptedData(decrypted);
  //   } catch (error) {
  //     console.error('Error decrypting data:', error);
  //     // setDecryptedData('Error decrypting data: ' + error?.message);
  //   }
  // };

  return (
    <div className="flex flex-col flex-nowrap flex-grow h-full">
      <div className="flex flex-row flex-nowrap bg-gray-100 py-4 px-4 gap-2">
        <p>Example Test Area</p>
        <button
          onClick={handleGetDataFromBlockHash}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Get Block Data
        </button>
        {/* <input
          type="password"
          placeholder="Enter decryption key"
          value={decryptionKey}
          onChange={(e) => setDecryptionKey(e.target.value)}
          className="border rounded px-2 py-1"
        /> */}
        {/* <button
          onClick={handleDecrypt}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Decrypt Data
        </button> */}
      </div>
      {blockData && (
        <div
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Block Data: </strong>
          <span className="block sm:inline">{blockData}</span>
        </div>
      )}
      {decryptedData && (
        <div
          className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative mt-2"
          role="alert"
        >
          <strong className="font-bold">Decrypted Data: </strong>
          <span className="block sm:inline">{decryptedData}</span>
        </div>
      )}
      <div className="flex-grow overflow-y-auto">
        <div className="flex flex-col gap-2 p-4">
          {allRequests.map((request, index) => (
            <RequestItem
              key={index}
              request={request}
              finalized={finalizedRequests.some(
                (r) => r.requestId === request.requestId,
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const RequestItem: React.FC<{ request: any; finalized: boolean }> = ({
  request,
  finalized,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const requestUrl = urlify(request.url);

  const onView = useCallback(() => {
    chrome.runtime.sendMessage<any, string>({
      type: BackgroundActiontype.verify_prove_request,
      data: request,
    });
    navigate('/verify/' + request?.id);
  }, [request]);

  return (
    <div className="truncate flex flex-row w-full py-1 px-4 flex-nowrap border-transparent shadow-md border-[2px] rounded-md p-2 hover:bg-gray-100 hover:border-gray-400 cursor-pointer transition-all duration-500 ease-in-out">
      <div className="flex flex-col flex-nowrap flex-grow">
        <div className="flex flex-row items-center text-xs">
          <div className="bg-slate-200 text-slate-400 px-1 py-0.5 rounded-sm">
            {request.method}
          </div>
          <div className="text-black font-bold px-2 py-1 rounded-md overflow-hidden text-ellipsis">
            {requestUrl?.pathname}
          </div>
        </div>
        <div className="flex flex-row">
          <div className="font-bold text-slate-400">Host:</div>
          <div className="ml-2 text-slate-800">{requestUrl?.host}</div>
        </div>
        <div className="flex flex-row">
          <div className="font-bold text-slate-400">Notary API:</div>
          <div className="ml-2 text-slate-800">{request.notaryUrl}</div>
        </div>
        <div className="flex flex-row">
          <div className="font-bold text-slate-400">TLS Proxy API: </div>
          <div className="ml-2 text-slate-800">{request.websocketProxyUrl}</div>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {finalized ? (
          <>
            <ActionButton
              className="bg-slate-600 text-slate-200 hover:bg-slate-500 hover:text-slate-100"
              onClick={onView}
              fa="fa-solid fa-receipt"
              ctaText="View Proof"
            />
          </>
        ) : (
          <button className="flex flex-row flex-grow-0 gap-2 self-end items-center justify-end px-2 py-1 bg-slate-100 text-slate-300 font-bold">
            <span className="text-xs font-bold">Pending</span>
          </button>
        )}
      </div>
    </div>
  );
};

const ActionButton: React.FC<{
  onClick: () => void;
  fa: string;
  ctaText: string;
  className?: string;
}> = ({ onClick, fa, ctaText, className }) => {
  return (
    <button
      className={classNames(
        'flex flex-row flex-grow-0 gap-2 self-end items-center justify-end px-2 py-1 hover:font-bold',
        className,
      )}
      onClick={onClick}
    >
      <i className={fa}></i>
      <span className="text-xs font-bold">{ctaText}</span>
    </button>
  );
};

export default ExampleComponent;
