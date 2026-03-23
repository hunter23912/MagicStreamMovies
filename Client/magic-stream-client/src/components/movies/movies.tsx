import Movie from "../movie/Movie";
import type { Movie as MovieItem } from "../movie/Movie";

type MoviesProps = {
  movies?: MovieItem[];
  message?: string;
};

const Movies = ({ movies, message }: MoviesProps) => {
  return (
    <div className="container mt-4">
      <div className="row">
        {message && <p>{message}</p>}
        {movies && movies.length > 0
          ? movies.map((movie) => (
              <Movie key={movie._id ?? movie.imdb_id} movie={movie} />
            ))
          : null}
      </div>
    </div>
  );
};

export default Movies;
