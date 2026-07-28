import React, { useState, useEffect } from "react";
import { useDriverStore } from "../stores/useDriverstore";
import { useAssetStore } from "../stores/useAssetStore";
import { useCustomerStore } from "../stores/useCustomerStore";
import WhatsAppChatHub from "./WhatsAppChatHub";
import ShipmentDetailsModal from "./ShipmentDetailsModal";
import {
  Plus,
  MessageSquare,
  Send,
  Compass,
  CheckCircle,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  ExternalLink,
  Sparkles,
  Fuel,
  ArrowRight,
  Gauge,
  Layers,
  Eye,
  ArrowUp,
  ArrowDown,
  Paperclip,
  FileText,
  Image,
} from "lucide-react";
import { useShipmentStore } from "../stores/useShipmentStore";
import { useTripStore } from "../stores/useTripStore";
import { axiosInstance } from "@/lib/axios";
import TripDetailsModal from "./TripDetailModal";
export default function DispatcherDashboard({
  shipments,
  onAddTrip,
  onUpdateTrip,
  onRemoveTrip,
  messages,
  onUpdateShipment,
  onSendMessage,
  onMarkMessagesAsRead,
  currentUser,
}) {
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);

  const { addShipment, isLoading } = useShipmentStore();
  const mockDrivers = useDriverStore((state) => state.drivers);
  const fetchDrivers = useDriverStore((state) => state.fetchDrivers);

  const trucks = useAssetStore((state) => state.trucks);
  const trailors = useAssetStore((state) => state.trailors);
  const fetchTrucks = useAssetStore((state) => state.fetchTrucks);
  const fetchTrailors = useAssetStore((state) => state.fetchTrailors);

  const customers = useCustomerStore((state) => state.customers);
  const fetchCustomers = useCustomerStore((state) => state.fetchCustomers);

  const fetchTrips = useTripStore((state) => state.fetchTrips);
  const trips = useTripStore((state) => state.trips);
  useEffect(() => {
    fetchDrivers();
    fetchTrucks();
    fetchTrailors();
    fetchCustomers();
    fetchTrips();
  }, []);

  const [selectedShipment, setSelectedShipment] = useState(
    shipments[0] || null
  );

  useEffect(() => {
    if (!selectedShipment && shipments && shipments.length > 0) {
      setSelectedShipment(shipments[0]);
    }
  }, [shipments, selectedShipment]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [activeView, setActiveView] = useState("grid");
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [searchField, setSearchField] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loadTypeFilter, setLoadTypeFilter] = useState("all");
  const [commitmentFilter, setCommitmentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("trackingNumber");
  const [sortOrder, setSortOrder] = useState("asc");
  const [formCommitment, setFormCommitment] = useState("normal");
  const [formCommitmentDate, setFormCommitmentDate] = useState("");
  const [formCommitmentTime, setFormCommitmentTime] = useState("");
  const [consolidationDriverId, setConsolidationDriverId] = useState("");
  const [consolidationDriverName, setConsolidationDriverName] = useState("");
  const [consolidationTruck, setConsolidationTruck] = useState("TRK-102");
  const [consolidationTrailer, setConsolidationTrailer] = useState("TRL-504");
  const [selectedConsolidationIds, setSelectedConsolidationIds] = useState([]);
  const [showSelectedTripDetailsId, setShowSelectedTripDetailsId] =
    useState(null);
  const [vehicleType, setVehicleType] = useState(
    "Class 8 Heavy Duty Semi-Truck"
  );
  const [weather, setWeather] = useState("Clear / Dry Roads");
  const [traffic, setTraffic] = useState("Normal Flow");
  const [chatAttachment, setChatAttachment] = useState(null);
  const [editingWaypointId, setEditingWaypointId] = useState(null);
  const [editScheduledTime, setEditScheduledTime] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [customerId, setCustomerId] = useState("CUST001");
  const [customerName, setCustomerName] = useState("AeroParts Manufacturing");
  const [customerEmail, setCustomerEmail] = useState("logistics@aeroparts.com");
  const [customerPhone, setCustomerPhone] = useState("+1 (416) 555-0100");
  const [customerAddress, setCustomerAddress] = useState(
    "150 Industrial Pkwy, Sector 4, Toronto, ON"
  );
  const [pbNum, setPbNum] = useState("");
  const [shipperName, setShipperName] = useState("");
  const [shipperAddress, setShipperAddress] = useState("");
  const [shipperPhone, setShipperPhone] = useState("");
  const [consigneeName, setConsigneeName] = useState("");
  const [consigneeAddress, setConsigneeAddress] = useState("");
  const [consigneePhone, setConsigneePhone] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [driverId, setDriverId] = useState("");
  const [driverName, setDriverName] = useState("Marcus Vance");
  const [truck, setTruck] = useState("TRK-102");
  const [trailer, setTrailer] = useState("TRL-504");
  const [cargo, setCargo] = useState("");
  const [weight, setWeight] = useState(6e3);
  const [pallets, setPallets] = useState(4);
  const [distance, setDistance] = useState(300);
  const [loadType, setLoadType] = useState("LTL");
  const [priority, setPriority] = useState("standard");
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editedShipment, setEditedShipment] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [isUploadingRateCon, setIsUploadingRateCon] = useState(false);
  const getDriverRecommendations = (loadWeight, loadPallets, loadOrigin) => {
    return mockDrivers
      .map((drv) => {
        const activeShipmentsForDriver = shipments.filter(
          (s) => s.driverId === drv.id && s.status !== "delivered"
        );
        const currentWeight = activeShipmentsForDriver.reduce(
          (sum, s) => sum + (s.weightLbs || 0),
          0
        );
        const currentPallets = activeShipmentsForDriver.reduce(
          (sum, s) => sum + (s.palletCount || 0),
          0
        );
        const availableWeight = 45e3 - currentWeight;
        const availablePallets = 26 - currentPallets;
        const hasWeightCapacity = availableWeight >= loadWeight;
        const hasPalletCapacity = availablePallets >= loadPallets;
        let currentRegion = "Midwest Corridor";
        let isNearby = false;
        let distanceMiles = 45;
        if (drv.id === "DRV001") {
          currentRegion = "Toronto/Chicago Corridor";
        } else if (drv.id === "DRV002") {
          currentRegion = "Pacific Northwest";
        } else if (drv.id === "DRV003") {
          currentRegion = "Southwest Region";
        } else if (drv.id === "DRV004") {
          currentRegion = "Great Lakes Local";
        } else if (drv.id === "DRV005") {
          currentRegion = "Northeast Corridor";
        }
        const originLower = (loadOrigin || "").toLowerCase();
        if (
          drv.id === "DRV001" &&
          (originLower.includes("toronto") ||
            originLower.includes("mississauga") ||
            originLower.includes("chicago") ||
            originLower.includes("on") ||
            originLower.includes("il"))
        ) {
          isNearby = true;
          distanceMiles = originLower.includes("toronto") ? 12 : 180;
        } else if (
          drv.id === "DRV002" &&
          (originLower.includes("seattle") ||
            originLower.includes("everett") ||
            originLower.includes("vancouver") ||
            originLower.includes("wa") ||
            originLower.includes("bc"))
        ) {
          isNearby = true;
          distanceMiles = originLower.includes("everett") ? 8 : 115;
        } else if (
          drv.id === "DRV003" &&
          (originLower.includes("fresno") ||
            originLower.includes("nogales") ||
            originLower.includes("ca") ||
            originLower.includes("az") ||
            originLower.includes("tucson"))
        ) {
          isNearby = true;
          distanceMiles = originLower.includes("fresno") ? 15 : 420;
        } else if (
          drv.id === "DRV004" &&
          (originLower.includes("detroit") ||
            originLower.includes("michigan") ||
            originLower.includes("mi") ||
            originLower.includes("chicago"))
        ) {
          isNearby = true;
          distanceMiles = 32;
        } else if (
          drv.id === "DRV005" &&
          (originLower.includes("buffalo") ||
            originLower.includes("newark") ||
            originLower.includes("ny") ||
            originLower.includes("nj") ||
            originLower.includes("new york"))
        ) {
          isNearby = true;
          distanceMiles = originLower.includes("newark") ? 9 : 280;
        } else {
          let hash = 0;
          const comb = drv.name + originLower;
          for (let i = 0; i < comb.length; i++) {
            hash = comb.charCodeAt(i) + ((hash << 5) - hash);
          }
          distanceMiles = Math.abs(hash % 600) + 80;
          isNearby = distanceMiles < 200;
        }
        let score = 0;
        if (hasWeightCapacity) score += 30;
        if (hasPalletCapacity) score += 30;
        if (isNearby) score += 40;
        return {
          driver: drv,
          currentRegion,
          availableWeight,
          availablePallets,
          hasWeightCapacity,
          hasPalletCapacity,
          isNearby,
          distanceMiles,
          score,
        };
      })
      .sort((a, b) => b.score - a.score);
  };
  const filteredAndSortedShipments = React.useMemo(() => {
    return shipments
      .filter((s) => {
        if (statusFilter !== "all" && s.status !== statusFilter) return false;
        if (loadTypeFilter !== "all" && s.loadType !== loadTypeFilter)
          return false;
        if (commitmentFilter !== "all") {
          if (
            commitmentFilter === "normal" &&
            s.deliveryCommitment !== "normal" &&
            s.deliveryCommitment !== void 0
          )
            return false;
          if (
            commitmentFilter === "guaranteed" &&
            s.deliveryCommitment !== "guaranteed"
          )
            return false;
          if (
            commitmentFilter === "appointment" &&
            s.deliveryCommitment !== "guaranteed_appointment"
          )
            return false;
        }
        if (globalSearchQuery.trim() !== "") {
          const query = globalSearchQuery.toLowerCase();
          const matchesTracking = s.load_number.toLowerCase().includes(query);
          const matchesCustomer = s.customer_name.toLowerCase().includes(query);
          const matchesDriver = s.driver_name.toLowerCase().includes(query);
          const matchesCity =
            s.customer_billing_address.toLowerCase().includes(query) ||
            s.destination.toLowerCase().includes(query);
          const shipperNames = s?.waypoints
            ?.filter((w) => w.stopType === "pickup")
            ?.map((w) => w.companyName.toLowerCase());
          const matchesShipperName = shipperNames?.some((name) =>
            name.includes(query)
          );
          const shipperAddresses = s?.waypoints
            ?.filter((w) => w.stopType === "pickup")
            ?.map((w) => w.address.toLowerCase());
          const matchesShipperAddress = shipperAddresses?.some((addr) =>
            addr.includes(query)
          );
          const consigneeNames = s?.waypoints
            ?.filter((w) => w.stopType === "delivery")
            ?.map((w) => w.companyName.toLowerCase());
          const matchesConsigneeName = consigneeNames?.some((name) =>
            name.includes(query)
          );
          const consigneeAddresses = s?.waypoints
            ?.filter((w) => w.stopType === "delivery")
            ?.map((w) => w.address.toLowerCase());
          const matchesConsigneeAddress = consigneeAddresses?.some((addr) =>
            addr.includes(query)
          );
          const matchesPickupLocation = s.customer_billing_address
            .toLowerCase()
            .includes(query);
          const matchesDeliveryLocation = s.destination
            .toLowerCase()
            .includes(query);
          if (searchField === "trackingNumber") return matchesTracking;
          if (searchField === "customerName") return matchesCustomer;
          if (searchField === "shipperName") return matchesShipperName;
          if (searchField === "shipperAddress") return matchesShipperAddress;
          if (searchField === "consigneeName") return matchesConsigneeName;
          if (searchField === "consigneeAddress")
            return matchesConsigneeAddress;
          if (searchField === "pickupLocation") return matchesPickupLocation;
          if (searchField === "deliveryLocation")
            return matchesDeliveryLocation;
          return (
            matchesTracking ||
            matchesCustomer ||
            matchesDriver ||
            matchesCity ||
            matchesShipperName ||
            matchesShipperAddress ||
            matchesConsigneeName ||
            matchesConsigneeAddress
          );
        }
        return true;
      })
      .sort((a, b) => {
        let compareValue = 0;
        if (sortBy === "trackingNumber") {
          const numA = parseInt(a.trackingNumber, 10) || 0;
          const numB = parseInt(b.trackingNumber, 10) || 0;
          compareValue = numA - numB;
        } else if (sortBy === "weight") {
          compareValue = a.weightLbs - b.weightLbs;
        } else if (sortBy === "distance") {
          compareValue = a.totalDistanceMiles - b.totalDistanceMiles;
        } else if (sortBy === "eta") {
          compareValue = new Date(a.eta).getTime() - new Date(b.eta).getTime();
        } else if (sortBy === "customerName") {
          compareValue = a.customerName.localeCompare(b.customerName);
        } else if (sortBy === "pickupLocation") {
          compareValue = a.originCity.localeCompare(b.originCity);
        } else if (sortBy === "deliveryLocation") {
          compareValue = a.destinationCity.localeCompare(b.destinationCity);
        } else if (sortBy === "shipperName") {
          const nameA = a.waypoints
            .filter((w) => w.stopType === "pickup")
            .map((w) => w.companyName)
            .join(", ");
          const nameB = b.waypoints
            .filter((w) => w.stopType === "pickup")
            .map((w) => w.companyName)
            .join(", ");
          compareValue = nameA.localeCompare(nameB);
        } else if (sortBy === "shipperAddress") {
          const addrA = a?.waypoints
            ?.filter((w) => w.stopType === "pickup")
            .map((w) => w.address)
            .join(", ");
          const addrB = b.waypoints
            .filter((w) => w.stopType === "pickup")
            .map((w) => w.address)
            .join(", ");
          compareValue = addrA.localeCompare(addrB);
        } else if (sortBy === "consigneeName") {
          const nameA = a.waypoints
            .filter((w) => w.stopType === "delivery")
            .map((w) => w.companyName)
            .join(", ");
          const nameB = b.waypoints
            .filter((w) => w.stopType === "delivery")
            .map((w) => w.companyName)
            .join(", ");
          compareValue = nameA.localeCompare(nameB);
        } else if (sortBy === "consigneeAddress") {
          const addrA = a.waypoints
            .filter((w) => w.stopType === "delivery")
            .map((w) => w.address)
            .join(", ");
          const addrB = b.waypoints
            .filter((w) => w.stopType === "delivery")
            .map((w) => w.address)
            .join(", ");
          compareValue = addrA.localeCompare(addrB);
        } else {
          compareValue = a.id > b.id ? 1 : -1;
        }
        return sortOrder === "asc" ? compareValue : -compareValue;
      });
  }, [
    shipments,
    statusFilter,
    loadTypeFilter,
    commitmentFilter,
    globalSearchQuery,
    searchField,
    sortBy,
    sortOrder,
  ]);
  const handleConsolidateTrips = () => {
    if (!consolidationDriverId) {
      alert("Please select a driver");
      return;
    }
    if (selectedConsolidationIds.length === 0) {
      alert("Please select at least one load to consolidate into this trip.");
      return;
    }
    const numericTripNumbers = trips
      .map((t) => parseInt(t.trip_number, 10))
      .filter((num) => !isNaN(num) && num >= 1e4);
    const nextTripNum =
      numericTripNumbers.length > 0
        ? Math.max(...numericTripNumbers) + 1
        : 10003;
    const tripNumber = String(nextTripNum);
    const tripId = `TRIP-${tripNumber}`;
    const selectedLoads = shipments.filter((s) =>
      selectedConsolidationIds.includes(s.id)
    );
    const totalWeight = selectedLoads.reduce(
      (sum, s) => sum + Number(s.weight),
      0
    );
    const totalPallets = selectedLoads.reduce(
      (sum, s) => sum + Number(s.pieces),
      0
    );
    const newTrip = {
      tripNumber,
      driverId: consolidationDriverId,
      driverName: consolidationDriverName,
      truckNumber: consolidationTruck,
      trailerNumber: consolidationTrailer,
      status: "pending",
      shipmentIds: [...selectedConsolidationIds],
      totalWeightLbs: totalWeight,
      totalPallets,
    };
    selectedLoads.forEach((shipment) => {
      const updatedShipment = {
        ...shipment,
        tripId,
        driverId: consolidationDriverId,
        driverName: consolidationDriverName,
        truckNumber: consolidationTruck,
        trailerNumber: consolidationTrailer,
        status: "assigned",
      };
      onUpdateShipment(updatedShipment);
    });
    if (onAddTrip) {
      onAddTrip(newTrip);
    }
    setSelectedConsolidationIds([]);

    setConsolidationDriverId("");
    setConsolidationDriverName("");
  };
  useEffect(() => {
    if (selectedShipment && onMarkMessagesAsRead) {
      onMarkMessagesAsRead(selectedShipment.id, "dispatcher");
    }
  }, [selectedShipment?.id, messages.length]);
  useEffect(() => {
    if (globalSearchQuery.trim()) {
      const query = globalSearchQuery.trim().toLowerCase();
      const matchedShipment = shipments.find(
        (s) => s.load_number.toLowerCase() === query
      );
      if (matchedShipment) {
        setSelectedShipment(matchedShipment);
        setIsDetailModalOpen(true);
      } else {
        const matchedTrip = trips.find(
          (t) =>
            t?.tripNumber?.toLowerCase() === query ||
            t?.id?.toLowerCase() === query
        );
        if (matchedTrip) {
          setActiveView("consolidation");
          setShowSelectedTripDetailsId(matchedTrip.id);
        }
      }
    }
  }, [globalSearchQuery, shipments, trips]);
  const handleSendMessage = (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !chatAttachment) || !selectedShipment) return;
    onSendMessage(
      newMessage,
      selectedShipment.driverId,
      selectedShipment.id,
      chatAttachment || void 0
    );
    setNewMessage("");
    setChatAttachment(null);
  };
  const handleAttachMockFile = (type) => {
    if (type === "photo") {
      setChatAttachment({
        type: "photo",
        name: "Trailer_Rear_Axle_Weight.jpg",
        url: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=600&q=80",
        size: "1.2 MB",
      });
    } else {
      setChatAttachment({
        type: "document",
        name: "Customs_PAPS_Approved_Stamp.pdf",
        url: "#",
        size: "420 KB",
      });
    }
  };
  const handleMoveWaypoint = (index, direction) => {
    if (!selectedShipment) return;
    const nextWaypoints = [...selectedShipment.waypoints];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= nextWaypoints.length) return;
    const temp = nextWaypoints[index];
    nextWaypoints[index] = nextWaypoints[swapIndex];
    nextWaypoints[swapIndex] = temp;
    const updatedWaypoints = nextWaypoints.map((w, idx) => ({
      ...w,
      sequence: idx + 1,
    }));
    const updatedShipment = {
      ...selectedShipment,
      waypoints: updatedWaypoints,
    };
    onUpdateShipment(updatedShipment);
    setSelectedShipment(updatedShipment);
  };
  const handleSaveWaypointTime = (waypointId) => {
    if (!selectedShipment || !editScheduledTime) return;
    const updatedWaypoints = selectedShipment.waypoints.map((w) => {
      if (w.id === waypointId) {
        return {
          ...w,
          scheduledTime: new Date(editScheduledTime).toISOString(),
        };
      }
      return w;
    });
    const updatedShipment = {
      ...selectedShipment,
      waypoints: updatedWaypoints,
    };
    onUpdateShipment(updatedShipment);
    setSelectedShipment(updatedShipment);
    setEditingWaypointId(null);
  };
  const handleApplyAiSequence = () => {
    if (!selectedShipment || !optimizedRoute) return;
    const sortedWaypoints = [...selectedShipment.waypoints].sort((a, b) => {
      const idxA = optimizedRoute.optimizedSequence.findIndex(
        (name) =>
          name.toLowerCase().includes(a.companyName.toLowerCase()) ||
          a.companyName.toLowerCase().includes(name.toLowerCase())
      );
      const idxB = optimizedRoute.optimizedSequence.findIndex(
        (name) =>
          name.toLowerCase().includes(b.companyName.toLowerCase()) ||
          b.companyName.toLowerCase().includes(name.toLowerCase())
      );
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
    const updatedWaypoints = sortedWaypoints.map((w, idx) => ({
      ...w,
      sequence: idx + 1,
    }));
    const updatedShipment = {
      ...selectedShipment,
      waypoints: updatedWaypoints,
    };
    onUpdateShipment(updatedShipment);
    setSelectedShipment(updatedShipment);
  };
  const handleUpdateBorderStatus = (status) => {
    if (!selectedShipment) return;
    const updated = { ...selectedShipment, borderConnectStatus: status };
    if (status === "submitted" && !updated.borderConnectManifestId) {
      updated.borderConnectManifestId =
        "BC-MANIFEST-" + Math.floor(1e5 + Math.random() * 9e5);
    }
    onUpdateShipment(updated);
    setSelectedShipment(updated);
  };
  const handleAiOptimizeRoute = async () => {
    if (!selectedShipment) return;
    setAiLoading(true);
    setAiError(null);
    setOptimizedRoute(null);
    try {
      const response = await fetch("/api/gemini/optimize-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: selectedShipment.originCity,
          destination: selectedShipment.destinationCity,
          cargoDescription: selectedShipment.cargoDescription,
          vehicleType,
          weather,
          traffic,
          waypoints: selectedShipment.waypoints.map((w) => ({
            companyName: w.companyName,
            address: w.address,
            stopType: w.stopType,
            weight: w.weight,
            pieces: w.pieces,
            scheduledTime: w.scheduledTime,
          })),
          priority:
            "Ensure rapid border clearance, coordinate trailer axle weight load limit, safe winter/highway routing",
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || "Server error");
      }
      const data = await response.json();
      setOptimizedRoute(data);
    } catch (err) {
      setAiError(
        err.message ||
          "Could not reach server-side route optimizer. Verify your GEMINI_API_KEY inside the Secrets panel."
      );
    } finally {
      setAiLoading(false);
    }
  };
  const handleUploadRateCon = async (e) => {
    if (!e.target.files?.length) return;
    setIsUploadingRateCon(true);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      const trackingNumber = "LD-" + Math.floor(1e3 + Math.random() * 9e3);
      const newShipment = {
        id: "SHP_AUTO_" + trackingNumber,
        trackingNumber,
        customerName: "Auto-Extracted Corp",
        customerEmail: "shipping@auto-extracted.com",
        dispatcherName: "System User",
        broker: "C.H. Robinson",
        poNumber: "PO-" + trackingNumber,
        bolNumber: "BOL-" + trackingNumber,
        status: "pending",
        driverId: "DRV001",
        driverName: "Marcus Vance",
        truckNumber: "TRK-102",
        trailerNumber: "TRL-504",
        originCity: "Dallas, TX",
        destinationCity: "Atlanta, GA",
        cargoDescription: "Industrial Parts (Auto-parsed)",
        weightLbs: 12500,
        palletCount: 10,
        totalDistanceMiles: 800,
        costEstimate: 1600,
        priceInvoice: 2400,
        eta: new Date(Date.now() + 864e5 * 3).toISOString(),
        borderConnectStatus: "none",
        documentIds: [],
        waypoints: [
          {
            id: `WPT_AUTO_1`,
            companyName: `Auto-Extracted Corp`,
            address: "Dallas, TX",
            lat: 32.7,
            lng: -96.8,
            stopType: "pickup",
            sequence: 1,
            status: "pending",
            scheduledTime: new Date(Date.now() + 36e5 * 4).toISOString(),
          },
          {
            id: `WPT_AUTO_2`,
            companyName: `Consignee Warehouse`,
            address: "Atlanta, GA",
            lat: 33.7,
            lng: -84.3,
            stopType: "delivery",
            sequence: 2,
            status: "pending",
            scheduledTime: new Date(Date.now() + 864e5 * 2.5).toISOString(),
          },
        ],
      };
      onAddShipment(newShipment);
      setSelectedShipment(newShipment);
      setIsDetailModalOpen(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingRateCon(false);
    }
  };
  const handleCreateLoad = async (e) => {
    e.preventDefault();
    if (!customerName || !origin || !destination) return;
    // Robust parsing of load/tracking numbers (supporting custom prefixes like "LOAD " or "L" or "LD-")
    let maxNum = 10005;
    let preferredPrefix = "";
    let hasCustomPrefix = false;

    shipments.forEach((s) => {
      const numStr = String(s.trackingNumber || s.load_number || "");
      // Match optional prefix followed by trailing digits
      const match = numStr.match(/^(.*?)(\d+)$/);
      if (match) {
        const prefix = match[1];
        const num = parseInt(match[2], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
          preferredPrefix = prefix;
          hasCustomPrefix = true;
        }
      } else {
        // Fallback: extract any digits from the string
        const digits = numStr.replace(/\D/g, "");
        if (digits) {
          const num = parseInt(digits, 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
            preferredPrefix = "";
            hasCustomPrefix = false;
          }
        }
      }
    });

    const nextNum = maxNum + 1;
    const trackingNumber = hasCustomPrefix
      ? `${preferredPrefix}${nextNum}`
      : String(nextNum);

    // Generate a secure unique database ID to prevent any duplicate/overwrite collisions
    const uniqueId =
      "SHP" +
      Date.now().toString().slice(-6) +
      Math.floor(10 + Math.random() * 90);

    // Construct newShipment object with all properties required for both DB columns and frontend backwards compatibility
    const newShipment = {
      load_number: trackingNumber,
      pb_num: pbNum || "PB-" + trackingNumber,
      customer_id: customerId,
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      shipperName: shipperName || `${customerName} Depot`,
      shipperAddress: shipperAddress || origin,
      shipperPhone,
      consigneeName: consigneeName || `${customerName} Consignee`,
      consigneeAddress: consigneeAddress || destination,
      consigneePhone,
      status: "pending",
      driverId,
      driverName,
      truckNumber: truck,
      trailerNumber: trailer,
      truck_id: truck,
      trailer_id: trailer,
      originCity: origin,
      destinationCity: destination,
      cargoDescription: cargo,
      commodity: cargo,
      weight: Number(weight),
      pieces: Number(pallets),
      rate: Math.round(distance * 4.5),
      weightLbs: Number(weight),
      palletCount: Number(pallets),
      totalDistanceMiles: Number(distance),
      costEstimate: Math.round(distance * 2.2),
      priceInvoice: Math.round(distance * 4.5),
      eta: new Date(Date.now() + 864e5 * 2).toISOString(),
      borderConnectStatus:
        origin.includes("ON") || destination.includes("BC") ? "draft" : "none",
      documentIds: [],
      loadType,
      priority,
      deliveryCommitment: formCommitment,
      commitmentDate: formCommitment === "normal" ? void 0 : formCommitmentDate,
      commitmentTime: formCommitment === "normal" ? void 0 : formCommitmentTime,
      waypoints: [
        {
          id: `WPT_NEW_1`,
          companyName: shipperName || `${customerName} Depot`,
          address: shipperAddress || origin,
          lat: 41.8,
          lng: -87.6,
          stopType: "pickup",
          sequence: 1,
          status: "pending",
          scheduledTime: new Date(Date.now() + 36e5 * 4).toISOString(),
        },
        {
          id: `WPT_NEW_2`,
          companyName: consigneeName || `${customerName} Consignee`,
          address: consigneeAddress || destination,
          lat: 43.6,
          lng: -79.6,
          stopType: "delivery",
          sequence: 2,
          status: "pending",
          scheduledTime: new Date(Date.now() + 864e5 * 1.5).toISOString(),
        },
      ],
    };
    const success = await addShipment(newShipment);
    if (success) {
      setSelectedShipment(newShipment);
    }
    // setIsDetailModalOpen(true);
    setShowAddForm(false);
    setCustomerId("CUST001");
    setCustomerName("AeroParts Manufacturing");
    setCustomerEmail("logistics@aeroparts.com");
    setCustomerPhone("+1 (416) 555-0100");
    setCustomerAddress("150 Industrial Pkwy, Sector 4, Toronto, ON");
    setPbNum("");
    setShipperName("");
    setShipperAddress("");
    setShipperPhone("");
    setConsigneeName("");
    setConsigneeAddress("");
    setConsigneePhone("");
    setOrigin("");
    setDestination("");
    setCargo("");
    setFormCommitment("normal");
    setFormCommitmentDate("");
    setFormCommitmentTime("");
  };
  const activeChatMessages = selectedShipment
    ? messages.filter(
        (m) =>
          m.shipmentId === selectedShipment.id ||
          m.recipientId === selectedShipment.driverId ||
          m.senderName === selectedShipment.driverName
      )
    : [];

  const filteredTrips = trips.filter((trip) => {
    if (!globalSearchQuery) return true;

    const q = globalSearchQuery.toLowerCase();

    const tripLoads = shipments.filter(
      (shipment) => shipment.tripId === trip.id
    );

    return (
      trip.trip_number.toLowerCase().includes(q) ||
      trip.driver_name.toLowerCase().includes(q) ||
      tripLoads.some((load) =>
        [load.customer_name, load.destination, load.tracking_number]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(q))
      )
    );
  });
  return (
    <div
      id="dispatcher-suite"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
    >
      {/* Upper Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase text-slate-500 font-bold">
              Active Drivers
            </p>
            <h3 className="text-2xl font-bold font-sans text-slate-900 mt-0.5">
              {
                shipments.filter(
                  (s) => s.status === "in_transit" || s.status === "dispatched"
                ).length
              }
            </h3>
          </div>
          <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-lg">
            <Compass
              className="h-5 w-5 animate-spin"
              style={{ animationDuration: "60s" }}
            />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase text-slate-500 font-bold">
              LTL Freight Loads
            </p>
            <h3 className="text-2xl font-bold font-sans text-slate-900 mt-0.5">
              {shipments.length}
            </h3>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-lg">
            <Layers className="h-5 w-5" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase text-slate-500 font-bold">
              E-Manifests (BorderConnect)
            </p>
            <h3 className="text-2xl font-bold font-sans text-slate-900 mt-0.5">
              {shipments.filter((s) => s.borderConnectStatus !== "none").length}
            </h3>
          </div>
          <div className="bg-cyan-50 text-cyan-600 p-2.5 rounded-lg">
            <ExternalLink className="h-5 w-5" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase text-slate-500 font-bold">
              Samsara Diagnostics
            </p>
            <span className="inline-flex items-center text-xs font-semibold text-emerald-600 mt-1 bg-emerald-50 px-2 py-0.5 rounded">
              <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse" />
              All Systems Operational
            </span>
          </div>
          <div className="bg-rose-50 text-rose-600 p-2.5 rounded-lg">
            <Gauge className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Dispatcher Dashboard Tabs */}
      <div className="border-b border-slate-200 mb-6 flex items-center justify-between">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveView("grid")}
            className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center space-x-2 ${
              activeView === "grid"
                ? "border-indigo-600 text-indigo-600 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Active Shipments Fleet Manager</span>
          </button>

          <button
            id="ltl-consolidation-tab"
            onClick={() => setActiveView("consolidation")}
            className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center space-x-2 ${
              activeView === "consolidation"
                ? "border-indigo-600 text-indigo-600 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Compass className="h-4 w-4 text-indigo-500" />
            <span>LTL Consolidation Trip Planner</span>
          </button>

          <button
            id="whatsapp-chat-tab"
            onClick={() => setActiveView("whatsapp")}
            className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center space-x-2 relative ${
              activeView === "whatsapp"
                ? "border-emerald-600 text-emerald-600 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <MessageSquare className="h-4 w-4 text-emerald-500" />
            <span>WhatsApp Support Hub</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          </button>
        </div>

        <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">
          {activeView === "grid"
            ? "Operational Dispatcher console"
            : activeView === "consolidation"
            ? "LTL Load Bundling & Trailer Space Optimizer"
            : "Active secure support network (20 Groups)"}
        </div>
      </div>

      {activeView === "whatsapp" ? (
        <WhatsAppChatHub
          currentRole="dispatcher"
          currentUser={{ name: "Chief Dispatcher Keith", role: "dispatcher" }}
          messages={messages}
          onSendMessage={onSendMessage}
          onMarkMessagesAsRead={onMarkMessagesAsRead}
        />
      ) : activeView === "consolidation" ? (
        /* LTL Consolidation View (Feature #2, #4) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 8 Columns: Load Consolidation Planner */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-lg">
                    <Compass className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      LTL Load Bundling & Trailer Space Optimizer
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      Bundle multiple LTL (or FTL) shipments into a single,
                      high-efficiency consolidated dispatch trip.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 1: Configure Trip Assets & Driver */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold font-mono text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-indigo-500" />
                  1. Configure Active Driver, Truck & Trailer Assets
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-2xs font-bold text-slate-500 uppercase mb-1">
                      Select Driver Profile
                    </label>
                    <select
                      required
                      value={consolidationDriverId}
                      onChange={(e) => {
                        const matched = mockDrivers.find(
                          (d) => d.id === e.target.value
                        );
                        if (matched) {
                          setConsolidationDriverId(matched.id);
                          setConsolidationDriverName(matched.username);
                          setConsolidationTruck(matched?.truck);
                          setConsolidationTrailer(matched?.trailer);
                        }
                      }}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs bg-white text-slate-800 font-semibold"
                    >
                      <option value="">Select a driver</option>
                      {mockDrivers.map((drv) => (
                        <option key={drv.id} value={drv.id}>
                          {drv.username}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-2xs font-bold text-slate-500 uppercase mb-1">
                      Truck Number (Assigned)
                    </label>
                    <input
                      type="text"
                      value={consolidationTruck}
                      onChange={(e) => setConsolidationTruck(e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs bg-white text-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs font-bold text-slate-500 uppercase mb-1">
                      Trailer Number (Assigned)
                    </label>
                    <input
                      type="text"
                      value={consolidationTrailer}
                      onChange={(e) => setConsolidationTrailer(e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs bg-white text-slate-800 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Bundle Unassigned Shipments */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold font-mono text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-indigo-500" />
                  2. Select Shipments to Bundle
                </h4>

                {/* Table of eligible shipments */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-3xs font-bold uppercase tracking-wider">
                          <th className="px-4 py-2.5 w-12 text-center">
                            Select
                          </th>
                          <th className="px-4 py-2.5">Load # / Customer</th>
                          <th className="px-4 py-2.5">Origin / Destination</th>
                          <th className="px-4 py-2.5">Load Type</th>
                          <th className="px-4 py-2.5">Weight (Lbs)</th>
                          <th className="px-4 py-2.5">Pallets</th>
                          <th className="px-4 py-2.5">Commitment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {shipments.filter((s) => s.status === "pending")
                          .length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="px-4 py-8 text-center text-slate-500 font-medium"
                            >
                              No unassigned loads available for consolidation.
                            </td>
                          </tr>
                        ) : (
                          shipments
                            .filter((s) => s.status === "pending")
                            .map((s) => {
                              const isChecked =
                                selectedConsolidationIds.includes(s.id);
                              return (
                                <tr
                                  key={s.id}
                                  className={`hover:bg-slate-50 transition-colors ${
                                    isChecked
                                      ? "bg-indigo-50/20 font-medium"
                                      : ""
                                  }`}
                                >
                                  <td className="px-4 py-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        if (isChecked) {
                                          setSelectedConsolidationIds(
                                            selectedConsolidationIds.filter(
                                              (id) => id !== s.id
                                            )
                                          );
                                        } else {
                                          setSelectedConsolidationIds([
                                            ...selectedConsolidationIds,
                                            s.id,
                                          ]);
                                        }
                                      }}
                                      className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                    />
                                  </td>
                                  <td className="px-4 py-3 font-semibold text-slate-900">
                                    <div>{s.load_number}</div>
                                    <div className="text-3xs text-slate-500 font-normal truncate max-w-[120px]">
                                      {s.customer_name}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-slate-700">
                                    <div className="flex items-center space-x-1">
                                      <span>{s.customer_billing_address}</span>
                                      <ArrowRight className="h-10 w-10 text-slate-400" />
                                      <span>{s.destination}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-3xs font-mono font-bold uppercase ${
                                        (s.loadType || "LTL") === "FTL"
                                          ? "bg-indigo-100 text-indigo-800"
                                          : "bg-amber-100 text-amber-800"
                                      }`}
                                    >
                                      {s.loadType || "LTL"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 font-mono font-medium text-slate-800">
                                    {s?.weightLbs?.toLocaleString()} lbs
                                  </td>
                                  <td className="px-4 py-3 font-mono font-medium text-slate-800">
                                    {s.palletCount || 2}
                                  </td>
                                  <td className="px-4 py-3">
                                    {s.deliveryCommitment === "guaranteed" ? (
                                      <span className="bg-emerald-100 text-emerald-800 text-3xs font-bold px-1.5 py-0.5 rounded uppercase">
                                        Guaranteed
                                      </span>
                                    ) : s.deliveryCommitment ===
                                      "guaranteed_appointment" ? (
                                      <span className="bg-indigo-100 text-indigo-800 text-3xs font-bold px-1.5 py-0.5 rounded uppercase">
                                        Appointment
                                      </span>
                                    ) : (
                                      <span className="bg-slate-100 text-slate-700 text-3xs font-semibold px-1.5 py-0.5 rounded uppercase">
                                        Normal
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Step 3: Dynamic Trailer Space Utilization & Submission */}
              {selectedConsolidationIds.length > 0 && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold font-mono text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Gauge className="h-4 w-4 text-indigo-500" />
                    3. Live Trailer Space Optimization & Utilization
                  </h4>

                  {(() => {
                    const selectedLoads = shipments.filter((s) =>
                      selectedConsolidationIds.includes(s.id)
                    );
                    const totalWeight = selectedLoads.reduce(
                      (sum, s) => sum + Number(s.weight),
                      0
                    );
                    const totalPallets = selectedLoads.reduce(
                      (sum, s) => sum + (Number(s.pieces) || 2),
                      0
                    );
                    const hasFTL = selectedLoads.some(
                      (s) => s.loadType === "FTL"
                    );
                    const weightLimit = 45e3;
                    const palletLimit = 26;
                    const weightPercent = Math.min(
                      Math.round((totalWeight / weightLimit) * 100),
                      100
                    );
                    const palletPercent = Math.min(
                      Math.round((totalPallets / palletLimit) * 100),
                      100
                    );
                    const isOverloadedWeight = totalWeight > weightLimit;
                    const isOverloadedPallets = totalPallets > palletLimit;
                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Weight Utilization */}
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-slate-600">
                                Trailer Weight Utilization
                              </span>
                              <span
                                className={
                                  isOverloadedWeight
                                    ? "text-rose-600 font-extrabold"
                                    : "text-indigo-600"
                                }
                              >
                                {totalWeight.toLocaleString()} /{" "}
                                {weightLimit.toLocaleString()} Lbs (
                                {weightPercent}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  isOverloadedWeight
                                    ? "bg-rose-500 animate-pulse"
                                    : weightPercent > 85
                                    ? "bg-amber-500"
                                    : "bg-indigo-600"
                                }`}
                                style={{ width: `${weightPercent}%` }}
                              />
                            </div>
                            {isOverloadedWeight && (
                              <p className="text-rose-600 text-3xs font-semibold">
                                ⚠️ OVERWEIGHT WARNING: Trailer load exceeds the
                                45k heavy-duty payload limit.
                              </p>
                            )}
                          </div>

                          {/* Pallet Utilization */}
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-slate-600">
                                Trailer Space / Pallet Utilization
                              </span>
                              <span
                                className={
                                  isOverloadedPallets
                                    ? "text-rose-600 font-extrabold"
                                    : "text-indigo-600"
                                }
                              >
                                {totalPallets} / {palletLimit} Pallets (
                                {palletPercent}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  isOverloadedPallets
                                    ? "bg-rose-500 animate-pulse"
                                    : palletPercent > 85
                                    ? "bg-amber-500"
                                    : "bg-indigo-600"
                                }`}
                                style={{ width: `${palletPercent}%` }}
                              />
                            </div>
                            {isOverloadedPallets && (
                              <p className="text-rose-600 text-3xs font-semibold">
                                ⚠️ OVERLOAD WARNING: Pallet count exceeds the
                                standard 53ft trailer capability (26 pallets).
                              </p>
                            )}
                          </div>
                        </div>

                        {/* FTL notice (Feature #2) */}
                        {hasFTL && (
                          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-xl text-2xs leading-relaxed font-semibold">
                            💡 <strong>FTL LOAD CONSOLIDATED:</strong> You have
                            bundled a Full Truckload (FTL) shipment with other
                            cargo. The trailer is legally and
                            administrative-wise marked as dedicated to the
                            primary customer, but is optimized internally for
                            dual cargo space. Customers will not see
                            consolidation notes in their client portals.
                          </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            disabled={isOverloadedWeight || isOverloadedPallets}
                            onClick={handleConsolidateTrips}
                            className={`px-5 py-2.5 text-xs font-bold text-white rounded-lg transition-all shadow-sm flex items-center space-x-1.5 ${
                              isOverloadedWeight || isOverloadedPallets
                                ? "bg-slate-300 cursor-not-allowed"
                                : "bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
                            }`}
                          >
                            <Sparkles className="h-4 w-4" />
                            <span>Confirm & Build Consolidation Trip</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Right 4 Columns: Trips Manifest */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
              <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                    <Layers className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide font-mono">
                    Consolidated Trips Manifest
                  </span>
                </div>
                <span className="bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded text-2xs font-mono">
                  {trips.length} Trips
                </span>
              </div>

              {/* Trip Quick Finder Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <Compass className="h-3.5 w-3.5 text-slate-400 rotate-45" />
                </div>
                <input
                  type="text"
                  placeholder="Find Trip # or Load #..."
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  className="block w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                />
              </div>

              {/* Trips list */}

              <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
                {trips.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6 font-medium">
                    No consolidated trips created yet. Use the Planner on the
                    left to combine loads.
                  </p>
                ) : (
                  (() => {
                    const filteredTrips = trips.filter((trip) => {
                      if (!globalSearchQuery.trim()) return true;
                      const query = globalSearchQuery.toLowerCase();
                      const tripLoads = shipments.filter(
                        (s) => s.tripId === trip.id
                      );
                      const matchesTripNum = trip.trip_number
                        .toLowerCase()
                        .includes(query);
                      const matchesDriver = trip.driver_name
                        .toLowerCase()
                        .includes(query);
                      const matchesTruck =
                        trip?.truckNumber?.toLowerCase().includes(query) ||
                        trip?.trailerNumber?.toLowerCase().includes(query);
                      const matchesLoads = tripLoads.some(
                        (s) =>
                          s.tracking_number.toLowerCase().includes(query) ||
                          s.customer_name.toLowerCase().includes(query) ||
                          s.customer_city.toLowerCase().includes(query) ||
                          s.destination.toLowerCase().includes(query) ||
                          s.waypoints.some(
                            (w) =>
                              w.companyName.toLowerCase().includes(query) ||
                              w.address.toLowerCase().includes(query)
                          )
                      );
                      return (
                        matchesTripNum ||
                        matchesDriver ||
                        matchesTruck ||
                        matchesLoads
                      );
                    });
                    if (filteredTrips.length === 0) {
                      return (
                        <p className="text-xs text-slate-400 text-center py-6 font-medium">
                          No trips matching "{globalSearchQuery}" found.
                        </p>
                      );
                    }
                    return filteredTrips.map((trip) => {
                      const isExpanded = showSelectedTripDetailsId === trip.id;
                      const tripLoads = shipments.filter(
                        (s) => s.tripId === trip.id
                      );
                      return (
                        <div
                          key={trip.id}
                          className={`rounded-xl border transition-all p-3.5 space-y-3 cursor-pointer ${
                            isExpanded
                              ? "bg-slate-50 border-indigo-400 ring-1 ring-indigo-400 shadow-xs"
                              : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                          }`}
                          // onClick={() =>
                          //   setShowSelectedTripDetailsId(
                          //     isExpanded ? null : trip.id
                          //   )
                          // }
                          onClick={async () => {
                            const response = await axiosInstance.get(
                              `/trips/${trip.id}`
                            );

                            setSelectedTrip(response.data.trip);
                            setIsTripModalOpen(true);
                          }}
                          // onClick={() => {
                          //   const tripWithLoads = {
                          //     ...trip,
                          //     shipments: shipments.filter((s) =>
                          //       trip.shipment_ids.includes(s.id)
                          //     ),
                          //   };

                          //   setSelectedTrip(tripWithLoads);
                          //   setIsTripModalOpen(true);
                          // }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-xs font-bold text-slate-900">
                                Trip #{trip.trip_number}
                              </span>
                              <span className="text-3xs font-mono bg-indigo-50 text-indigo-700 px-1 py-0.2 rounded border border-indigo-100 uppercase font-bold">
                                {trip?.shipment_ids?.length} loads
                              </span>
                            </div>

                            {/* Editable Trip Status dropdown */}
                            <div onClick={(e) => e.stopPropagation()}>
                              {/* <select
                                value={trip.status}
                                onChange={(e) => {
                                  const newStatus = e.target.value;
                                  if (onUpdateTrip) {
                                    onUpdateTrip({
                                      ...trip,
                                      status: newStatus,
                                    });
                                  }
                                  tripLoads.forEach((s) => {
                                    onUpdateShipment({
                                      ...s,
                                      status:
                                        newStatus === "in_transit"
                                          ? "in_transit"
                                          : newStatus === "completed"
                                          ? "completed"
                                          : newStatus === "dispatched"
                                          ? "dispatched"
                                          : "pending",
                                    });
                                  });
                                }}
                                className={`text-2xs font-bold px-1.5 py-0.5 rounded cursor-pointer border border-transparent focus:outline-none focus:ring-1 focus:ring-indigo-400 capitalize ${
                                  trip.status === "completed"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : trip.status === "in_transit"
                                    ? "bg-amber-100 text-amber-800"
                                    : trip.status === "dispatched"
                                    ? "bg-blue-100 text-blue-800 font-semibold"
                                    : "bg-slate-100 text-slate-800"
                                }`}
                              >
                                <option value="pending">Pending</option>
                                <option value="dispatched">Dispatched</option>
                                <option value="in_transit">In Transit</option>
                                <option value="completed">Completed</option>
                              </select> */}
                              <span
                                className={`text-2xs font-bold px-2 py-1 rounded capitalize ${
                                  trip.status === "completed"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : trip.status === "in_transit"
                                    ? "bg-amber-100 text-amber-800"
                                    : trip.status === "dispatched"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-slate-100 text-slate-800"
                                }`}
                              >
                                {trip.status.replace("_", " ")}
                              </span>
                            </div>
                          </div>

                          {/* Driver & truck brief */}
                          <div className="grid grid-cols-2 gap-2 text-3xs text-slate-500 font-mono">
                            <div>
                              <span className="text-slate-400 uppercase font-bold text-[9px]">
                                Driver:
                              </span>
                              <div className="text-slate-700 font-bold text-2xs font-sans mt-0.5 truncate">
                                {trip.driver_name}
                              </div>
                            </div>
                            <div>
                              <span className="text-slate-400 uppercase font-bold text-[9px]">
                                Assets:
                              </span>
                              <div className="text-slate-700 font-semibold mt-0.5">
                                {trip.truckNumber} / {trip.trailerNumber}
                              </div>
                            </div>
                          </div>

                          {/* Brief weight metrics */}
                          <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2 text-3xs font-mono text-slate-500">
                            <div>
                              <span className="text-slate-400 uppercase font-bold text-[9px]">
                                Weight:
                              </span>
                              <div className="text-slate-700 font-bold text-2xs mt-0.5">
                                {trip?.total_weight_lbs || 0.0} lbs
                              </div>
                            </div>
                            <div>
                              <span className="text-slate-400 uppercase font-bold text-[9px]">
                                Space:
                              </span>
                              <div className="text-slate-700 font-bold text-2xs mt-0.5">
                                {trip?.total_pallets || 0} Pallets
                              </div>
                            </div>
                          </div>

                          {/* Nested Shipment/Loads list when expanded */}
                          {isExpanded && (
                            <div
                              className="border-t border-slate-200 pt-3 mt-3 space-y-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="text-3xs font-bold text-slate-400 uppercase font-mono block">
                                Consolidated Loads Manifest
                              </span>

                              <div className="space-y-1.5">
                                {tripLoads.map((load) => (
                                  <div
                                    key={load.id}
                                    className="bg-white border border-slate-100 rounded-lg p-2 flex items-center justify-between text-xs hover:border-slate-300 cursor-pointer"
                                    onClick={() => {
                                      setSelectedShipment(load);
                                      setIsDetailModalOpen(true);
                                    }}
                                  >
                                    <div>
                                      <div className="flex items-center space-x-1.5 font-bold">
                                        <span className="text-slate-800">
                                          Load #{load.trackingNumber}
                                        </span>
                                        <span
                                          className={`text-4xs font-mono uppercase px-1 py-0.2 rounded font-bold ${
                                            load.loadType === "FTL"
                                              ? "bg-indigo-50 text-indigo-700"
                                              : "bg-amber-50 text-amber-700"
                                          }`}
                                        >
                                          {load.loadType || "LTL"}
                                        </span>
                                      </div>
                                      <div className="text-3xs text-slate-400 font-medium mt-0.5 truncate max-w-[150px]">
                                        {load.originCity} →{" "}
                                        {load.destinationCity}
                                      </div>
                                    </div>

                                    <div className="text-right text-3xs font-mono font-medium text-slate-600">
                                      <div>
                                        {load.weightLbs.toLocaleString()} lbs
                                      </div>
                                      <div>{load.palletCount || 2} pallets</div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Disassemble Trip Action */}
                              <div className="pt-2 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (
                                      confirm(
                                        `Are you sure you want to disassemble Trip #${trip.trip_number}? This will unassign all ${trip.shipment_ids.length} shipments and return them to independent loads.`
                                      )
                                    ) {
                                      tripLoads.forEach((s) => {
                                        onUpdateShipment({
                                          ...s,
                                          tripId: void 0,
                                          status: "pending",
                                        });
                                      });
                                      if (onRemoveTrip) {
                                        onRemoveTrip(trip.id);
                                      }
                                    }
                                  }}
                                  className="text-rose-600 hover:text-white border border-rose-200 hover:bg-rose-600 hover:border-rose-600 px-2.5 py-1 rounded text-3xs font-bold tracking-wider uppercase transition-colors cursor-pointer"
                                >
                                  Disassemble Trip
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Main Grid Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 8 Columns: Shipments List & Route Optimization */}
          <div className="lg:col-span-8 space-y-6">
            {/* Active Shipments Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-base font-semibold text-slate-900"></h3>
                </div>
                {(currentUser.role === "super_admin" ||
                  currentUser.role === "admin" ||
                  currentUser.role === "data_entry") && (
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer transition-colors border border-slate-300">
                      {isUploadingRateCon ? (
                        <Compass className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Paperclip className="h-3.5 w-3.5" />
                      )}
                      <span>
                        {isUploadingRateCon ? "Parsing..." : "Upload Rate Con"}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="application/pdf,image/*"
                        onChange={handleUploadRateCon}
                        disabled={isUploadingRateCon}
                      />
                    </label>
                    <button
                      onClick={() => setShowAddForm(!showAddForm)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium cursor-pointer transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Dispatch New Load</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Load Adding Form Modal/Drawer */}
              {showAddForm && (
                <form
                  onSubmit={handleCreateLoad}
                  className="p-6 border-b border-slate-200 bg-indigo-50/30 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-150 pb-2">
                    <h4 className="text-sm font-bold font-mono text-indigo-950 uppercase flex items-center gap-1.5">
                      <Plus className="h-4 w-4 text-indigo-600" />
                      Create & Dispatch New Shipment
                    </h4>
                    <span className="text-3xs font-mono text-slate-500 uppercase">
                      Interactive Load File Builder
                    </span>
                  </div>

                  {/* Section 1: Customer Details */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-indigo-950">
                      1. Customer Details
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      <div>
                        <label className="block text-3xs font-bold text-slate-500 uppercase">
                          Select Profile
                        </label>
                        <select
                          value={customerId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomerId(val);
                            const chosen = customers.find((c) => c.id === val);
                            if (chosen) {
                              setCustomerName(chosen.name);
                              setCustomerEmail(chosen.email || "");
                              setCustomerPhone(chosen.phone || "");
                              setCustomerAddress(chosen.address || "");
                            } else if (val === "NEW") {
                              setCustomerName("");
                              setCustomerEmail("");
                              setCustomerPhone("");
                              setCustomerAddress("");
                            }
                          }}
                          className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500"
                        >
                          {customers.map((cust) => (
                            <option key={cust.id} value={cust.id}>
                              {cust.name} ({cust.id})
                            </option>
                          ))}
                          <option value="NEW">Custom / New Profile</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-3xs font-bold text-slate-500 uppercase">
                          Customer Account Name
                        </label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="e.g. Caterpillar Heavy"
                          className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-3xs font-bold text-slate-500 uppercase">
                          Customer Email
                        </label>
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="customer@example.com"
                          className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-3xs font-bold text-slate-500 uppercase">
                          Customer Phone
                        </label>
                        <input
                          type="text"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="+1 (555) 019-2831"
                          className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-3xs font-bold text-slate-500 uppercase">
                          Customer Billing Address
                        </label>
                        <input
                          type="text"
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                          placeholder="100 Industrial Way, Suite A"
                          className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Shipper & Consignee Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Shipper details */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                      <div className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-indigo-950">
                        2. Shipper (Pickup) Details
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-3xs font-bold text-slate-500 uppercase">
                              Shipper Name
                            </label>
                            <input
                              type="text"
                              value={shipperName}
                              onChange={(e) => setShipperName(e.target.value)}
                              placeholder="e.g. AeroParts Toronto HQ"
                              className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-3xs font-bold text-slate-500 uppercase">
                              Shipper Phone
                            </label>
                            <input
                              type="text"
                              value={shipperPhone}
                              onChange={(e) => setShipperPhone(e.target.value)}
                              placeholder="+1 (416) 555-0199"
                              className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-3xs font-bold text-slate-500 uppercase">
                            Shipper Street Address
                          </label>
                          <input
                            type="text"
                            value={shipperAddress}
                            onChange={(e) => setShipperAddress(e.target.value)}
                            placeholder="e.g. 400 Britannia Rd E, Mississauga, ON"
                            className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-3xs font-bold text-slate-500 uppercase">
                            Origin City & State / Province
                          </label>
                          <input
                            type="text"
                            value={origin}
                            onChange={(e) => setOrigin(e.target.value)}
                            placeholder="e.g. Toronto, ON"
                            className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Consignee details */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                      <div className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-indigo-950">
                        3. Consignee (Delivery) Details
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-3xs font-bold text-slate-500 uppercase">
                              Consignee Name
                            </label>
                            <input
                              type="text"
                              value={consigneeName}
                              onChange={(e) => setConsigneeName(e.target.value)}
                              placeholder="e.g. Midwest Aero Chicago Assembly"
                              className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-3xs font-bold text-slate-500 uppercase">
                              Consignee Phone
                            </label>
                            <input
                              type="text"
                              value={consigneePhone}
                              onChange={(e) =>
                                setConsigneePhone(e.target.value)
                              }
                              placeholder="+1 (312) 555-0210"
                              className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-3xs font-bold text-slate-500 uppercase">
                            Consignee Street Address
                          </label>
                          <input
                            type="text"
                            value={consigneeAddress}
                            onChange={(e) =>
                              setConsigneeAddress(e.target.value)
                            }
                            placeholder="e.g. 1000 Assembly Dr, Chicago, IL"
                            className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-3xs font-bold text-slate-500 uppercase">
                            Destination City & State / Province
                          </label>
                          <input
                            type="text"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            placeholder="e.g. Chicago, IL"
                            className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Cargo, Weight, and Driver details */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-indigo-950">
                      4. Cargo, Routing & Dispatch Assets
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      <div>
                        <label className="block text-3xs font-bold text-slate-500 uppercase">
                          Assigned Driver
                        </label>
                        <select
                          required
                          value={driverId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDriverId(val);
                            const matched = mockDrivers.find(
                              (d) => d.id === val
                            );
                            if (matched) {
                              setDriverName(matched.name);
                              setTruck(
                                matched.truckNumber ||
                                  matched.truck ||
                                  "TRK-102"
                              );
                              setTrailer(
                                matched.trailerNumber ||
                                  matched.trailer ||
                                  "TRL-504"
                              );
                            }
                          }}
                          className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white font-semibold text-slate-800"
                        >
                          <option value="" defaultChecked>
                            Select a driver
                          </option>
                          {mockDrivers.map((drv) => (
                            <option key={drv.id} value={drv.id}>
                              {drv.username} (
                              {drv.truck || drv.truckNumber || "No Truck"})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-3xs font-bold text-slate-500 uppercase font-semibold text-indigo-950">
                          Freight Load Mode
                        </label>
                        <select
                          value={loadType}
                          onChange={(e) => setLoadType(e.target.value)}
                          className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white font-bold text-indigo-700"
                        >
                          <option value="LTL">LTL (Less-Than-Truckload)</option>
                          <option value="FTL">FTL (Full Truckload)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-3xs font-bold text-slate-500 uppercase font-semibold text-indigo-950">
                          Shipment Priority
                        </label>
                        <select
                          value={priority}
                          onChange={(e) => setPriority(e.target.value)}
                          className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white font-bold text-indigo-700"
                        >
                          <option value="standard">Standard</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-3xs font-bold text-slate-500 uppercase">
                          Cargo Description
                        </label>
                        <input
                          type="text"
                          value={cargo}
                          onChange={(e) => setCargo(e.target.value)}
                          placeholder="e.g. Precision aircraft gears (6 pallets)"
                          className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-3xs font-bold text-slate-500 uppercase">
                          Total Weight (Lbs)
                        </label>
                        <input
                          type="number"
                          value={weight}
                          onChange={(e) => setWeight(Number(e.target.value))}
                          className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-3xs font-bold text-slate-500 uppercase">
                          Pallet Count
                        </label>
                        <input
                          type="number"
                          value={pallets}
                          onChange={(e) => setPallets(Number(e.target.value))}
                          className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-3xs font-bold text-slate-500 uppercase">
                          Total Est. Distance (Miles)
                        </label>
                        <input
                          type="number"
                          value={distance}
                          onChange={(e) => setDistance(Number(e.target.value))}
                          className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
                        />
                      </div>
                    </div>

                    {/* Samsara Intelligent Recommendations Widget */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-2">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-1.5">
                          <Sparkles className="h-4 w-4 text-indigo-600 animate-pulse" />
                          <div>
                            <span className="text-2xs font-extrabold font-mono text-indigo-950 uppercase block">
                              Samsara Fleet Matching Recommender
                            </span>
                            <span className="text-[9px] text-slate-500 font-medium">
                              Real-time GPS proximity, hours of service &
                              trailer capacities
                            </span>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                          SAMSARA ACTIVE
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                        {getDriverRecommendations(weight, pallets, origin).map(
                          ({
                            driver,
                            currentRegion,
                            availableWeight,
                            availablePallets,
                            hasWeightCapacity,
                            hasPalletCapacity,
                            isNearby,
                            distanceMiles,
                          }) => {
                            const isSelected = driverId === driver.id;
                            const isCapable =
                              hasWeightCapacity && hasPalletCapacity;
                            return (
                              <button
                                key={driver.id}
                                type="button"
                                onClick={() => {
                                  setDriverId(driver.id);
                                  setDriverName(driver.name);
                                  setTruck(driver.truck);
                                  setTrailer(driver.trailer);
                                }}
                                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between h-full cursor-pointer ${
                                  isSelected
                                    ? "bg-indigo-600 text-white border-indigo-500 shadow-md ring-2 ring-indigo-500/20"
                                    : "bg-white text-slate-700 hover:bg-indigo-55/30 border-slate-200 hover:border-indigo-300"
                                }`}
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-extrabold text-2xs truncate block">
                                      {driver.name}
                                    </span>
                                    {isSelected && (
                                      <span className="h-2 w-2 rounded-full bg-white block animate-ping shrink-0" />
                                    )}
                                  </div>
                                  <span
                                    className={`text-[9px] font-mono block ${
                                      isSelected
                                        ? "text-indigo-200"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    {driver.truck} / {driver.trailer}
                                  </span>
                                </div>

                                <div className="mt-3.5 space-y-2 border-t pt-2 border-slate-100/50">
                                  {/* Capacity */}
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[8px] font-mono">
                                      <span>Weight:</span>
                                      <span
                                        className={`font-bold ${
                                          !hasWeightCapacity
                                            ? "text-rose-500"
                                            : isSelected
                                            ? "text-white"
                                            : "text-slate-700"
                                        }`}
                                      >
                                        {availableWeight.toLocaleString()} lbs
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[8px] font-mono">
                                      <span>Space:</span>
                                      <span
                                        className={`font-bold ${
                                          !hasPalletCapacity
                                            ? "text-rose-500"
                                            : isSelected
                                            ? "text-white"
                                            : "text-slate-700"
                                        }`}
                                      >
                                        {availablePallets} plts
                                      </span>
                                    </div>
                                  </div>

                                  {/* Proximity / Location */}
                                  <div className="flex items-center justify-between text-[8px] font-mono mt-1 border-t pt-1 border-dashed border-slate-100/50">
                                    <span
                                      className={
                                        isSelected
                                          ? "text-indigo-200"
                                          : "text-slate-400"
                                      }
                                    >
                                      Samsara GPS:
                                    </span>
                                    <span
                                      className={`font-bold ${
                                        isNearby
                                          ? isSelected
                                            ? "text-white"
                                            : "text-emerald-600"
                                          : isSelected
                                          ? "text-indigo-200"
                                          : "text-slate-500"
                                      }`}
                                    >
                                      {isNearby
                                        ? `\u{1F4CD} Nearby (${distanceMiles} mi)`
                                        : `${distanceMiles} mi`}
                                    </span>
                                  </div>
                                </div>

                                {/* Badge */}
                                <div className="mt-2.5 flex flex-wrap gap-1">
                                  {isNearby && (
                                    <span
                                      className={`text-[7px] font-bold font-mono uppercase px-1 py-0.2 rounded shrink-0 ${
                                        isSelected
                                          ? "bg-indigo-500 text-white"
                                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      }`}
                                    >
                                      Nearby
                                    </span>
                                  )}
                                  {!isCapable && (
                                    <span className="text-[7px] font-bold font-mono uppercase px-1 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                                      Lacks Cap
                                    </span>
                                  )}
                                  {isCapable && (
                                    <span
                                      className={`text-[7px] font-bold font-mono uppercase px-1 py-0.2 rounded shrink-0 ${
                                        isSelected
                                          ? "bg-indigo-500 text-white"
                                          : "bg-slate-100 text-slate-700 border border-slate-200"
                                      }`}
                                    >
                                      Fits
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>

                    {/* Delivery Commitment Selector */}
                    <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100 mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-3xs font-bold text-slate-700 uppercase">
                          Delivery Commitment Type
                        </label>
                        <select
                          value={formCommitment}
                          onChange={(e) => setFormCommitment(e.target.value)}
                          className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white font-semibold text-slate-800"
                        >
                          <option value="normal">Normal Delivery</option>
                          <option value="guaranteed">
                            Guaranteed Delivery
                          </option>
                          <option value="guaranteed_appointment">
                            Guaranteed with Appointment Need
                          </option>
                        </select>
                      </div>
                      {formCommitment !== "normal" && (
                        <>
                          <div>
                            <label className="block text-3xs font-bold text-slate-700 uppercase">
                              Commitment Date
                            </label>
                            <input
                              type="date"
                              value={formCommitmentDate}
                              onChange={(e) =>
                                setFormCommitmentDate(e.target.value)
                              }
                              className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
                              required={formCommitment !== "normal"}
                            />
                          </div>
                          <div>
                            <label className="block text-3xs font-bold text-slate-700 uppercase">
                              Commitment Time
                            </label>
                            <input
                              type="time"
                              value={formCommitmentTime}
                              onChange={(e) =>
                                setFormCommitmentTime(e.target.value)
                              }
                              className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-slate-800"
                              required={formCommitment !== "normal"}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-sm disabled:opacity-50"
                      disabled={isLoading}
                    >
                      {isLoading ? "Processing..." : "Confirm Dispatch"}
                    </button>
                  </div>
                </form>
              )}

              {/* Search, Filter & Sort Toolbar (Feature #1 & #4) */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col xl:flex-row gap-3 items-stretch xl:items-center justify-between">
                {/* Left Side: Search Bar & Target Selector */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full xl:max-w-2xl">
                  {/* Search Target Dropdown */}
                  <div className="relative shrink-0">
                    <select
                      value={searchField}
                      onChange={(e) => {
                        setSearchField(e.target.value);
                      }}
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer w-full sm:w-44"
                    >
                      <option value="all">🔍 All Fields (Global)</option>
                      <option value="trackingNumber">Load / Tracking #</option>
                      <option value="customerName">Customer Name</option>
                      <option value="shipperName">Shipper Name</option>
                      <option value="shipperAddress">Shipper Address</option>
                      <option value="consigneeName">Consignee Name</option>
                      <option value="consigneeAddress">
                        Consignee Address
                      </option>
                      <option value="pickupLocation">Pickup Location</option>
                      <option value="deliveryLocation">
                        Delivery Location
                      </option>
                    </select>
                  </div>

                  {/* Search Input Box */}
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Compass className="h-4 w-4 text-slate-400 rotate-45" />
                    </div>
                    <input
                      type="text"
                      value={globalSearchQuery}
                      onChange={(e) => setGlobalSearchQuery(e.target.value)}
                      placeholder={
                        searchField === "all"
                          ? "Search Load #, Customer, Shipper, Consignee, Location..."
                          : searchField === "trackingNumber"
                          ? "Enter specific Load/Tracking #..."
                          : searchField === "customerName"
                          ? "Enter customer account name..."
                          : searchField === "shipperName"
                          ? "Enter manufacturer or shipper name..."
                          : searchField === "shipperAddress"
                          ? "Enter origin street address..."
                          : searchField === "consigneeName"
                          ? "Enter delivery facility name..."
                          : searchField === "consigneeAddress"
                          ? "Enter destination street address..."
                          : searchField === "pickupLocation"
                          ? "Enter origin city or state..."
                          : "Enter destination city or state..."
                      }
                      className="block w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-semibold"
                    />
                    {globalSearchQuery && (
                      <button
                        onClick={() => setGlobalSearchQuery("")}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 text-sm font-bold"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Side: Filters & Sorter */}
                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
                  {/* Status Filter */}
                  <div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="dispatched">Dispatched</option>
                      <option value="in_transit">In Transit</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>

                  {/* Load Type Filter */}
                  <div>
                    <select
                      value={loadTypeFilter}
                      onChange={(e) => setLoadTypeFilter(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="all">All Modes (LTL/FTL)</option>
                      <option value="LTL">LTL Only</option>
                      <option value="FTL">FTL Only</option>
                    </select>
                  </div>

                  {/* Commitment Filter */}
                  <div>
                    <select
                      value={commitmentFilter}
                      onChange={(e) => setCommitmentFilter(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="all">All Commitments</option>
                      <option value="normal">Normal Delivery</option>
                      <option value="guaranteed">Guaranteed Only</option>
                      <option value="appointment">Appointment Only</option>
                    </select>
                  </div>

                  {/* Sort By */}
                  <div className="flex items-center space-x-1 border border-slate-300 rounded-lg bg-white px-2 py-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase font-mono mr-1">
                      Sort
                    </span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-transparent text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
                    >
                      <option value="trackingNumber">Load #</option>
                      <option value="customerName">Customer Name</option>
                      <option value="shipperName">Shipper Name</option>
                      <option value="shipperAddress">Shipper Address</option>
                      <option value="consigneeName">Consignee Name</option>
                      <option value="consigneeAddress">
                        Consignee Address
                      </option>
                      <option value="pickupLocation">Pickup Location</option>
                      <option value="deliveryLocation">
                        Delivery Location
                      </option>
                      <option value="weight">Weight (Lbs)</option>
                      <option value="distance">Distance</option>
                      <option value="eta">Projected ETA</option>
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        setSortOrder((prev) =>
                          prev === "asc" ? "desc" : "asc"
                        )
                      }
                      className="p-0.5 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                      title={
                        sortOrder === "asc"
                          ? "Sort Ascending"
                          : "Sort Descending"
                      }
                    >
                      {sortOrder === "asc" ? (
                        <ArrowUp className="h-3.5 w-3.5 text-indigo-500" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5 text-indigo-500" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Shipments List */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-2xs font-bold uppercase tracking-wider">
                      <th className="px-5 py-3">Tracking / Load Info</th>
                      <th className="px-5 py-3">Origin / Destination</th>
                      <th className="px-5 py-3">Dispatcher / Broker</th>
                      <th className="px-5 py-3">Driver & Assets</th>
                      <th className="px-5 py-3">BorderConnect status</th>
                      <th className="px-5 py-3">Samsara Telemetry</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredAndSortedShipments.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-5 py-8 text-center text-slate-500 font-medium"
                        >
                          <AlertCircle className="h-5 w-5 text-slate-400 mx-auto mb-1.5" />
                          No loads match the selected search or filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredAndSortedShipments.map((s) => {
                        const isSelected = selectedShipment?.id === s.id;
                        return (
                          <tr
                            key={s.id}
                            className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                              isSelected ? "bg-indigo-50/40 font-medium" : ""
                            }`}
                            onClick={() => {
                              setSelectedShipment(s);
                              setIsDetailModalOpen(true);
                            }}
                          >
                            <td className="px-5 py-4">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-semibold text-slate-900">
                                  {s.load_number}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-3xs font-mono font-bold uppercase ${
                                    (s.loadType ||
                                      (s.cargoDescription
                                        ?.toLowerCase()
                                        .includes("ltl")
                                        ? "LTL"
                                        : "FTL")) === "FTL"
                                      ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                                      : "bg-amber-100 text-amber-800 border border-amber-200"
                                  }`}
                                >
                                  {s.loadType ||
                                    (s.cargoDescription
                                      ?.toLowerCase()
                                      .includes("ltl")
                                      ? "LTL"
                                      : "FTL")}
                                </span>
                                {s.priority && (
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-3xs font-mono font-bold uppercase border ${
                                      s.priority === "urgent"
                                        ? "bg-rose-100 text-rose-800 border-rose-200 animate-pulse"
                                        : s.priority === "high"
                                        ? "bg-amber-100 text-amber-800 border-amber-200"
                                        : "bg-slate-100 text-slate-600 border-slate-200"
                                    }`}
                                  >
                                    {s.priority}
                                  </span>
                                )}
                              </div>
                              <div
                                className="text-slate-500 text-2xs mt-0.5 truncate max-w-[200px]"
                                title={s.cargoDescription}
                              >
                                {s.cargoDescription}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center space-x-1 text-slate-700">
                                <span>{s.customer_billing_address}</span>
                                <ArrowRight className="h-10 w-10  text-slate-400" />
                                <span>{s.destination}</span>
                              </div>
                              <div className="text-slate-500 text-2xs mt-0.5">
                                {s?.waypoints?.length} Total Waypoints
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="text-slate-900 font-semibold">
                                {s.dispatcherName || "Unassigned"}
                              </div>
                              <div className="text-slate-500 text-2xs mt-0.5">
                                {s.broker || "Direct Customer"}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="text-slate-900">
                                {s.driver_name}
                              </div>
                              <div className="text-slate-500 text-2xs mt-0.5 font-mono">
                                {s.truck_umber || "TRuck"} •{" "}
                                {s.trailer_number || "Trailer"}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              {s.borderConnectStatus === "none" ? (
                                <span className="text-slate-400 text-2xs">
                                  N/A
                                </span>
                              ) : (
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-2xs font-mono font-bold capitalize ${
                                    s.borderConnectStatus === "accepted"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : s.borderConnectStatus === "at_border"
                                      ? "bg-amber-100 text-amber-800"
                                      : s.borderConnectStatus === "submitted"
                                      ? "bg-blue-100 text-blue-800 font-medium"
                                      : "bg-slate-100 text-slate-800"
                                  }`}
                                >
                                  {s.borderConnectStatus || "N/A"}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              {s.status === "in_transit" ? (
                                <div className="space-y-1">
                                  <div className="flex items-center text-slate-700 text-2xs font-mono">
                                    <Gauge className="h-3 w-3 text-slate-500 mr-1" />
                                    <span>{s.speedMph} MPH</span>
                                  </div>
                                  <div className="flex items-center text-slate-500 text-2xs font-mono">
                                    <Fuel className="h-3 w-3 text-slate-400 mr-1" />
                                    <span>Fuel {s.fuelLevelPercent}%</span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400 capitalize text-2xs">
                                  {s?.status?.replace("_", " ")}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <button
                                className="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-600 hover:text-indigo-600 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedShipment(s);
                                  setIsDetailModalOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Map & Stops Route Visual Container */}
            {selectedShipment && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      Active Map & Telemetry Pipeline
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Real-time GPS plotting of tracking code:{" "}
                      <span className="font-mono font-bold text-slate-800">
                        {selectedShipment.trackingNumber}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg text-xs font-mono">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-slate-600 capitalize">
                      Samsara Device Live
                    </span>
                  </div>
                </div>

                {/* Simulated Map Graphical representation */}
                <div className="relative h-64 w-full bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

                  {/* SVG Mock USA/Canada Border Crossing Route */}
                  <svg
                    className="absolute inset-0 h-full w-full"
                    viewBox="0 0 600 250"
                  >
                    {/* Outer border representation lines */}
                    <line
                      x1="0"
                      y1="110"
                      x2="600"
                      y2="110"
                      stroke="#f1f5f9"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      className="opacity-40"
                    />
                    <text
                      x="15"
                      y="100"
                      fill="#cbd5e1"
                      fontSize="10"
                      className="opacity-50 font-mono tracking-wider uppercase"
                    >
                      CANADA
                    </text>
                    <text
                      x="15"
                      y="130"
                      fill="#cbd5e1"
                      fontSize="10"
                      className="opacity-50 font-mono tracking-wider uppercase"
                    >
                      UNITED STATES
                    </text>

                    {/* Route path */}
                    <path
                      d="M 80 70 Q 230 40 320 110 T 520 180"
                      fill="none"
                      stroke="rgba(99, 102, 241, 0.4)"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />

                    {/* Highlighted section of the path depending on active movement */}
                    <path
                      d="M 80 70 Q 230 40 320 110"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="4"
                      strokeLinecap="round"
                      className="animate-pulse"
                    />

                    {/* Waypoint nodes */}
                    {selectedShipment?.waypoints?.map((wpt, idx) => {
                      const x = 80 + idx * 135;
                      const y =
                        wpt.stopType === "pickup"
                          ? 70
                          : wpt.stopType === "border_crossing"
                          ? 110
                          : 180;
                      return (
                        <g key={wpt.id}>
                          <circle
                            cx={x}
                            cy={y}
                            r={wpt.status === "completed" ? "7" : "9"}
                            fill={
                              wpt.status === "completed"
                                ? "#10b981"
                                : wpt.status === "arrived"
                                ? "#f59e0b"
                                : "#475569"
                            }
                            stroke="#ffffff"
                            strokeWidth="2"
                          />
                          <text
                            x={x + 12}
                            y={y + 4}
                            fill="#ffffff"
                            fontSize="9"
                            className="font-sans font-medium drop-shadow"
                          >
                            {wpt.companyName}
                          </text>
                        </g>
                      );
                    })}

                    {/* Active driving truck pointer */}
                    {selectedShipment.status === "in_transit" && (
                      <g
                        className="animate-bounce"
                        style={{ animationDuration: "3s" }}
                      >
                        <circle
                          cx="260"
                          cy="65"
                          r="14"
                          fill="#6366f1"
                          opacity="0.3"
                        />
                        <circle
                          cx="260"
                          cy="65"
                          r="8"
                          fill="#4f46e5"
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                        <text
                          x="254"
                          y="61"
                          fill="#4f46e5"
                          fontSize="24"
                          transform="rotate(20, 260, 65)"
                        >
                          🚚
                        </text>
                      </g>
                    )}
                  </svg>

                  {/* Left overlay widget */}
                  <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-800 p-3 rounded-lg text-white space-y-1 max-w-[200px]">
                    <div className="text-2xs font-mono uppercase text-slate-400">
                      Current Facility
                    </div>
                    <div className="text-xs font-bold truncate">
                      {selectedShipment?.waypoints?.find(
                        (w) => w.status === "arrived" || w.status === "pending"
                      )?.companyName || "Fully Delivered"}
                    </div>
                    <div className="text-2xs text-indigo-400 font-mono mt-1">
                      Est. Remaining: {selectedShipment.totalDistanceMiles} mi
                    </div>
                  </div>

                  {/* Right overlay widget */}
                  <div className="absolute bottom-3 right-3 bg-slate-900/90 border border-slate-800 p-3 rounded-lg text-white text-right space-y-1">
                    <div className="text-2xs font-mono uppercase text-slate-400">
                      Projected ETA
                    </div>
                    <div className="text-xs font-bold text-emerald-400">
                      {new Date(selectedShipment.eta).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="text-2xs text-slate-300">
                      {new Date(selectedShipment.eta).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Waypoints progression list */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700 font-mono uppercase tracking-tight flex items-center justify-between">
                    <span>
                      Routing Stops Manifest (
                      {selectedShipment?.waypoints?.length} locations)
                    </span>
                    <span className="text-4xs text-slate-400">
                      Click chevrons to manually override stop sequences
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {selectedShipment?.waypoints?.map((wpt, idx) => {
                      const isEditing = editingWaypointId === wpt.id;
                      return (
                        <div
                          key={wpt.id}
                          className={`p-3 rounded-xl border relative group transition-all duration-200 ${
                            wpt.status === "completed"
                              ? "bg-emerald-50/50 border-emerald-200"
                              : wpt.status === "arrived"
                              ? "bg-amber-50 border-amber-300"
                              : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          {/* Manual reordering controls */}
                          <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 shadow-sm border border-slate-100 rounded p-0.5 z-10">
                            <button
                              onClick={() => handleMoveWaypoint(idx, "up")}
                              disabled={idx === 0}
                              title="Move Stop Earlier"
                              className="p-0.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleMoveWaypoint(idx, "down")}
                              disabled={
                                idx === selectedShipment.waypoints.length - 1
                              }
                              title="Move Stop Later"
                              className="p-0.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-3xs font-mono font-bold uppercase text-slate-500">
                              Stop #{idx + 1}
                            </span>
                            <span
                              className={`text-3xs font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                                wpt.status === "completed"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : wpt.status === "arrived"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-200 text-slate-800"
                              }`}
                            >
                              {wpt.status}
                            </span>
                          </div>
                          <div className="font-semibold text-slate-900 text-xs mt-1 truncate">
                            {wpt.companyName}
                          </div>
                          <div className="text-3xs text-slate-500 truncate mt-0.5">
                            {wpt.address}
                          </div>

                          <div className="mt-2 flex flex-col gap-1 border-t border-slate-100 pt-1.5">
                            {isEditing ? (
                              <div className="space-y-1">
                                <input
                                  type="datetime-local"
                                  value={editScheduledTime}
                                  onChange={(e) =>
                                    setEditScheduledTime(e.target.value)
                                  }
                                  className="w-full text-4xs font-mono border border-slate-300 rounded px-1 py-0.5 bg-white"
                                />
                                <div className="flex justify-end gap-1">
                                  <button
                                    onClick={() => setEditingWaypointId(null)}
                                    className="px-1.5 py-0.5 text-[8px] bg-slate-100 rounded hover:bg-slate-200 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleSaveWaypointTime(wpt.id)
                                    }
                                    className="px-1.5 py-0.5 text-[8px] bg-indigo-600 text-white rounded hover:bg-indigo-700 cursor-pointer font-bold"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between text-3xs font-mono text-slate-600">
                                <span className="capitalize text-slate-400 font-bold">
                                  {wpt.stopType.replace("_", " ")}
                                </span>
                                <div className="flex items-center space-x-1">
                                  <span className="text-slate-800 font-bold">
                                    {new Date(
                                      wpt.scheduledTime
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setEditingWaypointId(wpt.id);
                                      setEditScheduledTime(
                                        new Date(wpt.scheduledTime)
                                          .toISOString()
                                          .slice(0, 16)
                                      );
                                    }}
                                    title="Edit scheduled delivery window"
                                    className="text-slate-400 hover:text-indigo-600 p-0.5 rounded hover:bg-slate-100 cursor-pointer text-[10px]"
                                  >
                                    ✏️
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Gemini Route Optimization Block */}
            {selectedShipment && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center space-x-2">
                    <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Gemini Dispatcher Copilot (Route Optimizer)
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Use server-side Gemini intelligence to optimize
                        deliveries, calculate fuel, tolls, and retrieve safety
                        warnings.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleAiOptimizeRoute}
                    disabled={aiLoading}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-lg text-xs font-semibold cursor-pointer transition-colors shrink-0"
                  >
                    {aiLoading ? (
                      <>
                        <span className="animate-spin h-3.5 w-3.5 border-2 border-slate-400 border-t-white rounded-full" />
                        <span>Optimizing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Run AI Optimization</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Dynamic route optimizer parameters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-150">
                  <div>
                    <label className="block text-4xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                      Vehicle Rig Type
                    </label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className="mt-1 block w-full rounded border border-slate-200 px-2.5 py-1 text-2xs bg-white text-slate-800 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="Class 8 Heavy Duty Semi-Truck">
                        Class 8 Heavy Semi-Truck
                      </option>
                      <option value="Temperature Controlled Reefer 53ft">
                        Temperature Controlled Reefer
                      </option>
                      <option value="Flatbed Hauler / Heavy Equipment">
                        Flatbed Hauler
                      </option>
                      <option value="Straight Box Truck (LTL Regional)">
                        Straight Box Truck
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-4xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                      Real-time Weather
                    </label>
                    <select
                      value={weather}
                      onChange={(e) => setWeather(e.target.value)}
                      className="mt-1 block w-full rounded border border-slate-200 px-2.5 py-1 text-2xs bg-white text-slate-800 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="Clear / Dry Roads">
                        Clear / Dry Roads
                      </option>
                      <option value="Heavy Rain & Winds (Hydroplaning risks)">
                        Rain & High Winds
                      </option>
                      <option value="Snow & Ice Storm (Chain laws active)">
                        Heavy Snow & Ice
                      </option>
                      <option value="Dense Fog (Limited Visibility)">
                        Dense Fog / Low Visibility
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-4xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                      Highway Traffic Flow
                    </label>
                    <select
                      value={traffic}
                      onChange={(e) => setTraffic(e.target.value)}
                      className="mt-1 block w-full rounded border border-slate-200 px-2.5 py-1 text-2xs bg-white text-slate-800 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="Normal Flow (No delays)">
                        Normal Flow (No delays)
                      </option>
                      <option value="Moderate Congestion (15-20 min bottlenecks)">
                        Moderate Congestion
                      </option>
                      <option value="Severe Highway Hold-ups (60+ min major delays)">
                        Severe Hold-ups (60+ mins)
                      </option>
                      <option value="Road Construction (Alternate lanes active)">
                        Road Construction Lanes
                      </option>
                    </select>
                  </div>
                </div>

                {aiError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-rose-800">
                        API Optimization Notice
                      </div>
                      <div className="text-2xs text-rose-700 mt-0.5">
                        {aiError}
                      </div>
                    </div>
                  </div>
                )}

                {optimizedRoute && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-4 bg-indigo-50/40 border border-indigo-100 rounded-xl">
                    {/* Sequence & Justification */}
                    <div className="md:col-span-8 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-indigo-100 pb-2">
                        <div className="text-xs font-bold text-indigo-950 font-mono uppercase tracking-wider">
                          Optimized Sequence Order
                        </div>
                        <button
                          onClick={handleApplyAiSequence}
                          className="flex items-center space-x-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold cursor-pointer transition-colors shadow-2xs self-start"
                        >
                          <CheckCircle className="h-3 w-3" />
                          <span>Apply AI Sequence Order</span>
                        </button>
                      </div>
                      <div className="flex items-center flex-wrap gap-2 mt-2">
                        {optimizedRoute.optimizedSequence.map(
                          (seqName, idx) => (
                            <React.Fragment key={idx}>
                              <span className="bg-white border border-indigo-200 px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-900 shadow-2xs">
                                {idx + 1}. {seqName}
                              </span>
                              {idx <
                                optimizedRoute.optimizedSequence.length - 1 && (
                                <ArrowRight className="h-3.5 w-3.5 text-indigo-400" />
                              )}
                            </React.Fragment>
                          )
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-indigo-950 font-mono uppercase tracking-wider">
                          Logistical Justification
                        </div>
                        <p className="text-xs text-slate-700 mt-1.5 leading-relaxed bg-white/80 p-3 rounded-lg border border-indigo-50 shadow-3xs font-medium">
                          {optimizedRoute.justification}
                        </p>
                      </div>
                    </div>

                    {/* Math, Tolls & Tips */}
                    <div className="md:col-span-4 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-3 rounded-xl border border-indigo-100">
                          <span className="text-3xs font-bold font-mono text-slate-500 uppercase">
                            Est. Fuel Cost
                          </span>
                          <div className="text-lg font-bold text-slate-900 mt-0.5">
                            {optimizedRoute.estimatedFuelGallons} Gal
                          </div>
                          <span className="text-3xs text-slate-500">
                            at 6.5 MPG {vehicleType.substring(0, 10)}
                          </span>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-indigo-100">
                          <span className="text-3xs font-bold font-mono text-slate-500 uppercase">
                            Est. Toll Tolls
                          </span>
                          <div className="text-lg font-bold text-slate-900 mt-0.5">
                            ${optimizedRoute.tollEstimatesUsd}
                          </div>
                          <span className="text-3xs text-slate-500">
                            commercial ezpass
                          </span>
                        </div>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-indigo-100 space-y-1.5">
                        <span className="text-xs font-bold text-slate-800 font-mono block uppercase">
                          Driver Safety & Border Tips
                        </span>
                        <ul className="text-2xs text-slate-600 space-y-1.5 pl-3 list-disc">
                          {optimizedRoute.drivingTips.map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right 4 Columns: Samsara ELD details, Border Connect status toggles, & Real-time Messenger */}
          <div className="lg:col-span-4 space-y-6">
            {/* Selected Shipment Administrative Hub */}
            {selectedShipment && (
              <>
                {/* Load Details Controls */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                        <FileText className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wide font-mono">
                        Load Details
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Customer:</span>
                      <span className="font-semibold text-slate-800">
                        {selectedShipment.customer_name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Dispatcher:</span>
                      <span className="font-semibold text-slate-800">
                        {selectedShipment.dispatcher_name || "Unassigned"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Broker/PO:</span>
                      <span className="font-semibold text-slate-800">
                        {selectedShipment.broker || "N/A"} -{" "}
                        {selectedShipment.poNumber || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Driver/Equip:</span>
                      <span className="font-semibold text-slate-800">
                        {selectedShipment.driver_name} (
                        {selectedShipment.truckNumber})
                      </span>
                    </div>
                    {(currentUser.role === "super_admin" ||
                      currentUser.role === "admin" ||
                      currentUser.role === "data_entry") && (
                      <button
                        onClick={() => {
                          setEditedShipment({ ...selectedShipment });
                          setIsEditingDetails(true);
                        }}
                        className="w-full mt-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold py-1.5 rounded-lg text-xs transition-colors border border-indigo-200"
                      >
                        Edit Load Details
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Driver Reassignment & Load Mode Toggle */}
                <div className="bg-gradient-to-br from-indigo-50 to-slate-50 rounded-xl border border-indigo-100 shadow-sm p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-indigo-100/60 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-wide font-mono block">
                          Driver Assignment Hub
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Reassign driver or change freight load mode
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        (selectedShipment.loadType ||
                          (selectedShipment.cargoDescription
                            ?.toLowerCase()
                            .includes("ltl")
                            ? "LTL"
                            : "FTL")) === "FTL"
                          ? "bg-indigo-600 text-white"
                          : "bg-amber-600 text-white"
                      }`}
                    >
                      {selectedShipment.loadType ||
                        (selectedShipment.cargoDescription
                          ?.toLowerCase()
                          .includes("ltl")
                          ? "LTL"
                          : "FTL")}{" "}
                      Mode
                    </span>
                  </div>

                  {!(
                    currentUser.role === "super_admin" ||
                    currentUser.role === "admin" ||
                    currentUser.role === "dispatcher" ||
                    currentUser.role === "driver_manager"
                  ) && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2.5 rounded-lg text-3xs font-medium">
                      ⚠️ Dispatch & driver reassignment are restricted to
                      Dispatchers & Driver Managers.
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                        Quick-Change Active Driver
                      </label>
                      <select
                        disabled={
                          !(
                            currentUser.role === "super_admin" ||
                            currentUser.role === "admin" ||
                            currentUser.role === "dispatcher" ||
                            currentUser.role === "driver_manager"
                          )
                        }
                        value={selectedShipment.driverId || ""}
                        onChange={(e) => {
                          const matched = mockDrivers.find(
                            (d) => d.id === e.target.value
                          );
                          if (matched) {
                            const updated = {
                              ...selectedShipment,
                              driverId: matched.id,
                              driverName: matched.username,
                              truckNumber: matched.truck,
                              trailerNumber: matched.trailer,
                            };
                            onUpdateShipment(updated);
                            setSelectedShipment(updated);
                          }
                        }}
                        className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        <option value="">-- Choose/Reassign Driver --</option>
                        {mockDrivers.map((drv) => (
                          <option key={drv.id} value={drv.id}>
                            {drv.username} (Truck: {drv.truck} | Trailer:{" "}
                            {drv.trailer})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Active Samsara Driver Recommender Widget */}
                    <div className="bg-slate-900/[0.03] border border-slate-200 rounded-xl p-3 mt-1.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold font-mono text-indigo-950 uppercase flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-indigo-600 animate-pulse" />
                          Samsara Fleet Suggestions
                        </span>
                        <span className="text-[8px] font-mono font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded border border-indigo-150">
                          TELEMETRY LIVE
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {getDriverRecommendations(
                          selectedShipment.weightLbs || 0,
                          selectedShipment.palletCount || 0,
                          selectedShipment.originCity ||
                            selectedShipment.waypoints?.[0]?.address ||
                            ""
                        )
                          .slice(0, 3)
                          .map(
                            ({
                              driver,
                              currentRegion,
                              availableWeight,
                              availablePallets,
                              hasWeightCapacity,
                              hasPalletCapacity,
                              isNearby,
                              distanceMiles,
                            }) => {
                              const isCurrentlyAssigned =
                                selectedShipment.driverId === driver.id;
                              const isCapable =
                                hasWeightCapacity && hasPalletCapacity;
                              return (
                                <button
                                  key={driver.id}
                                  disabled={
                                    !(
                                      currentUser.role === "super_admin" ||
                                      currentUser.role === "admin" ||
                                      currentUser.role === "dispatcher" ||
                                      currentUser.role === "driver_manager"
                                    )
                                  }
                                  onClick={() => {
                                    const updated = {
                                      ...selectedShipment,
                                      driverId: driver.id,
                                      driverName: driver.username,
                                      truckNumber: driver.truck,
                                      trailerNumber: driver.trailer,
                                    };
                                    onUpdateShipment(updated);
                                    setSelectedShipment(updated);
                                  }}
                                  className={`w-full text-left p-2 rounded-lg border transition-all text-xs flex flex-col justify-between cursor-pointer ${
                                    isCurrentlyAssigned
                                      ? "bg-indigo-600 text-white border-indigo-500 shadow-xs"
                                      : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-300"
                                  }`}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span className="font-extrabold text-[11px]">
                                      {driver.username}
                                    </span>
                                    <span
                                      className={`text-[8.5px] font-mono font-bold ${
                                        isCurrentlyAssigned
                                          ? "text-indigo-200"
                                          : "text-slate-500"
                                      }`}
                                    >
                                      {isNearby
                                        ? `\u{1F4CD} Nearby (${distanceMiles} mi)`
                                        : `${distanceMiles} mi away`}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between w-full mt-1 text-[8.5px] font-mono border-t border-slate-100/50 pt-1">
                                    <span
                                      className={
                                        isCurrentlyAssigned
                                          ? "text-indigo-200"
                                          : "text-slate-400"
                                      }
                                    >
                                      Trailer Payload Left:
                                    </span>
                                    <span
                                      className={`font-extrabold ${
                                        !isCapable
                                          ? "text-rose-500"
                                          : isCurrentlyAssigned
                                          ? "text-white"
                                          : "text-slate-800"
                                      }`}
                                    >
                                      {availablePallets} plts /{" "}
                                      {availableWeight.toLocaleString()} lbs
                                    </span>
                                  </div>

                                  <div className="flex justify-end gap-1 mt-1">
                                    {isNearby && (
                                      <span
                                        className={`text-[7px] font-bold font-mono uppercase px-1 py-0.2 rounded shrink-0 ${
                                          isCurrentlyAssigned
                                            ? "bg-indigo-500 text-white"
                                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        }`}
                                      >
                                        In Area
                                      </span>
                                    )}
                                    {!isCapable && (
                                      <span className="text-[7px] font-bold font-mono uppercase px-1 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                                        Overweight/Space
                                      </span>
                                    )}
                                    {isCapable && (
                                      <span
                                        className={`text-[7px] font-bold font-mono uppercase px-1 py-0.2 rounded shrink-0 ${
                                          isCurrentlyAssigned
                                            ? "bg-indigo-500 text-white"
                                            : "bg-slate-100 text-slate-700 border border-slate-200"
                                        }`}
                                      >
                                        Fits
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            }
                          )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                        Change Freight Load Mode
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          disabled={
                            !(
                              currentUser.role === "super_admin" ||
                              currentUser.role === "admin" ||
                              currentUser.role === "dispatcher" ||
                              currentUser.role === "driver_manager"
                            )
                          }
                          onClick={() => {
                            const updated = {
                              ...selectedShipment,
                              loadType: "LTL",
                            };
                            onUpdateShipment(updated);
                            setSelectedShipment(updated);
                          }}
                          className={`py-1.5 px-3 rounded-lg text-xs font-bold font-mono transition-all border disabled:opacity-50 ${
                            (selectedShipment.loadType ||
                              (selectedShipment.cargoDescription
                                ?.toLowerCase()
                                .includes("ltl")
                                ? "LTL"
                                : "FTL")) === "LTL"
                              ? "bg-amber-100 text-amber-800 border-amber-300 shadow-sm"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          LTL Mode
                        </button>
                        <button
                          disabled={
                            !(
                              currentUser.role === "super_admin" ||
                              currentUser.role === "admin" ||
                              currentUser.role === "dispatcher" ||
                              currentUser.role === "driver_manager"
                            )
                          }
                          onClick={() => {
                            const updated = {
                              ...selectedShipment,
                              loadType: "FTL",
                            };
                            onUpdateShipment(updated);
                            setSelectedShipment(updated);
                          }}
                          className={`py-1.5 px-3 rounded-lg text-xs font-bold font-mono transition-all border disabled:opacity-50 ${
                            (selectedShipment.loadType ||
                              (selectedShipment.cargoDescription
                                ?.toLowerCase()
                                .includes("ltl")
                                ? "LTL"
                                : "FTL")) === "FTL"
                              ? "bg-indigo-100 text-indigo-800 border-indigo-300 shadow-sm"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          FTL Mode
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Border Connect Customs Status Control */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-cyan-50 text-cyan-700 rounded-lg">
                        <ExternalLink className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wide font-mono">
                        Border Connect Manifest
                      </span>
                    </div>
                    {selectedShipment.borderConnectManifestId && (
                      <span className="text-3xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                        ID: {selectedShipment.borderConnectManifestId}
                      </span>
                    )}
                  </div>

                  {!(
                    currentUser.role === "super_admin" ||
                    currentUser.role === "admin" ||
                    currentUser.role === "customs"
                  ) && (
                    <div className="bg-cyan-50 border border-cyan-200 text-cyan-800 p-2.5 rounded-lg text-3xs font-medium">
                      ℹ️ Border documentation & customs release actions are
                      restricted to the Customs team.
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600">
                        Sync Crossing Status:
                      </span>
                      <span className="text-xs font-mono font-bold capitalize text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        {selectedShipment.borderConnectStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        disabled={
                          !(
                            currentUser.role === "super_admin" ||
                            currentUser.role === "admin" ||
                            currentUser.role === "customs"
                          )
                        }
                        onClick={() => handleUpdateBorderStatus("submitted")}
                        className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded text-3xs font-semibold cursor-pointer transition-colors text-center disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Submit Manifest
                      </button>
                      <button
                        type="button"
                        disabled={
                          !(
                            currentUser.role === "super_admin" ||
                            currentUser.role === "admin" ||
                            currentUser.role === "customs"
                          )
                        }
                        onClick={() => handleUpdateBorderStatus("at_border")}
                        className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-3xs font-semibold cursor-pointer transition-colors text-center disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        At Border
                      </button>
                      <button
                        type="button"
                        disabled={
                          !(
                            currentUser.role === "super_admin" ||
                            currentUser.role === "admin" ||
                            currentUser.role === "customs"
                          )
                        }
                        onClick={() => handleUpdateBorderStatus("accepted")}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-3xs font-semibold cursor-pointer transition-colors text-center disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        CBP Release
                      </button>
                    </div>
                  </div>
                </div>

                {/* Samsara Active Telemetry Panel */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-rose-50 text-rose-700 rounded-lg">
                        <Gauge className="h-4 w-4 animate-pulse" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wide font-mono">
                        Samsara ELD & Fleet Telemetry
                      </span>
                    </div>
                    <span className="text-3xs font-mono text-slate-500">
                      TRK: {selectedShipment.truckNumber}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div className="text-3xs font-mono text-slate-500 uppercase">
                        Engine Speed
                      </div>
                      <div className="text-base font-bold text-slate-900 mt-0.5">
                        {selectedShipment.status === "in_transit"
                          ? `${selectedShipment.speedMph} MPH`
                          : "0 MPH (Parked)"}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div className="text-3xs font-mono text-slate-500 uppercase">
                        Fuel Level
                      </div>
                      <div className="text-base font-bold text-slate-900 mt-0.5">
                        {selectedShipment.fuelLevelPercent}%
                      </div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div className="text-3xs font-mono text-slate-500 uppercase">
                        Coolant Temp
                      </div>
                      <div className="text-base font-bold text-slate-900 mt-0.5">
                        {selectedShipment.engineTempF}°F
                      </div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div className="text-3xs font-mono text-slate-500 uppercase">
                        Duty HOS Log
                      </div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5 capitalize">
                        {selectedShipment.activeHOSStatus || "Off Duty"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Real-time Messenger */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4 text-indigo-600" />
                      <span className="text-xs font-bold text-slate-800 font-mono uppercase">
                        Driver Comms: {selectedShipment.driver_name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-4xs text-slate-500 font-bold uppercase font-mono">
                        GPS LINK OK
                      </span>
                    </div>
                  </div>

                  {/* Messages Box */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
                    {activeChatMessages.length === 0 ? (
                      <div className="text-center text-slate-400 py-12 text-2xs">
                        No communications logged. Type a message below to
                        coordinate border manifests or routing warnings with{" "}
                        {selectedShipment.driver_name}.
                      </div>
                    ) : (
                      activeChatMessages.map((msg, index) => {
                        const isDispatcher = msg.senderRole === "dispatcher";
                        const isLastMsg =
                          index === activeChatMessages.length - 1;
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${
                              isDispatcher ? "items-end" : "items-start"
                            }`}
                          >
                            <div
                              className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs shadow-2xs ${
                                isDispatcher
                                  ? "bg-slate-900 text-white rounded-tr-none"
                                  : "bg-white text-slate-800 border border-slate-200 rounded-tl-none"
                              }`}
                            >
                              {msg.content && (
                                <p className="leading-relaxed">{msg.content}</p>
                              )}

                              {/* Render Chat Attachment if present */}
                              {msg.attachment && (
                                <div
                                  className={`mt-2 p-1.5 rounded-lg border text-2xs ${
                                    isDispatcher
                                      ? "bg-slate-850 border-slate-800 text-slate-200"
                                      : "bg-slate-50 border-slate-100 text-slate-700"
                                  }`}
                                >
                                  {msg.attachment.type === "photo" ? (
                                    <div className="space-y-1">
                                      <img
                                        src={msg.attachment.url}
                                        alt={msg.attachment.name}
                                        className="rounded max-h-24 object-cover w-full cursor-zoom-in"
                                        referrerPolicy="no-referrer"
                                      />
                                      <div className="flex items-center justify-between text-4xs text-slate-400 font-mono">
                                        <span className="truncate">
                                          {msg.attachment.name}
                                        </span>
                                        <span className="shrink-0">
                                          {msg.attachment.size}
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between gap-2 py-0.5">
                                      <div className="flex items-center space-x-1.5 min-w-0">
                                        <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                                        <span className="font-mono truncate font-semibold">
                                          {msg.attachment.name}
                                        </span>
                                      </div>
                                      <span className="text-4xs font-mono text-slate-400 shrink-0">
                                        {msg.attachment.size}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              <span
                                className={`block text-3xs mt-1 text-right font-mono ${
                                  isDispatcher
                                    ? "text-slate-400"
                                    : "text-slate-500"
                                }`}
                              >
                                {new Date(msg.timestamp).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" }
                                )}
                              </span>
                            </div>

                            {/* Read Receipts under dispatcher's last message */}
                            {isDispatcher && isLastMsg && (
                              <span className="text-[9px] font-mono font-semibold text-slate-400 mt-0.5 mr-1 flex items-center gap-1 uppercase">
                                {msg.read ? (
                                  <>
                                    <CheckCircle className="h-2.5 w-2.5 text-emerald-500" />
                                    <span>
                                      Read •{" "}
                                      {new Date(
                                        msg.timestamp
                                      ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </>
                                ) : (
                                  <span>Sent</span>
                                )}
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Attachment Selection Preview bar */}
                  {chatAttachment && (
                    <div className="px-3 py-1.5 bg-indigo-50 border-t border-slate-150 flex items-center justify-between text-2xs text-indigo-900 font-mono">
                      <div className="flex items-center space-x-1.5">
                        {chatAttachment.type === "photo" ? (
                          <Image className="h-3 w-3 text-indigo-600" />
                        ) : (
                          <FileText className="h-3 w-3 text-indigo-600" />
                        )}
                        <span className="font-semibold truncate">
                          📎 {chatAttachment.name}
                        </span>
                        <span className="text-indigo-400 text-3xs">
                          ({chatAttachment.size})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setChatAttachment(null)}
                        className="text-indigo-500 hover:text-indigo-700 font-bold px-1 rounded hover:bg-indigo-100 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Submit Panel */}
                  <div className="p-3 border-t border-slate-150 bg-white space-y-2">
                    <form
                      onSubmit={handleSendMessage}
                      className="flex items-center space-x-2"
                    >
                      {/* Attachment trigger menu */}
                      <div className="relative group">
                        <button
                          type="button"
                          title="Attach proof of delivery or photos"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                        >
                          <Paperclip className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-8 left-0 hidden group-hover:block bg-white border border-slate-200 shadow-md rounded-lg py-1 w-36 z-50 text-2xs">
                          <button
                            type="button"
                            onClick={() => handleAttachMockFile("photo")}
                            className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center space-x-1.5 cursor-pointer text-slate-700"
                          >
                            <Image className="h-3.5 w-3.5 text-slate-400" />
                            <span>Attach Photo</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAttachMockFile("document")}
                            className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center space-x-1.5 cursor-pointer text-slate-700"
                          >
                            <FileText className="h-3.5 w-3.5 text-slate-400" />
                            <span>Attach Manifest</span>
                          </button>
                        </div>
                      </div>

                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={`Message ${selectedShipment.driver_name}...`}
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs bg-slate-50 focus:bg-white focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim() && !chatAttachment}
                        className="p-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 text-white disabled:text-slate-300 rounded-lg cursor-pointer transition-colors"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Details Modal */}
      {isEditingDetails && editedShipment && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                Edit Load Details: {editedShipment.load_number}
              </h3>
              <button
                onClick={() => setIsEditingDetails(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Dispatcher Name
                  </label>
                  <input
                    type="text"
                    value={editedShipment.dispatcherName || ""}
                    onChange={(e) =>
                      setEditedShipment({
                        ...editedShipment,
                        dispatcherName: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Broker
                  </label>
                  <input
                    type="text"
                    value={editedShipment.broker || ""}
                    onChange={(e) =>
                      setEditedShipment({
                        ...editedShipment,
                        broker: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    PO Number
                  </label>
                  <input
                    type="text"
                    value={editedShipment.poNumber || ""}
                    onChange={(e) =>
                      setEditedShipment({
                        ...editedShipment,
                        poNumber: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    BOL Number
                  </label>
                  <input
                    type="text"
                    value={editedShipment.bolNumber || ""}
                    onChange={(e) =>
                      setEditedShipment({
                        ...editedShipment,
                        bolNumber: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Weight (Lbs)
                  </label>
                  <input
                    type="number"
                    value={editedShipment.weightLbs || 0}
                    onChange={(e) =>
                      setEditedShipment({
                        ...editedShipment,
                        weightLbs: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Cargo Description
                  </label>
                  <input
                    type="text"
                    value={editedShipment.cargoDescription || ""}
                    onChange={(e) =>
                      setEditedShipment({
                        ...editedShipment,
                        cargoDescription: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>

                <div className="col-span-2 border-t border-slate-100 pt-4 mt-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-indigo-500" />
                    Delivery Commitment & Appointment Status
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-2xs font-bold text-slate-500 uppercase mb-1">
                        Commitment Type
                      </label>
                      <select
                        value={editedShipment.deliveryCommitment || "normal"}
                        onChange={(e) =>
                          setEditedShipment({
                            ...editedShipment,
                            deliveryCommitment: e.target.value,
                          })
                        }
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs bg-white text-slate-800 font-semibold"
                      >
                        <option value="normal">Normal Delivery</option>
                        <option value="guaranteed">Guaranteed Delivery</option>
                        <option value="guaranteed_appointment">
                          Guaranteed with Appointment Need
                        </option>
                      </select>
                    </div>
                    {editedShipment.deliveryCommitment &&
                      editedShipment.deliveryCommitment !== "normal" && (
                        <>
                          <div>
                            <label className="block text-2xs font-bold text-slate-500 uppercase mb-1">
                              Commitment Date
                            </label>
                            <input
                              type="date"
                              value={editedShipment.commitmentDate || ""}
                              onChange={(e) =>
                                setEditedShipment({
                                  ...editedShipment,
                                  commitmentDate: e.target.value,
                                })
                              }
                              className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs bg-white text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-2xs font-bold text-slate-500 uppercase mb-1">
                              Commitment Time
                            </label>
                            <input
                              type="time"
                              value={editedShipment.commitmentTime || ""}
                              onChange={(e) =>
                                setEditedShipment({
                                  ...editedShipment,
                                  commitmentTime: e.target.value,
                                })
                              }
                              className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs bg-white text-slate-800"
                            />
                          </div>
                        </>
                      )}
                  </div>
                </div>

                <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 mt-2">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                      Assign Driver Profile (Quick Dispatch)
                    </label>
                    <select
                      value={editedShipment.driverId || ""}
                      onChange={(e) => {
                        const matched = mockDrivers.find(
                          (d) => d.id === e.target.value
                        );
                        if (matched) {
                          setEditedShipment({
                            ...editedShipment,
                            driverId: matched.id,
                            driverName: matched.name,
                            truckNumber: matched.truck,
                            trailerNumber: matched.trailer,
                          });
                        }
                      }}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white font-semibold text-slate-800"
                    >
                      <option value="">
                        -- Choose/Reassign an Active Driver --
                      </option>
                      {mockDrivers.map((drv) => (
                        <option key={drv.id} value={drv.id}>
                          {drv.name} (Truck: {drv.truck} | Trailer:{" "}
                          {drv.trailer})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Driver Name (Override)
                    </label>
                    <input
                      type="text"
                      value={editedShipment.driverName || ""}
                      onChange={(e) =>
                        setEditedShipment({
                          ...editedShipment,
                          driverName: e.target.value,
                        })
                      }
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Freight Load Mode
                    </label>
                    <select
                      value={
                        editedShipment.loadType ||
                        (editedShipment.cargoDescription
                          ?.toLowerCase()
                          .includes("ltl")
                          ? "LTL"
                          : "FTL")
                      }
                      onChange={(e) =>
                        setEditedShipment({
                          ...editedShipment,
                          loadType: e.target.value,
                        })
                      }
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white font-semibold"
                    >
                      <option value="LTL">LTL (Less-Than-Truckload)</option>
                      <option value="FTL">FTL (Full Truckload)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Shipment Priority
                    </label>
                    <select
                      value={editedShipment.priority || "standard"}
                      onChange={(e) =>
                        setEditedShipment({
                          ...editedShipment,
                          priority: e.target.value,
                        })
                      }
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white font-semibold"
                    >
                      <option value="standard">Standard</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Truck Number
                    </label>
                    <input
                      type="text"
                      value={editedShipment.truckNumber || ""}
                      onChange={(e) =>
                        setEditedShipment({
                          ...editedShipment,
                          truckNumber: e.target.value,
                        })
                      }
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Trailer Number
                    </label>
                    <input
                      type="text"
                      value={editedShipment.trailerNumber || ""}
                      onChange={(e) =>
                        setEditedShipment({
                          ...editedShipment,
                          trailerNumber: e.target.value,
                        })
                      }
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 flex justify-end space-x-2 bg-slate-50">
              <button
                onClick={() => setIsEditingDetails(false)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onUpdateShipment(editedShipment);
                  if (selectedShipment?.id === editedShipment.id) {
                    setSelectedShipment(editedShipment);
                  }
                  setIsEditingDetails(false);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      {isTripModalOpen && (
        <TripDetailsModal
          isOpen={isTripModalOpen}
          onClose={() => {
            setIsTripModalOpen(false);
            setSelectedTrip(null);
          }}
          setSelectedTrip={setSelectedTrip}
          trip={selectedTrip}
          onUpdateShipment={onUpdateShipment}
          onRemoveTrip={onRemoveTrip}
        />
      )}

      {selectedShipment && (
        <ShipmentDetailsModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          shipment={selectedShipment}
          currentUser={currentUser}
          messages={messages}
          onSendMessage={onSendMessage}
          onUpdateShipment={(updated) => {
            onUpdateShipment(updated);
            setSelectedShipment(updated);
          }}
          onMarkMessagesAsRead={onMarkMessagesAsRead}
        />
      )}
    </div>
  );
}
