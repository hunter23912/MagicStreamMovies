import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import Movies from "../movies/movies";
import type { Movie } from "../movie/Movie";

const Home = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      setMessage("");
      try {
        const response = await axiosClient.get("/movies");
        const movieData = Array.isArray(response.data) ? response.data : [];
        setMovies(movieData);
        if (movieData.length === 0) {
          setMessage("There are currently no movies available.");
        }
      } catch (error) {
        console.error("Error fetching movies:", error);
        setMessage("Error fetching movies.");
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, []);

  return (
    <>
      {loading ? (
        <h2>Loading...</h2>
      ) : (
        <Movies movies={movies} message={message} />
      )}
    </>
  );
};

export default Home;
