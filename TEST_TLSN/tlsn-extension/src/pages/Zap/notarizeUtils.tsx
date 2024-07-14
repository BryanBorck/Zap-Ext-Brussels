import { useDispatch } from 'react-redux';
import { notarizeRequest } from '../../reducers/requests';
import {
  getNotaryApi,
  getProxyApi,
  getMaxSent,
  getMaxRecv,
} from '../../utils/storage';
import { urlify } from '../../utils/misc';

const maxTranscriptSize = 16384;
const DELAY_BETWEEN_REQUESTS = 3000; // 3 seconds in milliseconds
const QUEUE_CHECK_INTERVAL = 5000; // 5 seconds

let notarizedRequestIds: Set<string> = new Set();
let currentlyNotarizing: string | null = null;
let requestQueue: string[] = [];
let lastProcessedTime: number = 0;
let processing: boolean = false;

export const useNotarize = () => {
  const dispatch = useDispatch();

  const notarize = async (req: any, onFinalize: (req: any) => void) => {
    if (!req) {
      //console.log('Request is null');
      return;
    }

    //console.log(`Starting notarization for request: ${req.requestId}`);
    currentlyNotarizing = req.requestId;

    const hostname = urlify(req.url)?.hostname;
    //console.log('Hostname:', hostname);
    const notaryUrl = await getNotaryApi();
    const websocketProxyUrl = await getProxyApi();
    const maxSentData = await getMaxSent();
    const maxRecvData = await getMaxRecv();

    const headers: { [k: string]: string } = (req.requestHeaders || []).reduce(
      (acc: any, h: any) => {
        acc[h.name] = h.value;
        return acc;
      },
      { Host: hostname },
    );

    headers['Accept-Encoding'] = 'identity';
    headers['Connection'] = 'close';

    try {
      const result = await dispatch(
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

      //console.log(`Notarized request: ${req.requestId}`);
      //console.log('REQUEST RESPONSE', result);
      notarizedRequestIds.add(req.requestId);
      lastProcessedTime = Date.now();
      onFinalize(req); // Call the callback to update the finalized request
    } catch (error) {
      console.error(`Error notarizing request ${req.requestId}:`, error);
    } finally {
      currentlyNotarizing = null;
      processing = false;
    }
  };

  const processNextInQueue = async (
    allRequests: any[],
    onFinalize: (req: any) => void,
  ) => {
    //console.log('Checking queue for next request to process');
    //console.log(`Current queue length: ${requestQueue.length}`);
    //console.log(
    //   `Processing status: ${processing ? 'Processing' : 'Not processing'}`,
    // );
    //console.log(`Time since last process: ${Date.now() - lastProcessedTime}ms`);

    if (processing || requestQueue.length === 0) {
      //console.log(
      //   'Exiting processNextInQueue: Already processing or queue is empty',
      // );
      return;
    }

    const currentTime = Date.now();
    if (currentTime - lastProcessedTime < DELAY_BETWEEN_REQUESTS) {
      //console.log(
      //   `Waiting for delay. Time remaining: ${
      //     DELAY_BETWEEN_REQUESTS - (currentTime - lastProcessedTime)
      //   }ms`,
      // );
      return;
    }

    processing = true;
    const nextRequestId = requestQueue[0];
    //console.log(`Attempting to process request: ${nextRequestId}`);
    const nextRequest = allRequests.find(
      (req) => req.requestId === nextRequestId,
    );

    if (nextRequest) {
      await notarize(nextRequest, onFinalize);
      requestQueue = requestQueue.slice(1);
    } else {
      //console.log(`Request ${nextRequestId} not found in allRequests`);
      processing = false;
    }
  };

  const addRequestsToQueue = (allRequests: any[]) => {
    //console.log('Checking for new requests to add to queue');
    const newRequestIds = allRequests
      .filter(
        (req) =>
          !notarizedRequestIds.has(req.requestId) &&
          !requestQueue.includes(req.requestId),
      )
      .map((req) => req.requestId);

    if (newRequestIds.length > 0) {
      //console.log(`Adding ${newRequestIds.length} new requests to queue`);
      requestQueue = [...requestQueue, ...newRequestIds];
    }
  };

  const startQueueProcessing = (
    allRequests: any[],
    onFinalize: (req: any) => void,
  ) => {
    //console.log('Setting up interval for queue processing');
    const intervalId = setInterval(() => {
      processNextInQueue(allRequests, onFinalize);
    }, QUEUE_CHECK_INTERVAL);

    // Immediate first run
    processNextInQueue(allRequests, onFinalize);

    return () => {
      //console.log('Clearing interval for queue processing');
      clearInterval(intervalId);
    };
  };

  return {
    notarize,
    processNextInQueue,
    addRequestsToQueue,
    startQueueProcessing,
  };
};
