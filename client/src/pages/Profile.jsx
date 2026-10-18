import { Link, Navigate } from "react-router-dom";

function Profile() {
  const token = localStorage.getItem("token");

  let user = {};

  try {
    user = JSON.parse(
      localStorage.getItem("user") || "{}"
    );
  } catch {
    user = {};
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="dashboard-page">
      <h1>My Profile</h1>
      <p>Your account information</p>

      <div className="post-card">
        <h2>{user.name || "User"}</h2>

        <p>
          <strong>Email:</strong>{" "}
          {user.email || "Email not available"}
        </p>

        <Link to="/dashboard" className="login-btn">
          Back to Dashboard
        </Link>

        <Link to="/" className="login-btn">
          Home
        </Link>
      </div>
    </div>
  );
}

export default Profile;