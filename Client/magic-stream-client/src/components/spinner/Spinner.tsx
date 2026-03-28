const Spinner = () => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "60vh",
      }}
    >
      <span
        className="spinner-border"
        role="status"
        style={{
          width: "5em",
          height: "5em",
          fontSize: "2em",
        }}
      ></span>
    </div>
  );
};

export default Spinner;
