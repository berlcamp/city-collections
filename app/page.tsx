"use client";

import { Sidebar, MainSideBar, MainMenu } from "@/components/index";

export default function Page() {
  return (
    <>
      <Sidebar>
        <MainSideBar />
      </Sidebar>
      <div className="app__main">
        <MainMenu />
      </div>
    </>
  );
}
