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
    <div className="h-screen w-full pt-14 sm:pt-16 bg-base-200/50 overflow-hidden flex flex-col">
      <div className="flex-1 w-full max-w-7xl mx-auto flex min-h-0 overflow-hidden relative">
        {/* Sidebar / Conversation List */}
        <div className={`${hasSelectedChat ? "hidden lg:flex" : "flex"} w-full lg:w-96 h-full flex-col shrink-0 border-r border-base-300 bg-base-100`}>
          <Sidebar />
        </div>

        {/* Chat Area */}
        <div className={`${!hasSelectedChat ? "hidden lg:flex" : "flex"} flex-1 h-full min-w-0 bg-base-100`}>
          {!hasSelectedChat ? (
            <div className="hidden lg:flex flex-1">
               <NoSelectedUser />
            </div>
          ) : (
            <ChatContainer />
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
