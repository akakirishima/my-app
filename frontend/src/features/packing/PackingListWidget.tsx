export default function PackingListWidget() {
  const items = ['タオル', '水筒', '日焼け止め']; // 仮データ
  return (
    <div className="aspect-square rounded-xl bg-yellow-400/70 p-4 flex flex-col">
      <h3 className="mb-2 text-center font-semibold">持ち物</h3>
      <ul className="flex-1 flex flex-col gap-1 overflow-y-auto">
        {items.map((item) => (
          <li key={item} className="before:content-['•'] before:mr-1">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}