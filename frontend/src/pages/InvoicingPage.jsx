import { useInvoiceStore } from "../store/useInvoiceStore";
import { useShipmentStore } from "../store/useShipmentStore";
import { useDocumentStore } from "../store/useDocumentStore";
import InvoicingDashboard from "../components/InvoicingDashboard";

export default function InvoicingPage() {
  const invoices = useInvoiceStore((state) => state.invoices);
  const addInvoice = useInvoiceStore((state) => state.addInvoice);
  const updateInvoice = useInvoiceStore((state) => state.updateInvoice);

  const shipments = useShipmentStore((state) => state.shipments);
  const updateShipment = useShipmentStore((state) => state.updateShipment);

  const documents = useDocumentStore((state) => state.documents);
  const updateDocument = useDocumentStore((state) => state.updateDocument);

  const handleAddInvoice = async (newInvoice) => {
    await addInvoice(newInvoice);
    const doc = documents.find((d) => d.shipmentId === newInvoice.shipmentId);
    if (doc) {
      const updatedDoc = { ...doc, status: "matched_to_invoice" };
      await updateDocument(updatedDoc);
    }
  };

  const handleUpdateInvoiceStatus = async (id, status) => {
    const inv = invoices.find((i) => i.id === id);
    if (inv) {
      await updateInvoice({ ...inv, status });
    }
  };

  const handleUpdateInvoice = async (updated) => {
    await updateInvoice(updated);
  };

  const handleVerifyDocument = async (docId, status) => {
    const doc = documents.find((d) => d.id === docId);
    if (doc) {
      const updatedDoc = { ...doc, status };
      await updateDocument(updatedDoc);

      if (status === "approved") {
        const ship = shipments.find((s) => s.id === doc.shipmentId);
        if (ship && !ship.documentIds.includes(docId)) {
          const updatedShip = {
            ...ship,
            documentIds: [...ship.documentIds, docId],
          };
          await updateShipment(updatedShip);
        }
      }
    }
  };

  return (
    <InvoicingDashboard
      invoices={invoices}
      shipments={shipments}
      documents={documents}
      onAddInvoice={handleAddInvoice}
      onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
      onUpdateInvoice={handleUpdateInvoice}
      onVerifyDocument={handleVerifyDocument}
    />
  );
}
