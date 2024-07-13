import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  notarizeRequest,
  useRequest,
  useRequests,
} from '../../reducers/requests';
import { useDispatch } from 'react-redux';
import {
  getNotaryApi,
  getProxyApi,
  getMaxSent,
  getMaxRecv,
} from '../../utils/storage';
import { urlify } from '../../utils/misc';

const maxTranscriptSize = 16384;
const DELAY_BETWEEN_REQUESTS = 30000; // 30 seconds in milliseconds

export default function Zap(): ReactElement {
  console.log('Zap component rendered');
  const navigate = useNavigate();
  const allRequests = useRequests() || [];
  console.log('All requests from useRequests:', allRequests);
  const dispatch = useDispatch();
  const [notarizedRequestIds, setNotarizedRequestIds] = useState<Set<string>>(
    new Set(),
  );
  const [currentlyNotarizing, setCurrentlyNotarizing] = useState<string | null>(
    null,
  );
  const [requestQueue, setRequestQueue] = useState<string[]>([]);

  const notarize = useCallback(
    async (req: any) => {
      if (!req) {
        console.log('Request is null');
        return;
      }

      setCurrentlyNotarizing(req.requestId);

      const hostname = urlify(req.url)?.hostname;
      console.log('Hostname:', hostname);
      const notaryUrl = await getNotaryApi();
      const websocketProxyUrl = await getProxyApi();
      const maxSentData = await getMaxSent();
      const maxRecvData = await getMaxRecv();
      console.log('API URLs and max data:', {
        notaryUrl,
        websocketProxyUrl,
        maxSentData,
        maxRecvData,
      });

      const headers: { [k: string]: string } = (
        req.requestHeaders || []
      ).reduce(
        (acc: any, h: any) => {
          acc[h.name] = h.value;
          return acc;
        },
        { Host: hostname },
      );

      headers['Accept-Encoding'] = 'identity';
      headers['Connection'] = 'close';
      console.log('Processed headers:', headers);

      console.log('Dispatching notarizeRequest');
      try {
        await dispatch(
          // @ts-ignore
          notarizeRequest({
            url: req.url,
            method: req.method,
            headers,
            body: req.requestBody,
            maxSentData,
            maxRecvData,
            maxTranscriptSize,
            notaryUrl,
            websocketProxyUrl,
            secretHeaders: [],
            secretResps: [],
          }),
        );

        console.log(
          'Notarized',
          req.requestId,
          req.url,
          req.method,
          req.requestBody,
        );
        setNotarizedRequestIds((prev) => new Set(prev).add(req.requestId));
      } catch (error) {
        console.error('Error notarizing request:', error);
      } finally {
        setCurrentlyNotarizing(null);
      }
    },
    [dispatch],
  );

  useEffect(() => {
    // Add new requests to the queue
    const newRequestIds = allRequests
      .filter(
        (req) =>
          !notarizedRequestIds.has(req.requestId) &&
          !requestQueue.includes(req.requestId),
      )
      .map((req) => req.requestId);

    if (newRequestIds.length > 0) {
      setRequestQueue((prev) => [...prev, ...newRequestIds]);
    }
  }, [allRequests, notarizedRequestIds, requestQueue]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const processNextRequest = async () => {
      if (requestQueue.length > 0 && !currentlyNotarizing) {
        const nextRequestId = requestQueue[0];
        const nextRequest = allRequests.find(
          (req) => req.requestId === nextRequestId,
        );

        if (nextRequest) {
          await notarize(nextRequest);
          setRequestQueue((prev) => prev.slice(1)); // Remove the processed request from the queue

          // Set a timeout for the next request
          timeoutId = setTimeout(() => {
            processNextRequest();
          }, DELAY_BETWEEN_REQUESTS);
        }
      }
    };

    if (!currentlyNotarizing) {
      processNextRequest();
    }

    // Cleanup function to clear the timeout if the component unmounts or dependencies change
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [requestQueue, currentlyNotarizing, allRequests, notarize]);

  console.log('Rendering Zap component');
  return (
    <div className="flex flex-col flex-nowrap flex-grow">
      <div className="flex flex-row flex-nowrap bg-gray-100 py-4 px-4 gap-2">
        <p>Zap Test Area</p>
      </div>
      <div className="flex flex-col gap-2 flex-nowrap overflow-y-auto p-4">
        {allRequests.map((request, index) => (
          <div
            key={index}
            className="truncate flex flex-row w-full py-1 px-4 flex-nowrap border-transparent shadow-md border-[2px] rounded-md p-2 hover:bg-gray-100 hover:border-gray-400 cursor-pointer transition-all duration-500 ease-in-out"
          >
            <p>{request.url}</p>
            <p>{request.method}</p>
            <p>{request.requestId}</p>
            {notarizedRequestIds.has(request.requestId) && (
              <p className="ml-2 text-green-500">Notarized</p>
            )}
            {currentlyNotarizing === request.requestId && (
              <p className="ml-2 text-yellow-500">Notarizing...</p>
            )}
            {!notarizedRequestIds.has(request.requestId) &&
              currentlyNotarizing !== request.requestId && (
                <p className="ml-2 text-blue-500">Queued</p>
              )}
          </div>
        ))}
      </div>
    </div>
  );
}
