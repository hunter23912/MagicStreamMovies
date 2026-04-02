import Movie from "../movie/Movie";
import type { MovieType } from "../movie/Movie";

type MoviesProps = {
  movies?: MovieType[];
  message?: string;
  updateMovieReview?: (imdb_id: string) => void;
};

const Movies = ({ movies, updateMovieReview, message }: MoviesProps) => {
  return (
    <div className="container mt-4">
      <div className="row">
        {message && <p>{message}</p>}
        {movies && movies.length > 0
          ? movies.map((movie) => (
              <Movie
                key={movie._id ?? movie.imdb_id}
                movie={movie}
                updateMovieReview={updateMovieReview}
              />
            ))
          : null}
      </div>
    </div>
  );
};

export default Movies;
