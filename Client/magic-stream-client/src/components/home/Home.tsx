import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosConfig";
import Movies from "../movies/movies";
import type { MovieType } from "../movie/Movie";

type HomeProps = {
  updateMovieReview: (imdb_id: string) => void;
};

const Home = ({ updateMovieReview }: HomeProps) => {
  const [movies, setMovies] = useState<MovieType[]>([]);
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
        <Movies
          movies={movies}
          message={message}
          updateMovieReview={updateMovieReview}
        />
      )}
    </>
  );
};

export default Home;
