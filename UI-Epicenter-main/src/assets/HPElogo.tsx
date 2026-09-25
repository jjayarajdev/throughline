"use client";
import { useEffect, useRef } from "react";

export default function HPELogo({ play = true, width = 300, 
  height = 90, }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (play && svgRef.current) {
      svgRef.current.classList.add("play");
    }
  }, [play]);

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Hewlett Packard Enterprise"
      className="hpe-logo gn-logo-animated css-animation gn-icon gn-icon-logo"
      viewBox="0 0 630 180"
      focusable="false"
       width={width}
      height={height}
      dangerouslySetInnerHTML={{
        __html: `
<style>
  .hpe-logo {
    --hpe-logo-bg: #fff;
    --hpe-logo-color: #000;
  }
  .dark-theme .hpe-logo {
    --hpe-logo-bg: #000;
    --hpe-logo-color: #fff;
  }
  .hpe-logo path {
    fill: none;
    stroke-width: 36;
    stroke-dashoffset: var(--_stroke-dashoffset, 0);
  }
  .hpe-logo.play .hpe-logo-element {
    animation: hpe-logo-element 2s linear 0.3s forwards;
  }
  @keyframes hpe-logo-element {
    0% {opacity: 1}
    100% {opacity: 0}
  }
  .hpe-logo .hpe-logo-snake {
    opacity: 0;
  }
  .hpe-logo.play .hpe-logo-snake {
    animation: hpe-logo-snake 5s linear 0s forwards;
  }
  @keyframes hpe-logo-snake {
    10% {opacity: .1}
    20% {opacity: .4}
    30% {opacity: 1}
    40% {stroke-dashoffset: 550}
    43.5% {stroke-dashoffset: 750}
    45% {stroke-dashoffset: 1230}
    50% {stroke-dashoffset: 1590}
    51% {stroke-dashoffset: 1600}
    55% {stroke-dashoffset: 1600}
    100% {stroke-dashoffset: 1600; opacity: 1}
  }
  .hpe-logo .hpe-logo-snake2 {
    opacity: 0;
  }
  .hpe-logo.play .hpe-logo-snake2 {
    animation: hpe-logo-snake2 5s linear 0s forwards;
  }
  @keyframes hpe-logo-snake2 {
    20% {opacity: .5}
    30% {opacity: 1}
    40% {opacity: .8}
    43%,100% {opacity: 0}
  }
  .hpe-logo .hpe-logo-H1 {--_stroke-dashoffset: 180}
  .hpe-logo.play .hpe-logo-H1 {
    animation: hpe-logo-dashoffset-reduce 0.458s ease-out 2.167s forwards;
  }
  .hpe-logo .hpe-logo-H2 {--_stroke-dashoffset: 180}
  .hpe-logo.play .hpe-logo-H2 {
    animation: hpe-logo-dashoffset-reduce 0.583s cubic-bezier(0, 0.7, 0.1, 1) 2.292s forwards;
  }
  .hpe-logo .hpe-logo-H3 {--_stroke-dashoffset: 140}
  .hpe-logo.play .hpe-logo-H3 {
    animation: hpe-logo-dashoffset-reduce 0.37s cubic-bezier(0, 0.7, 0.1, 1) 2.34s forwards;
  }
  .hpe-logo .hpe-logo-P1 {--_stroke-dashoffset: 180}
  .hpe-logo.play .hpe-logo-P1 {
    animation: hpe-logo-dashoffset-reduce 0.25s cubic-bezier(0, 0.7, 0.1, 1) 2.167s forwards;
  }
  .hpe-logo .hpe-logo-P2 {--_stroke-dashoffset: 370}
  .hpe-logo.play .hpe-logo-P2 {
    animation: hpe-logo-dashoffset-reduce 0.333s ease-out 2.5s forwards;
  }
  .hpe-logo .hpe-logo-E1 {--_stroke-dashoffset: 220}
  .hpe-logo.play .hpe-logo-E1 {
    animation: hpe-logo-dashoffset-reduce 0.458s ease-out 2.417s forwards;
  }
  .hpe-logo .hpe-logo-E2 {
    --_stroke-dashoffset: 168;
    opacity: 0;
    filter: brightness(1) contrast(2);
  }
  .hpe-logo.play .hpe-logo-E2 {
    animation: hpe-logo-E2 1s ease-out 2.533s forwards;
  }
  @keyframes hpe-logo-E2 {
    0% {stroke-dashoffset: var(--_stroke-dashoffset, 0)}
    40% {filter: brightness(0.8) contrast(1)}
    50% {opacity: 1}
    100% {stroke-dashoffset: 0; opacity: 0; filter: brightness(1) contrast(2)}
  }
  .hpe-logo .hpe-logo-half {
    opacity: 0;
  }
  .hpe-logo.play .hpe-logo-half {
    animation: hpe-logo-half 0.4s ease-out 3s forwards;
  }
  @keyframes hpe-logo-half {
    to {opacity: 1}
  }
  @keyframes hpe-logo-dashoffset-reduce {
    0% {stroke-dashoffset: var(--_stroke-dashoffset, 0)}
    100% {stroke-dashoffset: 0}
  }
</style>
<defs>
  <mask id="hpe-logo-mask" maskUnits="userSpaceOnUse">
    <rect fill="white" width="630" height="180" />
  </mask>
</defs>

<path class="hpe-logo-element" d="M612 180 V18 H18 V162 H630" stroke="#03a883"></path>
<path class="hpe-logo-snake2" d="M630 162 H0" stroke="#00e0af"></path>
<path class="hpe-logo-snake" d="M612 180 V18 H18 V162 H630" mask="url(#hpe-logo-mask)" stroke="#00e0af" stroke-dasharray="1600"></path>
<path class="hpe-logo-H1" d="M18 180 V0" stroke="var(--hpe-logo-color)" stroke-dasharray="180"></path>
<path class="hpe-logo-H2" d="M172 180 V0" stroke="var(--hpe-logo-color)" stroke-dasharray="180"></path>
<path class="hpe-logo-H3" d="M18 89 H155" stroke="var(--hpe-logo-color)" stroke-dasharray="140"></path>
<path class="hpe-logo-P1" d="M250 180 V0" stroke="var(--hpe-logo-color)" stroke-dasharray="180"></path>
<path class="hpe-logo-P2" d="M250 18 H352 A32 32 0 0 1 352 118 H250" stroke="var(--hpe-logo-color)" stroke-dasharray="370"></path>
<path class="hpe-logo-E1" d="M472 51 V18 H630" stroke="var(--hpe-logo-color)" stroke-dasharray="220"></path>
<path class="hpe-logo-half" d="M630 162 H472 V86 H630" stroke="#03a883"></path>
<path class="hpe-logo-E2" d="M630 162 H472 V86 H630" stroke="#00e0af" stroke-dasharray="420"></path>
<title>Hewlett Packard Enterprise</title>
        `,
      }}
    />
  );
}
