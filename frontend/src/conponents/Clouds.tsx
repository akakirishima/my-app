import { useMemo } from "react";

type CloudsProps = {
  /** 生成する雲の個数 */
  count?: number;
  /** アニメーション速度（秒）[min, max] */
  speed?: [number, number];
  /** 雲の大きさ（scale）[min, max] */
  scale?: [number, number];
  /** 縦位置（%）[min, max]：コンテナ上辺を0%、下辺を100% */
  y?: [number, number];
  /** 追加クラス */
  className?: string;
};

export default function Clouds({
  count = 6,
  speed = [28, 55],
  scale = [0.7, 1.15],
  y = [-10, 85],
  className,
}: CloudsProps) {
  const items = useMemo(() => {
    const rand = (a: number, b: number) => Math.random() * (b - a) + a;
    return Array.from({ length: count }).map((_, i) => {
      const duration = rand(speed[0], speed[1]);
      const delay = -rand(0, duration); // 負のディレイでバラけさせる
      const top = rand(y[0], y[1]);
      const s = rand(scale[0], scale[1]);
      return {
        key: i,
        style: {
          // CSS変数でアニメに渡す
          ["--d" as any]: `${duration}s`,
          ["--delay" as any]: `${delay}s`,
          ["--top" as any]: `${top}%`,
          ["--s" as any]: s,
        } as React.CSSProperties,
      };
    });
  }, [count, speed[0], speed[1], scale[0], scale[1], y[0], y[1]]);

  return (
    <div className={`clouds ${className ?? ""}`} aria-hidden="true">
      {items.map(({ key, style }) => (
        <div key={key} className="clouds__item" style={style} />
      ))}
    </div>
  );
}