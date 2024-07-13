import React, {
  ReactElement,
  useCallback,
  useEffect,
  useState,
  useRef,
} from 'react';
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
const QUEUE_CHECK_INTERVAL = 5000; // 5 seconds

export default function Zap(): ReactElement {
  console.log('Zap component rendered');
  const navigate = useNavigate();
  const allRequests = useRequests() || [];
  const dispatch = useDispatch();
  const [notarizedRequestIds, setNotarizedRequestIds] = useState<Set<string>>(
    new Set(),
  );
  const [currentlyNotarizing, setCurrentlyNotarizing] = useState<string | null>(
    null,
  );
  const [requestQueue, setRequestQueue] = useState<string[]>([]);
  const lastProcessedTime = useRef<number>(0);
  const processingRef = useRef<boolean>(false);

  const notarize = useCallback(
    async (req: any) => {
      if (!req) {
        console.log('Request is null');
        return;
      }

      console.log(`Starting notarization for request: ${req.requestId}`);
      setCurrentlyNotarizing(req.requestId);

      const hostname = urlify(req.url)?.hostname;
      console.log('Hostname:', hostname);
      const notaryUrl = await getNotaryApi();
      const websocketProxyUrl = await getProxyApi();
      const maxSentData = await getMaxSent();
      const maxRecvData = await getMaxRecv();

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

        console.log(`Notarized request: ${req.requestId}`);
        setNotarizedRequestIds((prev) => new Set(prev).add(req.requestId));
        lastProcessedTime.current = Date.now();
      } catch (error) {
        console.error(`Error notarizing request ${req.requestId}:`, error);
      } finally {
        setCurrentlyNotarizing(null);
        processingRef.current = false;
      }
    },
    [dispatch],
  );

  const processNextInQueue = useCallback(async () => {
    console.log('Checking queue for next request to process');
    console.log(`Current queue length: ${requestQueue.length}`);
    console.log(
      `Processing status: ${processingRef.current ? 'Processing' : 'Not processing'}`,
    );
    console.log(
      `Time since last process: ${Date.now() - lastProcessedTime.current}ms`,
    );

    if (processingRef.current || requestQueue.length === 0) {
      console.log(
        'Exiting processNextInQueue: Already processing or queue is empty',
      );
      return;
    }

    const currentTime = Date.now();
    if (currentTime - lastProcessedTime.current < DELAY_BETWEEN_REQUESTS) {
      console.log(
        `Waiting for delay. Time remaining: ${DELAY_BETWEEN_REQUESTS - (currentTime - lastProcessedTime.current)}ms`,
      );
      return;
    }

    processingRef.current = true;
    const nextRequestId = requestQueue[0];
    console.log(`Attempting to process request: ${nextRequestId}`);
    const nextRequest = allRequests.find(
      (req) => req.requestId === nextRequestId,
    );

    if (nextRequest) {
      await notarize(nextRequest);
      setRequestQueue((prev) => prev.slice(1));
    } else {
      console.log(`Request ${nextRequestId} not found in allRequests`);
      processingRef.current = false;
    }
  }, [allRequests, notarize, requestQueue]);

  useEffect(() => {
    console.log('Checking for new requests to add to queue');
    const newRequestIds = allRequests
      .filter(
        (req) =>
          !notarizedRequestIds.has(req.requestId) &&
          !requestQueue.includes(req.requestId),
      )
      .map((req) => req.requestId);

    if (newRequestIds.length > 0) {
      console.log(`Adding ${newRequestIds.length} new requests to queue`);
      setRequestQueue((prev) => [...prev, ...newRequestIds]);
    }
  }, [allRequests, notarizedRequestIds, requestQueue]);

  useEffect(() => {
    console.log('Setting up interval for queue processing');
    const intervalId = setInterval(() => {
      processNextInQueue();
    }, QUEUE_CHECK_INTERVAL);

    // Immediate first run
    processNextInQueue();

    return () => {
      console.log('Clearing interval for queue processing');
      clearInterval(intervalId);
    };
  }, [processNextInQueue]);

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
