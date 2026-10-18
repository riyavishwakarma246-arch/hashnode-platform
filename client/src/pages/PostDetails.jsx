import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import api from "../api/axios";

function PostDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await api.get(`/posts/${id}`);
        
        setPost(response.data);
      } catch (error) {
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, navigate]);

  if (loading) {
    return <div className="dashboard-page">Loading post...</div>;
  }

  if (!post) {
    return (
      <div className="dashboard-page">
        Post not found.
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <button
        type="button"
        className="secondary-btn"
        onClick={() => navigate("/")}
      >
        ← Back to Home
      </button>

      <article className="post-details">
        <h1>{post.title}</h1>

        {post.coverImage && (
          <img
              src={
                post.coverImage.startsWith("http")
                 ? post.coverImage
            :`http://localhost:5000${post.coverImage}`
               }
              alt={post.title}
             className="post-cover-image"
           />
        )}


        {post.tags && post.tags.length > 0 && (
          <div className="selected-tags">
            {post.tags.map((tag) => (
              <span
                key={tag._id || tag}
                className="tag-chip"
              >
                {tag.name || tag}
              </span>
            ))}
          </div>
        )}

        <div className="post-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({
                inline,
                className,
                children,
                ...props
              }) {
                const match = /language-(\w+)/.exec(
                  className || ""
                );

                return !inline && match ? (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(
                      /\n$/,
                      ""
                    )}
                  </SyntaxHighlighter>
                ) : (
                  <code
                    className={className}
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  );
}

export default PostDetails;