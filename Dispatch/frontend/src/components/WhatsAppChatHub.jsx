import { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Search,
  Send,
  Paperclip,
  CheckCheck,
  Phone,
  Video,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Shield,
  FileText,
  Image,
  RefreshCw,
  Lock,
  Info,
  Download,
  Trash2,
  UploadCloud,
  X,
  VideoOff,
  Mic,
  MicOff,
} from "lucide-react";

const FormatCargoOrLink = ({ text }) => {
  if (!text) return null;
  const str = String(text);
  const urlMatch = str.match(/(https?:\/\/[^\s]+)/gi);

  if (urlMatch && urlMatch[0]) {
    const rawUrl = urlMatch[0];
    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 my-1">
        <a
          href={rawUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-mono font-bold text-indigo-600 hover:text-indigo-800 underline break-all"
          title="Click to open or copy link"
        >
          {rawUrl}
        </a>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            window.open(rawUrl, "_blank");
          }}
          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-3xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
        >
          <span>👁 View Document</span>
        </button>
      </div>
    );
  }

  return <span>{str}</span>;
};

export default function WhatsAppChatHub({
  currentRole,
  currentUser,
  messages,
  onSendMessage,
  onMarkMessagesAsRead,
  shipments = [],
}) {
  const [viewingDocument, setViewingDocument] = useState(null);
  const [groups, setGroups] = useState([
    {
      id: "DRV001",
      name: "Marcus Vance Group Support",
      driverId: "DRV001",
      driverName: "Marcus Vance",
      truckNumber: "TRK-102",
      status: "normal",
      lastActivity: "2026-07-09T05:22:00-07:00",
      unreadCount: 0,
    },
    {
      id: "DRV002",
      name: "Sarah Jenkins Group Support",
      driverId: "DRV002",
      driverName: "Sarah Jenkins",
      truckNumber: "TRK-215",
      status: "active_issue",
      issueDescription:
        "Blaine Border commercial line backed up 45 mins. Requesting route change.",
      lastActivity: "2026-07-09T05:15:00-07:00",
      unreadCount: 2,
    },
    {
      id: "DRV003",
      name: "Rajesh Patel Group Support",
      driverId: "DRV003",
      driverName: "Rajesh Patel",
      truckNumber: "TRK-145",
      status: "active_issue",
      issueDescription: "Trailer tire pressure warning. Stopped at Flying J.",
      lastActivity: "2026-07-09T05:08:00-07:00",
      unreadCount: 1,
    },
    {
      id: "DRV004",
      name: "Alex Rodriguez Group Support",
      driverId: "DRV004",
      driverName: "Alex Rodriguez",
      truckNumber: "TRK-302",
      status: "active_issue",
      issueDescription:
        "HOS Driving limit near. Looking for overnight parking in Toledo.",
      lastActivity: "2026-07-09T04:55:00-07:00",
      unreadCount: 3,
    },
    {
      id: "DRV005",
      name: "Yuri Gromyko Group Support",
      driverId: "DRV005",
      driverName: "Yuri Gromyko",
      truckNumber: "TRK-188",
      status: "normal",
      lastActivity: "2026-07-09T04:12:00-07:00",
      unreadCount: 0,
    },
    {
      id: "DRV006",
      name: "Emily Chang Group Support",
      driverId: "DRV006",
      driverName: "Emily Chang",
      truckNumber: "TRK-405",
      status: "active_issue",
      issueDescription:
        "Customs manifest rejected by broker. Missing Importer IRS code.",
      lastActivity: "2026-07-09T03:40:00-07:00",
      unreadCount: 0,
    },
    {
      id: "DRV007",
      name: "David Miller Group Support",
      driverId: "DRV007",
      driverName: "David Miller",
      truckNumber: "TRK-122",
      status: "resolved",
      lastActivity: "2026-07-09T02:15:00-07:00",
      unreadCount: 0,
    },
    {
      id: "DRV008",
      name: "Linda Tremblay Group Support",
      driverId: "DRV008",
      driverName: "Linda Tremblay",
      truckNumber: "TRK-310",
      status: "normal",
      lastActivity: "2026-07-09T01:10:00-07:00",
      unreadCount: 0,
    },
    {
      id: "DRV009",
      name: "Carlos Santana Group Support",
      driverId: "DRV009",
      driverName: "Carlos Santana",
      truckNumber: "TRK-150",
      status: "normal",
      lastActivity: "2026-07-08T22:45:00-07:00",
      unreadCount: 0,
    },
    {
      id: "DRV010",
      name: "James Wilson Group Support",
      driverId: "DRV010",
      driverName: "James Wilson",
      truckNumber: "TRK-202",
      status: "resolved",
      lastActivity: "2026-07-08T20:30:00-07:00",
      unreadCount: 0,
    },
    {
      id: "DRV011",
      name: "Fatima Al-Fihri Group Support",
      driverId: "DRV011",
      driverName: "Fatima Al-Fihri",
      truckNumber: "TRK-245",
      status: "normal",
      lastActivity: "2026-07-08T18:15:00-07:00",
      unreadCount: 0,
    },
    {
      id: "DRV012",
      name: "Devendra Sharma Group Support",
      driverId: "DRV012",
      driverName: "Devendra Sharma",
      truckNumber: "TRK-119",
      status: "active_issue",
      issueDescription:
        "Hwy 402 closed due to multi-vehicle collision. Needs detour guidance.",
      lastActivity: "2026-07-08T17:02:00-07:00",
      unreadCount: 0,
    },
    {
      id: "DRV013",
      name: "Grace O'Malley Group Support",
      driverId: "DRV013",
      driverName: "Grace O'Malley",
      truckNumber: "TRK-305",
      status: "normal",
      lastActivity: "2026-07-08T15:40:00-07:00",
      unreadCount: 0,
    },
    {
      id: "DRV014",
      name: "Hans Schmidt Group Support",
      driverId: "DRV014",
      driverName: "Hans Schmidt",
      truckNumber: "TRK-290",
      status: "resolved",
      lastActivity: "2026-07-08T14:22:00-07:00",
      unreadCount: 0,
    },
    {
      id: "DRV015",
      name: "Chloe Dubois Group Support",
      driverId: "DRV015",
      driverName: "Chloe Dubois",
      truckNumber: "TRK-112",
      status: "normal",
      lastActivity: "2026-07-08T12:05:00-07:00",
      unreadCount: 0,
    },
    {
      id: "DRV016",
      name: "Kenji Tanaka Group Support",
      driverId: "DRV016",
      driverName: "Kenji Tanaka",
      truckNumber: "TRK-177",
      status: "active_issue",
      issueDescription:
        "Weight disparity. Shipper paperwork says 41,500 but scale says 44,000.",
      lastActivity: "2026-07-08T11:55:00-07:00",
      unreadCount: 0,
    },
    {
      id: "DRV017",
      name: "Nikolai Smirnov Group Support",
      driverId: "DRV017",
      driverName: "Nikolai Smirnov",
      truckNumber: "TRK-233",
      status: "normal",
      lastActivity: "2026-07-08T10:45:00-07:00",
      unreadCount: 0,
    },
    {
      id: "DRV018",
      name: "Isabella Rossi Group Support",
      driverId: "DRV018",
      driverName: "Isabella Rossi",
      truckNumber: "TRK-199",
      status: "normal",
      lastActivity: "2026-07-08T09:30:00-07:00",
      unreadCount: 0,
    },
    {
      id: "DRV019",
      name: "Samuel Adebayo Group Support",
      driverId: "DRV019",
      driverName: "Samuel Adebayo",
      truckNumber: "TRK-280",
      status: "active_issue",
      issueDescription:
        "Samsara terminal ELD error code ELD-404. Screen frozen.",
      lastActivity: "2026-07-08T08:15:00-07:00",
      unreadCount: 0,
    },
    {
      id: "DRV020",
      name: "Amara Diallo Group Support",
      driverId: "DRV020",
      driverName: "Amara Diallo",
      truckNumber: "TRK-255",
      status: "resolved",
      lastActivity: "2026-07-08T07:10:00-07:00",
      unreadCount: 0,
    },
  ]);
  const initialSelectedGroupId = currentRole === "driver" ? "DRV001" : "DRV002";
  const [selectedGroupId, setSelectedGroupId] = useState(
    initialSelectedGroupId
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [inputText, setInputText] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [mobileView, setMobileView] = useState("list");
  const [isDragging, setIsDragging] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(true);
  const [activeCall, setActiveCall] = useState(null);
  const [callTimerInterval, setCallTimerInterval] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatCanvasRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedGroupId]);
  useEffect(() => {
    if (selectedGroupId) {
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id === selectedGroupId) {
            return { ...g, unreadCount: 0 };
          }
          return g;
        })
      );
    }
  }, [selectedGroupId, messages.length]);
  useEffect(() => {
    if (activeCall) {
      const interval = setInterval(() => {
        setActiveCall((prev) =>
          prev ? { ...prev, duration: prev.duration + 1 } : null
        );
      }, 1e3);
      setCallTimerInterval(interval);
      return () => clearInterval(interval);
    } else {
      if (callTimerInterval) {
        clearInterval(callTimerInterval);
        setCallTimerInterval(null);
      }
    }
  }, [activeCall !== null]);
  const processFile = (file) => {
    const reader = new FileReader();
    if (file.type.startsWith("image/")) {
      reader.onload = (event) => {
        if (event.target?.result) {
          setAttachedFile({
            type: "photo",
            url: event.target.result,
            name:
              file.name && file.name !== "image.png"
                ? file.name
                : `Pasted_Screenshot_${/* @__PURE__ */ new Date()
                  .toISOString()
                  .slice(0, 10)}_${Math.floor(
                    1e3 + Math.random() * 9e3
                  )}.png`,
            size: `${(file.size / 1024).toFixed(0)} KB`,
          });
        }
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = (event) => {
        if (event.target?.result) {
          setAttachedFile({
            type: "document",
            url: event.target.result || "#",
            name: file.name,
            size: `${(file.size / 1024).toFixed(0)} KB`,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };
  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    let foundImage = false;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          processFile(file);
          foundImage = true;
          e.preventDefault();
        }
      }
    }
    if (foundImage) {
    }
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };
  const handleLocalFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };
  const triggerDeviceFileSelector = (type) => {
    setShowAttachmentMenu(false);
    if (fileInputRef.current) {
      fileInputRef.current.accept =
        type === "photo" ? "image/*" : ".pdf,.doc,.docx,.xls,.xlsx,.txt";
      fileInputRef.current.click();
    }
  };
  const filteredGroups = groups.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.truckNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || g.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const activeGroup = groups.find((g) => g.id === selectedGroupId);
  const [groupExtraMessages, setGroupExtraMessages] = useState({
    DRV002: [
      {
        id: "M_002_1",
        senderRole: "driver",
        senderName: "Sarah Jenkins",
        recipientId: "DISP_OFFICE",
        recipientName: "Chief Dispatcher Keith",
        content:
          "Hi dispatch, Blaine commercial truck lanes are completely locked up. Guard at the entrance says there is an IT outage at CBP.",
        timestamp: "2026-07-09T04:45:00-07:00",
        read: true,
        shipmentId: "SHP102",
      },
      {
        id: "M_002_2",
        senderRole: "dispatcher",
        senderName: "Chief Dispatcher Keith",
        recipientId: "DRV002",
        recipientName: "Sarah Jenkins",
        content:
          "Sarah, we are reviewing. CBP systems appear slow. Sophia is checking with broker. Sit tight, do not shut off Samsara tracker.",
        timestamp: "2026-07-09T04:52:00-07:00",
        read: true,
        shipmentId: "SHP102",
      },
      {
        id: "M_002_3",
        senderRole: "driver",
        senderName: "Sarah Jenkins",
        recipientId: "DISP_OFFICE",
        recipientName: "Chief Dispatcher Keith",
        content:
          "Sarah here, it has now been 45 minutes and I have only moved 3 truck lengths. Should I divert to Lynden crossing?",
        timestamp: "2026-07-09T05:15:00-07:00",
        read: false,
        shipmentId: "SHP102",
      },
    ],
    DRV003: [
      {
        id: "M_003_1",
        senderRole: "driver",
        senderName: "Rajesh Patel",
        recipientId: "DISP_OFFICE",
        recipientName: "Chief Dispatcher Keith",
        content:
          "Keith, trailer tire warning just popped on dash. PSI is down to 78 on right middle axle. I am pulling off at exit 218 London.",
        timestamp: "2026-07-09T05:00:00-07:00",
        read: true,
        shipmentId: "SHP103",
      },
      {
        id: "M_003_2",
        senderRole: "dispatcher",
        senderName: "Sophia Chen",
        recipientId: "DRV003",
        recipientName: "Rajesh Patel",
        content:
          "Copy that Rajesh, good call. Safest to check it at the Pilot Flying J. Let us know if you see a nail or split.",
        timestamp: "2026-07-09T05:08:00-07:00",
        read: false,
        shipmentId: "SHP103",
      },
    ],
    DRV004: [
      {
        id: "M_004_1",
        senderRole: "driver",
        senderName: "Alex Rodriguez",
        recipientId: "DISP_OFFICE",
        recipientName: "Chief Dispatcher Keith",
        content:
          "Samsara HOS alert says I have 42 minutes driving left. Toledo traffic is brutal. Need dispatch to help book or locate secure overnight parking.",
        timestamp: "2026-07-09T04:30:00-07:00",
        read: true,
        shipmentId: "SHP104",
      },
      {
        id: "M_004_2",
        senderRole: "dispatcher",
        senderName: "Emily Brown",
        recipientId: "DRV004",
        recipientName: "Alex Rodriguez",
        content:
          "Alex, Keith is checking with the TA Travel Center near exit 198. They usually have reserved paid spots. Hang in there.",
        timestamp: "2026-07-09T04:42:00-07:00",
        read: true,
        shipmentId: "SHP104",
      },
      {
        id: "M_004_3",
        senderRole: "driver",
        senderName: "Alex Rodriguez",
        recipientId: "DISP_OFFICE",
        recipientName: "Chief Dispatcher Keith",
        content:
          "Are we authorized for paid reservation parking? I do not want this blocked on my expense audit.",
        timestamp: "2026-07-09T04:55:00-07:00",
        read: false,
        shipmentId: "SHP104",
      },
    ],
    DRV006: [
      {
        id: "M_006_1",
        senderRole: "driver",
        senderName: "Emily Chang",
        recipientId: "DISP_OFFICE",
        recipientName: "Chief Dispatcher Keith",
        content:
          "Dispatch, custom broker emailed saying the manifest BC-9908 was rejected by US customs due to missing Importer Tax ID. Please resubmit.",
        timestamp: "2026-07-09T03:30:00-07:00",
        read: true,
      },
      {
        id: "M_006_2",
        senderRole: "dispatcher",
        senderName: "Keith Donnelly",
        recipientId: "DRV006",
        recipientName: "Emily Chang",
        content:
          "Looking into this Emily. I have sent the importer a priority message asking for their IRS EIN number. Will resubmit as soon as we get it.",
        timestamp: "2026-07-09T03:40:00-07:00",
        read: true,
      },
    ],
  });
  const getActiveMessages = () => {
    const mainMessages = messages.filter(
      (m) =>
        m.recipientId === selectedGroupId ||
        m.senderName === activeGroup?.driverName ||
        (m.recipientId === "DISP_OFFICE" &&
          m.senderName === activeGroup?.driverName)
    );
    const extras = groupExtraMessages[selectedGroupId] || [];
    return [...extras, ...mainMessages].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  };
  const activeMessages = getActiveMessages();
  const sharedAttachments = activeMessages
    .filter((m) => m.attachment)
    .map((m) => ({
      id: m.id,
      sender: m.senderName,
      timestamp: m.timestamp,
      ...m.attachment,
    }));
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() && !attachedFile) return;
    const attachmentObj = attachedFile
      ? {
        type: attachedFile.type,
        url: attachedFile.url,
        name: attachedFile.name,
        size: attachedFile.size,
      }
      : void 0;
    onSendMessage(inputText, selectedGroupId, "SHP101", attachmentObj);
    setInputText("");
    setAttachedFile(null);
  };
  const handleResolveIssue = () => {
    if (!activeGroup) return;
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === selectedGroupId) {
          return { ...g, status: "resolved" };
        }
        return g;
      })
    );
    const resolverName = currentUser.name;
    const resolverRole = currentRole.toUpperCase();
    onSendMessage(
      `\u{1F7E2} SYSTEM RESOLUTION: ${resolverName} (${resolverRole}) investigated and marked this issue as RESOLVED. Support channel set to Normal.`,
      selectedGroupId,
      "SHP101"
    );
  };
  const handleQuickReply = (text) => {
    onSendMessage(text, selectedGroupId, "SHP101");
  };
  const handleAttachSimulatedFile = (type) => {
    setShowAttachmentMenu(false);
    if (type === "photo") {
      setAttachedFile({
        type: "photo",
        url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=600",
        name: "TRAILER_TIRE_PSI_CHECK.JPG",
        size: "185 KB",
      });
    } else {
      setAttachedFile({
        type: "document",
        url: "#",
        name: "REVISED_BOL_MANIFEST_9018.PDF",
        size: "412 KB",
      });
    }
  };
  const triggerDriverSimulatedReply = () => {
    if (!activeGroup) return;
    const driverResponses = [
      "Copy that, reading your update now.",
      "Understood. Continuing transit as planned.",
      "Just pulled onto the highway shoulder. Paperwork looks correct.",
      "Thanks for resolving this, dispatch! Lifesaver.",
      "Perfect. Loading docks just cleared my truck. Departing now.",
      "ELD seems back to normal after soft reboot. Thanks safety team!",
      "I have uploaded the new scale ticket. Please check in dispatch console.",
    ];
    const randomResp =
      driverResponses[Math.floor(Math.random() * driverResponses.length)];
    const newMsg = {
      id: "M_SIM_" + Date.now(),
      senderRole: "driver",
      senderName: activeGroup.driverName,
      recipientId: "DISP_OFFICE",
      recipientName: currentUser.name,
      content: randomResp,
      timestamp: /* @__PURE__ */ new Date().toISOString(),
      read: false,
    };
    setGroupExtraMessages((prev) => {
      const existing = prev[selectedGroupId] || [];
      return {
        ...prev,
        [selectedGroupId]: [...existing, newMsg],
      };
    });
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === selectedGroupId) {
          return {
            ...g,
            lastActivity: /* @__PURE__ */ new Date().toISOString(),
            unreadCount: currentRole === "dispatcher" ? g.unreadCount + 1 : 0,
          };
        }
        return g;
      })
    );
  };
  const getSenderColorClass = (role, name) => {
    if (role === "driver") return "text-emerald-600";
    if (name.includes("Keith")) return "text-indigo-600";
    if (name.includes("Sophia")) return "text-purple-600";
    if (name.includes("Emily")) return "text-pink-600";
    return "text-sky-600";
  };
  const activeShipment = shipments.find(
    (s) => s.driverId === activeGroup?.driverId
  );
  const handleStartCall = (type) => {
    setActiveCall({
      type,
      duration: 0,
      muted: false,
      cameraOff: false,
    });
  };
  return (
    <div
      id="whatsapp-fleet-hub"
      onPaste={handlePaste}
      onDragOver={handleDragOver}
      className="bg-[#111b21] rounded-2xl border border-slate-800 overflow-hidden flex h-[620px] shadow-2xl font-sans text-[#e9edef] relative"
    >
      {/* Hidden native file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleLocalFileChange}
        className="hidden"
      />

      {/* Drag Over File Upload Area Overlay */}
      {isDragging && (
        <div
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="absolute inset-0 bg-[#0b141a]/85 backdrop-blur-xs flex flex-col items-center justify-center text-white z-50 border-4 border-dashed border-emerald-500 m-3 rounded-2xl transition-all"
        >
          <UploadCloud className="h-16 w-16 mb-4 text-emerald-500 animate-bounce" />
          <h4 className="text-lg font-bold font-sans text-emerald-400">
            Drag & Drop Support File
          </h4>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Release to attach photo or document directly to this driver chat.
          </p>
        </div>
      )}

      {/* ACTIVE CALL VIEW MODAL */}
      {activeCall && (
        <div className="absolute inset-0 bg-[#0b141a]/95 backdrop-blur-md z-50 flex flex-col items-center justify-between p-8 text-center animate-fade-in">
          {/* Header */}
          <div className="w-full flex items-center justify-between text-xs text-slate-400 font-mono">
            <div className="flex items-center space-x-1.5 text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold tracking-wider">
                SECURE SATELLITE UPLINK ACTIVE
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Shield className="h-3.5 w-3.5 text-slate-400" />
              <span>AES-256 ENCRYPTED</span>
            </div>
          </div>

          {/* Center Call screen */}
          <div className="space-y-6 my-auto">
            <div className="relative inline-block">
              {/* Pulsing visual waves */}
              <span className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping scale-150" />
              <span className="absolute inset-0 rounded-full bg-indigo-500/15 animate-pulse scale-125" />
              <div className="h-28 w-28 rounded-full bg-slate-800 text-white font-black text-3xl flex items-center justify-center border-4 border-[#202c33] shadow-xl relative z-10 mx-auto">
                {activeGroup?.driverName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-white tracking-wide">
                {activeGroup?.driverName}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Samsara Terminal #{activeGroup?.truckNumber || "TRK-ELD"}
              </p>

              <div className="px-3 py-1 bg-[#202c33] rounded-full text-xs font-bold font-mono text-emerald-400 inline-flex items-center space-x-1.5 mx-auto mt-2">
                {activeCall.type === "video" ? (
                  <Video className="h-3 w-3 animate-pulse" />
                ) : (
                  <Phone className="h-3 w-3 animate-pulse" />
                )}
                <span>
                  {activeCall.duration === 0
                    ? "Connecting Support Voice..."
                    : `On Call: ${Math.floor(activeCall.duration / 60)}:${(
                      activeCall.duration % 60
                    )
                      .toString()
                      .padStart(2, "0")}`}
                </span>
              </div>
            </div>

            {/* Fake voice frequency visualizer wave */}
            <div className="flex items-center justify-center space-x-1 h-8">
              {[...Array(12)].map((_, idx) => (
                <span
                  key={idx}
                  className="w-1 bg-gradient-to-t from-emerald-500 to-indigo-500 rounded-full animate-pulse"
                  style={{
                    height: `${Math.floor(Math.random() * 32) + 4}px`,
                    animationDelay: `${idx * 150}ms`,
                    animationDuration: `${Math.floor(Math.random() * 800) + 400
                      }ms`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-center space-x-5">
            <button
              onClick={() =>
                setActiveCall((prev) =>
                  prev ? { ...prev, muted: !prev.muted } : null
                )
              }
              className={`p-4 rounded-full transition-all cursor-pointer ${activeCall.muted
                ? "bg-rose-600 text-white"
                : "bg-[#202c33] text-slate-300 hover:bg-[#2a3942]"
                }`}
              title={activeCall.muted ? "Unmute Mic" : "Mute Mic"}
            >
              {activeCall.muted ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </button>

            {activeCall.type === "video" && (
              <button
                onClick={() =>
                  setActiveCall((prev) =>
                    prev ? { ...prev, cameraOff: !prev.cameraOff } : null
                  )
                }
                className={`p-4 rounded-full transition-all cursor-pointer ${activeCall.cameraOff
                  ? "bg-rose-600 text-white"
                  : "bg-[#202c33] text-slate-300 hover:bg-[#2a3942]"
                  }`}
                title={activeCall.cameraOff ? "Enable Video" : "Disable Video"}
              >
                {activeCall.cameraOff ? (
                  <VideoOff className="h-5 w-5" />
                ) : (
                  <Video className="h-5 w-5" />
                )}
              </button>
            )}

            <button
              onClick={() => setActiveCall(null)}
              className="p-4 bg-rose-600 hover:bg-rose-500 text-white rounded-full transition-all cursor-pointer active:scale-95 shadow-lg shadow-rose-950/50"
              title="Hang Up Call"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* SIDEBAR: GROUPS DIRECTORY */}
      <div
        className={`w-full md:w-80 lg:w-88 border-r border-[#202c33] bg-[#111b21] flex flex-col shrink-0 ${mobileView === "chat" ? "hidden md:flex" : "flex"
          }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 bg-[#202c33] flex items-center justify-between border-b border-[#2a3942]">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center border-2 border-indigo-400 shadow-md">
              {currentUser?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div>
              <h2 className="text-xs font-bold leading-none text-[#e9edef]">
                {currentUser.name}
              </h2>
              <span className="text-[10px] text-emerald-400 font-mono tracking-wider uppercase font-extrabold flex items-center gap-1 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {currentRole === "dispatcher"
                  ? "CHIEF DISPATCH"
                  : "SUPPORT CONSOLE"}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-1.5">
            <span
              title="Samsara Secure Uplink Active"
              className="flex items-center px-2 py-1 bg-[#182229] border border-[#2a3942] text-slate-400 font-mono text-[9px] rounded-md gap-1"
            >
              <span>Secure</span>
            </span>
          </div>
        </div>

        {/* Search Fleet Box */}
        <div className="p-3 bg-[#111b21] space-y-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8696a0]" />
            <input
              type="text"
              placeholder="Search driver support channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#202c33] text-[#e9edef] border-none rounded-lg py-1.5 pl-10 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-[#8696a0] font-medium"
            />
          </div>

          {/* Group Filters */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 select-none scrollbar-none">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-2.5 py-1 text-3xs font-black uppercase tracking-wider rounded-md border transition-all shrink-0 cursor-pointer ${statusFilter === "all"
                ? "bg-emerald-600 text-white border-emerald-500"
                : "bg-[#202c33] text-[#8696a0] border-transparent hover:bg-[#2a3942] hover:text-[#e9edef]"
                }`}
            >
              All ({groups.length})
            </button>
            <button
              onClick={() => setStatusFilter("active_issue")}
              className={`px-2.5 py-1 text-3xs font-black uppercase tracking-wider rounded-md border flex items-center space-x-1 shrink-0 transition-all cursor-pointer ${statusFilter === "active_issue"
                ? "bg-rose-600 text-white border-rose-500"
                : "bg-rose-950/20 text-rose-400 border-rose-900/40 hover:bg-rose-950/40"
                }`}
            >
              <AlertTriangle className="h-2.5 w-2.5" />
              <span>
                Issues (
                {groups.filter((g) => g.status === "active_issue").length})
              </span>
            </button>
            <button
              onClick={() => setStatusFilter("resolved")}
              className={`px-2.5 py-1 text-3xs font-black uppercase tracking-wider rounded-md border flex items-center space-x-1 shrink-0 transition-all cursor-pointer ${statusFilter === "resolved"
                ? "bg-indigo-600 text-white border-indigo-500"
                : "bg-indigo-950/20 text-indigo-400 border-indigo-900/40 hover:bg-indigo-950/40"
                }`}
            >
              <CheckCircle2 className="h-2.5 w-2.5" />
              <span>Fixed</span>
            </button>
            <button
              onClick={() => setStatusFilter("normal")}
              className={`px-2.5 py-1 text-3xs font-black uppercase tracking-wider rounded-md border transition-all shrink-0 cursor-pointer ${statusFilter === "normal"
                ? "bg-slate-700 text-white border-slate-600"
                : "bg-[#202c33] text-[#8696a0] border-transparent hover:bg-[#2a3942]"
                }`}
            >
              Normal
            </button>
          </div>
        </div>

        {/* Directory List of Groups */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#202c33] bg-[#111b21] scrollbar-none">
          {filteredGroups.length === 0 ? (
            <div className="p-8 text-center text-[#8696a0] text-2xs space-y-2">
              <MessageSquare className="h-6 w-6 mx-auto text-[#2a3942]" />
              <span>No active support groups matched.</span>
            </div>
          ) : (
            filteredGroups.map((group) => {
              const isActive = group.id === selectedGroupId;
              const hasUnread = group.unreadCount > 0;
              const groupExtras = groupExtraMessages[group.id] || [];
              const groupMains = messages.filter(
                (m) =>
                  m.recipientId === group.id ||
                  m.senderName === group.driverName
              );
              const allGroupMsgs = [...groupExtras, ...groupMains].sort(
                (a, b) =>
                  new Date(a.timestamp).getTime() -
                  new Date(b.timestamp).getTime()
              );
              const lastMsg = allGroupMsgs[allGroupMsgs.length - 1];
              return (
                <div
                  key={group.id}
                  id={`chat-group-item-${group.id}`}
                  onClick={() => {
                    setSelectedGroupId(group.id);
                    setMobileView("chat");
                  }}
                  className={`p-3 flex gap-3 cursor-pointer select-none transition-all border-l-4 ${isActive
                    ? "bg-[#2a3942] border-emerald-500"
                    : "hover:bg-[#202c33] border-transparent"
                    }`}
                >
                  {/* Group Icon with Status Glow */}
                  <div className="relative shrink-0">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs text-white border ${group.status === "active_issue"
                        ? "bg-gradient-to-tr from-rose-600 to-amber-500 border-rose-400/40 shadow-lg shadow-rose-950/50"
                        : group.status === "resolved"
                          ? "bg-gradient-to-tr from-emerald-600 to-indigo-500 border-emerald-400/40"
                          : "bg-gradient-to-tr from-slate-600 to-slate-800 border-slate-700"
                        }`}
                    >
                      {group.driverName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>

                    {/* Status dot overlay */}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#111b21] flex items-center justify-center text-[8px] font-black text-white ${group.status === "active_issue"
                        ? "bg-rose-500"
                        : group.status === "resolved"
                          ? "bg-emerald-500"
                          : "bg-slate-400"
                        }`}
                    >
                      {group.status === "active_issue"
                        ? "!"
                        : group.status === "resolved"
                          ? "\u2713"
                          : "\u2022"}
                    </span>
                  </div>

                  {/* Group Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#e9edef] truncate">
                        {group.driverName}
                      </span>
                      <span className="text-[9px] text-[#8696a0] font-mono shrink-0">
                        {lastMsg
                          ? new Date(lastMsg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                          : ""}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-0.5">
                      <p
                        className={`text-[10px] truncate max-w-[170px] ${hasUnread
                          ? "text-[#e9edef] font-bold"
                          : "text-[#8696a0]"
                          }`}
                      >
                        {group.status === "active_issue" && (
                          <span className="text-rose-500 font-extrabold mr-1 font-mono uppercase text-[9px]">
                            [ISSUE]
                          </span>
                        )}
                        {lastMsg
                          ? lastMsg.content
                          : `Group chat opened for vehicle ${group.truckNumber}...`}
                      </p>

                      {/* Green WhatsApp style unread bubble */}
                      {hasUnread && (
                        <span className="h-4 min-w-[16px] px-1 bg-emerald-500 text-[#111b21] rounded-full flex items-center justify-center text-[8px] font-extrabold shrink-0 animate-pulse">
                          {group.unreadCount}
                        </span>
                      )}
                    </div>

                    {/* Vehicle Metadata Line */}
                    <div className="flex items-center space-x-1.5 mt-1 font-mono text-[8px] text-[#8696a0] font-bold uppercase">
                      <span className="bg-[#202c33] px-1.5 py-0.2 rounded text-slate-300">
                        TRK: {group.truckNumber}
                      </span>
                      <span>•</span>
                      <span
                        className={`${group.status === "active_issue"
                          ? "text-rose-400 animate-pulse"
                          : "text-base-content"
                          }`}
                      >
                        {group.status === "active_issue"
                          ? "\u{1F6A8} SUPPORT CRITICAL"
                          : group.status === "resolved"
                            ? "\u2705 COMPLIANT"
                            : "ONLINE"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Info Banner */}
        <div className="p-2 bg-[#0b141a] text-base-content text-[8px] font-mono border-t border-[#202c33] text-center uppercase tracking-wider">
          ACTIVE DISPATCH TERMINAL UPLINK SECURE
        </div>
      </div>

      {/* MAIN: CHAT HUB WINDOW */}
      <div
        className={`flex-1 flex flex-col bg-[#0b141a] relative ${mobileView === "list" ? "hidden md:flex" : "flex"
          }`}
      >
        {!activeGroup ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#222e35]/30 p-8 text-center space-y-4">
            <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center animate-[bounce_2s_infinite]">
              <MessageSquare className="h-8 w-8" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h3 className="text-sm font-bold text-[#e9edef] uppercase tracking-wide">
                Secure WhatsApp Dispatch Hub
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Select a driver support channel from the directory. Monitor
                telematics, investigate HOS log violations, and share digital
                documents in real-time.
              </p>
            </div>
            <div className="flex items-center space-x-1.5 text-[9px] text-base-content font-mono uppercase tracking-widest bg-[#111b21] px-3 py-1 rounded-full border border-slate-800">
              <Lock className="h-3 w-3 text-emerald-500 shrink-0" />
              <span>Samsara Fleet-End Encrypted</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-row h-full overflow-hidden relative">
            {/* CHAT BUBBLES SECTION */}
            <div className="flex-1 flex flex-col h-full bg-[#0b141a] border-r border-[#202c33] justify-between overflow-hidden">
              {/* Active Group Header */}
              <div className="px-4 py-3 bg-[#202c33] border-b border-[#2a3942] flex items-center justify-between shrink-0 z-10">
                <div className="flex items-center space-x-3 min-w-0">
                  <button
                    onClick={() => setMobileView("list")}
                    className="md:hidden p-1 text-slate-400 hover:text-white mr-1 cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>

                  <div
                    onClick={() => setShowInfoPanel(!showInfoPanel)}
                    className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 cursor-pointer transition-transform hover:scale-105 ${activeGroup.status === "active_issue"
                      ? "bg-rose-600"
                      : activeGroup.status === "resolved"
                        ? "bg-emerald-600"
                        : "bg-indigo-600"
                      }`}
                  >
                    {activeGroup.driverName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>

                  <div className="min-w-0">
                    <h3
                      onClick={() => setShowInfoPanel(!showInfoPanel)}
                      className="text-xs font-bold leading-none text-[#e9edef] truncate flex items-center gap-1.5 cursor-pointer hover:text-emerald-400 transition-colors"
                    >
                      <span>{activeGroup.driverName} Group Chat</span>
                      <span className="text-[8px] bg-[#111b21] text-slate-300 border border-slate-800 px-1 py-0.2 rounded font-mono">
                        {activeGroup.truckNumber}
                      </span>
                    </h3>
                    <span className="text-[9px] text-[#8696a0] truncate block mt-1 font-mono">
                      Duty:{" "}
                      <span className="text-emerald-400 font-bold">
                        Active Driver
                      </span>{" "}
                      • Keith, Sophia, Emily online
                    </span>
                  </div>
                </div>

                {/* Right Header Action Buttons */}
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleStartCall("voice")}
                    className="p-2 text-[#8696a0] hover:text-[#e9edef] rounded-full hover:bg-[#2a3942] cursor-pointer transition-colors"
                    title="Initiate Secure Voice Call to ELD Terminal"
                  >
                    <Phone className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleStartCall("video")}
                    className="p-2 text-[#8696a0] hover:text-[#e9edef] rounded-full hover:bg-[#2a3942] cursor-pointer transition-colors"
                    title="Initiate Secure Video Uplink"
                  >
                    <Video className="h-4 w-4" />
                  </button>

                  <span className="w-px h-5 bg-[#2a3942]" />

                  <button
                    onClick={() => setShowInfoPanel(!showInfoPanel)}
                    className={`p-2 rounded-full hover:bg-[#2a3942] cursor-pointer transition-colors ${showInfoPanel
                      ? "text-emerald-400"
                      : "text-[#8696a0] hover:text-[#e9edef]"
                      }`}
                    title="Toggle Support Channel Insights Panel"
                  >
                    <Info className="h-4 w-4" />
                  </button>

                  {/* Simulator Reply button */}
                  <button
                    type="button"
                    onClick={triggerDriverSimulatedReply}
                    title="Simulate driver replying in sandboxed channel"
                    className="flex items-center space-x-1 px-2.5 py-1 bg-indigo-600/30 border border-indigo-500/30 hover:bg-indigo-600/50 rounded-lg text-[9px] font-mono font-bold tracking-tight text-indigo-300 cursor-pointer ml-1"
                  >
                    <RefreshCw className="h-3 w-3 animate-[spin_8s_linear_infinite]" />
                    <span className="hidden sm:inline">Simulate Reply</span>
                  </button>
                </div>
              </div>

              {/* CRITICAL ISSUE DESCRIPTOR BANNER */}
              {activeGroup.status === "active_issue" &&
                activeGroup.issueDescription && (
                  <div className="px-4 py-2 bg-rose-950/20 border-b border-rose-900/30 flex items-start space-x-3 text-rose-200 shadow-inner shrink-0">
                    <AlertTriangle className="h-4.5 w-4.5 text-rose-500 mt-0.5 shrink-0 animate-pulse" />
                    <div className="flex-1 min-w-0">
                      <span className="font-black font-mono uppercase tracking-wide text-rose-400 text-[8px] block">
                        CRITICAL ACTIVE INCIDENT REPORT:
                      </span>
                      <p className="font-semibold text-slate-300 leading-normal mt-0.5 text-3xs sm:text-2xs truncate md:whitespace-normal">
                        {activeGroup.issueDescription}
                      </p>
                    </div>
                    {currentRole === "dispatcher" && (
                      <button
                        onClick={handleResolveIssue}
                        className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-[#111b21] rounded text-[9px] font-black cursor-pointer transition-all uppercase shrink-0 shadow-lg"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                )}

              {/* WHATSAPP CHAT CANVAS / MESSAGE BUBBLES */}
              <div
                ref={chatCanvasRef}
                className="flex-1 p-4 overflow-y-auto space-y-4 relative scrollbar-none"
                style={{
                  backgroundColor: "#0b141a",
                  backgroundImage: `radial-gradient(#182229 1px, transparent 1px), radial-gradient(#182229 1px, #0b141a 1px)`,
                  backgroundSize: "24px 24px",
                  backgroundPosition: "0 0, 12px 12px",
                }}
              >
                {/* Encrypted Disclaimer */}
                <div className="max-w-xs mx-auto bg-[#182229] border border-[#2a3942]/60 text-[#8696a0] text-[8px] py-1 px-3 rounded-lg text-center font-mono leading-relaxed shadow-md uppercase tracking-wider">
                  🔒 Secure satellite uplink established. Telematics & logs
                  synced. Paste screenshots or drag documents anytime.
                </div>

                {activeMessages.map((msg, index) => {
                  const isMyMessage = msg.senderRole === currentRole;
                  const isSystem =
                    msg.content.includes("\u{1F7E2} SYSTEM RESOLUTION") ||
                    msg.content.includes("SYSTEM:");
                  if (isSystem) {
                    return (
                      <div
                        key={msg.id}
                        className="max-w-md mx-auto bg-[#182229] border border-emerald-500/20 text-emerald-400 text-[9px] font-bold py-1.5 px-4 rounded-lg text-center font-mono leading-normal shadow-md"
                      >
                        {msg.content}
                      </div>
                    );
                  }
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMyMessage ? "items-end" : "items-start"
                        } animate-fade-in`}
                    >
                      {/* Message Bubble Container */}
                      <div
                        className={`max-w-[75%] rounded-2xl px-3.5 py-2 shadow-md relative ${isMyMessage
                          ? "bg-[#005c4b] text-[#e9edef] rounded-tr-none"
                          : "bg-[#202c33] text-[#e9edef] rounded-tl-none"
                          }`}
                      >
                        {/* Sender Name block above text (Group Chat visual style) */}
                        {!isMyMessage && (
                          <span
                            className={`block text-[9px] font-black font-mono mb-1 leading-none tracking-wide uppercase ${getSenderColorClass(
                              msg.senderRole,
                              msg.senderName
                            )}`}
                          >
                            {msg.senderName} •{" "}
                            {msg.senderRole.replace("_", " ").toUpperCase()}
                          </span>
                        )}

                        {/* Content text */}
                        {msg.content && (
                          <p className="leading-relaxed text-xs font-medium whitespace-pre-wrap font-sans text-slate-100">
                            {msg.content}
                          </p>
                        )}

                        {/* Render attachment */}
                        {msg.attachment && (
                          <div
                            onClick={() => {
                              if (msg.attachment.url && msg.attachment.url.startsWith("http")) {
                                window.open(msg.attachment.url, "_blank");
                              } else {
                                setViewingDocument(msg.attachment);
                              }
                            }}
                            className={`mt-2 p-2 rounded-xl border text-2xs overflow-hidden cursor-pointer transition-all hover:opacity-95 hover:scale-[1.01] ${isMyMessage
                              ? "bg-[#004e3f]/90 border-[#027e66]/50 text-slate-100 shadow-sm"
                              : "bg-[#182229] border-[#2a3942] text-slate-100 shadow-sm"
                              }`}
                            title="Click to view/open document"
                          >
                            {msg.attachment.type === "photo" ? (
                              <div className="space-y-1 group/item">
                                <div className="relative overflow-hidden rounded-lg">
                                  <img
                                    src={msg.attachment.url}
                                    alt={msg.attachment.name}
                                    className="rounded-lg max-h-44 object-cover w-full transition-transform hover:scale-102"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <div className="flex items-center justify-between text-[8px] text-slate-300 font-mono mt-1 px-1">
                                  <span
                                    className="truncate max-w-[150px] font-bold"
                                    title={msg.attachment.name}
                                  >
                                    🖼️ {msg.attachment.name}
                                  </span>
                                  <span className="shrink-0 font-bold bg-[#111b21] px-1.5 py-0.5 rounded text-emerald-400">
                                    Click to Expand 👁
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-3 py-1 px-1">
                                <div className="flex items-center space-x-2 min-w-0">
                                  <div className="p-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg">
                                    <FileText className="h-5 w-5 shrink-0" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-mono truncate font-bold text-white text-xs">
                                      {msg.attachment.name}
                                    </p>
                                    <span className="text-[9px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                                      ● Digital BOL Document (Click to Open)
                                    </span>
                                  </div>
                                </div>
                                <span className="text-[9px] font-mono text-emerald-300 bg-[#111b21] px-2 py-1 rounded-lg border border-emerald-500/30 font-extrabold flex items-center space-x-1">
                                  <span>View</span>
                                  <span>👁</span>
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Bottom Metadata (Time + ticks) */}
                        <div className="flex items-center justify-end space-x-1 mt-1.5 leading-none">
                          <span className="text-[8px] text-[#8696a0] font-mono font-bold uppercase">
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {isMyMessage && (
                            <span className="shrink-0">
                              <CheckCheck className="h-3 w-3 text-[#53bdeb] font-bold" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* ATTACHMENT SELECTION PREVIEW BAR */}
              {attachedFile && (
                <div className="px-4 py-2 bg-[#182229] border-t border-[#2a3942] flex items-center justify-between text-2xs text-[#e9edef] font-mono z-10 animate-fade-in shrink-0">
                  <div className="flex items-center space-x-2 min-w-0">
                    {attachedFile.type === "photo" ? (
                      <div className="h-10 w-10 rounded border border-slate-700 overflow-hidden bg-slate-800 shrink-0">
                        <img
                          src={attachedFile.url}
                          className="h-full w-full object-cover"
                          alt="Preview Thumbnail"
                        />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded border border-slate-700 bg-slate-800 shrink-0 flex items-center justify-center text-[#8696a0]">
                        <FileText className="h-5 w-5 text-indigo-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="font-bold text-slate-200 truncate block text-3xs sm:text-2xs">
                        {attachedFile.name}
                      </span>
                      <span className="text-slate-400 text-[9px] font-mono font-black uppercase">
                        📎 ready to submit ({attachedFile.size})
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachedFile(null)}
                    className="text-slate-400 hover:text-rose-500 font-bold p-2 hover:bg-[#202c33] rounded-full transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* QUICK ACTION REPLIES */}
              <div className="px-3 py-1.5 bg-[#1f2c34] border-t border-[#2a3942] flex items-center gap-1.5 overflow-x-auto select-none shrink-0 scrollbar-none">
                <span className="text-[8px] font-black text-slate-400 font-mono shrink-0 uppercase tracking-widest mr-1">
                  PRESETS:
                </span>

                {currentRole === "dispatcher" ? (
                  <>
                    <button
                      onClick={() =>
                        handleQuickReply(
                          "PAPS border manifest is SUBMITTED and APPROVED. You are cleared to cross."
                        )
                      }
                      className="px-2.5 py-1 bg-[#2a3942] hover:bg-[#374955] text-emerald-400 font-mono text-[9px] font-extrabold rounded border border-[#2a3942] shrink-0 cursor-pointer transition-all"
                    >
                      🚀 Border approved
                    </button>
                    <button
                      onClick={() =>
                        handleQuickReply(
                          "Customs broker notified. Resubmitting revised paperwork. Please standby."
                        )
                      }
                      className="px-2.5 py-1 bg-[#2a3942] hover:bg-[#374955] text-[#8696a0] hover:text-[#e9edef] font-mono text-[9px] font-extrabold rounded border border-[#2a3942] shrink-0 cursor-pointer transition-all"
                    >
                      📝 Resubmitting manifest
                    </button>
                    <button
                      onClick={() =>
                        handleQuickReply(
                          "Weather alert: Heavy lake-effect snow down I-94. Alternate route recommended."
                        )
                      }
                      className="px-2.5 py-1 bg-[#2a3942] hover:bg-[#374955] text-amber-400 font-mono text-[9px] font-extrabold rounded border border-[#2a3942] shrink-0 cursor-pointer transition-all"
                    >
                      ❄️ Weather warning
                    </button>
                    <button
                      onClick={() =>
                        handleQuickReply(
                          "Axle weights look legal on CAT Scale receipt. Proceed to delivery."
                        )
                      }
                      className="px-2.5 py-1 bg-[#2a3942] hover:bg-[#374955] text-indigo-400 font-mono text-[9px] font-extrabold rounded border border-[#2a3942] shrink-0 cursor-pointer transition-all"
                    >
                      ⚖️ Weights look legal
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() =>
                        handleQuickReply(
                          "Sarnia Blue Water Bridge crossed. Checked in at US CBP Booth #4. Clear to Chicago."
                        )
                      }
                      className="px-2.5 py-1 bg-[#2a3942] hover:bg-[#374955] text-emerald-400 font-mono text-[9px] font-extrabold rounded border border-[#2a3942] shrink-0 cursor-pointer transition-all"
                    >
                      🌉 Bridge Crossed
                    </button>
                    <button
                      onClick={() =>
                        handleQuickReply(
                          "Pallet condition inspection complete. Sequential pictures attached."
                        )
                      }
                      className="px-2.5 py-1 bg-[#2a3942] hover:bg-[#374955] text-[#8696a0] hover:text-[#e9edef] font-mono text-[9px] font-extrabold rounded border border-[#2a3942] shrink-0 cursor-pointer transition-all"
                    >
                      📦 Pallets Secure
                    </button>
                    <button
                      onClick={() =>
                        handleQuickReply(
                          "Weigh scale green bypass. Weight on trailer verified legal."
                        )
                      }
                      className="px-2.5 py-1 bg-[#2a3942] hover:bg-[#374955] text-indigo-400 font-mono text-[9px] font-extrabold rounded border border-[#2a3942] shrink-0 cursor-pointer transition-all"
                    >
                      ⚖️ Bypass scale ok
                    </button>
                  </>
                )}
              </div>

              {/* INPUT SUBMIT PANEL */}
              <div className="p-3 bg-[#202c33] border-t border-[#2a3942] relative shrink-0">
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center space-x-2"
                >
                  {/* Paperclip menu button */}
                  <div className="relative shrink-0" style={{ height: "36px" }}>
                    <button
                      type="button"
                      onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                      title="Attach documents/photos"
                      className="text-[#8696a0] hover:text-[#e9edef] transition-colors cursor-pointer"
                      style={{
                        height: "36px",
                        width: "36px",
                        padding: "0px",
                        display: "flex",
                        alignItems: "center",
                        justify: "center",
                        borderRadius: "9999px",
                        backgroundColor: "transparent",
                      }}
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>

                    {/* Styled drop-down menu */}
                    {showAttachmentMenu && (
                      <div className="absolute bottom-12 left-0 bg-[#233138] border border-[#2a3942] shadow-2xl rounded-xl py-1.5 w-52 z-40 text-2xs text-[#e9edef] animate-fade-in">
                        <div className="px-3 py-1 border-b border-[#2a3942] text-[#8696a0] uppercase font-black text-[8px] tracking-wider mb-1">
                          Local Device upload
                        </div>
                        <button
                          type="button"
                          onClick={() => triggerDeviceFileSelector("photo")}
                          className="w-full text-left px-3 py-2 hover:bg-[#182229] flex items-center space-x-2.5 cursor-pointer font-bold"
                          style={{
                            height: "auto",
                            border: "none",
                            background: "transparent",
                          }}
                        >
                          <Image className="h-4 w-4 text-emerald-400" />
                          <span>📷 Select Local Photo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => triggerDeviceFileSelector("document")}
                          className="w-full text-left px-3 py-2 hover:bg-[#182229] flex items-center space-x-2.5 cursor-pointer font-bold"
                          style={{
                            height: "auto",
                            border: "none",
                            background: "transparent",
                          }}
                        >
                          <FileText className="h-4 w-4 text-blue-400" />
                          <span>📄 Select Local Document</span>
                        </button>

                        <div className="px-3 py-1 border-y border-[#2a3942] text-[#8696a0] uppercase font-black text-[8px] tracking-wider my-1">
                          Sandbox simulations
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAttachSimulatedFile("photo")}
                          className="w-full text-left px-3 py-2 hover:bg-[#182229] flex items-center space-x-2.5 cursor-pointer text-slate-300"
                          style={{
                            height: "auto",
                            border: "none",
                            background: "transparent",
                          }}
                        >
                          <Image className="h-4 w-4 text-base-content" />
                          <span>Simulate Pallet Damage photo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAttachSimulatedFile("document")}
                          className="w-full text-left px-3 py-2 hover:bg-[#182229] flex items-center space-x-2.5 cursor-pointer text-slate-300"
                          style={{
                            height: "auto",
                            border: "none",
                            background: "transparent",
                          }}
                        >
                          <FileText className="h-4 w-4 text-base-content" />
                          <span>Simulate Customs PDF</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Input Text Box */}
                  <div className="flex-1 relative" style={{ height: "36px" }}>
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={
                        currentRole === "dispatcher"
                          ? `Type message to ${activeGroup.driverName}... (or Paste screenshot here)`
                          : "Type support message to Dispatch office... (or Paste screenshot here)"
                      }
                      className="w-full bg-[#2a3942] text-[#e9edef] focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-[#8696a0] font-medium border-none shadow-inner text-xs"
                      style={{
                        height: "36px",
                        padding: "6px 100px 6px 16px",
                        borderRadius: "8px",
                        fontSize: "11px",
                        border: "none",
                        outline: "none",
                      }}
                    />
                    <span
                      className="hidden lg:inline absolute right-2 top-2 px-1.5 py-0.5 bg-[#202c33] text-[#8696a0] text-[8px] font-mono rounded border border-[#2a3942]"
                      style={{ pointerEvents: "none" }}
                    >
                      Ctrl + V to Paste
                    </span>
                  </div>

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={!inputText.trim() && !attachedFile}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-[#111b21] disabled:text-slate-600 cursor-pointer transition-all active:scale-95 shadow-md disabled:shadow-none shrink-0"
                    style={{
                      height: "36px",
                      width: "36px",
                      padding: "0px",
                      display: "flex",
                      alignItems: "center",
                      justify: "center",
                      borderRadius: "9999px",
                      border: "none",
                    }}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>

            {/* INTERACTIVE CHANNEL INSIGHTS PANEL (RIGHT SLIDEOUT DRAWER) */}
            {showInfoPanel && (
              <div className="w-64 lg:w-76 shrink-0 bg-[#121b22] border-l border-[#202c33] flex flex-col justify-between overflow-y-auto animate-slide-in h-full select-none">
                <div className="p-4 space-y-5">
                  {/* Title */}
                  <div className="flex items-center justify-between border-b border-[#202c33] pb-3">
                    <h4 className="text-xs font-black tracking-widest text-slate-300 font-mono uppercase flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      <span>Channel Insights</span>
                    </h4>
                    <button
                      onClick={() => setShowInfoPanel(false)}
                      className="p-1 hover:bg-[#202c33] text-slate-400 hover:text-white rounded-full cursor-pointer transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Profile Summary Card */}
                  <div className="text-center space-y-2 bg-[#1f2c34]/50 p-3.5 rounded-xl border border-[#2a3942]/40">
                    <div className="h-14 w-14 rounded-full bg-slate-800 text-slate-100 font-black text-lg flex items-center justify-center border-2 border-emerald-500 mx-auto">
                      {activeGroup.driverName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-slate-200">
                        {activeGroup.driverName}
                      </h5>
                      <p className="text-[9px] text-[#8696a0] font-mono mt-0.5 uppercase tracking-wider font-bold">
                        Driver ID: {activeGroup.driverId}
                      </p>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border inline-block ${activeGroup.status === "active_issue"
                        ? "bg-rose-950/40 text-rose-400 border-rose-900/60"
                        : "bg-emerald-950/40 text-emerald-400 border-emerald-900/60"
                        }`}
                    >
                      {activeGroup.status === "active_issue"
                        ? "\u26A0\uFE0F ISSUE ACTIVE"
                        : "\u2705 COMPLIANT"}
                    </span>
                  </div>

                  {/* Live Manifest details from shipments prop */}
                  <div className="space-y-2">
                    <h6 className="text-[9px] font-black font-mono tracking-widest text-[#8696a0] uppercase border-b border-[#202c33] pb-1">
                      Cargo & Route Logs
                    </h6>
                    {activeShipment ? (
                      <div className="bg-[#182229] border border-[#2a3942] rounded-xl p-3 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-emerald-400 font-mono bg-[#202c33] px-1.5 py-0.5 rounded">
                            {activeShipment.trackingNumber}
                          </span>
                          <span className="text-[9px] font-mono text-indigo-400 capitalize bg-indigo-950/30 px-1.5 py-0.2 rounded border border-indigo-900/20">
                            {activeShipment.status.replace("_", " ")}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[8px] text-base-content font-mono font-bold uppercase block">
                            Cargo Description
                          </span>
                          <p className="text-[10px] font-semibold text-slate-300 leading-tight line-clamp-2">
                            {activeShipment.cargoDescription}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 border-t border-[#202c33]/60 pt-2 text-[9px] font-mono text-[#8696a0]">
                          <div>
                            <span className="block text-[7px] text-base-content font-bold uppercase">
                              Transit Route
                            </span>
                            <span className="text-slate-300 font-semibold">
                              {activeShipment.originCity} →{" "}
                              {activeShipment.destinationCity}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[7px] text-base-content font-bold uppercase">
                              Estimated ETA
                            </span>
                            <span className="text-slate-300 font-semibold">
                              {new Date(activeShipment.eta).toLocaleDateString(
                                [],
                                { month: "short", day: "numeric" }
                              )}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[7px] text-base-content font-bold uppercase">
                              Truck/Trailer
                            </span>
                            <span className="text-slate-300 font-semibold">
                              T{activeShipment.truckNumber} /{" "}
                              {activeShipment.trailerNumber}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[7px] text-base-content font-bold uppercase">
                              Weight / Count
                            </span>
                            <span className="text-slate-300 font-semibold">
                              {(activeShipment.weightLbs / 1e3).toFixed(1)}k lbs
                              ({activeShipment.palletCount} Plt)
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-base-content italic bg-[#1f2c34]/20 p-2.5 rounded border border-[#2a3942]/30">
                        No active load currently linked to this driver.
                        Available for dispatch scheduling.
                      </div>
                    )}
                  </div>

                  {/* Shared Media Section */}
                  <div className="space-y-2">
                    <h6 className="text-[9px] font-black font-mono tracking-widest text-[#8696a0] uppercase border-b border-[#202c33] pb-1">
                      Shared support files ({sharedAttachments.length})
                    </h6>
                    {sharedAttachments.length === 0 ? (
                      <p className="text-[10px] text-base-content italic p-1">
                        No pictures or documents shared in this channel yet.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-2.5 max-h-44 overflow-y-auto scrollbar-none">
                        {sharedAttachments.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-[#1f2c34]/50 p-1.5 rounded-lg border border-[#2a3942]/40 gap-2"
                          >
                            <div className="flex items-center space-x-1.5 min-w-0">
                              {file.type === "photo" ? (
                                <img
                                  src={file.url}
                                  className="h-8 w-8 object-cover rounded shrink-0 bg-slate-800"
                                  alt="thumbnail"
                                />
                              ) : (
                                <FileText className="h-8 w-8 text-blue-400 shrink-0 bg-slate-800 p-1.5 rounded" />
                              )}
                              <div className="min-w-0">
                                <span className="text-[10px] text-slate-300 font-mono truncate block leading-tight font-semibold">
                                  {file.name}
                                </span>
                                <span className="text-[8px] text-base-content font-mono font-black uppercase">
                                  {file.size}
                                </span>
                              </div>
                            </div>
                            <a
                              href={file.url !== "#" ? file.url : void 0}
                              download={file.name}
                              className="p-1 hover:bg-[#202c33] rounded text-emerald-400 hover:text-emerald-300 shrink-0 cursor-pointer"
                              title="Download attachment file"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer security tag */}
                <div className="p-3 bg-[#0b141a] border-t border-[#202c33] text-center text-[8px] font-mono text-slate-600">
                  SECURE ENDPOINT UPLINK: VERIFIED
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Document Viewer Modal Overlay */}
      {viewingDocument && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-base-100 rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-scale-up space-y-0">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-sans">
                    {viewingDocument.name || "Carrier_BOL_Primary.pdf"}
                  </h3>
                  <p className="text-xs text-emerald-400 font-mono">
                    ● Digital BOL Document • {viewingDocument.size || "240 KB"} • Verified Sign-off
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingDocument(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 text-lg font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Document Viewer Content Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto bg-base-200">
              {/* Document Banner */}
              <div className="bg-emerald-950 text-emerald-100 p-4 rounded-2xl border border-emerald-800 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  <div>
                    <span className="font-bold text-white">Official Freight Bill of Lading (BOL)</span>
                    <p className="text-3xs text-emerald-300 font-mono mt-0.5">
                      Carrier Sign-off Complete • Timestamp: {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-800 text-emerald-200 rounded-full font-mono text-3xs font-bold uppercase">
                  VERIFIED
                </span>
              </div>

              {/* Simulated Paper Manifest Preview */}
              <div className="bg-base-100 p-6 rounded-2xl border border-slate-300 shadow-inner space-y-4 font-mono text-xs text-slate-800">
                <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                  <div>
                    <div className="text-sm font-extrabold text-base-content font-sans">LOGISYNC FREIGHT MANIFEST</div>
                    <div className="text-3xs text-base-content">Bill of Lading #BOL-2026-9812</div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xs text-base-content">ISSUED DATE</div>
                    <div className="text-xs font-bold text-indigo-600">{new Date().toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-3xs">
                  <div className="bg-base-200 p-3 rounded-xl border border-slate-100 space-y-1">
                    <div className="font-bold text-base-content uppercase">Shipper / Pickup Origin</div>
                    <div className="font-bold text-base-content">AeroParts Mfg Facility</div>
                    <div>100 Logistics Way, Toronto, ON</div>
                  </div>
                  <div className="bg-base-200 p-3 rounded-xl border border-slate-100 space-y-1">
                    <div className="font-bold text-base-content uppercase">Consignee / Destination</div>
                    <div className="font-bold text-base-content">Midwest Distribution Hub</div>
                    <div>500 Freight Blvd, Chicago, IL</div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden text-3xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="p-2">Item Description</th>
                        <th className="p-2">Pallets</th>
                        <th className="p-2">Weight</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2 font-bold"><FormatCargoOrLink text={viewingDocument?.name || "Industrial Cargo Components"} /></td>
                        <td className="p-2 font-mono">4 Pallets</td>
                        <td className="p-2 font-mono">6,000 Lbs</td>
                        <td className="p-2 text-emerald-600 font-bold">INSPECTED & OK</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-3xs">
                  <div className="space-y-0.5">
                    <div className="text-base-content font-bold">DRIVER SIGN-OFF STAMP</div>
                    <div className="font-bold text-base-content font-sans">Marcus Vance (Driver License Verified)</div>
                  </div>
                  <div className="px-3 py-1 bg-emerald-600 text-white font-mono font-bold rounded-lg text-3xs">
                    SIGNED & ATTACHED
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-base-100 border-t border-slate-200 flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  if (viewingDocument?.url && viewingDocument.url.startsWith("http")) {
                    window.open(viewingDocument.url, "_blank");
                  } else {
                    alert("Opening full resolution document link...");
                  }
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <Download className="h-4 w-4 text-slate-600" />
                <span>Download File</span>
              </button>
              <button
                onClick={() => setViewingDocument(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
