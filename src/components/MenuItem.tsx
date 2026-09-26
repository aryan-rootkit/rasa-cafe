import { formatPrice } from "@/data/site";
import type { MenuItem as MenuItemType } from "@/data/types";

type MenuItemProps = {
  item: MenuItemType;
};

export default function MenuItem({ item }: MenuItemProps) {
  return (
    <li className="group flex items-baseline gap-3 py-3.5">
      <span className="text-[15px] text-ink transition-transform duration-300 group-hover:translate-x-0.5 md:text-base">
        {item.name}
      </span>
      <span
        aria-hidden
        className="mb-1 flex-1 border-b border-dotted border-line-strong"
      />
      <span className="shrink-0 text-sm tracking-wide text-muted">
        {formatPrice(item.price)}
      </span>
    </li>
  );
}
