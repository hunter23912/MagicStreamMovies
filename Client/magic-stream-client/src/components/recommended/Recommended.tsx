import { useEffect, useState } from "react";
import type { MovieType } from "../movie/Movie";
import useAxiosPrivate from "../../hook/useAxiosPrivate";
import Movies from "../movies/movies";

const Recommended = () => {
  const [movies, setMovies] = useState<MovieType[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const axiosPrivate = useAxiosPrivate();

  useEffect(() => {
    const fetchRecommendedMovies = async () => {
      setLoading(true);
      setMessage("");

      try {
        const response = await axiosPrivate.get("/recommendedmovies");
        setMovies(response.data);
      } catch (error) {
        console.log("Error fetching recommended movies:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendedMovies();
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

export default Recommended;
