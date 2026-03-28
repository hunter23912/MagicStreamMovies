import "./App.css";
import Home from "./components/home/Home";
import Recommended from "./components/recommended/Recommended";
import Review from "./components/review/Review";
import Login from "./components/Login/Login";
import Register from "./components/Register/Register";
import Header from "./components/header/Header";
import { Route, Routes, useNavigate } from "react-router-dom";
import Layout from "./components/Layout";
import RequireAuth from "./components/RequiredAuth";

function App() {
  const navigate = useNavigate();

  const updateMovieReview = (imdb_id: string) => {
    navigate(`/review/${imdb_id}`);
  };

  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route
            path="/"
            element={<Home updateMovieReview={updateMovieReview} />}
          />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route element={<RequireAuth />}>
            <Route path="/recommended" element={<Recommended />} />
            <Route path="/review/:imdb_id" element={<Review />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;
