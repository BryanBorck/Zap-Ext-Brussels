import { notarizeRequest } from '../../reducers/requests';
import {
  getNotaryApi,
  getProxyApi,
  getMaxSent,
  getMaxRecv,
} from '../../utils/storage';
import { urlify } from '../../utils/misc';
import store from '../../utils/store';

const maxTranscriptSize = 16384;
const DELAY_BETWEEN_REQUESTS = 3000; // 30 seconds in milliseconds
const QUEUE_CHECK_INTERVAL = 5000; // 5 seconds

let notarizedRequestIds: Set<string> = new Set();
let currentlyNotarizing: string | null = null;
let requestQueue: string[] = [];
let lastProcessedTime: number = 0;
let processing: boolean = false;

const notarize = async (req: any) => {
  if (!req) {
    console.log('Request is null');
    return;
  }

  console.log(`Starting notarization for request: ${req.requestId}`);
  currentlyNotarizing = req.requestId;

  const hostname = urlify(req.url)?.hostname;
  console.log('Hostname:', hostname);
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

  console.log('Before Dispatch');

  try {
    await store.dispatch(
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
      }) as any,
    );

    console.log(`Notarized request: ${req.requestId}`);
    notarizedRequestIds.add(req.requestId);
    lastProcessedTime = Date.now();
  } catch (error) {
    console.error(`Error notarizing request ${req.requestId}:`, error);
  } finally {
    currentlyNotarizing = null;
    processing = false;
  }
};

const processNextInQueue = async (allRequests: any[]) => {
  console.log('Checking queue for next request to process');
  console.log(`Current queue length: ${requestQueue.length}`);
  console.log(
    `Processing status: ${processing ? 'Processing' : 'Not processing'}`,
  );
  console.log(`Time since last process: ${Date.now() - lastProcessedTime}ms`);

  if (processing || requestQueue.length === 0) {
    console.log(
      'Exiting processNextInQueue: Already processing or queue is empty',
    );
    return;
  }

  const currentTime = Date.now();
  if (currentTime - lastProcessedTime < DELAY_BETWEEN_REQUESTS) {
    console.log(
      `Waiting for delay. Time remaining: ${
        DELAY_BETWEEN_REQUESTS - (currentTime - lastProcessedTime)
      }ms`,
    );
    return;
  }

  processing = true;
  const nextRequestId = requestQueue[0];
  console.log(`Attempting to process request: ${nextRequestId}`);
  const nextRequest = allRequests.find(
    (req) => req.requestId === nextRequestId,
  );

  if (nextRequest) {
    await notarize(nextRequest);
    requestQueue = requestQueue.slice(1);
  } else {
    console.log(`Request ${nextRequestId} not found in allRequests`);
    processing = false;
  }
};

export const addRequestsToQueue = (allRequests: any[]) => {
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
    requestQueue = [...requestQueue, ...newRequestIds];
  }
};

export const startQueueProcessing = (allRequests: any[]) => {
  console.log('Setting up interval for queue processing');
  const intervalId = setInterval(() => {
    processNextInQueue(allRequests);
  }, QUEUE_CHECK_INTERVAL);

  // Immediate first run
  processNextInQueue(allRequests);

  return () => {
    console.log('Clearing interval for queue processing');
    clearInterval(intervalId);
  };
};
