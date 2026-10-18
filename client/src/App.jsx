import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";

import "./App.css";

import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreatePost from "./pages/CreatePost";
import PostDetails from "./pages/PostDetails";
import Profile from "./pages/Profile";
import api from "./api/axios";

function Home() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);

  const fetchPosts = async () => {
    try {
      const response = await api.get("/posts");
      setPosts(response.data);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const isLoggedIn = Boolean(
    localStorage.getItem("token")
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    alert("Logged out successfully!");
    window.location.reload();
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="logo">Hashnode</div>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#posts">Explore</a>
          <a href="#about">About</a>

          {!isLoggedIn ? (
            <>
              <Link to="/login" className="login-btn">
                Login
              </Link>
              <Link to="/register" className="login-btn">
                Register
              </Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="login-btn">
                Dashboard
              </Link>

              <Link to="/profile" className="login-btn">
                My Profile
              </Link>

              <button
                className="login-btn"
                onClick={() => navigate("/create-post")}
              >
                Create Post
              </button>

              <button
                className="login-btn"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </nav>

      <section className="hero-section" id="home">
        <h1>
          Share Your <span>Knowledge</span>
        </h1>

        <p>
          Write, publish and discover amazing stories
          from developers around the world.
        </p>

        <div className="hero-buttons">
          {isLoggedIn && (
            <button
              className="primary-btn"
              onClick={() => navigate("/create-post")}
            >
              Create Post
            </button>
          )}

          <button
            className="secondary-btn"
            onClick={() =>
              document
                .getElementById("posts")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Explore Posts
          </button>
        </div>
      </section>

      <section className="posts-section" id="posts">
        <h2>Latest Posts</h2>

        {posts.length === 0 ? (
          <p className="empty-message">
            No published posts yet.
          </p>
        ) : (
          <div className="posts">
            {posts.map((post) => (
              <div
                className="post-card"
                key={post._id}
                onClick={() => navigate(`/post/${post._id}`)}
                style={{ cursor: "pointer" }}
              >
                <span className="tag">Published</span>
                <h3>{post.title}</h3>
                <p>{post.content}</p>

                {post.author && (
                  <small>By {post.author.name}</small>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="footer" id="about">
        <p>
          © 2026 Hashnode Platform. Built with React & Node.js.
        </p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create-post" element={<CreatePost />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/post/:id" element={<PostDetails />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;