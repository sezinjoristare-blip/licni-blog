import "../styles/SkateRideRig.css";


function SkateRideRig({
  className = "",
}) {
  return (
    <div
      className={[
        "skate-ride-rig",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-skate-ride-rig
    >
      <img
        className="skate-ride-rig__base"
        src="/images/human-one/skate/skateboard-ride-base.webp"
        alt=""
        draggable="false"
      />

      <img
        className="
          skate-ride-rig__wheel
          skate-ride-rig__wheel--left
        "
        src="/images/human-one/skate/skateboard-front-wheel-left.webp"
        alt=""
        draggable="false"
      />

      <img
        className="
          skate-ride-rig__wheel
          skate-ride-rig__wheel--right
        "
        src="/images/human-one/skate/skateboard-front-wheel-right.webp"
        alt=""
        draggable="false"
      />
    </div>
  );
}


export default SkateRideRig;