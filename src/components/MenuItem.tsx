import { formatPrice } from "@/data/site";

export type MenuRowItem = {
  name: string;
  price: number;
  description: string;
};

type MenuItemProps = {
  item: MenuRowItem;
  showDescription?: boolean;
};

export default function MenuItem({ item, showDescription = false }: MenuItemProps) {
  return (
    <li className="group py-3.5">
      <div className="flex items-baseline gap-3">
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
      </div>
      {showDescription && item.description && (
        <p className="mt-1 max-w-md text-sm leading-relaxed text-muted">
          {item.description}
        </p>
      )}
    </li>
  );
}
