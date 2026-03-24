import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button, Container, Form } from "react-bootstrap";
import axiosClient from "../../api/axiosClient";
import useAuth from "../../hook/userAuth";

const Login = () => {
  const { setAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await axiosClient.post("/login", { email, password });
      console.log(response.data);
      if (response.data.error) {
        setError(response.data.error);
        return;
      }
      setAuth(response.data);
      localStorage.setItem("user", JSON.stringify(response.data));
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Error logging in:", err);
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="login-container d-flex align-items-center justify-content-center min-vh-100">
      <div
        className="login-card shadow p-4 rounded bg-white"
        style={{ maxWidth: 500 }}
      >
        <div className="text-center mb-4">
          <h2 className="fw-bold">Sign In</h2>
          <p className="text-muted">
            Welcome back! Please login to your account
          </p>
        </div>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="formBasicEmail" className="mb-3">
            <Form.Label>Email address</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </Form.Group>
          <Form.Group controlId="formBasicPassword" className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>
          <Button
            variant="primary"
            type="submit"
            className="w-100 mb-2"
            disabled={loading}
            style={{
              fontWeight: 600,
              letterSpacing: 1,
            }}
          >
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </Button>
        </Form>
        <div className="text-center mt-3">
          <span className="text-muted">Don't have an account? </span>
          <Link to="/register" className="fw-semibold">
            Register here
          </Link>
        </div>
      </div>
    </Container>
  );
};

export default Login;
