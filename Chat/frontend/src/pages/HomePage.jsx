import React from "react";
import Sidebar from "../components/Sidebar";
import NoSelectedUser from "../components/NoSelectedUser";
import ChatContainer from "../components/ChatContainer";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";

const HomePage = () => {
  const { selectedUser } = useChatStore();
  const { selectedGroup } = useGroupStore();

  const hasSelectedChat = Boolean(selectedUser || selectedGroup);

  return (
    /* Full-bleed shell. This previously used `max-w-7xl mx-auto`, which capped
       the workspace at 1280px and left large dead margins on wide monitors. */
    <div className="h-screen w-full overflow-hidden bg-base-200 pt-14 sm:pt-16">
      <div className="relative flex h-full min-h-0 w-full overflow-hidden">
        {/* Conversation list */}
        <aside
          className={`${hasSelectedChat ? "hidden lg:flex" : "flex"}
            h-full w-full shrink-0 flex-col border-r border-base-300 bg-base-100
            lg:w-[340px] xl:w-[380px] 2xl:w-[420px]`}
        >
          <Sidebar />
        </aside>

        {/* Conversation surface */}
        <main
          className={`${!hasSelectedChat ? "hidden lg:flex" : "flex"}
            h-full min-w-0 flex-1 bg-base-200`}
        >
          {!hasSelectedChat ? <NoSelectedUser /> : <ChatContainer />}
        </main>
      </div>
    </div>
  );
};

export default HomePage;
