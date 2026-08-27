import React from "react";
import {
  Camera,
  X,
  Image,
  ChevronLeft,
  ChevronRight,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
} from "lucide-react";

export default function CameraBatchModal({
  isSkidCameraOpen,
  setIsSkidCameraOpen,
  videoRef,
  skidCanvasRef,
  skidPhotos,
  setSkidPhotos,
  captureSkidPhoto,
  stopSkidCamera,
  isBatchPreviewOpen,
  setIsBatchPreviewOpen,
  previewSelectedIndex,
  setPreviewSelectedIndex,
  handleMovePhoto,
  handleDeletePhoto,
  handleFinishSkidBatch,
  driverLocation,
  isMobileMode,
}) {
  return (
    <>
      <canvas ref={skidCanvasRef} className="hidden" />

      {/* SKID CONDITION CAMERA INTERFACE */}
      {isSkidCameraOpen && (
        <div
          id="skid-camera-modal"
          className="fixed inset-0 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 z-[60]"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl p-5 md:p-6 flex flex-col gap-5 shadow-2xl relative text-slate-100 max-h-[95vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                  <Camera className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                    Cargo Skid Condition Camera
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-3xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      LIVE STREAM
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                    Samsara Watermarked Cargo Verification
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="bg-emerald-500/10 text-emerald-400 text-3xs font-mono font-bold px-2.5 py-1 rounded-full border border-emerald-500/20">
                  {skidPhotos.length} Captured
                </span>
                <button
                  type="button"
                  onClick={() => {
                    stopSkidCamera();
                    setIsSkidCameraOpen(false);
                  }}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Video Viewfinder */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              <div className="md:col-span-8 flex flex-col gap-3">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center shadow-inner">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Watermark Overlay */}
                  <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-sm border border-slate-800 text-[9px] font-mono font-bold px-2.5 py-1 text-indigo-300 rounded-lg flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>
                      GPS: {driverLocation?.lat?.toFixed(4)}°N,{" "}
                      {driverLocation?.lng?.toFixed(4)}°W
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[9px] font-mono text-slate-400 bg-slate-950/80 backdrop-blur-sm p-2 rounded-lg border border-slate-800">
                    <span>STATUS: READY</span>
                    <span className="text-emerald-400 font-bold">
                      STAMP VERIFIED
                    </span>
                  </div>
                </div>

                {/* Shutter Button */}
                <button
                  type="button"
                  onClick={captureSkidPhoto}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-indigo-950/50 flex items-center justify-center space-x-2 font-mono"
                >
                  <Camera className="h-4 w-4" />
                  <span>Snap Pallet Photo (#{skidPhotos.length + 1})</span>
                </button>
              </div>

              {/* Thumbnails Sidebar */}
              <div className="md:col-span-4 flex flex-col gap-3 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Captured Batch ({skidPhotos.length})
                </span>

                {skidPhotos.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-lg">
                    <Camera className="h-8 w-8 text-slate-600 mb-2 animate-bounce" />
                    <p className="text-xs font-mono text-slate-400">
                      No photos taken yet. Aim camera at cargo pallet &amp;
                      snap.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
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
                        <div className="absolute top-1 left-1 bg-slate-950/80 text-[8px] font-mono font-bold px-1 rounded text-white">
                          #{idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setPreviewSelectedIndex(0);
                    setIsBatchPreviewOpen(true);
                  }}
                  disabled={skidPhotos.length === 0}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-500 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-indigo-950/40 hover:shadow-indigo-600/30 font-mono mt-auto"
                >
                  Review &amp; Save Batch ({skidPhotos.length})
                </button>
              </div>
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
                    Upload
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
                {/* Left Column: Large Preview & Individual Picture Controls */}
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
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleMovePhoto(previewSelectedIndex, "prev")
                          }
                          disabled={previewSelectedIndex === 0}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/30 disabled:opacity-40 text-slate-200 border border-slate-700 rounded-xl text-2xs font-bold font-mono transition-all flex items-center space-x-1 uppercase cursor-pointer"
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
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/30 disabled:opacity-40 text-slate-200 border border-slate-700 rounded-xl text-2xs font-bold font-mono transition-all flex items-center space-x-1 uppercase cursor-pointer"
                        >
                          <span>Move Down</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(previewSelectedIndex)}
                        className="px-3.5 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-900/50 rounded-xl text-2xs font-bold font-mono transition-all flex items-center justify-center space-x-1.5 uppercase cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete Photo</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Complete Sequence List */}
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
                          </div>

                          <div className="flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMovePhoto(idx, "prev");
                              }}
                              disabled={idx === 0}
                              className="p-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded text-slate-300 cursor-pointer"
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
                              className="p-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded text-slate-300 cursor-pointer"
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
                  className="px-4 py-2 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider font-mono transition-all cursor-pointer w-full sm:w-auto text-center"
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
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white disabled:text-slate-500 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-emerald-950/40 flex items-center justify-center space-x-2 font-mono"
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
    </>
  );
}
