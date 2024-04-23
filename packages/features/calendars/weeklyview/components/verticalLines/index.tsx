import type dayjs from "@calcom/dayjs";

export const VeritcalLines = ({ days }: { days: dayjs.Dayjs[] }) => {
  const isRTL = () => {
    const userLocale = navigator.language;
    const userLanguage = new Intl.Locale(userLocale).language;
    return ["ar", "he", "fa", "ur"].includes(userLanguage);
  };

  const direction = isRTL() ? "rtl" : "ltr";

  return (
    <div
      className="divide-default pointer-events-none relative z-[60] col-start-1 col-end-2 row-start-1 grid
       auto-cols-auto grid-rows-1 divide-x sm:pr-8"
      dir={direction}
      style={{
        direction: direction,
      }}>
      {days.map((_, i) => (
        <div
          key={`Key_vertical_${i}`}
          className="row-span-full"
          style={{
            gridColumnStart: isRTL() ? days.length - i : i + 1,
          }}
        />
      ))}
    </div>
  );
};
