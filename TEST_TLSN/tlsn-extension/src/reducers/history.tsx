import {
  BackgroundActiontype,
  RequestHistory,
} from '../entries/Background/rpc';
import { useSelector } from 'react-redux';
import { AppRootState } from './index';
import deepEqual from 'fast-deep-equal';
import { getDataFromBlockHash, submitDataToAvail } from '../utils/availUtils';
import { hexToU8a } from '@polkadot/util';
import { encryptData } from '../utils/cryptoUtils';
// import { prove, set_logging_filter, verify } from 'tlsn-js';

let encryptionKey = 'myconstantkey123456';

enum ActionType {
  '/history/addRequest' = '/history/addRequest',
  '/history/deleteRequest' = '/history/deleteRequest',
}

type Action<payload> = {
  type: ActionType;
  payload?: payload;
  error?: boolean;
  meta?: any;
};

type State = {
  map: {
    [requestId: string]: RequestHistory;
  };
  order: string[];
};

const initialState: State = {
  map: {},
  order: [],
};

export const addRequestHistory = async (request?: any | null) => {
  if (request?.status == 'success') {
    console.log('Proof', request?.proof);
    // let result = await verify(request?.proof);
    // console.log('Verification Result', result);

    try {
      // Submit to Avail
      console.log('Submitting Proof to Avail');
      console.log('Full Request', JSON.stringify(request));

      // let encryptedData = await encryptData(
      //   JSON.stringify(request),
      //   encryptionKey,
      // );

      let encryptedData = await encryptData(
        JSON.stringify(request),
        encryptionKey,
      );

      console.log('SUBMITTING DATA', encryptedData.toString());

      const availResult = await submitDataToAvail(encryptedData.toString());

      if (availResult) {
        console.log('Submitted to Avail', availResult);
      } else {
        console.error('Failed to submit to Avail');
      }
    } catch (error) {
      console.error('Error in encryption or Avail submission:', error);
    }
  }

  return {
    type: ActionType['/history/addRequest'],
    payload: request,
  };
};

export const deleteRequestHistory = (id: string) => {
  chrome.runtime.sendMessage<any, string>({
    type: BackgroundActiontype.delete_prove_request,
    data: id,
  });

  return {
    type: ActionType['/history/deleteRequest'],
    payload: id,
  };
};

export default function history(
  state = initialState,
  action: Action<any>,
): State {
  switch (action.type) {
    case ActionType['/history/addRequest']: {
      const payload: RequestHistory = action.payload;

      if (!payload) return state;

      const existing = state.map[payload.id];
      const newMap = {
        ...state.map,
        [payload.id]: payload,
      };
      const newOrder = existing ? state.order : state.order.concat(payload.id);

      return {
        ...state,
        map: newMap,
        order: newOrder,
      };
    }
    case ActionType['/history/deleteRequest']: {
      const reqId: string = action.payload;
      const newMap = { ...state.map };
      delete newMap[reqId];
      const newOrder = state.order.filter((id) => id !== reqId);
      return {
        ...state,
        map: newMap,
        order: newOrder,
      };
    }
    default:
      return state;
  }
}

export const useHistoryOrder = (): string[] => {
  return useSelector((state: AppRootState) => {
    return state.history.order;
  }, deepEqual);
};

export const useAllProofHistory = (): RequestHistory[] => {
  return useSelector((state: AppRootState) => {
    return state.history.order.map((id) => state.history.map[id]);
  }, deepEqual);
};

export const useRequestHistory = (id?: string): RequestHistory | undefined => {
  return useSelector((state: AppRootState) => {
    if (!id) return undefined;
    return state.history.map[id];
  }, deepEqual);
};
