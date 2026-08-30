import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../../lib/axios";

export const useDocumentStore = create((set, get) => ({
  documents: [],
  isLoading: false,
  error: null,
  uploading: false,

  fetchDocuments: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance
        .get("/driver-documents")
        .catch(() => axiosInstance.get("/upload"))
        .catch(() => axiosInstance.get("/documents"))
        .catch(() => ({ data: [] }));
      const docs = Array.isArray(response.data)
        ? response.data
        : (response.data?.documents || response.data?.data || []);
      const parsedDocs = docs.map((item) =>
        typeof item.data === "string"
          ? JSON.parse(item.data)
          : item.data || item
      );
      set({ documents: parsedDocs, isLoading: false });
    } catch (err) {
      set({ documents: [], isLoading: false });
    }
  },

  addDocument: async (document) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance
        .post("/upload", document)
        .catch(() => axiosInstance.post("/documents", document));
      const savedDoc = response.data || document;
      set((state) => ({
        documents: [savedDoc, ...state.documents],
        isLoading: false,
      }));
      toast.success("Document uploaded successfully");
    } catch (err) {
      console.error("Failed to add document:", err);
      set({ error: "Failed to add document", isLoading: false });
      toast.error("Failed to upload document");
    }
  },

  updateDocument: async (document) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance
        .put(`/upload/${document.id}`, document)
        .catch(() => axiosInstance.put(`/documents/${document.id}`, document));
      const updated = response.data || document;
      set((state) => ({
        documents: state.documents.map((d) =>
          d.id === document.id ? updated : d
        ),
        isLoading: false,
      }));
      toast.success("Document updated");
    } catch (err) {
      console.error("Failed to update document:", err);
      set({ error: "Failed to update document", isLoading: false });
      toast.error("Failed to update document");
    }
  },
  uploadBOL: async (loadId, file) => {
    console.log("uploafing");
    console.log(loadId);
    console.log(file);
    set({ uploading: true, error: null });
    try {
      const formData = new FormData();
      formData.append("load_id", loadId);
      formData.append("bol_image", file); // Field name matches multer config

      const response = await axiosInstance.post("/load/upload-bol", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      set({ uploading: false });
      return { success: true, data: response.data.document };
    } catch (error) {
      console.log(error.message);
      set({ uploading: false, error: error.message });
      return { success: false, error: error.message };
    }
  },
}));
