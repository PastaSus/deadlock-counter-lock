import type {
  EntryMedia,
  EntryMediaSide,
  MediaAsset,
} from "../lib/schema";
import { AssetTooltip, type AssetTooltipProps } from "./asset-tooltip";

interface AssetMediaRowProps {
  media?: EntryMedia | null;
  asset?: MediaAsset | null;
  className?: string;
}

function assetTooltipProps(
  asset: MediaAsset,
  variant: "portrait" | "icon",
): AssetTooltipProps {
  const portrait = variant === "portrait";

  return {
    name: asset.name,
    typeLabel: asset.typeLabel,
    summary: asset.summary,
    tier: asset.tier,
    imagePath: portrait
      ? asset.portraitPath ?? asset.imagePath
      : asset.imagePath,
    imageWebpPath: portrait
      ? asset.portraitWebpPath
      : asset.imageWebpPath,
    variant,
    tierBorder: !portrait && asset.kind === "item" && Boolean(asset.tier),
  };
}

function placeholderTooltipProps(
  side: EntryMediaSide,
  variant: "portrait" | "icon",
): AssetTooltipProps {
  return {
    name: side.name,
    typeLabel: side.typeLabel,
    summary: side.summary,
    tier: side.tier,
    variant,
    tierBorder:
      variant === "icon" && side.kind === "item" && Boolean(side.tier),
  };
}

function SideMedia({ side }: { side: EntryMediaSide }) {
  if (side.kind === "hero") {
    return side.portrait ? (
      <AssetTooltip {...assetTooltipProps(side.portrait, "portrait")} />
    ) : (
      <AssetTooltip {...placeholderTooltipProps(side, "portrait")} />
    );
  }

  if (side.kind === "ability") {
    return (
      <span className="inline-flex items-center gap-1.5">
        {side.portrait ? (
          <AssetTooltip {...assetTooltipProps(side.portrait, "portrait")} />
        ) : null}
        {side.icon ? (
          <AssetTooltip {...assetTooltipProps(side.icon, "icon")} />
        ) : (
          <AssetTooltip {...placeholderTooltipProps(side, "icon")} />
        )}
      </span>
    );
  }

  if (side.kind === "item") {
    return side.icon ? (
      <AssetTooltip {...assetTooltipProps(side.icon, "icon")} />
    ) : (
      <AssetTooltip {...placeholderTooltipProps(side, "icon")} />
    );
  }

  return <AssetTooltip {...placeholderTooltipProps(side, "icon")} />;
}

export function AssetMediaRow({
  media,
  asset,
  className,
}: AssetMediaRowProps) {
  if (!media && !asset) return null;

  return (
    <div
      className={[
        "relative z-20 flex items-center gap-2",
        className,
      ].join(" ")}
    >
      {media ? (
        <>
          <SideMedia side={media.source} />
          <span
            className="text-[11px] font-mono text-text-muted"
            aria-hidden="true"
          >
            vs
          </span>
          <SideMedia side={media.target} />
        </>
      ) : asset ? (
        <AssetTooltip
          {...assetTooltipProps(
            asset,
            asset.kind === "hero" ? "portrait" : "icon",
          )}
        />
      ) : null}
    </div>
  );
}
