import { useId } from "react";
// Aset asli, digambar pada grid piksel khusus proyek ini.
export function WarehouseBackdrop() {
  const id = useId().replaceAll(":", "");
  return (
    <svg
      className="warehouse-backdrop"
      viewBox="0 0 800 460"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      <defs>
        <pattern
          id={`${id}-brick`}
          width="80"
          height="32"
          patternUnits="userSpaceOnUse"
        >
          <rect width="80" height="32" fill="#263345" />
          <path
            d="M0 31H80M40 0V16M0 16H80M0 16V32"
            stroke="#314052"
            strokeWidth="2"
          />
        </pattern>
        <pattern
          id={`${id}-stripe`}
          width="28"
          height="18"
          patternUnits="userSpaceOnUse"
        >
          <rect width="28" height="18" fill="#172331" />
          <path d="M-10 18L8 0H22L4 18M18 18L36 0H50L32 18" fill="#c99242" />
        </pattern>
        <g id={`${id}-crate`}>
          <rect width="58" height="48" fill="#64482f" />
          <rect x="3" y="3" width="52" height="42" fill="#b78249" />
          <path d="M5 14H53M5 29H53" stroke="#9b6b3c" strokeWidth="2" />
          <rect x="7" y="4" width="6" height="40" fill="#d2a364" />
          <rect x="45" y="4" width="6" height="40" fill="#d2a364" />
          <rect x="24" y="16" width="12" height="14" fill="#e5cea0" />
          <rect x="28" y="20" width="4" height="6" fill="#977042" />
        </g>
      </defs>
      <rect width="800" height="460" fill="#152333" />
      <rect y="34" width="800" height="332" fill={`url(#${id}-brick)`} />
      <path d="M0 38H800M0 54H800" stroke="#111d2b" strokeWidth="10" />
      <rect x="40" y="0" width="13" height="368" fill="#41505d" />
      <rect x="45" width="4" height="368" fill="#60707b" />
      <rect x="746" width="13" height="368" fill="#41505d" />
      <rect x="751" width="4" height="368" fill="#60707b" />
      <rect x="275" y="68" width="246" height="280" fill="#101b29" />
      <rect x="286" y="78" width="224" height="263" fill="#354555" />
      {Array.from({ length: 13 }, (_, i) => (
        <rect
          key={i}
          x="290"
          y={85 + i * 19}
          width="216"
          height="3"
          fill="#465564"
        />
      ))}
      <rect x="286" y="338" width="224" height="7" fill="#c28b43" />
      <rect x="358" y="56" width="85" height="19" fill="#b78948" />
      <text
        x="400"
        y="69"
        textAnchor="middle"
        fontSize="9"
        fill="#172330"
        fontFamily="monospace"
      >
        GUDANG 01
      </text>
      <rect x="78" y="92" width="120" height="65" fill="#172735" />
      <rect x="83" y="97" width="110" height="55" fill="#698089" />
      <path d="M137 97V152M83 123H193" stroke="#324957" strokeWidth="6" />
      <rect x="85" y="99" width="49" height="21" fill="#9aaca0" opacity=".35" />
      <rect x="75" y="200" width="154" height="10" fill="#616762" />
      <rect x="75" y="278" width="154" height="10" fill="#616762" />
      <rect x="75" y="348" width="154" height="10" fill="#616762" />
      <rect x="75" y="181" width="8" height="186" fill="#a87945" />
      <rect x="221" y="181" width="8" height="186" fill="#a87945" />
      <use href={`#${id}-crate`} x="88" y="152" />
      <use href={`#${id}-crate`} x="156" y="152" />
      <use href={`#${id}-crate`} x="89" y="230" />
      <rect x="158" y="248" width="47" height="29" fill="#697b6c" />
      <rect x="166" y="248" width="5" height="29" fill="#95a38a" />
      <rect x="192" y="248" width="5" height="29" fill="#95a38a" />
      <use href={`#${id}-crate`} x="154" y="299" />
      <rect x="575" y="110" width="112" height="5" fill="#667066" />
      <rect x="600" y="70" width="26" height="40" fill="#885d45" />
      <rect x="602" y="72" width="22" height="6" fill="#bb8860" />
      <rect x="640" y="84" width="32" height="26" fill="#6b7b68" />
      <path d="M721 70V305H695" fill="none" stroke="#52636c" strokeWidth="12" />
      <path d="M723 70V301" stroke="#7a8585" strokeWidth="3" />
      <rect y="366" width="800" height="94" fill="#3d4548" />
      <path
        d="M0 402H800M0 444H800M100 367L60 460M310 367L300 460M545 367L562 460M730 367L775 460"
        stroke="#4c5354"
        strokeWidth="2"
      />
      <rect y="362" width="800" height="12" fill={`url(#${id}-stripe)`} />
      <rect y="453" width="800" height="7" fill="#101d2c" />
      <path
        d="M255 408H539"
        stroke="#b39964"
        strokeWidth="3"
        strokeDasharray="23 12"
      />
      <g>
        <rect x="631" y="232" width="7" height="112" fill="#26303a" />
        <rect x="665" y="232" width="7" height="112" fill="#26303a" />
        <rect x="627" y="229" width="48" height="7" fill="#dda44f" />
        <rect x="624" y="268" width="9" height="28" fill="#172330" />
        <rect x="635" y="288" width="29" height="7" fill="#172330" />
        <rect x="616" y="301" width="66" height="52" fill="#c28a3f" />
        <rect x="621" y="307" width="55" height="23" fill="#e1ab52" />
        <rect x="620" y="332" width="50" height="6" fill="#755732" />
        <rect x="682" y="254" width="10" height="112" fill="#80918e" />
        <rect x="685" y="355" width="45" height="7" fill="#a1ae9d" />
        <rect x="608" y="329" width="10" height="19" fill="#ce8543" />
        <rect x="620" y="343" width="19" height="24" fill="#162330" />
        <rect x="651" y="343" width="23" height="24" fill="#162330" />
        <rect x="625" y="349" width="9" height="11" fill="#626c69" />
        <rect x="657" y="349" width="11" height="11" fill="#626c69" />
      </g>
      <rect x="55" y="336" width="17" height="28" fill="#657b72" />
      <rect x="52" y="342" width="23" height="4" fill="#879586" />
      <rect x="55" y="357" width="17" height="4" fill="#879586" />
      <rect x="698" y="317" width="17" height="11" fill="#bc8a4b" />
      <path d="M170 0V58M570 0V58" stroke="#8d8b77" strokeWidth="4" />
      <path d="M145 58H195L189 68H151ZM545 58H595L589 68H551Z" fill="#d9ad64" />
      <rect x="151" y="68" width="38" height="5" fill="#ffe0a1" />
      <rect x="551" y="68" width="38" height="5" fill="#ffe0a1" />
      <path
        d="M153 75L110 365H280L187 75ZM553 75L508 365H684L587 75Z"
        fill="#ffc776"
        opacity=".045"
      />
    </svg>
  );
}
