import axiosClient from "../../api/axiosClient";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { Button, Container, Form } from "react-bootstrap";

type Genre = {
  genre_id: number;
  genre_name: string;
};

const Register = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [favouriteGenres, setFavouriteGenres] = useState<Genre[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGenreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.selectedOptions);
    setFavouriteGenres(
      options.map(
        (opt): Genre => ({
          genre_id: Number(opt.value),
          genre_name: opt.label,
        }),
      ),
    );
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const defaultRole = "USER";
    console.log(defaultRole);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        first_name: firstName,
        last_name: lastName,
        email: email,
        password: password,
        role: defaultRole,
        favourite_genres: favouriteGenres,
      };

      const response = await axiosClient.post("/register", payload);
      if (response.data.error) {
        setError(response.data.error);
        return;
      }

      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Error registering user:", err);
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await axiosClient.get("/genres");
        setGenres(response.data);
      } catch (err) {
        console.error("Error fetching movie genres:", err);
      }
    };
    fetchGenres();
  }, []);

  return (
    <Container className="login-container d-flex align-items-center justify-content-center min-vh-100">
      <div
        className="login-card shadow p-4 rounded bg-white text-start"
        style={{ maxWidth: 500, width: "100%" }}
      >
        <div className="text-center mb-4">
          {/* <img src={logo} alt="Logo" width={60} className="mb-2" /> */}
          <h2 className="fw-bold">Register</h2>
          <p className="text-muted">Create your Magic Movie Stream account.</p>
          {error && <div className="alert alert-danger py-2">{error}</div>}
        </div>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>First Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Last Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Confirm Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              isInvalid={!!confirmPassword && confirmPassword !== password}
            />
            <Form.Control.Feedback type="invalid">
              Passwords do not match.
            </Form.Control.Feedback>
          </Form.Group>
          <Form.Group>
            <Form.Select
              multiple
              value={favouriteGenres.map((g) => String(g.genre_id))}
              onChange={handleGenreChange}
            >
              {genres.map((genre) => (
                <option
                  key={genre.genre_id}
                  value={genre.genre_id}
                  label={genre.genre_name}
                >
                  {genre.genre_name}
                </option>
              ))}
            </Form.Select>
            <Form.Text className="text-muted">
              Hold Ctrl (Windows) or Command (Mac) to select multiple genres.
            </Form.Text>
          </Form.Group>
          <Button
            variant="primary"
            type="submit"
            className="w-100 mb-2"
            disabled={loading}
            style={{ fontWeight: 600, letterSpacing: 1 }}
          >
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                />
                Registering...
              </>
            ) : (
              "Register"
            )}
          </Button>
        </Form>
      </div>
    </Container>
  );
};

export default Register;
