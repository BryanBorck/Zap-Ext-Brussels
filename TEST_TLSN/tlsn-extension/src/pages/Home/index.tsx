import React, {
  MouseEventHandler,
  ReactElement,
  ReactNode,
  useEffect,
  useState,
} from 'react';
import Icon from '../../components/Icon';
import classNames from 'classnames';
import { useNavigate } from 'react-router';
import { useRequests } from '../../reducers/requests';
import { PluginList } from '../../components/PluginList';
import PluginUploadInfo from '../../components/PluginInfo';
import { ErrorModal } from '../../components/ErrorModal';
import bkgPhoto from '../../assets/bkg_extension.png';
import circlePoints from '../../assets/circle_points.png';

export default function Home(): ReactElement {
  const requests = useRequests();
  const navigate = useNavigate();
  const [error, showError] = useState('');

  const [count, setCount] = useState(0);
  const [isSpinning, setIsSpinning] = useState(true);

  useEffect(() => {
    const duration = 5000; // total duration in milliseconds
    const increment = 100; // target count
    const intervalTime = duration / increment;

    let currentCount = 0;
    const interval = setInterval(() => {
      currentCount += 1;
      setCount(currentCount);

      if (currentCount >= increment) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full flex flex-col min-h-screen overflow-y-auto bg-blue-midlight overflow-x-hidden relative bg-bluemidlight">
      <div className="absolute inset-0 z-0">
        <img src={bkgPhoto} alt="" className="h-full w-full object-cover" />
      </div>
      {error && <ErrorModal onClose={() => showError('')} message={error} />}
      <div className="z-10 w-full flex flex-col flex-nowrap justify-center">
        <div className="relative h-[80px] w-full bg-black/15 backdrop-blur-md border-greentheme border-b-[2px] flex flex-col items-center justify-center">
          <img
            src="/logo.png"
            alt=""
            className="absolute top-[15px] left-[15px] h-5 w-auto"
          />
          <h1 className="absolute w-full flex flex-col items-center bottom-[15px] text-white text-2xl font-bold">
            <p>My Data Points</p>
          </h1>
        </div>
        <div className="relative w-full h-[250px] flex flex-col items-center justify-center">
          <div
            className={`absolute h-[260] w-[260] ${
              isSpinning ? 'animate-spin-slow' : ''
            } hover:scale-110 transition-transform z-20`}
          >
            <img src={circlePoints} alt="" className="h-full w-full" />
          </div>
          <h1 className="absolute h-[260] w-[260] flex flex-col items-center justify-center text-5xl font-bold text-center text-white hover:scale-110 transition-transform duration-500">
            {count}
          </h1>
          <div className="absolute -bottom-[20px] w-full px-8 flex flex-col items-center text-sm text-gray-400">
            You are doing great! Keep allowing access to open tabs and earn more
            points.
          </div>
        </div>
        <div className="relative w-full h-[180px] flex flex-col items-center justify-center px-6 space-y-[10px]">
          <button
            onClick={() => navigate('/requests')}
            className="w-full bg-lime-400 text-blue-900 font-bold py-1 mt-6 rounded-md shadow-lg border-[2px] border-transparent hover:bg-transparent hover:text-lime-500 hover:border-lime-500 transition-all duration-500 ease-in-out"
          >
            Requests
          </button>
          <button
            onClick={() => navigate('/zap-options')}
            className="w-full bg-lime-400 text-blue-900 font-bold py-1 mt-6 rounded-md shadow-lg border-[2px] border-transparent hover:bg-transparent hover:text-lime-500 hover:border-lime-500 transition-all duration-500 ease-in-out"
          >
            Settings
          </button>
          <button
            onClick={() => navigate('/history')}
            className="w-full bg-lime-400 text-blue-900 font-bold py-1 mt-6 rounded-md shadow-lg border-[2px] border-transparent hover:bg-transparent hover:text-lime-500 hover:border-lime-500 transition-all duration-500 ease-in-out"
          >
            History
          </button>
          {/* <NavButton
            fa="fa-solid fa-table"
            onClick={() => navigate('/requests')}
          >
            <span>Requests</span>
            <span>{`(${requests.length})`}</span>
          </NavButton>
          <NavButton
            fa="fa-solid fa-hammer"
            onClick={() => navigate('/custom')}
          >
            Custom
          </NavButton>
          <NavButton
            fa="fa-solid fa-certificate"
            onClick={() => navigate('/verify')}
          >
            Verify
          </NavButton>
          <NavButton fa="fa-solid fa-list" onClick={() => navigate('/history')}>
            History
          </NavButton>
          <NavButton className="relative" fa="fa-solid fa-plus">
            <PluginUploadInfo />
            Add a plugin
          </NavButton>
          <NavButton fa="fa-solid fa-gear" onClick={() => navigate('/options')}>
            Options
          </NavButton>
          <NavButton fa="fa-solid fa-check" onClick={() => navigate('/zap')}>
            Zap
          </NavButton> */}
        </div>
      </div>
      {/* <PluginList className="mx-4" /> */}
    </div>
  );
}

function NavButton(props: {
  fa: string;
  children?: ReactNode;
  onClick?: MouseEventHandler;
  className?: string;
  disabled?: boolean;
}): ReactElement {
  return (
    <button
      className={classNames(
        'flex flex-row flex-nowrap items-center justify-center',
        'text-white rounded px-2 py-1 gap-1',
        {
          'bg-primary/[.8] hover:bg-primary/[.7] active:bg-primary':
            !props.disabled,
          'bg-primary/[.5]': props.disabled,
        },
        props.className,
      )}
      onClick={props.onClick}
      disabled={props.disabled}
    >
      <Icon className="flex-grow-0 flex-shrink-0" fa={props.fa} size={1} />
      <span className="flex-grow flex-shrink w-0 flex-grow font-bold">
        {props.children}
      </span>
    </button>
  );
}
