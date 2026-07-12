import {
  LineSpinner,
  Bouncy,
  DotWave,
  Ring,
  Infinity,
  Helix,
  Hourglass,
  JellyTriangle,
  LineWobble,
  Mirage,
  Orbit,
  Ring2,
  Square,
  Tailspin,
  Trefoil,
  Trio,
} from "ldrs/react";

const COLOR = "var(--color-ember)";

export const LineSpinnerLoader = ({ size = 32 }: { size?: number }) => (
  <LineSpinner size={size} stroke={2.5} speed={1} color={COLOR} />
);

export const BouncyLoader = ({ size = 32 }: { size?: number }) => (
  <Bouncy size={size} speed={1.4} color={COLOR} />
);

export const DotWaveLoader = ({ size = 32 }: { size?: number }) => (
  <DotWave size={size} speed={1.2} color={COLOR} />
);

export const RingLoader = ({ size = 32 }: { size?: number }) => (
  <Ring size={size} stroke={3} speed={1.4} color={COLOR} />
);

export const InfinityLoader = ({ size = 60 }: { size?: number }) => (
  <Infinity size={size} stroke={2.5} speed={1.2} color={COLOR} />
);

export const HelixLoader = ({ size = 32 }: { size?: number }) => (
  <Helix size={size} speed={1.2} color={COLOR} />
);

export const HourglassLoader = ({ size = 32 }: { size?: number }) => (
  <Hourglass size={size} speed={1.2} color={COLOR} />
);

export const JellyLoader = ({ size = 32 }: { size?: number }) => (
  <JellyTriangle size={size} color={COLOR} />
);

export const WobbleLoader = ({ size = 32 }: { size?: number }) => (
  <LineWobble size={size} stroke={3} speed={1.2} color={COLOR} />
);

export const MirageLoader = ({ size = 32 }: { size?: number }) => (
  <Mirage size={size} speed={1.4} color={COLOR} />
);

export const OrbitLoader = ({ size = 32 }: { size?: number }) => (
  <Orbit size={size} speed={1.4} color={COLOR} />
);

export const Ring2Loader = ({ size = 32 }: { size?: number }) => (
  <Ring2 size={size} stroke={2.5} speed={1.2} color={COLOR} />
);

export const SquareLoader = ({ size = 32 }: { size?: number }) => (
  <Square size={size} stroke={2.5} speed={1.2} color={COLOR} />
);

export const TailspinLoader = ({ size = 32 }: { size?: number }) => (
  <Tailspin size={size} stroke={2.5} speed={1.2} color={COLOR} />
);

export const TrefoilLoader = ({ size = 32 }: { size?: number }) => (
  <Trefoil size={size} stroke={2.5} speed={1.4} color={COLOR} />
);

export const TrioLoader = ({ size = 32 }: { size?: number }) => (
  <Trio size={size} color={COLOR} />
);

export const CenteredLoader = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-64 items-center justify-center">{children}</div>
);
