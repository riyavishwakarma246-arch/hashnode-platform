import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

function Dashboard() {
  const [posts, setPosts] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [status, setStatus] = useState("draft");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchMyPosts = async () => {
    try {
      const response = await api.get("/posts/mine");
      console.log("MY POSTS:",response.data);
      setPosts(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
      setError("Posts load nahi ho paaye.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPosts();

    api.get("/tags")
      .then((response) => {
        const data = response.data;
        setAllTags(
          Array.isArray(data)
            ? data
            : Array.isArray(data.tags)
              ? data.tags
              : []
        );
      })
      .catch((err) => {
        console.error("Failed to load tags:", err);
      });
  }, []);

  const getTagId = (tag) =>
    typeof tag === "string" ? tag : tag?._id || tag?.id;

  const startEdit = (post) => {
    setEditingId(post._id);
    setTitle(post.title || "");
    setContent(post.content || "");
    setExcerpt(post.excerpt || "");
    setCoverImage(post.coverImage || "");
    setSelectedFile(null);

    setSelectedTags(
      Array.isArray(post.tags)
        ? post.tags.map(getTagId).filter(Boolean)
        : []
    );

    setStatus(post.status || "draft");
    setError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setExcerpt("");
    setCoverImage("");
    setSelectedFile(null);
    setSelectedTags([]);
    setStatus("draft");
    setError("");
  };

  const toggleTag = (tagId) => {
    setSelectedTags((previous) =>
      previous.includes(tagId)
        ? previous.filter((id) => id !== tagId)
        : [...previous, tagId]
    );
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    setError("");

    if (!editingId) {
      setError("Post ID nahi mili. Dobara Edit par click karo.");
      return;
    }

    if (!title.trim() || !content.trim()) {
      setError("Title aur content dono fill karo.");
      return;
    }

    if (excerpt.trim().length > 250) {
      setError("Excerpt 250 characters se zyada nahi hona chahiye.");
      return;
    }

    setSaving(true);

    try {
      let updatedImage = coverImage;

      if (selectedFile) {
        const formData = new FormData();
        formData.append("coverImage", selectedFile);

        const uploadResponse = await api.post(
          "/posts/upload-cover",
          formData
        );

        updatedImage = uploadResponse.data.coverImage;
      }

      const updatedData = {
        title: title.trim(),
        content: content.trim(),
        excerpt: excerpt.trim(),
        coverImage: updatedImage,
        status,
        tags: selectedTags,
      };

      // Correct API call: ID URL mein, data second argument mein
      await api.put(`/posts/${editingId}`, updatedData);

      alert(
        status === "published"
          ? "Post updated and published successfully!"
          : "Draft updated successfully!"
      );

      cancelEdit();
      await fetchMyPosts();
    } catch (err) {
      console.error("Update error:", err.response?.data || err);

      setError(
        err.response?.data?.message ||
          "Post update nahi hui. Terminal mein error check karo."
      );
    } finally {
      setSaving(false);
    }
  };

  const deletePost = async (id) => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      await api.delete(`/posts/${id}`);
      alert("Post deleted successfully!");
      await fetchMyPosts();
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.response?.data?.message || "Failed to delete post.");
    }
  };

  if (loading) {
    return <h2>Loading dashboard...</h2>;
  }

  return (
    <div className="dashboard-page">
      <h1>My Dashboard</h1>
      <p>Manage your posts here.</p>

      <Link to="/" className="login-btn">
        Back to Home
      </Link>

      {editingId && (
        <section className="create-section">
          <h2>Edit Post</h2>

          {error && (
            <p role="alert" style={{ color: "crimson" }}>
              {error}
            </p>
          )}

          <form className="post-form" onSubmit={handleUpdate}>
            <label>Post Title *</label>
            <input
              type="text"
              placeholder="Post title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />

            <label>Excerpt (max 250 characters)</label>
            <textarea
              placeholder="Short description"
              value={excerpt}
              maxLength={250}
              onChange={(event) => setExcerpt(event.target.value)}
              rows={3}
            />
            <small>{excerpt.length}/250 characters</small>

            <label>Cover Image</label>

            {coverImage && !selectedFile && (
              <div>
                <p>Current cover image:</p>
                <img
                  src={
                    coverImage.startsWith("http")
                      ? coverImage
                      : `https://hashnode-platform-3a49.onrender.com${coverImage}`
                  }
                  alt="Current cover"
                  style={{
                    display: "block",
                    maxWidth: "100%",
                    maxHeight: "220px",
                    objectFit: "contain",
                    marginBottom: "8px",
                  }}
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                setError("");

                if (!file) return;

                if (!file.type.startsWith("image/")) {
                  setError("Valid image file select karo.");
                  event.target.value = "";
                  return;
                }

                if (file.size > 5 * 1024 * 1024) {
                  setError("Image 5 MB se chhoti honi chahiye.");
                  event.target.value = "";
                  return;
                }

                setSelectedFile(file);
              }}
            />

            {selectedFile && (
              <p>New image selected: {selectedFile.name}</p>
            )}

            <button
              type="button"
              className="secondary-btn"
              onClick={() => {
                setCoverImage("");
                setSelectedFile(null);
              }}
            >
              Remove Cover Image
            </button>

            <label>Tags</label>

            <div className="edit-tags">
              {allTags.map((tag) => {
                const tagId = getTagId(tag);
                if (!tagId) return null;

                return (
                  <label key={tagId} style={{ marginRight: "12px" }}>
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tagId)}
                      onChange={() => toggleTag(tagId)}
                    />
                    {" "}{tag.name}
                  </label>
                );
              })}
            </div>

            <label>Post Content (Markdown supported) *</label>
            <textarea
              placeholder="Write your post..."
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={10}
              required
            />

            <label>Post Status</label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>

            <div className="form-buttons">
              <button
                type="submit"
                className="primary-btn"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                className="secondary-btn"
                disabled={saving}
                onClick={cancelEdit}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="dashboard-posts">
        {posts.length === 0 ? (
          <p>You haven't created any posts yet.</p>
        ) : (
          posts.map((post) => (
            <div className="post-card" key={post._id}>
              <h3>{post.title}</h3>

              <p>
                {post.excerpt || (post.content || "").slice(0, 150)}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={
                    post.status === "published"
                      ? "status-published"
                      : "status-draft"
                  }
                >
                  {post.status === "published" ? "Published" : "Draft"}
                </span>
              </p>

              <div className="post-actions">
                <button
                  type="button"
                  className="edit-btn"
                  onClick={() => startEdit(post)}
                >
                  Edit
                </button>

                <button
                  type="button"
                  className="delete-btn"
                  onClick={() => deletePost(post._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Dashboard;