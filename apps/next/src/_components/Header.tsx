"use client";

import SessionMobileCount from "./SessionMobileCount";
import SessionsUI from "./SessionsUI";
import SessionTitleDisplay from "./SessionTitleDisplay";

function Timer() {
  return (
    <div className="flex w-screen flex-col-reverse px-10 pt-10 sm:mt-0 sm:h-[15vh] sm:w-full sm:flex-row sm:items-center sm:justify-between sm:px-[5vw]">
      <SessionsUI />
      <div className="mb-4 flex items-end justify-between sm:mb-1">
        <SessionTitleDisplay />
        <SessionMobileCount />
      </div>
    </div>
  );
}

export default Timer;