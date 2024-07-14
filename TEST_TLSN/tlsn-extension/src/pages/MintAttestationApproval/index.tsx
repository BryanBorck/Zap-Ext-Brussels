import React, { ReactElement, useCallback, useEffect } from 'react';
import Icon from '../../components/Icon';
import { useSearchParams } from 'react-router-dom';
import { safeParseJSON, urlify } from '../../utils/misc';
import browser from 'webextension-polyfill';
import { BackgroundActiontype } from '../../entries/Background/rpc';
import { BaseApproval } from '../BaseApproval';
import { minimatch } from 'minimatch';
import { useAllProofHistory } from '../../reducers/history';
import classNames from 'classnames';
import logo from '../../assets/zap_logo.png';

export function MintAttestationApproval(): ReactElement {
  const [params] = useSearchParams();
  const origin = params.get('origin');
  const favIconUrl = params.get('favIconUrl');
  const url = params.get('url');

  const hostname = urlify(origin || '')?.hostname;

  const onCancel = useCallback(() => {
    browser.runtime.sendMessage({
      type: BackgroundActiontype.mint_attestation_response,
      data: false,
    });
  }, []);

  const onAccept = useCallback(() => {
    browser.runtime.sendMessage({
      type: BackgroundActiontype.mint_attestation_response,
      data: true,
    });
  }, []);

  return (
    <div className="absolute flex flex-col items-center w-screen h-screen bg-white gap-2 cursor-default">
      <div className="w-full p-2 border-b border-gray-200 text-gray-500">
        <div className="flex flex-row items-end justify-start gap-2">
          <img className="h-5" src={logo} alt="logo" />
          <span className="font-semibold">Requesting Mint Attestation</span>
        </div>
      </div>
      <div className="flex flex-col flex-grow gap-2 overflow-y-auto w-full bg-bluemiddark text-white">
        <div className="flex flex-col items-center gap-2 py-8">
          {!!favIconUrl ? (
            <img
              src={favIconUrl}
              className="h-16 w-16 rounded-full border border-bluemidlight bg-bluemidlight"
              alt="logo"
            />
          ) : (
            <Icon
              fa="fa-solid fa-globe"
              size={4}
              className="h-16 w-16 rounded-full border border-bluemidlight text-white"
            />
          )}
          <div className="text-2xl text-center px-8">
            Do you want to share proof history with{' '}
            <b className="text-blue-500">{hostname}</b>?
          </div>
        </div>
        <div className="flex flex-col items-center gap-4 text-sm px-8 text-center flex-grow">
          <button
            onClick={onCancel}
            className="w-full bg-lime-400 text-blue-900 font-bold py-1 mt-6 rounded-md shadow-lg border-[2px] border-transparent hover:bg-transparent hover:text-lime-500 hover:border-lime-500 transition-all duration-500 ease-in-out"
          >
            Create Passkey
          </button>
          <button
            onClick={onAccept}
            className="w-full bg-lime-400 text-blue-900 font-bold py-1 mt-6 rounded-md shadow-lg border-[2px] border-transparent hover:bg-transparent hover:text-lime-500 hover:border-lime-500 transition-all duration-500 ease-in-out"
          >
            Mint Proof
          </button>
        </div>
      </div>
    </div>
  );
}
