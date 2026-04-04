import { Button, Container, Nav, Navbar } from "react-bootstrap";
import { useNavigate, NavLink } from "react-router-dom";
import useAuth from "../../hook/useAuth";
import logo from "../../assets/logo.svg";

const Header = ({ handleLogout }: { handleLogout: () => void }) => {
  const navigate = useNavigate();
  const { auth } = useAuth();

  return (
    <Navbar
      bg="dark"
      variant="dark"
      expand="lg"
      sticky="top"
      className="shadow-sm"
    >
      <Container>
        <Navbar.Brand>
          <img
            alt="logo"
            src={logo}
            className="d-inline-block align-top me-2"
            style={{ width: "30px", height: "30px" }}
          />
          Magic Stream
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-navbar-nav" />
        <Navbar.Collapse id="main-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={NavLink} to="/">
              Home
            </Nav.Link>
            <Nav.Link as={NavLink} to="/recommended">
              Recommended
            </Nav.Link>
          </Nav>
          <Nav className="ms-auto align-items-center gap-3 gap-lg-2">
            {auth ? (
              <>
                <span className="me-3 text-light">
                  Hello, <strong>{auth.first_name}</strong>
                </span>
                <Button
                  variant="outline-light"
                  size="sm"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline-info"
                  size="sm"
                  onClick={() => navigate("/login")}
                >
                  Login
                </Button>
                <Button
                  variant="info"
                  size="sm"
                  onClick={() => navigate("/register")}
                >
                  Register
                </Button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
