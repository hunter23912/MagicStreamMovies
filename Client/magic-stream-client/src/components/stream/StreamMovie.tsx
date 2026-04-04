import { useParams } from "react-router-dom";
import ReactPlayer from "react-player";

const StreamMovie = () => {
  let param = useParams();
  let key = param.yt_id;
  return (
    <div className="react-player-container" style={{ height: "90vh" }}>
      {key != null ? (
        <ReactPlayer
          controls={true}
          playing={true}
          src={`https://www.youtube.com/watch?v=${key}`}
          width="100%"
          height="100%"
        />
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default StreamMovie;
