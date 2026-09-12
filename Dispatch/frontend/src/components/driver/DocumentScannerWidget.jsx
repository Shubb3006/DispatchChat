// import React from "react";
// import {
//   FileText,
//   Upload,
//   Camera,
//   Sparkles,
//   AlertTriangle,
//   CheckCircle,
//   CheckCircle2,
//   Download,
//   Eye,
//   Printer,
//   X,
//   Shield,
//   Clock,
//   Check,
// } from "lucide-react";

// export default function DocumentScannerWidget({
//   docType,
//   setDocType,
//   parserLoadId,
//   setParserLoadId,
//   parserCustomLoadNumber,
//   setParserCustomLoadNumber,
//   shipments,
//   fileInputRef,
//   handleFileChange,
//   fileName,
//   fileText,
//   setFileText,
//   ocrLoading,
//   ocrError,
//   handleParseDocument,
//   skidPhotos,
//   setSkidPhotos,
//   startSkidCamera,
//   extractedResult,
//   myDocuments,
//   docLogFilter,
//   setDocLogFilter,
//   filteredDocLogs,
//   selectedDocIds,
//   handleSelectAllFilteredDocs,
//   handleBulkDownload,
//   handleBulkStatusUpdate,
//   handleToggleSelectDoc,
//   selectedLogDoc,
//   setSelectedLogDoc,
//   getDocumentImage,
//   handlePrintDocument,
//   handleDownloadDocument,
//   internalNoteText,
//   setInternalNoteText,
//   noteSaved,
//   handleSaveInternalNote,
// }) {
//   return (
//     <div className="space-y-6">
//       {/* Real-Time Document Collector & AI-OCR Parser */}
//       <div className="bg-base-100 rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
//         <div className="flex items-center space-x-2.5">
//           <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
//             <FileText className="h-5 w-5" />
//           </div>
//           <div>
//             <h3 className="text-sm font-bold text-base-content">
//               Real-time Document Collector &amp; AI-OCR Parser
//             </h3>
//             <p className="text-xs text-base-content mt-0.5">
//               Scans Bills of Lading (BOL), Proof of Delivery (POD), and fuel
//               receipts using Gemini vision.
//             </p>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
//           {/* Document selection and upload */}
//           <div className="md:col-span-5 space-y-4">
//             <div>
//               <label className="block text-2xs font-bold text-slate-700 uppercase font-mono mb-1">
//                 Document Class
//               </label>
//               <select
//                 value={docType}
//                 onChange={(e) => setDocType(e.target.value)}
//                 className="block w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-base-100 focus:outline-none focus:border-indigo-500"
//               >
//                 <option value="bol">Bill of Lading (BOL)</option>
//                 <option value="pod">Proof of Delivery (POD)</option>
//                 <option value="fuel_receipt">Fuel / Diesel Receipt</option>
//                 <option value="scale_ticket">Scale weight ticket</option>
//                 <option value="skid_picture">
//                   Skid Picture (Pickup / Condition)
//                 </option>
//               </select>
//             </div>

//             <div>
//               <label className="block text-2xs font-bold text-slate-700 uppercase font-mono mb-1">
//                 Load / Shipment Number <span className="text-rose-500">*</span>
//               </label>
//               <select
//                 value={parserLoadId}
//                 onChange={(e) => setParserLoadId(e.target.value)}
//                 className="block w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-base-100 focus:outline-none focus:border-indigo-500"
//               >
//                 {shipments.map((s) => (
//                   <option key={s.id} value={s.id}>
//                     {s.trackingNumber} — {s.originCity} to {s.destinationCity}
//                   </option>
//                 ))}
//                 <option value="custom">
//                   -- Enter custom load number manually --
//                 </option>
//               </select>
//               {parserLoadId === "custom" && (
//                 <input
//                   type="text"
//                   placeholder="Type Custom Load / Tracking Number"
//                   value={parserCustomLoadNumber}
//                   onChange={(e) => setParserCustomLoadNumber(e.target.value)}
//                   className="mt-1.5 block w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-base-100 focus:outline-none focus:border-indigo-500"
//                 />
//               )}
//             </div>

//             {docType === "skid_picture" ? (
//               <div
//                 id="skid-capture-dashboard"
//                 className="bg-base-200 border border-slate-200 rounded-xl p-4 space-y-4"
//               >
//                 <div className="flex items-center justify-between">
//                   <span className="text-2xs font-bold text-indigo-900 uppercase font-mono tracking-wider">
//                     Pallet condition batch capture
//                   </span>
//                   {skidPhotos.length > 0 && (
//                     <button
//                       type="button"
//                       onClick={() => setSkidPhotos([])}
//                       className="text-3xs text-rose-600 hover:text-rose-700 font-bold uppercase tracking-wider cursor-pointer"
//                     >
//                       Clear Batch
//                     </button>
//                   )}
//                 </div>

//                 {skidPhotos.length === 0 ? (
//                   <div className="border border-dashed border-slate-300 rounded-xl p-6 text-center bg-base-100">
//                     <Camera className="h-6 w-6 text-slate-400 mx-auto animate-pulse" />
//                     <span className="block text-xs font-semibold text-slate-600 mt-2">
//                       No pallet photos captured yet
//                     </span>
//                     <p className="text-[10px] text-slate-400 mt-1">
//                       Select Skid Picture to launch camera automatically, or
//                       click below to launch manually.
//                     </p>
//                   </div>
//                 ) : (
//                   <div className="space-y-2">
//                     <div className="grid grid-cols-3 gap-2">
//                       {skidPhotos.map((pic, i) => (
//                         <div
//                           key={i}
//                           className="relative rounded-lg overflow-hidden aspect-video border border-slate-200 bg-slate-900"
//                         >
//                           <img
//                             src={pic}
//                             alt="skid preview"
//                             className="w-full h-full object-cover"
//                             referrerPolicy="no-referrer"
//                           />
//                           <div className="absolute bottom-1 right-1 bg-slate-950/80 text-[8px] font-bold font-mono px-1 py-0.2 text-white rounded">
//                             #{i + 1}
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                     <span className="block text-[10px] text-emerald-600 font-mono font-bold">
//                       ✓ {skidPhotos.length} Pallet condition photos ready in
//                       sequential batch
//                     </span>
//                   </div>
//                 )}

//                 <button
//                   type="button"
//                   onClick={() => startSkidCamera()}
//                   className="w-full flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold cursor-pointer border border-indigo-200 transition-colors"
//                 >
//                   <Camera className="h-3.5 w-3.5" />
//                   <span>
//                     {skidPhotos.length > 0
//                       ? `Capture More Photos (${skidPhotos.length})`
//                       : "Launch Skid Condition Camera"}
//                   </span>
//                 </button>
//               </div>
//             ) : (
//               <div
//                 onClick={() => fileInputRef.current?.click()}
//                 className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-5 text-center cursor-pointer bg-base-200 hover:bg-base-200/50 transition-colors"
//               >
//                 <Upload className="h-6 w-6 text-slate-400 mx-auto" />
//                 <span className="block text-xs font-semibold text-slate-800 mt-2">
//                   {fileName ? fileName : "Upload signed receipt image"}
//                 </span>
//                 <span className="block text-3xs text-base-content mt-1">
//                   PNG, JPG or PDF up to 10MB
//                 </span>

//                 <input
//                   type="file"
//                   ref={fileInputRef}
//                   onChange={handleFileChange}
//                   className="hidden"
//                   accept="image/*,application/pdf"
//                 />
//               </div>
//             )}

//             <div>
//               <label className="block text-2xs font-bold text-slate-700 uppercase font-mono mb-1">
//                 OCR Text Fallback (or test input)
//               </label>
//               <textarea
//                 value={fileText}
//                 onChange={(e) => setFileText(e.target.value)}
//                 rows={3}
//                 placeholder="Provide description or mock text if not uploading an image file to trigger Gemini's simulation parsing..."
//                 className="block w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-base-100 focus:outline-none focus:border-indigo-500"
//               />
//             </div>

//             <button
//               type="button"
//               onClick={handleParseDocument}
//               disabled={
//                 ocrLoading ||
//                 (docType === "skid_picture" && skidPhotos.length === 0)
//               }
//               className="w-full flex items-center justify-center space-x-1.5 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm"
//             >
//               {ocrLoading ? (
//                 <>
//                   <span className="animate-spin h-3.5 w-3.5 border-2 border-slate-400 border-t-white rounded-full mr-2" />
//                   <span>Gemini Analyzing Document...</span>
//                 </>
//               ) : (
//                 <>
//                   <Sparkles className="h-3.5 w-3.5 text-indigo-200" />
//                   <span>
//                     {docType === "skid_picture"
//                       ? "Submit Skid Condition Batch"
//                       : "Submit Document to Billing"}
//                   </span>
//                 </>
//               )}
//             </button>
//           </div>

//           {/* Parsed Output Panel */}
//           <div className="md:col-span-7">
//             <div className="bg-base-200 rounded-2xl p-4 border border-slate-200 h-full min-h-[220px] flex flex-col justify-between">
//               {ocrError && (
//                 <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2">
//                   <AlertTriangle className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
//                   <div>
//                     <div className="text-xs font-bold text-rose-800 font-sans">
//                       Gemini API OCR Notice
//                     </div>
//                     <div className="text-2xs text-rose-700 mt-0.5">
//                       {ocrError}
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {extractedResult ? (
//                 <div className="space-y-3 flex-1">
//                   <div className="flex items-center justify-between border-b border-slate-200 pb-2">
//                     <span className="text-xs font-bold text-indigo-900 font-mono uppercase tracking-wider">
//                       AI Extraction Results
//                     </span>
//                     <span className="text-3xs font-bold font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
//                       Confidence {extractedResult.confidence}%
//                     </span>
//                   </div>

//                   <div className="grid grid-cols-2 gap-3 text-2xs font-mono text-slate-700">
//                     <div>
//                       <span className="text-slate-400 text-3xs uppercase">
//                         BOL Number
//                       </span>
//                       <div className="font-bold text-slate-800 mt-0.5">
//                         {extractedResult.bolNumber || "N/A"}
//                       </div>
//                     </div>
//                     <div>
//                       <span className="text-slate-400 text-3xs uppercase">
//                         Purchase Order
//                       </span>
//                       <div className="font-bold text-slate-800 mt-0.5">
//                         {extractedResult.purchaseOrder || "N/A"}
//                       </div>
//                     </div>
//                     <div className="col-span-2">
//                       <span className="text-slate-400 text-3xs uppercase">
//                         Shipper (Pickup)
//                       </span>
//                       <div className="font-bold text-slate-800 mt-0.5">
//                         {extractedResult.shipperName || "N/A"}
//                       </div>
//                     </div>
//                     <div className="col-span-2">
//                       <span className="text-slate-400 text-3xs uppercase">
//                         Consignee (Delivery)
//                       </span>
//                       <div className="font-bold text-slate-800 mt-0.5">
//                         {extractedResult.consigneeName || "N/A"}
//                       </div>
//                     </div>
//                     <div className="col-span-2">
//                       <span className="text-slate-400 text-3xs uppercase">
//                         Cargo Items &amp; Pallets
//                       </span>
//                       <div className="font-bold text-slate-800 mt-0.5">
//                         {extractedResult.items || "N/A"}
//                       </div>
//                     </div>
//                     <div>
//                       <span className="text-slate-400 text-3xs uppercase">
//                         Weight (Lbs)
//                       </span>
//                       <div className="font-bold text-slate-800 mt-0.5">
//                         {extractedResult.weightLbs
//                           ? `${extractedResult.weightLbs} Lbs`
//                           : "N/A"}
//                       </div>
//                     </div>
//                     <div>
//                       <span className="text-slate-400 text-3xs uppercase">
//                         Signature Detected
//                       </span>
//                       <div className="font-bold text-slate-800 mt-0.5">
//                         {extractedResult.signatureFound
//                           ? "✅ Signed"
//                           : "❌ No Signature"}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               ) : !ocrLoading ? (
//                 <div className="flex flex-col items-center justify-center text-center text-slate-400 my-auto py-10">
//                   <FileText className="h-10 w-10 text-slate-300 stroke-1" />
//                   <p className="text-xs font-semibold text-slate-600 mt-3">
//                     Awaiting Scan Document
//                   </p>
//                   <p className="text-2xs text-base-content mt-1 max-w-[300px]">
//                     Upload or describe a shipping document, click "Submit
//                     Document to Billing" to verify, match BOL, and trigger OCR
//                     extraction.
//                   </p>
//                 </div>
//               ) : (
//                 <div className="flex flex-col items-center justify-center text-center text-indigo-600 my-auto py-10">
//                   <div className="relative flex items-center justify-center">
//                     <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-indigo-400 opacity-75" />
//                     <div className="relative bg-indigo-600 text-white rounded-full h-10 w-10 flex items-center justify-center shadow-lg font-bold">
//                       AI
//                     </div>
//                   </div>
//                   <p className="text-xs font-bold text-slate-800 mt-4 animate-pulse">
//                     Running OCR &amp; Key-value Extraction...
//                   </p>
//                   <p className="text-3xs text-base-content mt-1">
//                     Verifying signatures and parsing shipment manifest weight
//                     scales.
//                   </p>
//                 </div>
//               )}

//               {extractedResult && (
//                 <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center space-x-2 mt-4 text-emerald-800 text-3xs">
//                   <CheckCircle className="h-4 w-4 shrink-0" />
//                   <span>
//                     Document matched successfully with load registry and sent to
//                     Billing &amp; Safety teams for administrative routing
//                     approval.
//                   </span>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Uploaded Documents Logs History */}
//       <div className="bg-base-100 rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
//         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
//           <div className="flex items-center gap-2">
//             {filteredDocLogs.length > 0 && (
//               <input
//                 type="checkbox"
//                 checked={
//                   filteredDocLogs.length > 0 &&
//                   filteredDocLogs.every((d) => selectedDocIds.includes(d.id))
//                 }
//                 onChange={(e) => handleSelectAllFilteredDocs(e.target.checked)}
//                 className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
//                 title="Select / deselect all filtered documents"
//               />
//             )}
//             <h4 className="text-xs font-bold text-slate-800 uppercase font-mono">
//               Scanned Logistics Document Logs ({myDocuments.length})
//             </h4>
//           </div>
//           <div className="flex items-center gap-2 shrink-0">
//             <label
//               htmlFor="doc-status-filter"
//               className="text-[10px] font-bold text-slate-400 uppercase font-mono"
//             >
//               Filter:
//             </label>
//             <select
//               id="doc-status-filter"
//               value={docLogFilter}
//               onChange={(e) => setDocLogFilter(e.target.value)}
//               className="text-2xs bg-base-200 border border-slate-200 rounded-lg px-2.5 py-1 font-sans text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
//             >
//               <option value="all">All Documents</option>
//               <option value="pending_review">Pending Review</option>
//               <option value="approved">Approved</option>
//               <option value="rejected">Rejected</option>
//             </select>
//           </div>
//         </div>

//         {selectedDocIds.length > 0 && (
//           <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
//             <div className="flex items-center space-x-2">
//               <div className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold font-mono">
//                 {selectedDocIds.length} Selected
//               </div>
//               <span className="text-2xs font-medium text-indigo-950">
//                 Bulk actions on selected logistics records
//               </span>
//             </div>
//             <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
//               <button
//                 type="button"
//                 onClick={handleBulkDownload}
//                 className="flex items-center gap-1 px-3 py-1.5 bg-base-100 hover:bg-base-200 border border-slate-200 rounded-lg text-3xs font-bold text-slate-700 transition-colors shadow-2xs cursor-pointer"
//               >
//                 <Download className="h-3 w-3" />
//                 <span>Download Selected</span>
//               </button>

//               <div className="h-4 w-[1px] bg-indigo-200/60 hidden sm:block" />

//               <div className="flex items-center gap-1.5">
//                 <button
//                   type="button"
//                   onClick={() => handleBulkStatusUpdate("approved")}
//                   className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-3xs font-bold transition-colors cursor-pointer"
//                 >
//                   Approve
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => handleBulkStatusUpdate("rejected")}
//                   className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-3xs font-bold transition-colors cursor-pointer"
//                 >
//                   Reject
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => handleBulkStatusUpdate("pending_review")}
//                   className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-3xs font-bold transition-colors cursor-pointer"
//                 >
//                   Pending
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {myDocuments.length === 0 ? (
//           <p className="text-3xs text-slate-400 text-center py-6">
//             No shipping receipts uploaded on this trip yet.
//           </p>
//         ) : filteredDocLogs.length === 0 ? (
//           <p className="text-3xs text-slate-400 text-center py-6">
//             No documents match the selected filter.
//           </p>
//         ) : (
//           <div className="space-y-2">
//             {filteredDocLogs.map((doc) => (
//               <div
//                 key={doc.id}
//                 onClick={() => setSelectedLogDoc(doc)}
//                 className="w-full p-2.5 rounded-xl bg-base-200 border border-slate-200 flex items-center justify-between hover:bg-slate-100/85 transition-all text-left cursor-pointer group"
//               >
//                 <div className="flex items-center space-x-3 min-w-0 flex-1">
//                   <div
//                     className="flex items-center shrink-0"
//                     onClick={(e) => e.stopPropagation()}
//                   >
//                     <input
//                       type="checkbox"
//                       checked={selectedDocIds.includes(doc.id)}
//                       onChange={() => handleToggleSelectDoc(doc.id)}
//                       className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
//                     />
//                   </div>

//                   <div
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       setSelectedLogDoc(doc);
//                     }}
//                     className="relative h-10 w-10 rounded-lg overflow-hidden bg-slate-200 border border-slate-300 shrink-0 cursor-pointer group/thumb hover:ring-2 hover:ring-indigo-500 transition-all"
//                     title="Click to view visual document content"
//                   >
//                     <img
//                       src={getDocumentImage(doc)}
//                       alt={doc.fileName}
//                       className="h-full w-full object-cover group-hover/thumb:scale-110 transition-transform duration-200"
//                       referrerPolicy="no-referrer"
//                     />
//                     <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
//                       <Eye className="h-4 w-4 text-white" />
//                     </div>
//                   </div>

//                   <div className="min-w-0 flex-1">
//                     <div className="text-2xs font-bold text-base-content truncate group-hover:text-indigo-600 transition-colors flex items-center gap-1">
//                       {doc.fileName}
//                       {doc.internalNote && (
//                         <span
//                           className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"
//                           title="Has internal admin note"
//                         />
//                       )}
//                     </div>
//                     <div className="text-3xs text-base-content font-mono capitalize flex items-center gap-1 flex-wrap">
//                       <span>
//                         {doc.type.replace("_", " ")} • {doc.fileSize}
//                       </span>
//                       {doc.internalNote && (
//                         <span
//                           className="text-amber-600 font-sans font-semibold text-[9px] truncate max-w-[150px] bg-amber-50 px-1 rounded"
//                           title={doc.internalNote}
//                         >
//                           Note: {doc.internalNote}
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//                 <span
//                   className={`text-[9px] font-mono font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full shrink-0 ml-2 border flex items-center gap-1 ${
//                     doc.status === "approved" ||
//                     doc.status === "matched_to_invoice"
//                       ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
//                       : doc.status === "rejected"
//                       ? "bg-rose-50 text-rose-700 border-rose-200/60"
//                       : "bg-amber-50 text-amber-700 border-amber-200/60"
//                   }`}
//                 >
//                   <span
//                     className={`w-1 h-1 rounded-full ${
//                       doc.status === "approved" ||
//                       doc.status === "matched_to_invoice"
//                         ? "bg-emerald-500"
//                         : doc.status === "rejected"
//                         ? "bg-rose-500"
//                         : "bg-amber-500"
//                     }`}
//                   />
//                   {doc.status === "pending_review"
//                     ? "pending"
//                     : doc.status === "matched_to_invoice"
//                     ? "approved"
//                     : doc.status}
//                 </span>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Document Details Modal */}
//       {selectedLogDoc && (
//         <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
//           <div className="bg-base-100 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
//             <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
//               <div className="flex items-center space-x-3">
//                 <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
//                   <FileText className="h-5 w-5" />
//                 </div>
//                 <div>
//                   <div className="flex items-center gap-1.5 flex-wrap">
//                     <h3 className="text-sm font-bold text-base-content">
//                       {selectedLogDoc.fileName}
//                     </h3>
//                     <span
//                       className={`text-[8px] font-mono font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border flex items-center gap-0.5 ${
//                         selectedLogDoc.status === "approved" ||
//                         selectedLogDoc.status === "matched_to_invoice"
//                           ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
//                           : selectedLogDoc.status === "rejected"
//                           ? "bg-rose-50 text-rose-700 border-rose-200/60"
//                           : "bg-amber-50 text-amber-700 border-amber-200/60"
//                       }`}
//                     >
//                       {selectedLogDoc.status === "pending_review"
//                         ? "pending"
//                         : selectedLogDoc.status === "matched_to_invoice"
//                         ? "approved"
//                         : selectedLogDoc.status}
//                     </span>
//                   </div>
//                   <p className="text-xs text-base-content capitalize">
//                     {selectedLogDoc.type.replace("_", " ")} •{" "}
//                     {selectedLogDoc.fileSize}
//                   </p>
//                 </div>
//               </div>
//               <div className="flex items-center gap-1.5 shrink-0">
//                 <button
//                   onClick={() => handlePrintDocument(selectedLogDoc)}
//                   className="p-1.5 hover:bg-slate-100 hover:text-slate-800 rounded-lg text-base-content transition-colors flex items-center justify-center cursor-pointer"
//                   title="Print simplified document"
//                 >
//                   <Printer className="h-5 w-5" />
//                 </button>
//                 <button
//                   onClick={() => handleDownloadDocument(selectedLogDoc)}
//                   className="p-1.5 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-base-content transition-colors flex items-center justify-center cursor-pointer"
//                   title="Download document file"
//                 >
//                   <Download className="h-5 w-5" />
//                 </button>
//                 <button
//                   onClick={() => setSelectedLogDoc(null)}
//                   className="p-1.5 hover:bg-slate-100 rounded-lg text-base-content transition-colors cursor-pointer"
//                 >
//                   <X className="h-5 w-5" />
//                 </button>
//               </div>
//             </div>

//             <div className="p-5 overflow-y-auto space-y-6">
//               {/* Document Image Placeholder / Photo Gallery */}
//               {selectedLogDoc.type === "skid_picture" &&
//               selectedLogDoc.skidPictures &&
//               selectedLogDoc.skidPictures.length > 0 ? (
//                 <div className="space-y-3">
//                   <span className="block text-2xs font-bold text-base-content uppercase tracking-wider font-mono">
//                     Captured Pallet Condition Photos (
//                     {selectedLogDoc.skidPictures.length})
//                   </span>
//                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                     {selectedLogDoc.skidPictures.map((pic, idx) => (
//                       <div
//                         key={idx}
//                         className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 group"
//                       >
//                         <img
//                           src={pic}
//                           alt={`Pallet condition ${idx + 1}`}
//                           className="w-full h-44 object-cover"
//                           referrerPolicy="no-referrer"
//                         />
//                         <div className="absolute top-2 left-2 bg-slate-950/80 text-[10px] font-mono font-bold px-2 py-0.5 text-white rounded-md">
//                           PHOTO #{idx + 1}
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               ) : (
//                 <div className="space-y-3">
//                   <span className="block text-2xs font-bold text-base-content uppercase tracking-wider font-mono">
//                     Scanned Document Visual Preview
//                   </span>
//                   <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-950 group shadow-sm">
//                     <img
//                       src={getDocumentImage(selectedLogDoc)}
//                       alt={selectedLogDoc.fileName}
//                       className="w-full h-56 sm:h-64 object-cover group-hover:scale-[1.02] transition-transform duration-300"
//                       referrerPolicy="no-referrer"
//                     />
//                   </div>
//                 </div>
//               )}

//               {/* Extracted Metadata */}
//               {selectedLogDoc.extractedData && (
//                 <div className="space-y-3">
//                   <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono border-b border-slate-200 pb-2">
//                     Extracted Metadata
//                   </h4>
//                   <div className="grid grid-cols-2 gap-3">
//                     {selectedLogDoc.extractedData.shipperName && (
//                       <div className="bg-base-200 p-2.5 rounded-xl border border-slate-100">
//                         <span className="block text-3xs font-bold text-base-content uppercase mb-0.5">
//                           Shipper
//                         </span>
//                         <span className="block text-xs font-semibold text-base-content truncate">
//                           {selectedLogDoc.extractedData.shipperName}
//                         </span>
//                       </div>
//                     )}
//                     {selectedLogDoc.extractedData.consigneeName && (
//                       <div className="bg-base-200 p-2.5 rounded-xl border border-slate-100">
//                         <span className="block text-3xs font-bold text-base-content uppercase mb-0.5">
//                           Consignee
//                         </span>
//                         <span className="block text-xs font-semibold text-base-content truncate">
//                           {selectedLogDoc.extractedData.consigneeName}
//                         </span>
//                       </div>
//                     )}
//                     {selectedLogDoc.extractedData.bolNumber && (
//                       <div className="bg-base-200 p-2.5 rounded-xl border border-slate-100">
//                         <span className="block text-3xs font-bold text-base-content uppercase mb-0.5">
//                           BOL Number
//                         </span>
//                         <span className="block text-xs font-semibold text-base-content">
//                           {selectedLogDoc.extractedData.bolNumber}
//                         </span>
//                       </div>
//                     )}
//                     {selectedLogDoc.extractedData.purchaseOrder && (
//                       <div className="bg-base-200 p-2.5 rounded-xl border border-slate-100">
//                         <span className="block text-3xs font-bold text-base-content uppercase mb-0.5">
//                           PO Number
//                         </span>
//                         <span className="block text-xs font-semibold text-base-content">
//                           {selectedLogDoc.extractedData.purchaseOrder}
//                         </span>
//                       </div>
//                     )}
//                     {selectedLogDoc.extractedData.weightLbs && (
//                       <div className="bg-base-200 p-2.5 rounded-xl border border-slate-100">
//                         <span className="block text-3xs font-bold text-base-content uppercase mb-0.5">
//                           Weight
//                         </span>
//                         <span className="block text-xs font-semibold text-base-content">
//                           {selectedLogDoc.extractedData.weightLbs} Lbs
//                         </span>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               )}

//               {/* Internal Note Section */}
//               <div className="bg-amber-50/40 border border-amber-200/60 rounded-xl p-4 space-y-3">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-1.5">
//                     <Shield className="h-4 w-4 text-amber-600" />
//                     <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
//                       Internal Administration Note
//                     </span>
//                   </div>
//                   {selectedLogDoc.internalNote && (
//                     <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded">
//                       Saved Note Active
//                     </span>
//                   )}
//                 </div>

//                 <div className="space-y-2">
//                   <textarea
//                     value={internalNoteText}
//                     onChange={(e) => setInternalNoteText(e.target.value)}
//                     placeholder="Enter internal note or reason for rejection..."
//                     className="w-full h-20 text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-base-100 placeholder-slate-400 font-sans leading-relaxed resize-none text-slate-800"
//                   />
//                   <div className="flex justify-end items-center gap-2">
//                     {noteSaved && (
//                       <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
//                         <Check className="h-3.5 w-3.5" /> Note saved
//                         successfully
//                       </span>
//                     )}
//                     <button
//                       type="button"
//                       onClick={handleSaveInternalNote}
//                       className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
//                     >
//                       Save Note
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

import React, { useState } from "react";
import { useDocumentStore } from "../../stores/useDocumentStore";

export default function DocumentScannerWidget({ myShipment }) {
  const loadId = myShipment.id
  const [file, setFile] = useState(null);
  const { uploadBOL, uploading, error } = useDocumentStore();

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select or capture a BOL image first.");

    const result = await uploadBOL(loadId, file);
    if (result.success) {
      alert("BOL uploaded successfully! Awaiting dispatcher approval.");
      setFile(null);
      if (onUploadSuccess) onUploadSuccess();
    } else {
      alert(`Upload failed: ${result.error}`);
    }
  };

  return (
    <div className="bg-base-100 p-4 rounded shadow border border-base-300">
      <h3 className="text-md font-semibold text-gray-700 mb-2">
        Upload Bill of Lading (BOL)
      </h3>
      <p className="text-xs text-base-content/60 mb-4">
        Take a clear photo of the signed BOL upon reaching the pickup location.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-base-content/60 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />

        {file && (
          <p className="text-xs text-green-600 font-medium">
            Selected file: {file.name}
          </p>
        )}

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:bg-gray-400 text-sm"
        >
          {uploading ? "Uploading to Dispatch..." : "Submit BOL for Approval"}
        </button>
      </form>
    </div>
  );
}
