import React, { ReactElement, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import Toggle from '../../components/Toggle';
import { setList, URL_PATTERNS_LS_KEY } from '../../utils/storage';
import bkgPhoto from '../../assets/bkg_extension.png';

export default function ZapOptions(): ReactElement {
  const [twitterOn, setTwitterOn] = useState<boolean>(false);
  const [instagramOn, setInstagramOn] = useState<boolean>(false);
  const [discordOn, setDiscordOn] = useState<boolean>(false);
  const [gmailOn, setGmailOn] = useState<boolean>(false);
  const [chatgptOn, setChatgptOn] = useState<boolean>(false);

  useEffect(() => {
    const urls = [];
    if (twitterOn) {
      urls.push('https://x.com/i/api/1.1/dm/user_updates.json');
    }
    if (instagramOn) {
      urls.push('https://www.instagram.com/ajax/bulk-route-definitions/');
    }
    if (discordOn) {
      urls.push('https://discord.com/api/v9/users/@me');
    }
    if (gmailOn) {
      urls.push('https://mail.google.com/sync/u/0/i/fd\\S+');
      //   urls.push('https://mail.google.com/sync/u/0/i/s\\S+');
    }
    if (chatgptOn) {
      urls.push(
        'https://chatgpt.com/backend-api/conversation/\\S+',
        // 'https://chatgpt.com/backend-api/conversations\\S+',
      );
    }
    setList(URL_PATTERNS_LS_KEY, urls);
  }, [twitterOn, chatgptOn]);

  const handleToggle = (index: number, state: boolean) => {
    console.log(`Toggle ${index} is now ${state ? 'On' : 'Off'}`);
    switch (index) {
      case 0:
        setTwitterOn(state);
        break;
      case 1:
        setInstagramOn(state);
        break;
      case 2:
        setDiscordOn(state);
        break;
      case 3:
        setGmailOn(state);
        break;
      case 4:
        setChatgptOn(state);
        break;
      default:
        // Optional: Handle the default case
        break;
    }
  };

  return (
    <div className="w-full flex flex-col min-h-screen overflow-y-auto bg-blue-midlight overflow-x-hidden relative bg-bluemidlight">
      <div className="absolute inset-0 z-0">
        <img src={bkgPhoto} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="z-10 w-full flex flex-col flex-nowrap justify-center">
        <div className="relative h-[80px] w-full bg-black/15 backdrop-blur-md border-greentheme border-b-[2px] flex flex-col items-center justify-center">
          <img
            src="/logo.png"
            alt=""
            className="absolute top-[15px] left-[15px] h-5 w-auto"
          />
          <h1 className="absolute w-full flex flex-col items-center bottom-[15px] text-white text-2xl font-bold">
            <p>My Settings</p>
          </h1>
        </div>
        <div className="flex flex-col gap-2 flex-nowrap overflow-y-auto py-4 px-24 text-white">
          <div className="flex flex-row space-x-4 items-center">
            <Toggle index={0} onToggle={handleToggle} />
            <p className="text-lg">Twitter</p>
          </div>
          <div className="flex flex-row space-x-4 items-center">
            <Toggle index={1} onToggle={handleToggle} />
            <p className="text-lg">Instagram</p>
          </div>
          <div className="flex flex-row space-x-4 items-center">
            <Toggle index={2} onToggle={handleToggle} />
            <p className="text-lg">Discord</p>
          </div>
          <div className="flex flex-row space-x-4 items-center">
            <Toggle index={3} onToggle={handleToggle} />
            <p className="text-lg">Gmail</p>
          </div>
          <div className="flex flex-row space-x-4 items-center">
            <Toggle index={4} onToggle={handleToggle} />
            <p className="text-lg">Chatgpt</p>
          </div>
        </div>
      </div>
    </div>
  );
}
