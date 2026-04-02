import { Button } from "react-bootstrap";

export type MovieType = {
  _id?: string;
  title: string;
  imdb_id: string;
  poster_path: string;
  ranking?: {
    ranking_name: string;
  };
  admin_review?: string;
};

export type MovieProps = {
  movie: MovieType;
  updateMovieReview?: (imdb_id: string) => void;
};

const Movie = ({ movie, updateMovieReview }: MovieProps) => {
  return (
    <div className="col-md-4 mb-4">
      <div className="card h-100 shadow-sm">
        <div style={{ position: "relative" }}>
          <img
            src={movie.poster_path}
            alt={movie.title}
            className="card-img-top"
            style={{ objectFit: "contain", height: "250px", width: "100%" }}
          />
        </div>
        <div className="card-body d-flex flex-column">
          <h5 className="card-title">{movie.title}</h5>
          <p className="card-text mb-2">{movie.imdb_id}</p>
          {/* {movie.admin_review && (
            <p className="card-text text-muted">{movie.admin_review}</p>
          )} */}
        </div>
        {movie.ranking?.ranking_name && (
          <span className="badge bg-dark m-3 p-2" style={{ fontSize: "1em" }}>
            {movie.ranking.ranking_name}
          </span>
        )}
        {updateMovieReview && (
          <Button
            variant="outline-info"
            className="m-3 mt-auto"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              updateMovieReview(movie.imdb_id);
            }}
          >
            Review
          </Button>
        )}
      </div>
    </div>
  );
};

export default Movie;
