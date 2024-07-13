import React, { useEffect, useState, useCallback } from 'react';
import { useRequests } from '../../reducers/requests';
import { useNotarize } from './notarizeUtils';
import { useNavigate } from 'react-router';
import { BackgroundActiontype } from '../../entries/Background/rpc';
import { useDispatch } from 'react-redux';
import classNames from 'classnames';
import { urlify } from '../../utils/misc';
import { getNotaryApi, getProxyApi } from '../../utils/storage';

const ExampleComponent: React.FC = () => {
  const allRequests = useRequests() || [];
  const { addRequestsToQueue, startQueueProcessing } = useNotarize();
  const [finalizedRequests, setFinalizedRequests] = useState<any[]>([]);

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

  return (
    <div className="flex flex-col flex-nowrap flex-grow h-full">
      <div className="flex flex-row flex-nowrap bg-gray-100 py-4 px-4 gap-2">
        <p>Example Test Area</p>
      </div>
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
