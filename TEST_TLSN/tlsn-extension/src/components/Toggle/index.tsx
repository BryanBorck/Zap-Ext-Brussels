import React, { useEffect, useState } from 'react';
import { TOGGLE_STATE_LS_KEY, getList, setList } from '../../utils/storage';

interface ToggleProps {
  index: number;
  initialState?: boolean;
  onToggle?: (index: number, state: boolean) => void;
}

const Toggle: React.FC<ToggleProps> = ({
  index,
  initialState = false,
  onToggle,
}) => {
  const [isOn, setIsOn] = useState(initialState);

  useEffect(() => {
    getList(TOGGLE_STATE_LS_KEY).then((list) => {
      if (list.length > index) {
        setIsOn(list[index]);
      }
    });
  }, [index, TOGGLE_STATE_LS_KEY]);

  useEffect(() => {
    getList(TOGGLE_STATE_LS_KEY).then((list) => {
      list[index] = isOn;
      setList(TOGGLE_STATE_LS_KEY, list);
      if (onToggle) {
        onToggle(index, isOn);
      }
    });
  }, [isOn, index, TOGGLE_STATE_LS_KEY, onToggle]);

  const handleToggle = () => {
    setIsOn((prevState) => !prevState);
  };

  return (
    <div
      onClick={handleToggle}
      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer shadow-md border-[2px] ${
        isOn ? 'bg-greentheme border-white' : 'bg-white border-greentheme'
      }`}
    >
      <div
        className={`w-4 h-4 rounded-full shadow-md transform transition-transform ${
          isOn ? 'translate-x-5 bg-white' : 'bg-greentheme'
        }`}
      ></div>
    </div>
  );
};

export default Toggle;
