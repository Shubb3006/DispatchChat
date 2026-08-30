import React from "react";
import { MessageSquare, Shield, CheckCheck, Folder, Radio, Truck } from "lucide-react";
import { useLanguageStore } from "../store/useLanguageStore";

const NoSelectedUser = () => {
  const { t } = useLanguageStore();

  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-8 sm:p-12 bg-base-200/30">
      <div className="max-w-md text-center space-y-8 fade-in">
        {/* Professional Logo Display */}
        <div className="flex justify-center">
          <div className="size-24 rounded-[2.5rem] bg-primary flex items-center justify-center shadow-2xl shadow-primary/20">
             <img src="/logo.png" className="size-14 object-contain" alt="Ozack" />
          </div>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="space-y-2">
          <h2 className="text-3xl font-black tracking-tighter uppercase">
            OZACK_CHAT
          </h2>
          <p className="text-sm font-medium opacity-40 uppercase tracking-widest px-8">
            Real-Time Fleet Intelligence & Communication
          </p>
        </div>

        {/* Professional Feature Pills Grid */}
        <div className="grid grid-cols-2 gap-3 pt-4">
          {[
            { icon: CheckCheck, color: "text-sky-500", title: "Read Receipts", sub: "WhatsApp Ticks" },
            { icon: Folder, color: "text-indigo-500", title: "Media Vault", sub: "PDF Scanning" },
            { icon: Radio, color: "text-amber-500", title: "Fleet Groups", sub: "Channel Based" },
            { icon: Shield, color: "text-emerald-500", title: "Secure Admin", sub: "Enterprise UI" }
          ].map((feat, idx) => (
            <div key={idx} className="p-4 rounded-3xl bg-base-100 border border-base-300/50 shadow-sm flex flex-col items-center text-center gap-2">
               <feat.icon className={`size-6 ${feat.color}`} />
               <div>
                  <div className="text-[11px] font-black uppercase tracking-tight">{feat.title}</div>
                  <div className="text-[9px] opacity-40 font-bold uppercase">{feat.sub}</div>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NoSelectedUser;
