import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  notarizeRequest,
  useRequest,
  useRequests,
} from '../../reducers/requests';
import revolutlogo from '../../assets/img/revolut-icon.png';
import { urlify } from '../../utils/misc';
import {
  getNotaryApi,
  getProxyApi,
  getMaxSent,
  getMaxRecv,
} from '../../utils/storage';
import { useDispatch } from 'react-redux';

const maxTranscriptSize = 16384;

export default function Zap(): ReactElement {
  const navigate = useNavigate();
  const requests = useRequests();
  const dispatch = useDispatch();
  const [reqsIdNotarized, setReqsIdNotarized] = useState<string[]>([]);
  const [processing, setProcessing] = useState<boolean>(false);
  const [currentReqId, setCurrentReqId] = useState<string | null>(null);
  const [currentReq, setCurrentReq] = useState<any | null>(null);

  const notarize = useCallback(
    async (req: any) => {
      if (!req) return;
      const hostname = urlify(req.url)?.hostname;
      const notaryUrl = await getNotaryApi();
      const websocketProxyUrl = await getProxyApi();
      const maxSentData = await getMaxSent();
      const maxRecvData = await getMaxRecv();
      const headers: { [k: string]: string } = req.requestHeaders.reduce(
        (acc: any, h: any) => {
          acc[h.name] = h.value;
          return acc;
        },
        { Host: hostname },
      );

      //TODO: for some reason, these needs to be override to work
      headers['Accept-Encoding'] = 'identity';
      headers['Connection'] = 'close';

      dispatch(
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
        'Notarizing',
        req.requestId,
        req.url,
        req.method,
        req.requestBody,
      );
    },
    [dispatch],
  );

  // Effect to set the current request to be processed
  useEffect(() => {
    if (!processing && reqsIdNotarized.length > 0) {
      setCurrentReqId(reqsIdNotarized[0]);
    }
  }, [reqsIdNotarized, processing]);

  // Effect to fetch the request based on the current request ID
  useEffect(() => {
    if (currentReqId) {
      const req = useRequest(currentReqId);
      setCurrentReq(req);
    }
  }, [currentReqId]);

  // Effect to fetch the request and process it
  useEffect(() => {
    const processCurrentReq = async () => {
      if (currentReq) {
        setProcessing(true);
        await notarize(currentReq);
        setReqsIdNotarized((prevList) =>
          prevList.filter((id) => id !== currentReqId),
        );
        setProcessing(false);
        setCurrentReqId(null);
        setCurrentReq(null);
      }
    };

    processCurrentReq();
  }, [currentReq, notarize, currentReqId]);

  useEffect(() => {
    if (requests.length > 0) {
      setReqsIdNotarized((prevList) => [...prevList, requests[0].requestId]);
    }
  }, [requests]);

  return (
    <div className="flex flex-col flex-nowrap flex-grow">
      <div className="flex flex-row flex-nowrap bg-gray-100 py-4 px-4 gap-2">
        <p>Zap Test Area</p>
      </div>
      <div className="flex flex-col gap-2 flex-nowrap overflow-y-auto p-4">
        {/* FAZER UM MAPPING AQUI*/}
        {requests.map((request, index) => (
          <div
            key={index}
            className="truncate flex flex-row w-full py-1 px-4 flex-nowrap border-transparent shadow-md border-[2px] rounded-md p-2 hover:bg-gray-100 hover:border-gray-400 cursor-pointer transition-all duration-500 ease-in-out"
          >
            <p>{request.url}</p>
            <p>{request.method}</p>
            <p>{request.requestId}</p>
          </div>
        ))}
        {/* <div
          onClick={() => navigate('/revolut')}
          className="flex flex-row w-full py-1 px-4 flex-nowrap border-transparent shadow-md border-[2px] rounded-md p-2 hover:bg-gray-100 hover:border-gray-400 cursor-pointer transition-all duration-500 ease-in-out"
        >
          <img src={revolutlogo} alt="Revolut" className="h-4 w-4 mr-4" />
          <p>Revolut</p>
        </div> */}
      </div>
    </div>
  );
}
