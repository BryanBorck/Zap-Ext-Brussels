import {
  initialize,
  getKeyringFromSeed,
  ApiPromise,
  Keyring,
} from 'avail-js-sdk';
import { KeyringPair } from '@polkadot/keyring/types';
import { ISubmittableResult } from '@polkadot/types/types/extrinsic';
import { H256 } from '@polkadot/types/interfaces/runtime';

import config from './config';

export async function initializeAvail(): Promise<{
  api: ApiPromise;
  account: KeyringPair;
  options: { app_id: number; nonce: number };
}> {
  const api = await initialize(config.endpoint);
  const account = getKeyringFromSeed(config.seed);
  const appId = config.appId === 0 ? 1 : config.appId;
  const options = { app_id: appId, nonce: -1 };

  return {
    api,
    account,
    options,
  };
}

export async function submitDataToAvail(data: string): Promise<{
  txHash: string;
  blockHash: string;
} | null> {
  const { api, account, options } = await initializeAvail();

  const txResult = await new Promise<ISubmittableResult>((response) => {
    api.tx.dataAvailability
      .submitData(data)
      .signAndSend(account, options, (result: ISubmittableResult) => {
        console.log(`Tx status: ${result.status}`);
        if (result.isFinalized || result.isError) {
          response(result);
        }
      });
  });
  if (txResult.isError) {
    console.log('Transaction was not executed');
    return null;
  }

  const [txHash, blockHash] = [
    txResult.txHash as H256,
    txResult.status.asFinalized as H256,
  ];
  console.log(`Tx Hash: ${txHash}, Block Hash: ${blockHash}`);

  const error = txResult.dispatchError;
  if (error != undefined) {
    if (error.isModule) {
      const decoded = api.registry.findMetaError(error.asModule);
      const { docs, name, section } = decoded;
      console.log(`${section}.${name}: ${docs.join(' ')}`);
    } else {
      console.log(error.toString());
    }
    return null;
  }

  return {
    txHash: txHash.toHex(),
    blockHash: blockHash.toHex(),
  };
}

export async function getDataFromBlockHash(
  blockHash: string,
  txHash: H256,
): Promise<string | null> {
  const { api } = await initializeAvail();

  const block = await api.rpc.chain.getBlock(blockHash);
  const tx = block.block.extrinsics.find(
    (tx) => tx.hash.toHex() == txHash.toHex(),
  );
  if (tx == undefined) {
    console.log('Failed to find the Submit Data transaction');
    return null;
  }

  const dataHex = tx.method.args.map((a) => a.toString()).join(', ');
  let submittedData = '';
  for (let n = 0; n < dataHex.length; n += 2) {
    submittedData += String.fromCharCode(
      parseInt(dataHex.substring(n, n + 2), 16),
    );
  }
  console.log(`submitted data: ${submittedData}`);

  return submittedData;
}
