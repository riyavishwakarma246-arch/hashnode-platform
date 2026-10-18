import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

function CreatePost() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [status, setStatus] = useState("draft");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await api.get("/tags");
        const tags = response.data;

        setAllTags(
          Array.isArray(tags)
            ? tags
            : Array.isArray(tags.tags)
              ? tags.tags
              : []
        );
      } catch (err) {
        console.error("Failed to load tags:", err);
      }
    };

    fetchTags();
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      setPreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const toggleTag = (tagId) => {
    setSelectedTags((previous) =>
      previous.includes(tagId)
        ? previous.filter((id) => id !== tagId)
        : [...previous, tagId]
    );
  };

  const addTag = async () => {
  const name = tagInput.trim();

  if (!name) {
    setError("Pehle tag ka naam likho.");
    return;
  }

  setError("");

  const existingTag = allTags.find(
    (tag) => tag.name?.toLowerCase() === name.toLowerCase()
  );

  if (existingTag) {
    const tagId = existingTag._id || existingTag.id;

    setSelectedTags((previous) =>
      previous.includes(tagId) ? previous : [...previous, tagId]
    );

    setTagInput("");
    return;
  }

  try {
    const response = await api.post("/tags", { name });
    const newTag = response.data;
    const newTagId = newTag._id || newTag.id;

    setAllTags((previous) => [...previous, newTag]);
    setSelectedTags((previous) =>
      previous.includes(newTagId) ? previous : [...previous, newTagId]
    );

    setTagInput("");
    setError("");
  } catch (err) {
    console.error("Create tag error:", err);

    setError(
      err.response?.data?.message ||
        "Tag create nahi hua. Please dobara try karo."
    );
  }
};

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    setError("");
    setCoverImage("");
    setSelectedFile(null);

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please ek valid image file select karo.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image ka size 5 MB se kam hona chahiye.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!title.trim() || !content.trim()) {
      setError("Please title aur content dono fill karo.");
      return;
    }

    setLoading(true);

    try {
      let uploadedImage = coverImage;

      if (selectedFile) {
        const formData = new FormData();
        formData.append("coverImage", selectedFile);

        const uploadResponse = await api.post(
          "/posts/upload-cover",
          formData
        );

        uploadedImage = uploadResponse.data.coverImage;
      }

      const postData = {
        title: title.trim(),
        content: content.trim(),
        excerpt: excerpt.trim(),
        status,
        tags: selectedTags,
        coverImage: uploadedImage,
      };

      await api.post("/posts", postData);

      alert(
        status === "published"
          ? "Post published successfully!"
          : "Draft saved successfully!"
      );

      navigate("/dashboard");
    } catch (err) {
      console.error("Create post error:", err);
      setError(
        err.response?.data?.message ||
          "Post save nahi hua. Please dobara try karo."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          style={styles.backButton}
        >
          ← Back to Dashboard
        </button>

        <h1 style={styles.heading}>Create a New Post</h1>
        <p style={styles.subtitle}>
          Share your ideas and stories with the world.
        </p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Post Title *</label>
          <input
            style={styles.input}
            type="text"
            placeholder="Enter your post title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <label style={styles.label}>Excerpt</label>
          <textarea
            style={styles.textareaSmall}
            placeholder="Write a short description (max 250 characters)"
            value={excerpt}
            maxLength={250}
            onChange={(e) => setExcerpt(e.target.value)}
          />
          <small style={styles.helper}>
            {excerpt.length}/250 characters
          </small>

          <label style={styles.label}>Cover Image (Optional)</label>
          <input
            style={styles.input}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />
          <small style={styles.helper}>
            Laptop se image choose karo. Maximum size: 5 MB.
          </small>

          {preview && (
            <div style={styles.previewBox}>
              <p style={styles.label}>Image Preview</p>
              <img
                src={preview}
                alt="Cover image preview"
                style={styles.previewImage}
              />
              <button
                type="button"
                style={styles.removeButton}
                onClick={() => {
                  setSelectedFile(null);
                  setCoverImage("");
                }}
              >
                Remove Image
              </button>
            </div>
          )}

          <label style={styles.label}>Tags</label>
          <div style={styles.tagInputRow}>
            <input
              style={{ ...styles.input, flex: 1 }}
              type="text"
              placeholder="Search or enter a tag"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
            />
            <button
              type="button"
              style={styles.addButton}
              onClick={addTag}
            >
              Add
            </button>
          </div>

          <div style={styles.tags}>
            {allTags.map((tag) => {
              const tagId = tag._id || tag.id;
              const isSelected = selectedTags.includes(tagId);

              return (
                <button
                  key={tagId}
                  type="button"
                  onClick={() => toggleTag(tagId)}
                  style={{
                    ...styles.tag,
                    ...(isSelected ? styles.selectedTag : {}),
                  }}
                >
                  {isSelected ? "✓ " : ""}
                  {tag.name}
                </button>
              );
            })}
          </div>

          <label style={styles.label}>Post Content *</label>
          <textarea
            style={styles.contentArea}
            placeholder="Write your post here... Markdown is supported."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />

          <label style={styles.label}>Post Status</label>
          <select
            style={styles.input}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="draft">Save as Draft</option>
            <option value="published">Publish Now</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitButton,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? "Saving..."
              : status === "published"
                ? "Publish Post"
                : "Save Draft"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    padding: "32px 16px",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    maxWidth: "850px",
    margin: "0 auto",
    background: "#ffffff",
    padding: "32px",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
  },
  backButton: {
    border: "none",
    background: "transparent",
    color: "#2563eb",
    cursor: "pointer",
    fontSize: "15px",
    marginBottom: "20px",
  },
  heading: {
    fontSize: "30px",
    marginBottom: "8px",
    color: "#111827",
  },
  subtitle: {
    color: "#6b7280",
    marginBottom: "28px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  label: {
    fontWeight: "600",
    marginTop: "12px",
    color: "#374151",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "7px",
    fontSize: "15px",
    background: "#fff",
  },
  textareaSmall: {
    width: "100%",
    boxSizing: "border-box",
    minHeight: "85px",
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "7px",
    fontSize: "15px",
    resize: "vertical",
  },
  contentArea: {
    width: "100%",
    boxSizing: "border-box",
    minHeight: "300px",
    padding: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "7px",
    fontSize: "15px",
    lineHeight: "1.6",
    resize: "vertical",
  },
  helper: {
    color: "#6b7280",
    textAlign: "right",
  },
  previewBox: {
    marginTop: "10px",
  },
  previewImage: {
    display: "block",
    width: "100%",
    maxHeight: "320px",
    objectFit: "contain",
    background: "#f3f4f6",
    borderRadius: "8px",
    marginTop: "8px",
  },
  removeButton: {
    marginTop: "8px",
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    background: "#fff",
    cursor: "pointer",
  },
  tagInputRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  addButton: {
    padding: "12px 18px",
    background: "#e5e7eb",
    border: "none",
    borderRadius: "7px",
    cursor: "pointer",
  },
  tags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "6px",
  },
  tag: {
    padding: "7px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "20px",
    background: "#fff",
    cursor: "pointer",
  },
  selectedTag: {
    background: "#dbeafe",
    borderColor: "#2563eb",
    color: "#1d4ed8",
  },
  submitButton: {
    marginTop: "20px",
    padding: "14px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
  },
  error: {
    padding: "12px",
    background: "#fee2e2",
    color: "#b91c1c",
    borderRadius: "7px",
    marginBottom: "16px",
  },
};

export default CreatePost;