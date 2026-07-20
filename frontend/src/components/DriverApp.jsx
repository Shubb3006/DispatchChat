import { useState, useRef, useEffect } from "react";
import {
  Compass,
  Shield,
  MessageSquare,
  Send,
  FileText,
  Camera,
  Upload,
  MapPin,
  Clock,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  RefreshCcw,
  User,
  Check,
  X,
  ShieldAlert,
  CheckCircle,
  Paperclip,
  Image,
  Siren,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Trash2,
  ChevronLeft,
  Eye,
  Download,
  Printer,
} from "lucide-react";
export function getDocumentImage(doc) {
  if (
    doc.type === "skid_picture" &&
    doc.skidPictures &&
    doc.skidPictures.length > 0
  ) {
    return doc.skidPictures[0];
  }
  if (doc.imageUrl) {
    return doc.imageUrl;
  }
  switch (doc.type) {
    case "bol":
      return "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=300";
    case "pod":
      return "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=300&q=80";
    case "scale_ticket":
      return "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&w=300&q=80";
    case "fuel_receipt":
    case "customs_receipt":
      return "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=300&q=80";
    default:
      return "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=300&q=80";
  }
}
export default function DriverApp({
  shipments,
  messages,
  documents,
  hosLogs,
  onAddDocument,
  onUpdateDocument,
  onSendMessage,
  onUpdateHOSLog,
  onUpdateShipmentStatus,
  onMarkMessagesAsRead,
  onAddSafetyIncident,
  onUpdateShipment,
  isMobileMode = false,
}) {
  const driverId = "DRV001";
  const driverName = "Marcus Vance";
  const myShipment =
    shipments.find(
      (s) => s.driverId === driverId && s.status !== "delivered"
    ) || shipments[0];
  const myHOSLog = hosLogs.find((l) => l.driverId === driverId) || hosLogs[0];
  const [newMessage, setNewMessage] = useState("");
  const [chatAttachment, setChatAttachment] = useState(null);
  const [driverNotes, setDriverNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);
  useEffect(() => {
    setDriverNotes(myShipment?.driverNotes || "");
  }, [myShipment?.id, myShipment?.driverNotes]);
  const handleSaveNotes = () => {
    if (!myShipment) return;
    onUpdateShipment({
      ...myShipment,
      driverNotes,
    });
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2500);
  };
  const [docType, setDocType] = useState("bol");
  const [fileText, setFileText] = useState("");
  const [fileBase64, setFileBase64] = useState(null);
  const [fileName, setFileName] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState(null);
  const [extractedResult, setExtractedResult] = useState(null);
  const [selectedLogDoc, setSelectedLogDoc] = useState(null);
  const [internalNoteText, setInternalNoteText] = useState("");
  const [docLogFilter, setDocLogFilter] = useState("all");
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  useEffect(() => {
    if (selectedLogDoc) {
      setInternalNoteText(selectedLogDoc.internalNote || "");
    } else {
      setInternalNoteText("");
    }
  }, [selectedLogDoc]);
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [pendingPickupWaypointId, setPendingPickupWaypointId] = useState("");
  const [pickupBolFile, setPickupBolFile] = useState(null);
  const [pickupSkidFile, setPickupSkidFile] = useState(null);
  const [pickupError, setPickupError] = useState(null);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [pendingDeliveryWaypointId, setPendingDeliveryWaypointId] =
    useState("");
  const [deliveryPodFile, setDeliveryPodFile] = useState(null);
  const [consigneeSignee, setConsigneeSignee] = useState("");
  const [deliveryError, setDeliveryError] = useState(null);
  const [pickupLoadId, setPickupLoadId] = useState("");
  const [pickupCustomLoadNumber, setPickupCustomLoadNumber] = useState("");
  const [deliveryLoadId, setDeliveryLoadId] = useState("");
  const [deliveryCustomLoadNumber, setDeliveryCustomLoadNumber] = useState("");
  const [parserLoadId, setParserLoadId] = useState("");
  const [parserCustomLoadNumber, setParserCustomLoadNumber] = useState("");
  useEffect(() => {
    if (isPickupModalOpen && myShipment) {
      setPickupLoadId(myShipment.id);
      setPickupCustomLoadNumber("");
    }
  }, [isPickupModalOpen, myShipment]);
  useEffect(() => {
    if (isDeliveryModalOpen && myShipment) {
      setDeliveryLoadId(myShipment.id);
      setDeliveryCustomLoadNumber("");
    }
  }, [isDeliveryModalOpen, myShipment]);
  useEffect(() => {
    if (myShipment) {
      setParserLoadId(myShipment.id);
      setParserCustomLoadNumber("");
    }
  }, [myShipment]);
  const handleBolChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPickupBolFile({
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          dataUrl: event.target?.result,
        });
      };
      reader.readAsDataURL(file);
    }
  };
  const handleSkidPicChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPickupSkidFile({
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          dataUrl: event.target?.result,
        });
      };
      reader.readAsDataURL(file);
    }
  };
  const handlePodChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setDeliveryPodFile({
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          dataUrl: event.target?.result,
        });
      };
      reader.readAsDataURL(file);
    }
  };
  const handleLoadDemoPickup = () => {
    setPickupBolFile({
      name: "BOL_Samsara_Manifest_SHP101.pdf",
      size: "245.3 KB",
      dataUrl:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    });
    setPickupSkidFile({
      name: "SKID_PALLET_CONDITION_OK.jpg",
      size: "188.4 KB",
      dataUrl:
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=400",
    });
    setPickupError(null);
  };
  const handleLoadDemoDelivery = () => {
    setDeliveryPodFile({
      name: "POD_Signed_Freight_Bill.pdf",
      size: "312.1 KB",
      dataUrl:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    });
    setConsigneeSignee("Johnathan Mercer (Dock Lead)");
    setDeliveryError(null);
  };
  const handleSubmitPickup = () => {
    if (!pickupBolFile || !pickupSkidFile) {
      setPickupError(
        "Both Bill of Lading (BOL) and Skid Condition Picture are required."
      );
      return;
    }
    if (pickupLoadId === "custom" && !pickupCustomLoadNumber.trim()) {
      setPickupError("Please enter a custom Load Number.");
      return;
    }
    if (!myShipment) return;
    const targetShipment =
      shipments.find((s) => s.id === pickupLoadId) || myShipment;
    const resolvedShipmentId =
      pickupLoadId === "custom"
        ? "CUSTOM_LOAD"
        : targetShipment?.id || "SHP101";
    const resolvedTrackingNumber =
      pickupLoadId === "custom"
        ? pickupCustomLoadNumber
        : targetShipment?.trackingNumber || "LS-90281-CAN";
    const bolDoc = {
      id: "DOC" + Math.floor(1e4 + Math.random() * 9e4),
      shipmentId: resolvedShipmentId,
      trackingNumber: resolvedTrackingNumber,
      type: "bol",
      fileName: pickupBolFile.name,
      fileSize: pickupBolFile.size,
      uploadedBy: "Marcus Vance (Driver App)",
      uploadDate: /* @__PURE__ */ new Date().toISOString(),
      status: "pending_review",
      imageUrl: pickupBolFile.dataUrl,
      extractedData: {
        shipperName: targetShipment?.shipperName || "AeroParts Hub",
        consigneeName: targetShipment?.consigneeName || "Midwest Assembly",
        weightLbs: targetShipment?.weightLbs || 8500,
        bolNumber:
          targetShipment?.bolNumber ||
          "BOL-" + Math.floor(1e5 + Math.random() * 9e5),
        confidence: 0.98,
      },
    };
    const skidDoc = {
      id: "DOC" + Math.floor(1e4 + Math.random() * 9e4),
      shipmentId: resolvedShipmentId,
      trackingNumber: resolvedTrackingNumber,
      type: "skid_picture",
      fileName: pickupSkidFile.name,
      fileSize: pickupSkidFile.size,
      uploadedBy: "Marcus Vance (Driver App)",
      uploadDate: /* @__PURE__ */ new Date().toISOString(),
      status: "pending_review",
      skidPictures: [pickupSkidFile.dataUrl],
    };
    onAddDocument(bolDoc);
    onAddDocument(skidDoc);
    const targetWptId =
      pendingPickupWaypointId ||
      targetShipment?.waypoints.find((w) => w.stopType === "pickup")?.id;
    if (targetWptId) {
      handleCompleteStop(targetWptId);
    }
    onSendMessage(
      `Marcus Vance here: I have uploaded the BOL (${pickupBolFile.name}) and Skid picture for Load Number ${resolvedTrackingNumber}. Waiting for office team verification/approval.`,
      "DRV001",
      resolvedShipmentId
    );
    setPickupBolFile(null);
    setPickupSkidFile(null);
    setPickupError(null);
    setIsPickupModalOpen(false);
  };
  const handleSubmitDelivery = () => {
    if (!deliveryPodFile) {
      setDeliveryError(
        "Proof of Delivery (POD) document is required to sign off."
      );
      return;
    }
    if (!consigneeSignee.trim()) {
      setDeliveryError(
        "Please enter the name of the receiver who signed for the delivery."
      );
      return;
    }
    if (deliveryLoadId === "custom" && !deliveryCustomLoadNumber.trim()) {
      setDeliveryError("Please enter a custom Load Number.");
      return;
    }
    if (!myShipment) return;
    const targetShipment =
      shipments.find((s) => s.id === deliveryLoadId) || myShipment;
    const resolvedShipmentId =
      deliveryLoadId === "custom"
        ? "CUSTOM_LOAD"
        : targetShipment?.id || "SHP101";
    const resolvedTrackingNumber =
      deliveryLoadId === "custom"
        ? deliveryCustomLoadNumber
        : targetShipment?.trackingNumber || "LS-90281-CAN";
    const podDoc = {
      id: "DOC" + Math.floor(1e4 + Math.random() * 9e4),
      shipmentId: resolvedShipmentId,
      trackingNumber: resolvedTrackingNumber,
      type: "pod",
      fileName: deliveryPodFile.name,
      fileSize: deliveryPodFile.size,
      uploadedBy: "Marcus Vance (Driver App)",
      uploadDate: /* @__PURE__ */ new Date().toISOString(),
      status: "pending_review",
      imageUrl: deliveryPodFile.dataUrl,
      extractedData: {
        consigneeName: targetShipment?.consigneeName || "Midwest Assembly",
        signatureFound: true,
        confidence: 0.99,
        rawText: `Signed by receiver: ${consigneeSignee}`,
      },
    };
    onAddDocument(podDoc);
    const targetWptId =
      pendingDeliveryWaypointId ||
      targetShipment?.waypoints.find((w) => w.stopType === "delivery")?.id;
    if (targetWptId) {
      handleCompleteStop(targetWptId);
    }
    onSendMessage(
      `Marcus Vance here: Delivery finalized. POD signed by ${consigneeSignee} uploaded for Load Number ${resolvedTrackingNumber}. Waiting for office verification.`,
      "DRV001",
      resolvedShipmentId
    );
    setDeliveryPodFile(null);
    setConsigneeSignee("");
    setDeliveryError(null);
    setIsDeliveryModalOpen(false);
  };
  const fileInputRef = useRef(null);
  const chatFileRef = useRef(null);
  const driverMessagesEndRef = useRef(null);
  const myMessages = messages
    .filter(
      (m) =>
        m.recipientId === "DRV001" ||
        m.senderName === "Marcus Vance" ||
        (m.recipientId === "DISP_OFFICE" && m.senderName === "Marcus Vance")
    )
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  useEffect(() => {
    driverMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [myMessages.length]);
  const handleChatFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setChatAttachment({
            type: file.type.startsWith("image/") ? "photo" : "document",
            url: event.target.result,
            name: file.name,
            size: `${(file.size / 1024).toFixed(0)} KB`,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };
  const handleSendDriverMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !chatAttachment) return;
    onSendMessage(
      newMessage,
      "DRV001",
      myShipment?.id || "SHP101",
      chatAttachment
        ? {
            type: chatAttachment.type,
            url: chatAttachment.url,
            name: chatAttachment.name,
            size: chatAttachment.size,
          }
        : void 0
    );
    const textLower = newMessage.toLowerCase();
    if (
      textLower.includes("picked") ||
      textLower.includes("pick up") ||
      textLower.includes("pickup") ||
      textLower.includes("loaded")
    ) {
      const pickupWpt = myShipment?.waypoints.find(
        (w) => w.stopType === "pickup" && w.status !== "completed"
      );
      if (pickupWpt) {
        setPendingPickupWaypointId(pickupWpt.id);
        setIsPickupModalOpen(true);
      }
    } else if (
      textLower.includes("delivered") ||
      textLower.includes("delivery") ||
      textLower.includes("pod")
    ) {
      const deliveryWpt = myShipment?.waypoints.find(
        (w) => w.stopType === "delivery" && w.status !== "completed"
      );
      if (deliveryWpt) {
        setPendingDeliveryWaypointId(deliveryWpt.id);
        setIsDeliveryModalOpen(true);
      }
    }
    setNewMessage("");
    setChatAttachment(null);
  };
  const [isSkidCameraOpen, setIsSkidCameraOpen] = useState(false);
  const [skidPhotos, setSkidPhotos] = useState([]);
  const [cameraError, setCameraError] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [simulatedCondition, setSimulatedCondition] = useState(
    "Standard wrapped pallet (Intact)"
  );
  const videoRef = useRef(null);
  const [isBatchPreviewOpen, setIsBatchPreviewOpen] = useState(false);
  const [previewSelectedIndex, setPreviewSelectedIndex] = useState(0);
  const handleMovePhoto = (index, direction) => {
    const targetIndex = direction === "prev" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= skidPhotos.length) return;
    const updated = [...skidPhotos];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setSkidPhotos(updated);
    setPreviewSelectedIndex(targetIndex);
  };
  const handleDeletePhoto = (index) => {
    const updated = skidPhotos.filter((_, i) => i !== index);
    setSkidPhotos(updated);
    if (updated.length === 0) {
      setPreviewSelectedIndex(0);
    } else if (index >= updated.length) {
      setPreviewSelectedIndex(updated.length - 1);
    }
  };
  const startSkidCamera = async () => {
    setIsSkidCameraOpen(true);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      setCameraStream(stream);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.warn(
        "Camera permission blocked or not supported. Falling back to Sandbox interactive simulation.",
        err
      );
      setCameraError(
        "Camera permission blocked or not supported inside sandbox frame. Activating Interactive Sandbox Camera Feed."
      );
    }
  };
  const stopSkidCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsSkidCameraOpen(false);
  };
  const captureSkidPhoto = () => {
    let capturedDataUrl = "";
    if (cameraStream && videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
        ctx.fillRect(0, canvas.height - 60, canvas.width, 60);
        ctx.fillStyle = "#34D399";
        ctx.font = "bold 12px monospace";
        ctx.fillText(
          `VEHICLE ID: ${
            myShipment?.truckNumber || "TRK-102"
          } | SAMSARA ACTIVE TRACKING`,
          20,
          canvas.height - 40
        );
        ctx.fillStyle = "#94A3B8";
        ctx.fillText(
          `GPS COORDINATES: Lat ${driverLocation.lat.toFixed(
            6
          )}, Lng ${driverLocation.lng.toFixed(6)}`,
          20,
          canvas.height - 24
        );
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(
          `PALLET CONDITION BATCH #${skidPhotos.length + 1} | TIMESTAMP: ${
            /* @__PURE__ */ new Date().toLocaleString()
          } | ${simulatedCondition}`,
          20,
          canvas.height - 8
        );
        capturedDataUrl = canvas.toDataURL("image/jpeg");
      }
    } else {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const grad = ctx.createLinearGradient(0, 0, 0, 480);
        grad.addColorStop(0, "#1E293B");
        grad.addColorStop(1, "#020617");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 640, 480);
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(30, 30, 580, 420);
        ctx.fillStyle = "#713F12";
        ctx.fillRect(100, 340, 440, 40);
        ctx.fillStyle = "#854D0E";
        for (let i = 110; i < 540; i += 60) {
          ctx.fillRect(i, 340, 40, 40);
        }
        if (simulatedCondition.includes("crate")) {
          ctx.fillStyle = "#78716C";
          ctx.fillRect(140, 110, 360, 230);
          ctx.strokeStyle = "#44403C";
          ctx.lineWidth = 4;
          ctx.strokeRect(150, 120, 340, 210);
        } else {
          ctx.fillStyle = "#B45309";
          ctx.fillRect(140, 110, 360, 230);
        }
        ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        for (let y = 130; y < 330; y += 40) {
          ctx.moveTo(140, y);
          ctx.bezierCurveTo(230, y + 15, 410, y - 15, 500, y);
        }
        ctx.stroke();
        if (
          simulatedCondition.includes("defect") ||
          simulatedCondition.includes("misalignment") ||
          simulatedCondition.includes("Repaired")
        ) {
          ctx.strokeStyle = "#EF4444";
          ctx.lineWidth = 2;
          ctx.strokeRect(160, 150, 80, 80);
          ctx.fillStyle = "#EF4444";
          ctx.font = "bold 10px sans-serif";
          ctx.fillText("CORNER FAULT", 165, 170);
        }
        ctx.fillStyle = "#FEF08A";
        ctx.fillRect(220, 180, 120, 60);
        ctx.fillStyle = "#000000";
        ctx.font = "bold 9px monospace";
        ctx.fillText("DO NOT DOUBLE STACK", 225, 202);
        ctx.fillText("SAMSARA SECURITY GEOFENCE", 225, 215);
        ctx.fillText("CARRIER VERIFIED", 225, 228);
        ctx.strokeStyle = "#10B981";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(80, 80, 480, 320);
        ctx.beginPath();
        ctx.moveTo(80, 240);
        ctx.lineTo(560, 240);
        ctx.stroke();
        ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
        ctx.fillRect(0, 420, 640, 60);
        ctx.fillStyle = "#34D399";
        ctx.font = "bold 11px monospace";
        ctx.fillText(
          `SAMSARA ADVANCED CONDITION TRACKER \u2022 VEHICLE ID: ${
            myShipment?.truckNumber || "TRK-102"
          }`,
          25,
          438
        );
        ctx.fillStyle = "#94A3B8";
        ctx.fillText(
          `GPS COORDINATES: Lat ${driverLocation.lat.toFixed(
            6
          )}, Lng ${driverLocation.lng.toFixed(6)} | MANIFEST: ${
            myShipment?.id || "SHP101"
          }`,
          25,
          454
        );
        ctx.fillStyle = "#FEF08A";
        ctx.fillText(
          `[SKID PHOTO #${skidPhotos.length + 1}]: ${simulatedCondition}`,
          25,
          470
        );
        capturedDataUrl = canvas.toDataURL("image/jpeg");
      }
    }
    if (capturedDataUrl) {
      setSkidPhotos((prev) => [...prev, capturedDataUrl]);
    }
  };
  const handleFinishSkidBatch = () => {
    if (skidPhotos.length === 0) {
      alert(
        "Please capture at least one pallet condition photo before finalizing the batch."
      );
      return;
    }
    setFileName(`SKID_CONDITION_BATCH_${Date.now().toString().slice(-6)}.JPG`);
    setFileText(
      `Sequential capture of ${
        skidPhotos.length
      } pallet condition photos. Location verified at Lat ${driverLocation.lat.toFixed(
        6
      )}, Lng ${driverLocation.lng.toFixed(6)}. Vehicle ${
        myShipment?.truckNumber || "TRK-102"
      }. Status: Secure shrink-wrap, corner guards applied, no skid shift recorded.`
    );
    if (skidPhotos[0]) {
      setFileBase64(skidPhotos[0].split(",")[1]);
    }
    setIsBatchPreviewOpen(false);
    stopSkidCamera();
  };
  useEffect(() => {
    if (docType === "skid_picture") {
      startSkidCamera();
    }
  }, [docType]);
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [isSosActive, setIsSosActive] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(5);
  const [sosIncidentId, setSosIncidentId] = useState(null);
  const triggerSOSAlert = () => {
    setIsSosModalOpen(false);
    setIsSosActive(true);
    const incidentId = "INC_SOS_" + Date.now();
    setSosIncidentId(incidentId);
    const newIncident = {
      id: incidentId,
      driverId,
      driverName,
      truckNumber: myShipment?.truckNumber || "TRK-102",
      timestamp: /* @__PURE__ */ new Date().toISOString(),
      type: "emergency_sos",
      severity: "high",
      description: `\u{1F6A8} EMERGENCY SOS TRIGGERED BY DRIVER. Immediate dispatch and rescue response required. Contact: +1 (555) 492-3810. Vehicle: ${
        myShipment?.truckNumber || "TRK-102"
      } (Trailer: ${
        myShipment?.trailerNumber || "TRL-504"
      }). Coordinates: Lat ${driverLocation.lat.toFixed(
        6
      )}, Lng ${driverLocation.lng.toFixed(6)}.`,
      location: `Lat ${driverLocation.lat.toFixed(
        4
      )}, Lng ${driverLocation.lng.toFixed(4)}`,
      status: "pending_review",
    };
    if (onAddSafetyIncident) {
      onAddSafetyIncident(newIncident);
    }
    onSendMessage(
      `\u{1F6A8} [EMERGENCY SOS SIGNAL] \u{1F6A8}
\u2022 Driver: ${driverName}
\u2022 Contact: +1 (555) 492-3810
\u2022 Vehicle: Truck ${myShipment?.truckNumber || "TRK-102"} / Trailer ${
        myShipment?.trailerNumber || "TRL-504"
      }
\u2022 Coordinates: Lat ${driverLocation.lat.toFixed(
        6
      )}, Lng ${driverLocation.lng.toFixed(6)}
\u2022 Severity: HIGH (Distress Beacon Active)`,
      "DISP_OFFICE",
      myShipment?.id || "SHP101"
    );
  };
  const cancelSOSAlert = () => {
    setIsSosModalOpen(false);
    setSosCountdown(5);
  };
  const resolveSOSAlert = () => {
    setIsSosActive(false);
    setSosCountdown(5);
    onSendMessage(
      `\u2705 [ALL CLEAR / SOS RESOLVED] Driver has cancelled the Emergency SOS distress beacon. No further emergency dispatch action required.`,
      "DISP_OFFICE",
      myShipment?.id || "SHP101"
    );
  };
  const startSOSCountdown = () => {
    setSosCountdown(5);
    setIsSosModalOpen(true);
  };
  useEffect(() => {
    let timer = null;
    if (isSosModalOpen && sosCountdown > 0) {
      timer = setTimeout(() => {
        setSosCountdown((prev) => prev - 1);
      }, 1e3);
    } else if (isSosModalOpen && sosCountdown === 0) {
      triggerSOSAlert();
    }
    return () => clearTimeout(timer);
  }, [isSosModalOpen, sosCountdown]);
  const [driverLocation, setDriverLocation] = useState({
    lat: 42.3314,
    // Default to Detroit, MI (middle of shipping corridor)
    lng: -83.0458,
  });
  const [isLiveGps, setIsLiveGps] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  const getStopDistanceText = (wpt) => {
    const dist = calculateDistance(
      driverLocation.lat,
      driverLocation.lng,
      wpt.lat,
      wpt.lng
    );
    if (dist < 1e3) {
      return `${Math.round(dist)}m`;
    }
    return `${(dist / 1e3).toFixed(2)} km`;
  };
  const isStopWithinRange = (wpt) => {
    const dist = calculateDistance(
      driverLocation.lat,
      driverLocation.lng,
      wpt.lat,
      wpt.lng
    );
    return dist <= 500;
  };
  useEffect(() => {
    let watchId = null;
    if (isLiveGps) {
      if ("geolocation" in navigator) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            setDriverLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            setGpsError(null);
          },
          (err) => {
            console.error(err);
            setGpsError(
              "GPS Access Blocked or Denied inside Sandbox. Fallback to Simulation."
            );
            setIsLiveGps(false);
          },
          { enableHighAccuracy: true, timeout: 1e4, maximumAge: 0 }
        );
      } else {
        setGpsError("HTML5 Geolocation not supported by this browser.");
        setIsLiveGps(false);
      }
    }
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isLiveGps]);
  useEffect(() => {
    if (myShipment && onMarkMessagesAsRead) {
      onMarkMessagesAsRead(myShipment.id, "driver");
    }
  }, [myShipment?.id, messages.length]);
  const handleSendMessage = (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !chatAttachment) || !myShipment) return;
    onSendMessage(
      newMessage,
      "DISP_OFFICE",
      myShipment.id,
      chatAttachment || void 0
    );
    setNewMessage("");
    setChatAttachment(null);
  };
  const handleAttachMockFile = (type) => {
    if (type === "photo") {
      setChatAttachment({
        type: "photo",
        name: "Signed_POD_Reciept.jpg",
        url: "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=600&q=80",
        size: "1.4 MB",
      });
    } else {
      setChatAttachment({
        type: "document",
        name: "Diesel_Receipt_FuelPilot.pdf",
        url: "#",
        size: "180 KB",
      });
    }
  };
  const handleChangeHOSStatus = (status) => {
    const updated = { ...myHOSLog, currentStatus: status };
    onUpdateHOSLog(updated);
    if (myShipment) {
      let shipmentHOSStatus = "off_duty";
      if (status === "ON") shipmentHOSStatus = "on_duty";
      if (status === "D") shipmentHOSStatus = "driving";
      if (status === "SB") shipmentHOSStatus = "sleeper";
      const speed = status === "D" ? 62 : 0;
      onUpdateShipmentStatus(
        myShipment.id,
        myShipment.status,
        myShipment.waypoints,
        myShipment.borderConnectStatus
      );
    }
  };
  const handleCompleteStop = (waypointId) => {
    if (!myShipment) return;
    const updatedWaypoints = myShipment.waypoints.map((w) => {
      if (w.id === waypointId) {
        return {
          ...w,
          status: "completed",
          actualTime: /* @__PURE__ */ new Date().toISOString(),
        };
      }
      return w;
    });
    const nextPending = updatedWaypoints.find((w) => w.status === "pending");
    if (nextPending) {
      nextPending.status = "arrived";
    }
    let shipmentStatus = myShipment.status;
    const allCompleted = updatedWaypoints.every(
      (w) => w.status === "completed"
    );
    if (allCompleted) {
      shipmentStatus = "delivered";
    } else if (updatedWaypoints.some((w) => w.status === "completed")) {
      shipmentStatus = "in_transit";
    }
    onUpdateShipmentStatus(myShipment.id, shipmentStatus, updatedWaypoints);
  };
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      const pureBase64 = base64.split(",")[1];
      setFileBase64(pureBase64);
    };
    reader.readAsDataURL(file);
  };
  const handleParseDocument = async () => {
    setOcrLoading(true);
    setOcrError(null);
    setExtractedResult(null);
    try {
      const response = await fetch("/api/gemini/parse-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: docType,
          base64Data: fileBase64,
          textFallback:
            fileText ||
            `Standard Bill of Lading for shipper ${
              myShipment?.waypoints[0]?.companyName || "AeroParts"
            } sending ${myShipment?.palletCount || 6} pallets to ${
              myShipment?.waypoints[myShipment.waypoints.length - 1]
                ?.companyName || "Midwest Assembly"
            }. Weight: ${
              myShipment?.weightLbs || 8500
            } lbs. BOL Number: BOL-${Math.floor(1e5 + Math.random() * 9e5)}`,
          fileName: fileName || "BOL_Scanned_Truck_App.pdf",
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || "Server error");
      }
      const data = await response.json();
      setExtractedResult(data);
      const docId = "DOC" + Math.floor(1e4 + Math.random() * 9e4);
      const targetShipment =
        shipments.find((s) => s.id === parserLoadId) || myShipment;
      const resolvedShipmentId =
        parserLoadId === "custom"
          ? "CUSTOM_LOAD"
          : targetShipment?.id || "SHP101";
      const resolvedTrackingNumber =
        parserLoadId === "custom"
          ? parserCustomLoadNumber
          : targetShipment?.trackingNumber || "LS-90281-CAN";
      const newDocument = {
        id: docId,
        shipmentId: resolvedShipmentId,
        trackingNumber: resolvedTrackingNumber,
        type: docType,
        fileName:
          fileName ||
          `${docType.toUpperCase()}-${resolvedTrackingNumber}-EXTRACTED.pdf`,
        fileSize:
          docType === "skid_picture" && skidPhotos.length > 0
            ? `${skidPhotos.length * 125} KB`
            : "450 KB",
        uploadedBy: `${driverName} (Driver App)`,
        uploadDate: /* @__PURE__ */ new Date().toISOString(),
        status: "pending_review",
        imageUrl: fileBase64 || void 0,
        skidPictures: docType === "skid_picture" ? [...skidPhotos] : void 0,
        extractedData: {
          shipperName: data.shipperName,
          consigneeName: data.consigneeName,
          items: data.items,
          weightLbs: Number(data.weightLbs),
          bolNumber: data.bolNumber,
          purchaseOrder: data.purchaseOrder,
          carrierName: data.carrierName,
          signatureFound: data.signatureFound,
          confidence: data.confidence,
        },
      };
      onAddDocument(newDocument);
      if (docType === "skid_picture") {
        setSkidPhotos([]);
      }
    } catch (err) {
      setOcrError(
        err.message ||
          "Verification failed. Verify your GEMINI_API_KEY inside the Secrets panel."
      );
    } finally {
      setOcrLoading(false);
    }
  };
  const activeChatMessages = myShipment
    ? messages.filter(
        (m) =>
          m.shipmentId === myShipment.id ||
          m.recipientId === driverId ||
          m.senderName === driverName
      )
    : [];
  const myDocuments = myShipment
    ? documents.filter((d) => d.shipmentId === myShipment.id)
    : [];
  const filteredDocLogs = myDocuments.filter((doc) => {
    if (docLogFilter === "all") return true;
    if (docLogFilter === "approved")
      return doc.status === "approved" || doc.status === "matched_to_invoice";
    return doc.status === docLogFilter;
  });
  const handleToggleSelectDoc = (docId) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId)
        ? prev.filter((id) => id !== docId)
        : [...prev, docId]
    );
  };
  const handleSelectAllFilteredDocs = (isChecked) => {
    if (isChecked) {
      setSelectedDocIds(filteredDocLogs.map((d) => d.id));
    } else {
      setSelectedDocIds([]);
    }
  };
  const handleBulkStatusUpdate = (status) => {
    selectedDocIds.forEach((id) => {
      const doc = myDocuments.find((d) => d.id === id);
      if (doc) {
        const updated = { ...doc, status };
        if (onUpdateDocument) {
          onUpdateDocument(updated);
        }
      }
    });
    setSelectedDocIds([]);
  };
  const handleBulkDownload = async () => {
    for (const id of selectedDocIds) {
      const doc = myDocuments.find((d) => d.id === id);
      if (doc) {
        await handleDownloadDocument(doc);
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }
  };
  const scannedWeights = myDocuments
    .filter(
      (d) =>
        d.extractedData &&
        typeof d.extractedData.weightLbs === "number" &&
        d.extractedData.weightLbs > 0
    )
    .map((d) => ({
      fileName: d.fileName,
      weight: d.extractedData.weightLbs,
      type: d.type,
      id: d.id,
    }));
  const hasScannedWeight = scannedWeights.length > 0;
  const currentWeight = hasScannedWeight
    ? scannedWeights[0].weight
    : myShipment?.weightLbs || 0;
  const maxWeightCapacity = 45e3;
  const capacityUtilizedPercent = Math.min(
    Math.round((currentWeight / maxWeightCapacity) * 100),
    100
  );
  const handleDownloadDocument = async (doc) => {
    try {
      const imageUrl = getDocumentImage(doc);
      if (imageUrl.startsWith("data:")) {
        const link2 = document.createElement("a");
        link2.href = imageUrl;
        link2.download = doc.fileName;
        document.body.appendChild(link2);
        link2.click();
        document.body.removeChild(link2);
        return;
      }
      const response = await fetch(imageUrl, { mode: "cors" });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = doc.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const imageUrl = getDocumentImage(doc);
      const link = document.createElement("a");
      link.href = imageUrl;
      link.target = "_blank";
      link.download = doc.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  const handlePrintDocument = (doc) => {
    const printIframe = document.createElement("iframe");
    printIframe.style.position = "absolute";
    printIframe.style.width = "0";
    printIframe.style.height = "0";
    printIframe.style.border = "none";
    document.body.appendChild(printIframe);
    const docContext = printIframe.contentWindow || printIframe.contentDocument;
    if (!docContext) return;
    const docHTML = `
      <html>
        <head>
          <title>Print Document: ${doc.fileName}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #334155;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
              line-height: 1.5;
            }
            .header {
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 15px;
              margin-bottom: 25px;
            }
            .title {
              font-size: 22px;
              font-weight: bold;
              color: #0f172a;
              margin: 0 0 5px 0;
            }
            .subtitle {
              font-size: 13px;
              color: #64748b;
              margin: 0;
              text-transform: uppercase;
              font-family: monospace;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 16px;
              margin-bottom: 30px;
            }
            .meta-card {
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 12px;
              background-color: #f8fafc;
            }
            .meta-label {
              font-size: 10px;
              font-weight: bold;
              color: #64748b;
              text-transform: uppercase;
              margin-bottom: 3px;
              letter-spacing: 0.05em;
            }
            .meta-value {
              font-size: 13px;
              font-weight: 600;
              color: #0f172a;
            }
            .section-title {
              font-size: 14px;
              font-weight: bold;
              color: #1e293b;
              border-bottom: 1px solid #cbd5e1;
              padding-bottom: 6px;
              margin-top: 30px;
              margin-bottom: 12px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .preview-container {
              margin-top: 15px;
              text-align: center;
            }
            .preview-image {
              max-width: 100%;
              max-height: 450px;
              border-radius: 6px;
              border: 1px solid #cbd5e1;
              object-fit: contain;
            }
            .note-container {
              border-left: 4px solid #f59e0b;
              padding: 12px 15px;
              border-radius: 0 6px 6px 0;
              font-size: 13px;
              line-height: 1.5;
              background-color: #fffbeb;
              border: 1px solid #fef3c7;
              border-left-width: 4px;
              margin-top: 15px;
              margin-bottom: 25px;
            }
            .footer {
              margin-top: 40px;
              border-top: 1px solid #e2e8f0;
              padding-top: 15px;
              font-size: 10px;
              color: #94a3b8;
              text-align: center;
            }
            @media print {
              body {
                padding: 0;
              }
              .meta-card {
                background-color: transparent !important;
                page-break-inside: avoid;
              }
              .preview-image {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">${doc.fileName}</h1>
            <p class="subtitle">${doc.type.replace("_", " ")} &bull; ${
      doc.fileSize
    } &bull; Status: ${doc.status}</p>
          </div>

          <div class="meta-grid">
            <div class="meta-card">
              <div class="meta-label">Document ID</div>
              <div class="meta-value">${doc.id}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">File Type</div>
              <div class="meta-value">${doc.type.replace("_", " ")}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">File Size</div>
              <div class="meta-value">${doc.fileSize}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Approval Status</div>
              <div class="meta-value" style="text-transform: uppercase;">${doc.status.replace(
                "_",
                " "
              )}</div>
            </div>
          </div>

          ${
            doc.extractedData
              ? `
            <h2 class="section-title">Extracted Metadata (OCR)</h2>
            <div class="meta-grid">
              ${
                doc.extractedData.shipperName
                  ? `
                <div class="meta-card">
                  <div class="meta-label">Shipper Name</div>
                  <div class="meta-value">${doc.extractedData.shipperName}</div>
                </div>
              `
                  : ""
              }
              ${
                doc.extractedData.consigneeName
                  ? `
                <div class="meta-card">
                  <div class="meta-label">Consignee Name</div>
                  <div class="meta-value">${doc.extractedData.consigneeName}</div>
                </div>
              `
                  : ""
              }
              ${
                doc.extractedData.bolNumber
                  ? `
                <div class="meta-card">
                  <div class="meta-label">Bill of Lading (BOL) #</div>
                  <div class="meta-value">${doc.extractedData.bolNumber}</div>
                </div>
              `
                  : ""
              }
              ${
                doc.extractedData.purchaseOrder
                  ? `
                <div class="meta-card">
                  <div class="meta-label">Purchase Order (PO) #</div>
                  <div class="meta-value">${doc.extractedData.purchaseOrder}</div>
                </div>
              `
                  : ""
              }
              ${
                doc.extractedData.weightLbs
                  ? `
                <div class="meta-card">
                  <div class="meta-label">Cargo Weight</div>
                  <div class="meta-value">${doc.extractedData.weightLbs} Lbs</div>
                </div>
              `
                  : ""
              }
              ${
                doc.extractedData.signatureFound !== void 0
                  ? `
                <div class="meta-card">
                  <div class="meta-label">Signature Found</div>
                  <div class="meta-value">${
                    doc.extractedData.signatureFound
                      ? "Verified Present"
                      : "Missing"
                  }</div>
                </div>
              `
                  : ""
              }
            </div>
          `
              : ""
          }

          ${
            doc.internalNote
              ? `
            <h2 class="section-title">Administrative Notes</h2>
            <div class="note-container">
              <strong>Note:</strong> ${doc.internalNote}
            </div>
          `
              : ""
          }

          <h2 class="section-title" style="page-break-before: auto;">Document Image Preview</h2>
          <div class="preview-container">
            ${
              doc.type === "skid_picture" &&
              doc.skidPictures &&
              doc.skidPictures.length > 0
                ? doc.skidPictures
                    .map(
                      (pic, idx) => `
                <div style="margin-bottom: 20px; page-break-inside: avoid;">
                  <div class="meta-label" style="text-align: left; margin-bottom: 5px;">Pallet Photo #${
                    idx + 1
                  }</div>
                  <img class="preview-image" src="${pic}" alt="Pallet Photo ${
                        idx + 1
                      }" />
                </div>
              `
                    )
                    .join("")
                : `<img class="preview-image" src="${getDocumentImage(
                    doc
                  )}" alt="${doc.fileName}" />`
            }
          </div>

          <div class="footer">
            <p>Generated by Samsara Driver Terminal on ${
              /* @__PURE__ */ new Date().toLocaleDateString()
            }</p>
            <p style="font-family: monospace; font-size: 8px; letter-spacing: 0.05em;">SECURE DIGITAL RECORD &bull; SYSTEM ID: ${
              doc.id
            }</p>
          </div>
        </body>
      </html>
    `;
    const printDocument =
      printIframe.contentWindow?.document || printIframe.contentDocument;
    if (printDocument) {
      printDocument.write(docHTML);
      printDocument.close();
      setTimeout(() => {
        printIframe.contentWindow?.focus();
        printIframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(printIframe);
        }, 5e3);
      }, 500);
    }
  };
  const [noteSaved, setNoteSaved] = useState(false);
  const handleSaveInternalNote = () => {
    if (!selectedLogDoc) return;
    const updatedDoc = {
      ...selectedLogDoc,
      internalNote: internalNoteText,
    };
    setSelectedLogDoc(updatedDoc);
    if (onUpdateDocument) {
      onUpdateDocument(updatedDoc);
    }
    setNoteSaved(true);
    setTimeout(() => {
      setNoteSaved(false);
    }, 2e3);
  };
  return (
    <div
      id="driver-app-terminal"
      className={
        isMobileMode
          ? "px-1.5 py-2 space-y-4 text-slate-800"
          : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-slate-800"
      }
    >
      {/* ACTIVE SOS BEACON BANNER */}
      {isSosActive && (
        <div className="bg-rose-950 border-2 border-rose-600 rounded-2xl p-5 mb-6 text-white shadow-2xl relative overflow-hidden animate-pulse">
          {/* Decorative background grid and alert waves */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-rose-900/40 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-4">
              <div className="p-3.5 bg-rose-600 rounded-xl text-white shadow-md shrink-0">
                <Siren className="h-6 w-6 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-black tracking-wide text-rose-200 uppercase flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
                  🔴 ACTIVE DISTRESS BEACON STREAMING
                </h2>
                <p className="text-xs text-rose-100">
                  Your live GPS coordinates (
                  <span className="font-mono font-bold text-white">
                    {driverLocation.lat.toFixed(6)},{" "}
                    {driverLocation.lng.toFixed(6)}
                  </span>
                  ), Vehicle ID (
                  <span className="font-bold text-white">
                    {myShipment?.truckNumber || "TRK-102"}
                  </span>
                  ), and emergency contacts are shared with dispatch safety
                  marshals.
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-3xs font-mono text-rose-300 uppercase mt-1">
                  <span>Driver Contact: +1 (555) 492-3810</span>
                  <span>•</span>
                  <span>Safety Status: Urgent Escalation</span>
                  <span>•</span>
                  <span>Pinging: Samsara HOS Feed Active</span>
                </div>
              </div>
            </div>

            <button
              onClick={resolveSOSAlert}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-rose-950 text-xs font-bold rounded-xl transition-all border border-rose-300 hover:border-white cursor-pointer hover:shadow-lg self-center md:self-auto uppercase tracking-wider shrink-0"
            >
              Resolve / All Clear
            </button>
          </div>
        </div>
      )}

      {/* Driver Header profile */}
      <div
        className={`bg-slate-900 text-white ${
          isMobileMode ? "p-3.5 mb-4" : "p-5 mb-6"
        } rounded-2xl border border-slate-800 shadow-md flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4`}
      >
        <div className="flex items-center space-x-4">
          <div className="bg-emerald-500 text-slate-950 h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
            MV
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              Active Driver Terminal
            </h2>
            <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 mt-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                Logged In: Marcus Vance • Truck{" "}
                {myShipment?.truckNumber || "TRK-102"} • Trailer{" "}
                {myShipment?.trailerNumber || "TRL-504"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Samsara HOS Duty Dashboard Widget */}
          <div className="flex items-center space-x-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700 overflow-x-auto max-w-full">
            {["OFF", "ON", "SB", "D"].map((status) => {
              const isActive = myHOSLog?.currentStatus === status;
              return (
                <button
                  key={status}
                  onClick={() => handleChangeHOSStatus(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? status === "D"
                        ? "bg-indigo-600 text-white"
                        : status === "ON"
                        ? "bg-emerald-600 text-white"
                        : status === "SB"
                        ? "bg-amber-600 text-white"
                        : "bg-slate-600 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {status === "D"
                    ? "Driving (D)"
                    : status === "ON"
                    ? "On Duty (ON)"
                    : status === "SB"
                    ? "Sleeper (SB)"
                    : "Off Duty (OFF)"}
                </button>
              );
            })}
          </div>

          {/* Prominent Emergency SOS Trigger Button */}
          <button
            onClick={startSOSCountdown}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold uppercase tracking-widest rounded-xl transition-all duration-300 shadow-lg shadow-rose-950/40 hover:shadow-rose-600/30 border border-rose-500/30 cursor-pointer flex items-center gap-2 animate-pulse hover:animate-none group hover:scale-[1.03] active:scale-[0.98]"
          >
            <Siren className="h-4 w-4 animate-bounce group-hover:scale-125 shrink-0" />
            <span>Emergency SOS</span>
          </button>
        </div>
      </div>

      {/* PROFESSIONAL DRIVER TEAM CHAT & DISPATCH COMMUNICATIONS BLOCK (MOVED TO TOP) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="bg-slate-900 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <MessageSquare className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                Dispatch &amp; Back-Office Support Group
              </h3>
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                Direct Private Channel • Marcus Vance Support #DRV001
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 shrink-0 self-start sm:self-auto">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-slate-300">
              HQ CONNECTION STABLE (3 DISPATCHERS ACTIVE)
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-150">
          {/* Left: Chat Thread and Input Area */}
          <div className="flex-1 flex flex-col h-[350px] bg-slate-50/50">
            {/* Message scroll viewport */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 min-h-0">
              {myMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-10">
                  <MessageSquare className="h-8 w-8 text-slate-300 stroke-1" />
                  <p className="text-xs font-semibold text-slate-600 mt-2">
                    No messages in this support group yet.
                  </p>
                  <p className="text-3xs text-slate-400 mt-0.5">
                    Use the input below to send an update to Chief Dispatcher
                    Keith.
                  </p>
                </div>
              ) : (
                myMessages.map((msg) => {
                  const isDriver = msg.senderRole === "driver";
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${
                        isDriver ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`flex items-start space-x-2.5 max-w-[85%] ${
                          isDriver ? "flex-row-reverse space-x-reverse" : ""
                        }`}
                      >
                        {/* Mini avatar */}
                        <div
                          className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-2xs uppercase shrink-0 ${
                            isDriver
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {msg.senderName.slice(0, 2)}
                        </div>

                        <div
                          className={`p-3 rounded-2xl text-xs border shadow-sm ${
                            isDriver
                              ? "bg-indigo-600 text-white border-indigo-700 rounded-tr-none"
                              : "bg-white text-slate-800 border-slate-200 rounded-tl-none"
                          }`}
                        >
                          <div className="flex items-baseline justify-between gap-4 mb-1">
                            <span
                              className={`font-bold text-3xs uppercase tracking-wider ${
                                isDriver ? "text-indigo-200" : "text-slate-500"
                              }`}
                            >
                              {isDriver
                                ? "Marcus Vance (You)"
                                : `${
                                    msg.senderName
                                  } (${msg.senderRole.toUpperCase()})`}
                            </span>
                            <span
                              className={`text-4xs font-mono ${
                                isDriver
                                  ? "text-indigo-200/80"
                                  : "text-slate-400"
                              }`}
                            >
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="leading-relaxed whitespace-pre-wrap font-medium">
                            {msg.content}
                          </p>
                          {msg.attachment && (
                            <div
                              className={`mt-2 p-1.5 border rounded-lg flex items-center space-x-2 text-3xs font-mono ${
                                isDriver
                                  ? "bg-indigo-700/60 border-indigo-500/40 text-indigo-100"
                                  : "bg-slate-50 border-slate-200 text-slate-600"
                              }`}
                            >
                              <Paperclip className="h-3.5 w-3.5 text-indigo-300" />
                              <span className="truncate max-w-[140px]">
                                {msg.attachment.name}
                              </span>
                              <span className="opacity-80">
                                ({msg.attachment.size || "Attachment"})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={driverMessagesEndRef} />
            </div>

            {/* Attachment Preview Box */}
            {chatAttachment && (
              <div className="px-4 py-2 bg-indigo-50 border-t border-indigo-100 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-mono text-indigo-800 min-w-0">
                  <Paperclip className="h-4 w-4 text-indigo-500 shrink-0" />
                  <span className="font-bold truncate">
                    {chatAttachment.name}
                  </span>
                  <span className="text-3xs text-indigo-500">
                    ({chatAttachment.size})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setChatAttachment(null)}
                  className="p-1 hover:bg-indigo-100 rounded text-indigo-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Message Composer Area */}
            <form
              onSubmit={handleSendDriverMessage}
              className="p-3 bg-white border-t border-slate-150 flex items-center space-x-2"
            >
              <input
                type="file"
                ref={chatFileRef}
                onChange={handleChatFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => chatFileRef.current?.click()}
                title="Attach screenshot, log, or scale ticket"
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-700 rounded-xl transition-colors cursor-pointer shrink-0"
              >
                <Paperclip className="h-4 w-4" />
              </button>

              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a secure update or message to Dispatch..."
                className="flex-1 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-xl px-4 py-2 text-xs text-slate-800 placeholder-slate-400 transition-all h-9"
              />

              <button
                type="submit"
                disabled={!newMessage.trim() && !chatAttachment}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 text-white disabled:text-slate-400 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer h-9 shrink-0"
              >
                <span>Send</span>
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>

          {/* Right: Quick Touch Status Actions & Contacts Info */}
          <div className="w-full lg:w-[320px] p-4 bg-slate-50/30 space-y-4 shrink-0 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                Quick-Touch Status updates
              </span>
              <p className="text-[10px] text-slate-400 leading-normal">
                Tap any preset below to broadcast an instant status log without
                typing:
              </p>

              <div className="space-y-2">
                {[
                  {
                    label: "\u{1F4CD} Arrived at Shipper",
                    text: "Driver Marcus Vance here: I have arrived safely at the pickup shipper. Check-in completed.",
                  },
                  {
                    label: "\u{1F4E6} Picked Up Load & BOL",
                    text: "Driver Marcus Vance here: Cargo is fully loaded and secured. Uploading BOL and Skid Pictures.",
                  },
                  {
                    label: "\u{1F6A6} Heavy Traffic Delay",
                    text: "Driver Marcus Vance here: Encountered major traffic delays/road congestion. Estimating 30-45 minute variance.",
                  },
                  {
                    label: "\u{1F4CB} Weight Ticket Logged",
                    text: "Driver Marcus Vance here: Scaled out load at regional CAT scale. Weight ticket logged for billing review.",
                  },
                  {
                    label: "\u{1F6C2} Customs Border Line",
                    text: "Driver Marcus Vance here: Heavy queues at customs commercial lane. Preparing PAPS manifest entry.",
                  },
                  {
                    label: "\u{1F3C1} Trip Delivery Finished",
                    text: "Driver Marcus Vance here: Final consignee signature received. POD successfully completed. Ready for next dispatch load.",
                  },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onSendMessage(
                        preset.text,
                        "DRV001",
                        myShipment?.id || "SHP101"
                      );
                      if (preset.label.includes("Picked Up")) {
                        const pickupWpt = myShipment?.waypoints.find(
                          (w) =>
                            w.stopType === "pickup" && w.status !== "completed"
                        );
                        if (pickupWpt) {
                          setPendingPickupWaypointId(pickupWpt.id);
                        }
                        setIsPickupModalOpen(true);
                      } else if (preset.label.includes("Delivery Finished")) {
                        const deliveryWpt = myShipment?.waypoints.find(
                          (w) =>
                            w.stopType === "delivery" &&
                            w.status !== "completed"
                        );
                        if (deliveryWpt) {
                          setPendingDeliveryWaypointId(deliveryWpt.id);
                        }
                        setIsDeliveryModalOpen(true);
                      }
                    }}
                    className="w-full text-left p-2 bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 text-2xs font-bold text-slate-700 hover:text-indigo-900 rounded-lg transition-all flex items-center justify-between cursor-pointer group shadow-2xs"
                  >
                    <span className="truncate">{preset.label}</span>
                    <ChevronRight className="h-3 w-3 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200/80 pt-3.5 space-y-2 text-[10px]">
              <div className="flex items-center justify-between text-slate-500 font-medium">
                <span>Dispatch Office Contacts:</span>
                <span className="text-emerald-600 font-bold uppercase font-mono tracking-wider">
                  Active
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5 font-sans">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-700">
                    Keith Donnelly (Chief)
                  </span>
                  <span className="text-slate-400 font-mono">Ext 204</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-700">
                    Sophia Chen (Customs)
                  </span>
                  <span className="text-slate-400 font-mono">Ext 112</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-700">
                    Emily Brown (Billing)
                  </span>
                  <span className="text-slate-400 font-mono">Ext 440</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EMERGENCY SOS COUNTDOWN MODAL */}
      {isSosModalOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border-2 border-rose-600 rounded-2xl w-full max-w-lg p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden text-slate-100">
            {/* Pulsing red decorative rings */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="text-center space-y-4 relative z-10">
              <div className="inline-flex p-4 bg-rose-600/20 border border-rose-500/30 text-rose-500 rounded-full animate-bounce">
                <Siren className="h-10 w-10 animate-pulse" />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-black text-white uppercase tracking-tight">
                  Confirm Emergency SOS Trigger
                </h2>
                <p className="text-xs text-rose-200 font-mono">
                  ESTABLISHING CRYPTOGRAPHIC SAMSARA DISPATCH UPLINK
                </p>
              </div>

              {/* Huge countdown clock */}
              <div className="flex justify-center py-4">
                <div className="h-28 w-28 bg-gradient-to-br from-rose-900/60 to-slate-950 border-4 border-rose-600 rounded-full flex flex-col items-center justify-center shadow-lg shadow-rose-950/30 relative">
                  <span className="text-4xl font-extrabold tracking-tight text-white animate-pulse">
                    {sosCountdown}
                  </span>
                  <span className="text-[9px] text-rose-300 font-mono uppercase mt-0.5">
                    Seconds
                  </span>

                  {/* Circular progress highlight border indicator */}
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle
                      cx="56"
                      cy="56"
                      r="52"
                      className="stroke-rose-600 fill-none"
                      strokeWidth="4"
                      strokeDasharray="326.72"
                      strokeDashoffset={
                        326.72 - (326.72 * (5 - sosCountdown)) / 5
                      }
                    />
                  </svg>
                </div>
              </div>

              {/* Data payload showcase */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-left space-y-2.5">
                <span className="text-3xs text-slate-400 font-mono font-bold uppercase tracking-widest block">
                  Broadcast Metadata Payload
                </span>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-2xs">
                  <div>
                    <span className="text-slate-500 block font-mono">
                      DRIVER ID &amp; NAME
                    </span>
                    <span className="font-bold text-white">
                      {driverName} ({driverId})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-mono">
                      CONTACT TELEPHONE
                    </span>
                    <span className="font-bold text-white">
                      +1 (555) 492-3810
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-mono">
                      VEHICLE (TRUCK/TRAILER)
                    </span>
                    <span className="font-bold text-white">
                      Truck: {myShipment?.truckNumber || "TRK-102"} / Trailer:{" "}
                      {myShipment?.trailerNumber || "TRL-504"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-mono">
                      GEOLOCATION COORDINATES
                    </span>
                    <span className="font-bold text-indigo-300 font-mono">
                      {driverLocation.lat.toFixed(6)},{" "}
                      {driverLocation.lng.toFixed(6)}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-slate-400">
                This will alert safety marshals, create a high-severity critical
                safety report, and notify dispatcher radio chat with active
                emergency beaconing.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 relative z-10">
              <button
                onClick={cancelSOSAlert}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer uppercase tracking-wider"
              >
                Abort &amp; Cancel
              </button>
              <button
                onClick={triggerSOSAlert}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-rose-950/50 hover:shadow-rose-600/30 transition-all cursor-pointer uppercase tracking-wider"
              >
                Trigger Immediately
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEQUENTIAL SKID CONDITION CAMERA MULTI-CAPTURE MODAL */}
      {isSkidCameraOpen && (
        <div
          id="skid-camera-modal"
          className="fixed inset-0 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 z-50"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl p-5 md:p-6 flex flex-col md:flex-row gap-6 shadow-2xl relative text-slate-100 max-h-[95vh] overflow-y-auto md:overflow-hidden">
            {/* Viewfinder Column */}
            <div className="flex-1 flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-bold font-mono tracking-wider text-emerald-400 uppercase">
                    Live Pallet Scan Uplink Active
                  </span>
                </div>
                <span className="text-3xs font-mono text-slate-400">
                  VEHICLE: {myShipment?.truckNumber || "TRK-102"}
                </span>
              </div>

              {/* Viewfinder Screen */}
              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video flex items-center justify-center group shadow-inner">
                {cameraError ? (
                  /* Animated fallback scanner visual */
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-950/30 via-slate-950/40 to-slate-950/90 z-0 pointer-events-none" />

                    {/* Continuous moving grid scan line */}
                    <div className="absolute left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_15px_#10B981] top-1/2 -translate-y-1/2 animate-[pulse_1.5s_infinite] z-10 pointer-events-none" />

                    <div className="z-10 p-3 bg-indigo-500/10 border border-indigo-400/20 text-indigo-400 rounded-full animate-pulse">
                      <Camera className="h-8 w-8" />
                    </div>
                    <div className="z-10 space-y-1">
                      <span className="text-xs font-bold text-slate-200 block uppercase font-mono">
                        SANDBOX INTUITIVE CAMERA SIMULATOR
                      </span>
                      <p className="text-3xs text-slate-400 max-w-md mx-auto">
                        Real hardware media devices are blocked by browser
                        iframe cross-origin sandboxing. Standard watermarked
                        pallet simulation is fully loaded and interactive.
                      </p>
                    </div>

                    {/* Simulation metadata parameters */}
                    <div className="absolute bottom-4 left-4 text-left font-mono text-[9px] text-slate-400 space-y-0.5 z-10 bg-slate-950/80 p-2 rounded border border-slate-800/60">
                      <div>FOCUS: AUTO-DETECTION</div>
                      <div>LAT: {driverLocation.lat.toFixed(6)}</div>
                      <div>LNG: {driverLocation.lng.toFixed(6)}</div>
                      <div>DEFECT_SCANNER: ENGAGED</div>
                    </div>

                    <div className="absolute top-4 right-4 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 text-emerald-400 font-mono text-[8px] font-bold rounded uppercase z-10 animate-pulse">
                      Sim Active
                    </div>
                  </div>
                ) : (
                  /* Real live webcam video feed */
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Framing crosshair overlays */}
                <div className="absolute inset-4 border border-dashed border-white/10 pointer-events-none rounded-lg flex items-center justify-center">
                  <div className="w-10 h-10 border-2 border-emerald-500/30 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-emerald-500/40 rounded-full" />
                  </div>
                </div>

                {/* Live bottom bar info overlay */}
                <div className="absolute bottom-2 right-2 bg-slate-950/70 backdrop-blur-sm rounded px-2 py-0.5 font-mono text-[9px] text-white">
                  FRAME RATE: 30 FPS • AGC ON
                </div>
              </div>

              {/* Adjust condition for the simulated pallet */}
              <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <label className="block text-3xs font-bold font-mono uppercase text-slate-400">
                  Pallet Angle & Condition Preset (Simulation controls)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    "Standard wrapped pallet (Intact)",
                    "Heavy duty crate (Secure)",
                    "Notice: Splintered wood (Repaired)",
                    "Warning: Corner board misalignment",
                    "High-value gear (Strapped)",
                    "Defect: Minor tear in shrink wrap",
                  ].map((cond) => (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => setSimulatedCondition(cond)}
                      className={`p-1.5 rounded text-left text-3xs truncate transition-all cursor-pointer font-mono font-bold ${
                        simulatedCondition === cond
                          ? "bg-indigo-600 text-white border border-indigo-500"
                          : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-300"
                      }`}
                    >
                      {cond}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons inside Viewfinder Column */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={stopSkidCamera}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer uppercase tracking-wider font-mono border border-slate-700"
                >
                  Discard & Exit
                </button>
                <button
                  type="button"
                  onClick={captureSkidPhoto}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-950/50 hover:shadow-emerald-600/20 transition-all cursor-pointer uppercase tracking-wider font-mono flex items-center justify-center space-x-2"
                >
                  <Camera className="h-4 w-4" />
                  <span>Capture Skid Condition Photo</span>
                </button>
              </div>
            </div>

            {/* Sidebar Captured Gallery Column */}
            <div className="w-full md:w-80 flex flex-col space-y-4 border-t md:border-t-0 md:border-l border-slate-800 pt-5 md:pt-0 md:pl-5 shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold font-mono text-indigo-400 uppercase tracking-wider">
                  Sequential Batch Tray ({skidPhotos.length})
                </h3>
                {skidPhotos.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSkidPhotos([])}
                    className="text-3xs text-rose-400 hover:text-rose-300 font-bold font-mono uppercase tracking-wider"
                  >
                    Clear Tray
                  </button>
                )}
              </div>

              {/* Scrollable grid tray */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[35vh] md:max-h-none min-h-[140px] bg-slate-950/40 p-2 rounded-xl border border-slate-950">
                {skidPhotos.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-4 text-center text-slate-500 space-y-2">
                    <Camera className="h-6 w-6 text-slate-600" />
                    <span className="text-3xs font-mono font-semibold uppercase tracking-wider">
                      Batch Tray Empty
                    </span>
                    <p className="text-4xs text-slate-600">
                      Aim at a pallet/skid, select your condition preset, and
                      click "Capture Skid Condition Photo" to add to this
                      sequence tray.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {skidPhotos.map((pic, idx) => (
                      <div
                        key={idx}
                        className="relative rounded-lg overflow-hidden border border-slate-800 group aspect-video bg-slate-900"
                      >
                        <img
                          src={pic}
                          alt="Captured skid"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() =>
                              setSkidPhotos((prev) =>
                                prev.filter((_, i) => i !== idx)
                              )
                            }
                            className="p-1 bg-rose-600 text-white rounded hover:bg-rose-500 cursor-pointer text-3xs font-mono font-bold uppercase"
                          >
                            Delete
                          </button>
                        </div>
                        <div className="absolute top-1 left-1 bg-slate-950/80 text-[8px] font-mono font-bold px-1 py-0.2 text-white rounded">
                          #{idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Finish batch control */}
              <button
                type="button"
                onClick={() => {
                  setPreviewSelectedIndex(0);
                  setIsBatchPreviewOpen(true);
                }}
                disabled={skidPhotos.length === 0}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-500 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-indigo-950/40 hover:shadow-indigo-600/30 font-mono"
              >
                Review &amp; Save Batch ({skidPhotos.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MULTI-CAPTURE BATCH PREVIEW MODAL */}
      {isBatchPreviewOpen && (
        <div
          id="batch-preview-modal"
          className="fixed inset-0 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 z-[60]"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl p-5 md:p-6 flex flex-col gap-5 shadow-2xl relative text-slate-100 max-h-[95vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                  <Image className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                    Skid Photo Batch Editor
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                    Review, Re-order, and Prune Pallet Sequence Before Document
                    Processor Upload
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="bg-indigo-600/20 text-indigo-400 text-3xs font-mono font-bold px-2 py-1 rounded-full border border-indigo-500/20 uppercase tracking-wider">
                  {skidPhotos.length}{" "}
                  {skidPhotos.length === 1 ? "Photo" : "Photos"} Captured
                </span>
                <button
                  type="button"
                  onClick={() => setIsBatchPreviewOpen(false)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            {skidPhotos.length === 0 ? (
              <div className="py-16 text-center space-y-4 max-w-md mx-auto">
                <div className="p-4 bg-slate-800/40 rounded-full inline-block text-slate-500 border border-slate-800">
                  <Camera className="h-10 w-10 animate-bounce" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
                    Batch Empty
                  </h4>
                  <p className="text-xs text-slate-400">
                    You have deleted all photos from this condition batch.
                    Please go back to the camera view to capture more.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBatchPreviewOpen(false)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Back to Camera View
                </button>
              </div>
            ) : (
              <div
                className={`grid grid-cols-1 ${
                  isMobileMode ? "" : "lg:grid-cols-12"
                } gap-6 min-h-0 overflow-hidden`}
              >
                {/* Left Column: Large Preview & Individual Picture Controls (7 cols) */}
                <div
                  className={
                    isMobileMode
                      ? "flex flex-col space-y-4"
                      : "lg:col-span-7 flex flex-col space-y-4"
                  }
                >
                  <div className="bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/60">
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-slate-950 flex items-center justify-center">
                      <img
                        src={skidPhotos[previewSelectedIndex] || skidPhotos[0]}
                        alt="Selected Skid Review"
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-sm border border-slate-800 text-3xs font-bold font-mono px-2 py-1 text-indigo-400 rounded-lg uppercase">
                        Sequence Item #{previewSelectedIndex + 1} of{" "}
                        {skidPhotos.length}
                      </div>
                    </div>
                  </div>

                  {/* Active Photo Actions */}
                  <div className="bg-slate-950/30 border border-slate-800/80 rounded-xl p-4 space-y-4">
                    <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                      Active Photo Operations
                    </span>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                      {/* Re-ordering arrow controls */}
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleMovePhoto(previewSelectedIndex, "prev")
                          }
                          disabled={previewSelectedIndex === 0}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/30 disabled:opacity-40 text-slate-200 disabled:text-slate-600 border border-slate-700 disabled:border-slate-800/60 rounded-xl text-2xs font-bold font-mono transition-all flex items-center space-x-1 uppercase cursor-pointer"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                          <span>Move Up</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleMovePhoto(previewSelectedIndex, "next")
                          }
                          disabled={
                            previewSelectedIndex === skidPhotos.length - 1
                          }
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/30 disabled:opacity-40 text-slate-200 disabled:text-slate-600 border border-slate-700 disabled:border-slate-800/60 rounded-xl text-2xs font-bold font-mono transition-all flex items-center space-x-1 uppercase cursor-pointer"
                        >
                          <span>Move Down</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Destructive delete */}
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(previewSelectedIndex)}
                        className="px-3.5 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-900/50 hover:border-rose-700/60 rounded-xl text-2xs font-bold font-mono transition-all flex items-center justify-center space-x-1.5 uppercase cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete Photo</span>
                      </button>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/60 space-y-1.5">
                      <div className="flex justify-between items-center text-[9px] font-mono font-bold text-slate-400 uppercase">
                        <span>Device Scan Metadata Overlay:</span>
                        <span className="text-emerald-500">Verified</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        This sequential camera item will be processed with
                        watermarked GPS coordinates{" "}
                        <code className="text-slate-400">
                          {driverLocation.lat.toFixed(5)}°N,{" "}
                          {driverLocation.lng.toFixed(5)}°W
                        </code>{" "}
                        and a high-resolution tamperproof UNIX timestamp.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Column: Complete Sequence List (5 cols) */}
                <div
                  className={
                    isMobileMode
                      ? "flex flex-col space-y-4 min-h-[200px]"
                      : "lg:col-span-5 flex flex-col space-y-4 min-h-[250px] lg:max-h-[500px]"
                  }
                >
                  <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                    Sequence Order Tray (Select to review)
                  </span>

                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[300px] lg:max-h-none bg-slate-950/40 p-3 rounded-xl border border-slate-950">
                    {skidPhotos.map((pic, idx) => {
                      const isSelected = idx === previewSelectedIndex;
                      return (
                        <div
                          key={idx}
                          onClick={() => setPreviewSelectedIndex(idx)}
                          className={`group p-2 rounded-xl border transition-all cursor-pointer flex items-center space-x-3 ${
                            isSelected
                              ? "bg-indigo-950/40 border-indigo-500/50 shadow-md shadow-indigo-950/20"
                              : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                          }`}
                        >
                          {/* Thumbnail */}
                          <div className="w-16 h-10 rounded overflow-hidden shrink-0 border border-slate-800 bg-slate-950 relative">
                            <img
                              src={pic}
                              alt={`Thumbnail ${idx}`}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute bottom-0.5 right-0.5 bg-slate-950/80 text-[7px] font-mono font-bold px-1 rounded text-slate-300">
                              #{idx + 1}
                            </div>
                          </div>

                          {/* Info & Sequence indicator */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-[11px] font-mono font-bold uppercase tracking-wide ${
                                  isSelected
                                    ? "text-indigo-400"
                                    : "text-slate-300"
                                }`}
                              >
                                Photo #{idx + 1}
                              </span>
                              {isSelected && (
                                <span className="text-[9px] font-mono text-emerald-500 font-semibold animate-pulse uppercase tracking-wider">
                                  Reviewing
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">
                              Condition: Pallet wrapped &amp; strapped
                            </p>
                          </div>

                          {/* Quick Arrow Up / Down */}
                          <div className="flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMovePhoto(idx, "prev");
                              }}
                              disabled={idx === 0}
                              className="p-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded text-slate-300 hover:text-white cursor-pointer"
                              title="Move Up"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMovePhoto(idx, "next");
                              }}
                              disabled={idx === skidPhotos.length - 1}
                              className="p-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded text-slate-300 hover:text-white cursor-pointer"
                              title="Move Down"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer Controls */}
            <div className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSkidPhotos([]);
                    setIsBatchPreviewOpen(false);
                    stopSkidCamera();
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 border border-slate-700 hover:border-rose-900 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider font-mono transition-all cursor-pointer w-full sm:w-auto text-center animate-pulse-once"
                >
                  Discard Batch
                </button>
                <button
                  type="button"
                  onClick={() => setIsBatchPreviewOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer uppercase tracking-wider font-mono border border-slate-700 w-full sm:w-auto text-center"
                >
                  Add More Photos
                </button>
              </div>

              <button
                type="button"
                onClick={handleFinishSkidBatch}
                disabled={skidPhotos.length === 0}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white disabled:text-slate-500 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-emerald-950/40 hover:shadow-emerald-600/30 flex items-center justify-center space-x-2"
              >
                <Check className="h-4 w-4" />
                <span>
                  Confirm &amp; Commit {skidPhotos.length} Photos to Processor
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIGITAL DOCUMENTS & PARSER PANEL GRID */}

      {/* Grid Layout: Map Waypoints, Document Parsing, Messenger */}
      <div
        className={`grid grid-cols-1 ${
          isMobileMode ? "" : "lg:grid-cols-12"
        } gap-6`}
      >
        {/* Left Column: Samsara ELD Hours & Active Shipment stops */}
        <div className={isMobileMode ? "space-y-6" : "lg:col-span-8 space-y-6"}>
          {/* HOS Resilient Driving Timers */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-xs font-bold font-mono text-slate-500 uppercase tracking-wider mb-4">
              Samsara Active ELD Clock (Hours of Service)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                <span className="text-3xs font-mono text-slate-500 uppercase">
                  Driving Time
                </span>
                <div
                  className={`text-xl font-bold font-mono mt-1 ${
                    myHOSLog?.currentStatus === "D"
                      ? "text-indigo-600"
                      : "text-slate-800"
                  }`}
                >
                  {Math.floor(myHOSLog?.drivingSecondsRemaining / 3600)}h{" "}
                  {Math.floor((myHOSLog?.drivingSecondsRemaining % 3600) / 60)}m
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full"
                    style={{
                      width: `${
                        (myHOSLog.drivingSecondsRemaining / 39600) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                <span className="text-3xs font-mono text-slate-500 uppercase">
                  On-Duty Time
                </span>
                <div className="text-xl font-bold font-mono mt-1 text-slate-800">
                  {Math.floor(myHOSLog.dutySecondsRemaining / 3600)}h{" "}
                  {Math.floor((myHOSLog.dutySecondsRemaining % 3600) / 60)}m
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full"
                    style={{
                      width: `${
                        (myHOSLog.dutySecondsRemaining / 50400) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                <span className="text-3xs font-mono text-slate-500 uppercase">
                  70-Hr Cycle remaining
                </span>
                <div className="text-xl font-bold font-mono mt-1 text-slate-800">
                  {Math.floor(myHOSLog.cycleSecondsRemaining / 3600)}h
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-slate-600 h-full"
                    style={{
                      width: `${
                        (myHOSLog.cycleSecondsRemaining / 252e3) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                <span className="text-3xs font-mono text-slate-500 uppercase">
                  Next Mandatory Rest
                </span>
                <div className="text-xl font-bold font-mono text-rose-600 mt-1">
                  In {Math.floor(myHOSLog.breakSecondsRemaining / 3600)}h{" "}
                  {Math.floor((myHOSLog.breakSecondsRemaining % 3600) / 60)}m
                </div>
                <span className="text-3xs text-slate-400">
                  30-min break required
                </span>
              </div>
            </div>
          </div>

          {/* GPS Geofencing & Simulation Hub */}
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-xl border border-indigo-950 shadow-md p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-800/40 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-600/30 rounded-lg text-indigo-300">
                  <Compass
                    className="h-5 w-5 animate-spin-slow"
                    style={{ animationDuration: "8s" }}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">
                    Real-time GPS Geofence Monitor
                  </h3>
                  <p className="text-3xs text-indigo-200/70 font-mono uppercase mt-0.5">
                    SAMSARA SECURE GEOFENCING API
                  </p>
                </div>
              </div>

              {/* Live Device GPS Toggle */}
              <button
                onClick={() => setIsLiveGps((prev) => !prev)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center space-x-1.5 cursor-pointer ${
                  isLiveGps
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 shadow"
                    : "bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/40"
                }`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    isLiveGps ? "bg-white animate-pulse" : "bg-indigo-500"
                  }`}
                />
                <span>
                  {isLiveGps ? "Device GPS: Connected" : "Connect Device GPS"}
                </span>
              </button>
            </div>

            {gpsError && (
              <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-lg text-amber-200 text-2xs flex items-start space-x-2 font-mono">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                <span>{gpsError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              {/* Telemetry Display */}
              <div className="md:col-span-5 bg-slate-950/60 rounded-xl p-4 border border-slate-800 space-y-2.5">
                <span className="text-3xs text-slate-400 uppercase tracking-widest font-mono font-bold block">
                  Current Driver Telemetry
                </span>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-2xs">
                    <span className="text-slate-500 font-mono">Latitude:</span>
                    <span className="font-mono text-indigo-300 font-bold">
                      {driverLocation.lat.toFixed(6)}
                    </span>
                  </div>
                  <div className="flex justify-between text-2xs">
                    <span className="text-slate-500 font-mono">Longitude:</span>
                    <span className="font-mono text-indigo-300 font-bold">
                      {driverLocation.lng.toFixed(6)}
                    </span>
                  </div>
                  <div className="flex justify-between text-2xs">
                    <span className="text-slate-500 font-mono">Status:</span>
                    <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      {isLiveGps ? "HTML5 Browser Feed" : "Simulated GPS"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Simulation Action Panel */}
              <div className="md:col-span-7 space-y-2">
                <span className="text-3xs text-slate-400 uppercase tracking-widest font-mono font-bold block">
                  Sandbox Simulation Controls
                </span>
                <p className="text-3xs text-slate-300 leading-relaxed font-sans">
                  To sign a stop, you must be physically within 500m of its
                  coordinates. Use quick shortcuts below to teleport there
                  instantly for sandbox testing:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {myShipment?.waypoints.map((wpt, idx) => {
                    const isCompleted = wpt.status === "completed";
                    if (isCompleted) return null;
                    return (
                      <button
                        key={wpt.id}
                        onClick={() => {
                          setDriverLocation({ lat: wpt.lat, lng: wpt.lng });
                          setIsLiveGps(false);
                        }}
                        className="py-1.5 px-2.5 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 hover:border-indigo-500 rounded-lg text-3xs font-bold text-indigo-200 hover:text-white transition-all text-left flex items-center space-x-1.5 cursor-pointer truncate"
                        title={`Teleport to ${wpt.companyName}`}
                      >
                        <MapPin className="h-3 w-3 shrink-0 text-indigo-400" />
                        <span className="truncate">
                          Teleport to Stop #{idx + 1}
                        </span>
                      </button>
                    );
                  })}

                  <button
                    onClick={() => {
                      setDriverLocation({ lat: 42.3314, lng: -83.0458 });
                      setIsLiveGps(false);
                    }}
                    className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-3xs font-bold text-slate-300 hover:text-white transition-all text-left flex items-center space-x-1.5 cursor-pointer"
                  >
                    <RefreshCcw className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>Reset GPS (Detroit - Out of Range)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Shipment stops & action controls */}
          {myShipment ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-150 bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-3xs font-bold font-mono bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full uppercase">
                      Active Trip
                    </span>
                    {myShipment?.priority && (
                      <span
                        className={`text-3xs font-bold font-mono px-2 py-0.5 rounded-full uppercase border ${
                          myShipment.priority === "urgent"
                            ? "bg-rose-50 border-rose-200 text-rose-800"
                            : myShipment.priority === "high"
                            ? "bg-amber-50 border-amber-200 text-amber-800"
                            : "bg-slate-100 border-slate-200 text-slate-700"
                        }`}
                      >
                        {myShipment.priority} Priority
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 mt-1.5">
                    Waypoints & Delivery Tasks
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-3xs font-mono text-slate-500 uppercase block">
                    Tracking ID
                  </span>
                  <span className="text-xs font-bold font-mono text-slate-900">
                    {myShipment.trackingNumber}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* PROMINENT NEW DISPATCH ASSIGNMENT MANIFEST CARD */}
                <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-xl p-5 border border-indigo-500/30 shadow-md relative overflow-hidden">
                  {/* Decorative background grid and sparkles */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

                  <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3 mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-500/30">
                        <Sparkles className="h-4 w-4 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-widest font-mono text-indigo-300">
                          New Load Assigned
                        </h4>
                        <p className="text-[9px] text-slate-400 font-mono">
                          BROADCAST VIA SAMSARA DISPATCH NETWORK
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {myShipment?.priority && (
                        <span
                          className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                            myShipment.priority === "urgent"
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse"
                              : myShipment.priority === "high"
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                              : "bg-slate-500/20 text-slate-300 border-slate-500/30"
                          }`}
                        >
                          {myShipment.priority} Priority
                        </span>
                      )}
                      <span className="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-600 text-white shadow-sm border border-indigo-400/30 animate-pulse">
                        DISPATCHED
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left Panel: Origin and Destination Entity Names */}
                    <div className="space-y-3.5">
                      <div className="relative pl-6">
                        {/* Custom visual pipeline indicator line */}
                        <div className="absolute left-1.5 top-2.5 bottom-1.5 w-0.5 border-l border-dashed border-slate-500/40" />

                        <div className="relative space-y-1">
                          <span className="absolute -left-6 top-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 flex items-center justify-center text-white border-2 border-slate-900 shadow-sm">
                            <span className="h-1 w-1 bg-white rounded-full" />
                          </span>
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                            Shipper (Pickup Location)
                          </span>
                          <span className="text-xs font-extrabold text-white block">
                            {myShipment.shipperName ||
                              myShipment.waypoints.find(
                                (w) => w.stopType === "pickup"
                              )?.companyName ||
                              "Samsara Verified Shipper"}
                          </span>
                          <span className="text-2xs text-slate-300 block font-medium truncate">
                            {myShipment.shipperAddress ||
                              myShipment.waypoints.find(
                                (w) => w.stopType === "pickup"
                              )?.address ||
                              myShipment.originCity}
                          </span>
                        </div>

                        <div className="relative space-y-1 mt-4">
                          <span className="absolute -left-6 top-0.5 h-3.5 w-3.5 rounded-full bg-indigo-500 flex items-center justify-center text-white border-2 border-slate-900 shadow-sm">
                            <span className="h-1 w-1 bg-white rounded-full" />
                          </span>
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                            Consignee (Delivery Destination)
                          </span>
                          <span className="text-xs font-extrabold text-white block">
                            {myShipment.consigneeName ||
                              myShipment.waypoints.find(
                                (w) => w.stopType === "delivery"
                              )?.companyName ||
                              "Samsara Verified Consignee"}
                          </span>
                          <span className="text-2xs text-slate-300 block font-medium truncate">
                            {myShipment.consigneeAddress ||
                              myShipment.waypoints.find(
                                (w) => w.stopType === "delivery"
                              )?.address ||
                              myShipment.destinationCity}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Panel: Spec Payload Specs, skid counts, weight, pickup numbers */}
                    <div className="bg-slate-950/50 rounded-xl p-3.5 border border-slate-800/80 grid grid-cols-2 gap-3">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">
                          Skid/Pallet Count
                        </span>
                        <div className="flex items-baseline space-x-1">
                          <span className="text-sm font-black text-white">
                            {myShipment.palletCount}
                          </span>
                          <span className="text-3xs text-slate-400 font-mono uppercase">
                            Pallets
                          </span>
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">
                          Manifest Weight
                        </span>
                        <div className="flex items-baseline space-x-1">
                          <span className="text-sm font-black text-indigo-300">
                            {myShipment.weightLbs.toLocaleString()}
                          </span>
                          <span className="text-3xs text-slate-400 font-mono uppercase">
                            Lbs
                          </span>
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">
                          PO Number
                        </span>
                        <span className="text-2xs font-mono font-bold text-white block truncate">
                          {myShipment.poNumber || "N/A"}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">
                          BOL / Pickup Number
                        </span>
                        <span className="text-2xs font-mono font-bold text-amber-300 block truncate">
                          {myShipment.bolNumber || "N/A"}
                        </span>
                      </div>

                      <div className="col-span-2 border-t border-slate-800/60 pt-2 flex items-center justify-between text-3xs font-mono">
                        <span className="text-slate-400">LOAD MODE:</span>
                        <span className="font-extrabold text-white uppercase bg-indigo-900 px-1.5 py-0.2 rounded">
                          {myShipment.loadType || "FTL"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trip Progress Bar */}
                <div className="mb-2">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-semibold text-slate-700">
                      Trip Progress
                    </span>
                    <span className="text-xs font-mono font-bold text-indigo-600">
                      {Math.round(
                        (myShipment.waypoints.filter(
                          (w) => w.status === "completed"
                        ).length /
                          Math.max(myShipment.waypoints.length, 1)) *
                          100
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-in-out"
                      style={{
                        width: `${Math.round(
                          (myShipment.waypoints.filter(
                            (w) => w.status === "completed"
                          ).length /
                            Math.max(myShipment.waypoints.length, 1)) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="text-3xs text-slate-500 mt-1.5 text-right font-mono uppercase">
                    {
                      myShipment.waypoints.filter(
                        (w) => w.status === "completed"
                      ).length
                    }{" "}
                    / {myShipment.waypoints.length} Waypoints Completed
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xs font-mono font-bold text-slate-500 uppercase">
                      Trip Cargo details
                    </span>
                    {hasScannedWeight ? (
                      <span className="flex items-center space-x-1 text-[9px] font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full animate-pulse">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        <span>OCR VERIFIED</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-[9px] font-mono font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span>MANIFEST WEIGHT</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      {myShipment.cargoDescription}
                    </p>
                  </div>

                  {/* Weight Capacity Visual Progress Indicator */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200">
                    <div className="flex justify-between items-center text-xs font-mono text-slate-600">
                      <span className="text-2xs uppercase font-bold text-slate-500">
                        Weight Load Capacity
                      </span>
                      <span className="font-bold text-slate-800">
                        {currentWeight.toLocaleString()} /{" "}
                        {maxWeightCapacity.toLocaleString()} lbs
                      </span>
                    </div>

                    <div className="relative w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
                      <div
                        className={`h-3 rounded-full transition-all duration-700 ease-out ${
                          capacityUtilizedPercent > 95
                            ? "bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                            : capacityUtilizedPercent > 80
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${capacityUtilizedPercent}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-slate-500">
                        Capacity Utilized:{" "}
                        <span className="font-bold text-slate-700">
                          {capacityUtilizedPercent}%
                        </span>
                      </span>
                      <span className="text-slate-400 font-bold">
                        Max Cargo: 45K lbs
                      </span>
                    </div>

                    {hasScannedWeight && (
                      <div className="bg-emerald-50/70 border border-emerald-100 rounded-lg p-2 mt-2 space-y-1">
                        <div className="flex items-center space-x-1.5 text-[10px] text-emerald-800 font-medium">
                          <Sparkles className="h-3 w-3 text-emerald-500 animate-pulse" />
                          <span>AI-OCR Weight Extraction Match Success</span>
                        </div>
                        <p className="text-[9px] text-slate-600 font-mono leading-normal">
                          Extracted{" "}
                          <strong className="text-emerald-700 font-bold">
                            {currentWeight.toLocaleString()} lbs
                          </strong>{" "}
                          from scanned{" "}
                          <strong className="text-slate-700 font-bold truncate max-w-[150px] inline-block align-bottom">
                            {scannedWeights[0].fileName}
                          </strong>
                          . Weight is verified within legal dry-van highway
                          freight tolerances.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-100 text-xs font-mono text-slate-600">
                    <div>
                      Manifest Weight:{" "}
                      <span className="font-bold text-slate-800">
                        {myShipment.weightLbs.toLocaleString()} lbs
                      </span>
                    </div>
                    <div>
                      Pallets:{" "}
                      <span className="font-bold text-slate-800">
                        {myShipment.palletCount}
                      </span>
                    </div>
                    <div>
                      Border Manifest:{" "}
                      <span className="font-bold uppercase text-indigo-600">
                        {myShipment.borderConnectStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vertical Stops Timeline */}
                <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-5 my-4">
                  {myShipment.waypoints.map((wpt, idx) => {
                    const isCompleted = wpt.status === "completed";
                    const isArrived = wpt.status === "arrived";
                    return (
                      <div key={wpt.id} className="relative">
                        {/* Dot indicator */}
                        <div
                          className={`absolute -left-[31px] top-1 h-5 w-5 rounded-full border-2 bg-white flex items-center justify-center ${
                            isCompleted
                              ? "border-emerald-500 text-emerald-500"
                              : isArrived
                              ? "border-amber-500 text-amber-500 animate-pulse"
                              : "border-slate-300 text-slate-400"
                          }`}
                        >
                          {isCompleted ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          )}
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div>
                            <span className="text-3xs font-mono uppercase font-bold text-slate-500">
                              Stop #{idx + 1} ({wpt.stopType.replace("_", " ")})
                            </span>
                            <h4 className="text-xs font-bold text-slate-900">
                              {wpt.companyName}
                            </h4>
                            <p className="text-2xs text-slate-500">
                              {wpt.address}
                            </p>

                            {wpt.weight && (
                              <span className="inline-block mt-1 text-3xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                LTL: {wpt.pieces} Pcs / {wpt.weight} lbs
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <span className="text-2xs font-mono text-slate-500 mr-2">
                              {wpt.actualTime
                                ? `Completed ${new Date(
                                    wpt.actualTime
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}`
                                : `Sched: ${new Date(
                                    wpt.scheduledTime
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}`}
                            </span>

                            {!isCompleted && (
                              <div className="flex flex-col items-end space-y-1">
                                {(() => {
                                  const isGeofencedStop =
                                    wpt.stopType === "pickup" ||
                                    wpt.stopType === "delivery";
                                  const inRange =
                                    !isGeofencedStop || isStopWithinRange(wpt);
                                  const distanceText = getStopDistanceText(wpt);
                                  return (
                                    <>
                                      <button
                                        onClick={() => {
                                          if (isGeofencedStop && !inRange)
                                            return;
                                          if (wpt.stopType === "pickup") {
                                            setPendingPickupWaypointId(wpt.id);
                                            setIsPickupModalOpen(true);
                                          } else if (
                                            wpt.stopType === "delivery"
                                          ) {
                                            setPendingDeliveryWaypointId(
                                              wpt.id
                                            );
                                            setIsDeliveryModalOpen(true);
                                          } else {
                                            handleCompleteStop(wpt.id);
                                          }
                                        }}
                                        disabled={isGeofencedStop && !inRange}
                                        className={`px-3 py-1 text-2xs font-bold rounded flex items-center space-x-1 transition-all ${
                                          inRange
                                            ? "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-sm"
                                            : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-80"
                                        }`}
                                      >
                                        {isGeofencedStop && !inRange && (
                                          <Shield className="h-3.5 w-3.5 text-rose-500 mr-0.5 inline-block shrink-0" />
                                        )}
                                        <span>
                                          {wpt.stopType === "pickup"
                                            ? "Sign Pick Up"
                                            : wpt.stopType === "border_crossing"
                                            ? "Logged Crossing"
                                            : "Sign Delivery / POD"}
                                        </span>
                                      </button>

                                      {isGeofencedStop && (
                                        <span
                                          className={`text-[10px] font-mono font-bold uppercase tracking-tight ${
                                            inRange
                                              ? "text-emerald-600"
                                              : "text-rose-500"
                                          }`}
                                        >
                                          {inRange
                                            ? `In Range (${distanceText})`
                                            : `Too Far (${distanceText})`}
                                        </span>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Driver Notes Section */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="driver-notes-textarea"
                      className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      Driver Shipment Notes (Dispatch Review)
                    </label>
                    {notesSaved && (
                      <span className="text-3xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 animate-pulse">
                        ✓ Note Saved to Shipment
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <textarea
                      id="driver-notes-textarea"
                      value={driverNotes}
                      onChange={(e) => setDriverNotes(e.target.value)}
                      placeholder="Add any loading dock delays, gate codes, route detours, or shipment condition details for dispatch review..."
                      className="flex-1 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-lg p-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none min-h-[70px] resize-y transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleSaveNotes}
                      className="px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs rounded-lg transition-colors flex flex-col items-center justify-center gap-1 shrink-0 cursor-pointer min-w-[90px]"
                    >
                      <Check className="h-4 w-4" />
                      <span>Save Note</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center text-slate-500 text-xs">
              No active shipments assigned. Contact Keith in dispatch to receive
              LTL manifest coordinates.
            </div>
          )}

          {/* Real-time Document Scanned / OCR Extraction */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Real-time Document Collector & AI-OCR Parser
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Scans Bills of Lading (BOL), Proof of Delivery (POD), and fuel
                  receipts using Gemini server-side vision.
                </p>
              </div>
            </div>

            <div
              className={`grid grid-cols-1 ${
                isMobileMode ? "" : "md:grid-cols-12"
              } gap-5`}
            >
              {/* Document selection and upload simulation */}
              <div
                className={
                  isMobileMode ? "space-y-4" : "md:col-span-5 space-y-4"
                }
              >
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase">
                    Document Class
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs bg-white"
                  >
                    <option value="bol">Bill of Lading (BOL)</option>
                    <option value="pod">Proof of Delivery (POD)</option>
                    <option value="fuel_receipt">Fuel / Diesel Receipt</option>
                    <option value="scale_ticket">Scale weight ticket</option>
                    <option value="skid_picture">
                      Skid Picture (Pickup / Condition)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase">
                    Load / Shipment Number{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={parserLoadId}
                    onChange={(e) => setParserLoadId(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs bg-white focus:outline-none focus:border-indigo-500"
                  >
                    {shipments.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.trackingNumber} — {s.originCity} to{" "}
                        {s.destinationCity}
                      </option>
                    ))}
                    <option value="custom">
                      -- Enter custom load number manually --
                    </option>
                  </select>
                  {parserLoadId === "custom" && (
                    <input
                      type="text"
                      placeholder="Type Custom Load / Tracking Number"
                      value={parserCustomLoadNumber}
                      onChange={(e) =>
                        setParserCustomLoadNumber(e.target.value)
                      }
                      className="mt-1.5 block w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs bg-white focus:outline-none focus:border-indigo-500"
                    />
                  )}
                </div>

                {docType === "skid_picture" ? (
                  <div
                    id="skid-capture-dashboard"
                    className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xs font-bold text-indigo-900 uppercase font-mono tracking-wider">
                        Pallet condition batch capture
                      </span>
                      {skidPhotos.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSkidPhotos([])}
                          className="text-3xs text-rose-600 hover:text-rose-700 font-bold uppercase tracking-wider cursor-pointer"
                        >
                          Clear Batch
                        </button>
                      )}
                    </div>

                    {skidPhotos.length === 0 ? (
                      <div className="border border-dashed border-slate-300 rounded-lg p-6 text-center bg-white">
                        <Camera className="h-6 w-6 text-slate-400 mx-auto animate-pulse" />
                        <span className="block text-xs font-semibold text-slate-600 mt-2">
                          No pallet photos captured yet
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Select Skid Picture to launch camera automatically, or
                          click below to launch manually.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          {skidPhotos.map((pic, i) => (
                            <div
                              key={i}
                              className="relative rounded-md overflow-hidden aspect-video border border-slate-200 bg-slate-900"
                            >
                              <img
                                src={pic}
                                alt="skid preview"
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute bottom-1 right-1 bg-slate-950/80 text-[8px] font-bold font-mono px-1 py-0.2 text-white rounded">
                                #{i + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                        <span className="block text-[10px] text-emerald-600 font-mono font-bold">
                          ✓ {skidPhotos.length} Pallet condition photos ready in
                          sequential batch
                        </span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => startSkidCamera()}
                      className="w-full flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold cursor-pointer border border-indigo-200 transition-colors"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <span>
                        {skidPhotos.length > 0
                          ? `Capture More Photos (${skidPhotos.length})`
                          : "Launch Skid Condition Camera"}
                      </span>
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-5 text-center cursor-pointer bg-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <Upload className="h-6 w-6 text-slate-400 mx-auto" />
                    <span className="block text-xs font-semibold text-slate-800 mt-2">
                      {fileName ? fileName : "Upload signed receipt image"}
                    </span>
                    <span className="block text-3xs text-slate-500 mt-1">
                      PNG, JPG or PDF up to 10MB
                    </span>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*,application/pdf"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase">
                    OCR Text Fallback (or test input)
                  </label>
                  <textarea
                    value={fileText}
                    onChange={(e) => setFileText(e.target.value)}
                    rows={3}
                    placeholder="Provide description or mock text if not uploading an image file to trigger Gemini's simulation parsing..."
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  onClick={handleParseDocument}
                  disabled={
                    ocrLoading ||
                    (docType === "skid_picture" && skidPhotos.length === 0)
                  }
                  className="w-full flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                >
                  {ocrLoading ? (
                    <>
                      <span className="animate-spin h-3.5 w-3.5 border-2 border-slate-400 border-t-white rounded-full mr-2" />
                      <span>Gemini Analyzing Document...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 text-indigo-200" />
                      <span>
                        {docType === "skid_picture"
                          ? "Submit Skid Condition Batch"
                          : "Submit Document to Billing"}
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Parsed Output Panel */}
              <div className={isMobileMode ? "" : "md:col-span-7"}>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 h-full min-h-[220px] flex flex-col justify-between">
                  {ocrError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-rose-800 font-sans">
                          Gemini API OCR Notice
                        </div>
                        <div className="text-2xs text-rose-700 mt-0.5">
                          {ocrError}
                        </div>
                      </div>
                    </div>
                  )}

                  {extractedResult ? (
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="text-xs font-bold text-indigo-900 font-mono uppercase tracking-wider">
                          AI Extraction Results
                        </span>
                        <span className="text-3xs font-bold font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                          Confidence {extractedResult.confidence}%
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-2xs font-mono text-slate-700">
                        <div>
                          <span className="text-slate-400 text-3xs uppercase">
                            BOL Number
                          </span>
                          <div className="font-bold text-slate-800 mt-0.5">
                            {extractedResult.bolNumber || "N/A"}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-3xs uppercase">
                            Purchase Order
                          </span>
                          <div className="font-bold text-slate-800 mt-0.5">
                            {extractedResult.purchaseOrder || "N/A"}
                          </div>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400 text-3xs uppercase">
                            Shipper (Pickup)
                          </span>
                          <div className="font-bold text-slate-800 mt-0.5">
                            {extractedResult.shipperName || "N/A"}
                          </div>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400 text-3xs uppercase">
                            Consignee (Delivery)
                          </span>
                          <div className="font-bold text-slate-800 mt-0.5">
                            {extractedResult.consigneeName || "N/A"}
                          </div>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400 text-3xs uppercase">
                            Cargo Items & Pallets
                          </span>
                          <div className="font-bold text-slate-800 mt-0.5">
                            {extractedResult.items || "N/A"}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-3xs uppercase">
                            Weight (Lbs)
                          </span>
                          <div className="font-bold text-slate-800 mt-0.5">
                            {extractedResult.weightLbs
                              ? `${extractedResult.weightLbs} Lbs`
                              : "N/A"}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-3xs uppercase">
                            Signature Detected
                          </span>
                          <div className="font-bold text-slate-800 mt-0.5">
                            {extractedResult.signatureFound
                              ? "\u2705 Signed"
                              : "\u274C No Signature"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : !ocrLoading ? (
                    <div className="flex flex-col items-center justify-center text-center text-slate-400 my-auto py-10">
                      <FileText className="h-10 w-10 text-slate-300 stroke-1" />
                      <p className="text-xs font-semibold text-slate-600 mt-3">
                        Awaiting Scan Document
                      </p>
                      <p className="text-2xs text-slate-500 mt-1 max-w-[300px]">
                        Upload or describe a shipping document, click \"Submit
                        Document to Billing\" to verify, match BOL, and trigger
                        OCR extraction.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center text-indigo-600 my-auto py-10">
                      <div className="relative flex items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-indigo-400 opacity-75" />
                        <div className="relative bg-indigo-600 text-white rounded-full h-10 w-10 flex items-center justify-center shadow-lg font-bold">
                          AI
                        </div>
                      </div>
                      <p className="text-xs font-bold text-slate-800 mt-4 animate-pulse">
                        Running OCR & Key-value Extraction...
                      </p>
                      <p className="text-3xs text-slate-500 mt-1">
                        Verifying signatures and parsing shipment manifest
                        weight scales.
                      </p>
                    </div>
                  )}

                  {extractedResult && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 flex items-center space-x-2 mt-4 text-emerald-800 text-3xs">
                      <CheckCircle className="h-4 w-4 shrink-0" />
                      <span>
                        Document matched successfully with load registry and
                        sent to Billing & Safety teams for administrative
                        routing approval.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Messenger & document log history */}
        <div className={isMobileMode ? "space-y-6" : "lg:col-span-4 space-y-6"}>
          {/* Samsara Driver Compliance & Telemetry card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <h4 className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wide">
                  Samsara Fleet Compliance
                </h4>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                ID: SAM-GW-9018
              </span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
                <span className="font-medium">ELD Carrier Registry:</span>
                <span className="font-mono font-bold text-slate-800">
                  USDOT 3821092-A
                </span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
                <span className="font-medium">Current Fuel Range:</span>
                <span className="font-mono font-bold text-emerald-700">
                  78% (Estimated 410 mi)
                </span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
                <span className="font-medium">GPS Dispatch Connection:</span>
                <span className="font-mono font-bold text-indigo-700">
                  98.4 Kbps (Secure TLS)
                </span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-3xs text-amber-900 leading-relaxed flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>HOS SAFETY COMPLIANCE WARNING:</strong> Always complete
                pre-trip DVIR logs in the Samsara terminal before transitioning
                to "On Duty - Driving" status. Ensure all weight tickets are
                processed through OCR within 3 hours.
              </span>
            </div>
          </div>

          {/* My Uploaded Documents Logs */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                {filteredDocLogs.length > 0 && (
                  <input
                    type="checkbox"
                    checked={
                      filteredDocLogs.length > 0 &&
                      filteredDocLogs.every((d) =>
                        selectedDocIds.includes(d.id)
                      )
                    }
                    ref={(el) => {
                      if (el) {
                        const someSelected = filteredDocLogs.some((d) =>
                          selectedDocIds.includes(d.id)
                        );
                        const allSelected = filteredDocLogs.every((d) =>
                          selectedDocIds.includes(d.id)
                        );
                        el.indeterminate = someSelected && !allSelected;
                      }
                    }}
                    onChange={(e) =>
                      handleSelectAllFilteredDocs(e.target.checked)
                    }
                    className="h-3.5 w-3.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                    title="Select / deselect all filtered documents"
                  />
                )}
                <h4 className="text-xs font-bold text-slate-800 uppercase font-mono">
                  Scanned Logistics Document logs ({myDocuments.length})
                </h4>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <label
                  htmlFor="doc-status-filter"
                  className="text-[10px] font-bold text-slate-400 uppercase font-mono"
                >
                  Filter:
                </label>
                <select
                  id="doc-status-filter"
                  value={docLogFilter}
                  onChange={(e) => setDocLogFilter(e.target.value)}
                  className="text-2xs bg-slate-50 border border-slate-200 rounded-md px-2 py-0.5 font-sans text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="all">All Documents</option>
                  <option value="pending_review">Pending Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {selectedDocIds.length > 0 && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <div className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold font-mono">
                    {selectedDocIds.length} Selected
                  </div>
                  <span className="text-2xs font-medium text-indigo-950">
                    Bulk actions on selected logistics records
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <button
                    type="button"
                    onClick={handleBulkDownload}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-md text-3xs font-bold text-slate-700 hover:text-slate-800 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Download className="h-3 w-3" />
                    <span>Download Selected</span>
                  </button>

                  <div className="h-4 w-[1px] bg-indigo-200/60 hidden sm:block" />

                  <span className="text-3xs font-bold uppercase text-slate-400 font-mono tracking-wider">
                    Set Status:
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleBulkStatusUpdate("approved")}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-3xs font-bold shadow-2xs transition-colors cursor-pointer"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkStatusUpdate("rejected")}
                      className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-3xs font-bold shadow-2xs transition-colors cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkStatusUpdate("pending_review")}
                      className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-3xs font-bold shadow-2xs transition-colors cursor-pointer"
                    >
                      Pending
                    </button>
                  </div>
                </div>
              </div>
            )}

            {myDocuments.length === 0 ? (
              <p className="text-3xs text-slate-400 text-center py-6">
                No shipping receipts uploaded on this trip yet.
              </p>
            ) : filteredDocLogs.length === 0 ? (
              <p className="text-3xs text-slate-400 text-center py-6">
                No documents match the selected filter.
              </p>
            ) : (
              <div className="space-y-2">
                {filteredDocLogs.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedLogDoc(doc)}
                    className="w-full p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between hover:bg-slate-100/85 transition-all text-left cursor-pointer group"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                      {/* Individual Checkbox */}
                      <div
                        className="flex items-center shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedDocIds.includes(doc.id)}
                          onChange={() => handleToggleSelectDoc(doc.id)}
                          className="h-3.5 w-3.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                        />
                      </div>

                      {/* Clickable Small Thumbnail Preview Icon */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLogDoc(doc);
                        }}
                        className="relative h-10 w-10 rounded-md overflow-hidden bg-slate-200 border border-slate-300 shadow-2xs shrink-0 cursor-pointer group/thumb hover:ring-2 hover:ring-indigo-500 transition-all"
                        title="Click to view visual document content"
                      >
                        <img
                          src={getDocumentImage(doc)}
                          alt={doc.fileName}
                          className="h-full w-full object-cover group-hover/thumb:scale-110 transition-transform duration-200"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                          <Eye className="h-4 w-4 text-white" />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-2xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors flex items-center gap-1">
                          {doc.fileName}
                          {doc.internalNote && (
                            <span
                              className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"
                              title="Has internal admin note"
                            />
                          )}
                        </div>
                        <div className="text-3xs text-slate-500 font-mono capitalize flex items-center gap-1 flex-wrap">
                          <span>
                            {doc.type.replace("_", " ")} • {doc.fileSize}
                          </span>
                          {doc.internalNote && (
                            <span
                              className="text-amber-600 font-sans font-semibold text-[9px] truncate max-w-[150px] bg-amber-50 px-1 rounded"
                              title={doc.internalNote}
                            >
                              Note: {doc.internalNote}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-mono font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0 ml-2 border flex items-center gap-1 ${
                        doc.status === "approved" ||
                        doc.status === "matched_to_invoice"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                          : doc.status === "rejected"
                          ? "bg-rose-50 text-rose-700 border-rose-200/60"
                          : "bg-amber-50 text-amber-700 border-amber-200/60"
                      }`}
                    >
                      <span
                        className={`w-1 h-1 rounded-full ${
                          doc.status === "approved" ||
                          doc.status === "matched_to_invoice"
                            ? "bg-emerald-500"
                            : doc.status === "rejected"
                            ? "bg-rose-500"
                            : "bg-amber-500"
                        }`}
                      />
                      {doc.status === "pending_review"
                        ? "pending"
                        : doc.status === "matched_to_invoice"
                        ? "approved"
                        : doc.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Details Modal */}
      {selectedLogDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900">
                      {selectedLogDoc.fileName}
                    </h3>
                    <span
                      className={`text-[8px] font-mono font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border flex items-center gap-0.5 ${
                        selectedLogDoc.status === "approved" ||
                        selectedLogDoc.status === "matched_to_invoice"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                          : selectedLogDoc.status === "rejected"
                          ? "bg-rose-50 text-rose-700 border-rose-200/60"
                          : "bg-amber-50 text-amber-700 border-amber-200/60"
                      }`}
                    >
                      <span
                        className={`w-1 h-1 rounded-full ${
                          selectedLogDoc.status === "approved" ||
                          selectedLogDoc.status === "matched_to_invoice"
                            ? "bg-emerald-500"
                            : selectedLogDoc.status === "rejected"
                            ? "bg-rose-500"
                            : "bg-amber-500"
                        }`}
                      />
                      {selectedLogDoc.status === "pending_review"
                        ? "pending"
                        : selectedLogDoc.status === "matched_to_invoice"
                        ? "approved"
                        : selectedLogDoc.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 capitalize">
                    {selectedLogDoc.type.replace("_", " ")} •{" "}
                    {selectedLogDoc.fileSize}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handlePrintDocument(selectedLogDoc)}
                  className="p-1.5 hover:bg-slate-100 hover:text-slate-800 rounded-lg text-slate-500 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  title="Print simplified document"
                >
                  <Printer className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDownloadDocument(selectedLogDoc)}
                  className="p-1.5 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-slate-500 transition-colors flex items-center justify-center gap-1"
                  title="Download document file"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setSelectedLogDoc(null)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto space-y-6">
              {/* Document Image Placeholder / Photo Gallery */}
              {selectedLogDoc.type === "skid_picture" &&
              selectedLogDoc.skidPictures &&
              selectedLogDoc.skidPictures.length > 0 ? (
                <div className="space-y-3">
                  <span className="block text-2xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                    Captured Pallet Condition Photos (
                    {selectedLogDoc.skidPictures.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedLogDoc.skidPictures.map((pic, idx) => (
                      <div
                        key={idx}
                        className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-900 group"
                      >
                        <img
                          src={pic}
                          alt={`Pallet condition ${idx + 1}`}
                          className="w-full h-44 object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-2 left-2 bg-slate-950/80 text-[10px] font-mono font-bold px-2 py-0.5 text-white rounded">
                          PHOTO #{idx + 1}
                        </div>
                        <div className="absolute bottom-2 right-2 bg-emerald-600/90 text-[9px] font-bold font-mono px-2 py-0.5 text-white rounded">
                          SAMSARA VERIFIED
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <span className="block text-2xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                    Scanned Document Visual Preview
                  </span>
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-950 group shadow-sm">
                    <img
                      src={getDocumentImage(selectedLogDoc)}
                      alt={selectedLogDoc.fileName}
                      className="w-full h-56 sm:h-64 object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-xs text-[10px] font-mono font-bold px-2.5 py-1 text-white rounded-lg border border-slate-700/50 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>OCR OPTIMIZED</span>
                    </div>
                    <div className="absolute bottom-3 right-3 bg-indigo-600/90 backdrop-blur-xs text-[9px] font-bold font-mono px-2.5 py-1 text-white rounded-lg border border-indigo-500/50">
                      SAMSARA SECURE
                    </div>
                  </div>
                </div>
              )}

              {/* Extracted Metadata */}
              {selectedLogDoc.extractedData && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono border-b border-slate-200 pb-2">
                    Extracted Metadata
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedLogDoc.extractedData.shipperName && (
                      <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                        <span className="block text-3xs font-bold text-slate-500 uppercase mb-0.5">
                          Shipper
                        </span>
                        <span
                          className="block text-xs font-semibold text-slate-900 truncate"
                          title={selectedLogDoc.extractedData.shipperName}
                        >
                          {selectedLogDoc.extractedData.shipperName}
                        </span>
                      </div>
                    )}
                    {selectedLogDoc.extractedData.consigneeName && (
                      <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                        <span className="block text-3xs font-bold text-slate-500 uppercase mb-0.5">
                          Consignee
                        </span>
                        <span
                          className="block text-xs font-semibold text-slate-900 truncate"
                          title={selectedLogDoc.extractedData.consigneeName}
                        >
                          {selectedLogDoc.extractedData.consigneeName}
                        </span>
                      </div>
                    )}
                    {selectedLogDoc.extractedData.bolNumber && (
                      <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                        <span className="block text-3xs font-bold text-slate-500 uppercase mb-0.5">
                          BOL Number
                        </span>
                        <span className="block text-xs font-semibold text-slate-900">
                          {selectedLogDoc.extractedData.bolNumber}
                        </span>
                      </div>
                    )}
                    {selectedLogDoc.extractedData.purchaseOrder && (
                      <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                        <span className="block text-3xs font-bold text-slate-500 uppercase mb-0.5">
                          PO Number
                        </span>
                        <span className="block text-xs font-semibold text-slate-900">
                          {selectedLogDoc.extractedData.purchaseOrder}
                        </span>
                      </div>
                    )}
                    {selectedLogDoc.extractedData.weightLbs && (
                      <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                        <span className="block text-3xs font-bold text-slate-500 uppercase mb-0.5">
                          Weight
                        </span>
                        <span className="block text-xs font-semibold text-slate-900">
                          {selectedLogDoc.extractedData.weightLbs} Lbs
                        </span>
                      </div>
                    )}
                    {selectedLogDoc.extractedData.signatureFound !== void 0 && (
                      <div className="bg-slate-50 p-2.5 rounded border border-slate-100 flex flex-col justify-center">
                        <span className="block text-3xs font-bold text-slate-500 uppercase mb-0.5">
                          Signature
                        </span>
                        <div className="flex items-center space-x-1">
                          {selectedLogDoc.extractedData.signatureFound ? (
                            <>
                              <CheckCircle className="h-3 w-3 text-emerald-600" />
                              <span className="text-xs font-semibold text-emerald-700">
                                Signed
                              </span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-3 w-3 text-amber-600" />
                              <span className="text-xs font-semibold text-amber-700">
                                Missing
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedLogDoc.extractedData.items && (
                    <div className="bg-slate-50 p-3 rounded border border-slate-100 mt-2">
                      <span className="block text-3xs font-bold text-slate-500 uppercase mb-1">
                        Cargo Details / Items
                      </span>
                      <p className="text-xs text-slate-800 leading-relaxed">
                        {selectedLogDoc.extractedData.items}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Internal Note Section for Administrators */}
              <div className="bg-amber-50/40 border border-amber-200/60 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                      Internal Administration Note
                    </span>
                  </div>
                  {selectedLogDoc.internalNote && (
                    <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded">
                      Saved Note Active
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 leading-normal">
                  Leave administrative context for drivers or dispatchers (e.g.
                  why a document was rejected, or instructions for re-upload).
                </p>

                <div className="space-y-2">
                  <textarea
                    value={internalNoteText}
                    onChange={(e) => setInternalNoteText(e.target.value)}
                    placeholder="Enter internal note or reason for rejection (e.g., 'incorrect weight', 'blurry receipt')..."
                    className="w-full h-20 text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white placeholder-slate-400 font-sans leading-relaxed resize-none text-slate-800"
                  />
                  <div className="flex justify-end items-center gap-2">
                    {noteSaved && (
                      <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" /> Note saved
                        successfully
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveInternalNote}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- PICKUP MANIFEST UPLOAD POPUP -------------------- */}
      {isPickupModalOpen && (
        <div
          id="driver-pickup-popup"
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50"
        >
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 border border-slate-200 shadow-2xl relative overflow-hidden text-slate-800 space-y-5 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-sans">
                    Log Picked Up Load &amp; Documents
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono uppercase">
                    Shipment ID: {myShipment?.trackingNumber || "LS-90281-CAN"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPickupModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Error banner */}
            {pickupError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-2xs flex items-start space-x-2 font-medium">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{pickupError}</span>
              </div>
            )}

            {/* Form Fields / Drop zones */}
            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-200/60 text-2xs text-slate-600 leading-normal space-y-1">
                <p>
                  <strong>Shipper Check-In:</strong>{" "}
                  {myShipment?.shipperName || "AeroParts Hub"}.
                </p>
                <p className="font-mono text-3xs text-slate-400">
                  {myShipment?.shipperAddress || "Detroit, MI"}
                </p>
              </div>

              {/* Load Selector */}
              <div className="space-y-1.5 p-3.5 bg-indigo-50/40 rounded-xl border border-indigo-100/50">
                <label className="text-3xs font-bold font-mono text-indigo-700 uppercase tracking-wider block">
                  Verify / Specify Load Number{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  value={pickupLoadId}
                  onChange={(e) => setPickupLoadId(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 h-9 cursor-pointer shadow-xs"
                >
                  {shipments.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.trackingNumber} — {s.originCity} to {s.destinationCity}{" "}
                      ({s.cargoDescription})
                    </option>
                  ))}
                  <option value="custom">
                    -- Enter custom load number manually --
                  </option>
                </select>

                {pickupLoadId === "custom" && (
                  <input
                    type="text"
                    placeholder="Type Custom Load / Tracking Number"
                    value={pickupCustomLoadNumber}
                    onChange={(e) => setPickupCustomLoadNumber(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 h-9 mt-2 shadow-xs"
                  />
                )}
              </div>

              {/* 1. BOL File Upload */}
              <div className="space-y-1.5">
                <label className="text-3xs font-bold font-mono text-slate-500 uppercase tracking-wider block">
                  1. Bill of Lading (BOL) Document{" "}
                  <span className="text-rose-500">*</span>
                </label>

                {pickupBolFile ? (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-center space-x-2.5 truncate">
                      <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="truncate">
                        <span className="block text-xs font-bold text-slate-800 truncate">
                          {pickupBolFile.name}
                        </span>
                        <span className="block text-3xs font-mono text-slate-400">
                          {pickupBolFile.size}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setPickupBolFile(null)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-5 text-center transition-colors relative bg-slate-50/30">
                    <input
                      type="file"
                      id="pickup-bol-input"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleBolChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <FileText className="h-8 w-8 text-slate-400 mx-auto mb-1.5" />
                    <span className="block text-xs font-bold text-slate-700">
                      Drag &amp; drop BOL or click
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      Supports PDF, PNG, JPG (Max 5MB)
                    </span>
                  </div>
                )}
              </div>

              {/* 2. Skid Picture Upload */}
              <div className="space-y-1.5">
                <label className="text-3xs font-bold font-mono text-slate-500 uppercase tracking-wider block">
                  2. Pallet / Skid Loading Picture{" "}
                  <span className="text-rose-500">*</span>
                </label>

                {pickupSkidFile ? (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-center space-x-2.5 truncate">
                      {pickupSkidFile.dataUrl.startsWith("data:") ? (
                        <div className="h-10 w-10 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                          <img
                            src={pickupSkidFile.dataUrl}
                            alt="Skid Preview"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
                          <Image className="h-4 w-4" />
                        </div>
                      )}
                      <div className="truncate">
                        <span className="block text-xs font-bold text-slate-800 truncate">
                          {pickupSkidFile.name}
                        </span>
                        <span className="block text-3xs font-mono text-slate-400">
                          {pickupSkidFile.size}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setPickupSkidFile(null)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-5 text-center transition-colors relative bg-slate-50/30">
                    <input
                      type="file"
                      id="pickup-skid-input"
                      accept="image/*"
                      onChange={handleSkidPicChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <Camera className="h-8 w-8 text-slate-400 mx-auto mb-1.5" />
                    <span className="block text-xs font-bold text-slate-700">
                      Take or upload Skid Photo
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      Required for cargo condition verification
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <button
                type="button"
                onClick={handleLoadDemoPickup}
                className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center space-x-1 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>⚡ Auto-fill Demo Files</span>
              </button>

              <div className="flex space-x-2 sm:ml-auto w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsPickupModalOpen(false)}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitPickup}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Confirm &amp; Log Pick Up
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- DELIVERY POD UPLOAD POPUP -------------------- */}
      {isDeliveryModalOpen && (
        <div
          id="driver-delivery-popup"
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50"
        >
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 border border-slate-200 shadow-2xl relative overflow-hidden text-slate-800 space-y-5 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-sans">
                    Complete Delivery &amp; Upload POD
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono uppercase">
                    Shipment ID: {myShipment?.trackingNumber || "LS-90281-CAN"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDeliveryModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Error banner */}
            {deliveryError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-2xs flex items-start space-x-2 font-medium">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{deliveryError}</span>
              </div>
            )}

            {/* Form Fields / Drop zones */}
            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-200/60 text-2xs text-slate-600 leading-normal space-y-1">
                <p>
                  <strong>Consignee Delivery:</strong>{" "}
                  {myShipment?.consigneeName || "Midwest Assembly"}.
                </p>
                <p className="font-mono text-3xs text-slate-400">
                  {myShipment?.consigneeAddress || "Chicago, IL"}
                </p>
              </div>

              {/* Load Selector */}
              <div className="space-y-1.5 p-3.5 bg-emerald-50/40 rounded-xl border border-emerald-100/50">
                <label className="text-3xs font-bold font-mono text-emerald-700 uppercase tracking-wider block">
                  Verify / Specify Load Number{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  value={deliveryLoadId}
                  onChange={(e) => setDeliveryLoadId(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 h-9 cursor-pointer shadow-xs"
                >
                  {shipments.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.trackingNumber} — {s.originCity} to {s.destinationCity}{" "}
                      ({s.cargoDescription})
                    </option>
                  ))}
                  <option value="custom">
                    -- Enter custom load number manually --
                  </option>
                </select>

                {deliveryLoadId === "custom" && (
                  <input
                    type="text"
                    placeholder="Type Custom Load / Tracking Number"
                    value={deliveryCustomLoadNumber}
                    onChange={(e) =>
                      setDeliveryCustomLoadNumber(e.target.value)
                    }
                    className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 h-9 mt-2 shadow-xs"
                  />
                )}
              </div>

              {/* POD File Upload */}
              <div className="space-y-1.5">
                <label className="text-3xs font-bold font-mono text-slate-500 uppercase tracking-wider block">
                  Proof of Delivery (POD) Signed Document{" "}
                  <span className="text-rose-500">*</span>
                </label>

                {deliveryPodFile ? (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-center space-x-2.5 truncate">
                      <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="truncate">
                        <span className="block text-xs font-bold text-slate-800 truncate">
                          {deliveryPodFile.name}
                        </span>
                        <span className="block text-3xs font-mono text-slate-400">
                          {deliveryPodFile.size}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setDeliveryPodFile(null)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-xl p-5 text-center transition-colors relative bg-slate-50/30">
                    <input
                      type="file"
                      id="delivery-pod-input"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handlePodChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <FileText className="h-8 w-8 text-slate-400 mx-auto mb-1.5" />
                    <span className="block text-xs font-bold text-slate-700">
                      Drag &amp; drop signed POD or click
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      Supports scanned sheets or signed paper photos
                    </span>
                  </div>
                )}
              </div>

              {/* Signee / Receiver Name */}
              <div className="space-y-1.5">
                <label
                  htmlFor="consignee-signee-input"
                  className="text-3xs font-bold font-mono text-slate-500 uppercase tracking-wider block"
                >
                  Name of Receiver / Signee{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    id="consignee-signee-input"
                    value={consigneeSignee}
                    onChange={(e) => setConsigneeSignee(e.target.value)}
                    placeholder="e.g. Sgt. John Doe (Dock Supervisor)"
                    className="w-full bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 transition-all h-9"
                  />
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <button
                type="button"
                onClick={handleLoadDemoDelivery}
                className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center space-x-1 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>⚡ Auto-fill Demo POD</span>
              </button>

              <div className="flex space-x-2 sm:ml-auto w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsDeliveryModalOpen(false)}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitDelivery}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Confirm &amp; Log Delivery
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
