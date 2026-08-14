const AGE_SIZES = [
    { age: "0–3 Months", height: "50–61 cm", weight: "3–6 kg", label: "NB / 0-3M" },
    { age: "3–6 Months", height: "61–67 cm", weight: "6–8 kg", label: "3-6M" },
    { age: "6–9 Months", height: "67–72 cm", weight: "8–9 kg", label: "6-9M" },
    { age: "9–12 Months", height: "72–76 cm", weight: "9–10.5 kg", label: "9-12M" },
    { age: "1–2 Years", height: "76–86 cm", weight: "10.5–13 kg", label: "1-2Y" },
    { age: "2–3 Years", height: "86–98 cm", weight: "13–15 kg", label: "2-3Y" },
    { age: "3–4 Years", height: "98–104 cm", weight: "15–17 kg", label: "3-4Y" },
  ];
  
  const SHOE_SIZES = [
    { age: "6–12 Months", eu: "18–19", foot: "10.5–11.5 cm" },
    { age: "1–2 Years", eu: "20–22", foot: "12–13.5 cm" },
    { age: "2–3 Years", eu: "23–25", foot: "14–15.5 cm" },
    { age: "3–4 Years", eu: "26–27", foot: "16–16.5 cm" },
  ];

  export default function SizeGuidePage() {
    return (
      <main className="max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop py-stack-lg">
        <h1 className="font-display-md text-display-md text-text-primary mb-2">Size Guide</h1>
        <p className="font-body-md text-body-md text-text-secondary mb-stack-lg max-w-2xl">
          A general guide for clothing and footwear. Babies grow at different rates, so use height and
          weight as your primary reference — if your little one is between sizes, we recommend sizing up.
        </p>

        <p className="font-body-sm text-body-sm text-text-secondary italic mb-stack-lg max-w-2xl">
          Note: sizes on our product pages are shown as labels only. Use the tables below as a general
          reference alongside each product's description.
        </p>
  
        <section className="mb-stack-lg">
          <h2 className="font-headline-lg text-text-primary mb-stack-sm">Clothing</h2>
          <div className="overflow-x-auto border border-border-default rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-secondary">
                  <th className="font-label-md text-label-md text-text-secondary uppercase tracking-wider px-4 py-3">
                    Size Label
                  </th>
                  <th className="font-label-md text-label-md text-text-secondary uppercase tracking-wider px-4 py-3">
                    Age
                  </th>
                  <th className="font-label-md text-label-md text-text-secondary uppercase tracking-wider px-4 py-3">
                    Height
                  </th>
                  <th className="font-label-md text-label-md text-text-secondary uppercase tracking-wider px-4 py-3">
                    Weight
                  </th>
                </tr>
              </thead>
              <tbody>
                {AGE_SIZES.map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? "bg-surface-elevated" : "bg-surface-primary"}>
                    <td className="font-body-md text-body-md text-text-primary font-medium px-4 py-3">{row.label}</td>
                    <td className="font-body-sm text-body-sm text-text-secondary px-4 py-3">{row.age}</td>
                    <td className="font-body-sm text-body-sm text-text-secondary px-4 py-3">{row.height}</td>
                    <td className="font-body-sm text-body-sm text-text-secondary px-4 py-3">{row.weight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
  
        <section className="mb-stack-lg">
          <h2 className="font-headline-lg text-text-primary mb-stack-sm">Footwear</h2>
          <div className="overflow-x-auto border border-border-default rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-secondary">
                  <th className="font-label-md text-label-md text-text-secondary uppercase tracking-wider px-4 py-3">
                    Age
                  </th>
                  <th className="font-label-md text-label-md text-text-secondary uppercase tracking-wider px-4 py-3">
                    EU Size
                  </th>
                  <th className="font-label-md text-label-md text-text-secondary uppercase tracking-wider px-4 py-3">
                    Foot Length
                  </th>
                </tr>
              </thead>
              <tbody>
                {SHOE_SIZES.map((row, i) => (
                  <tr key={row.age} className={i % 2 === 0 ? "bg-surface-elevated" : "bg-surface-primary"}>
                    <td className="font-body-md text-body-md text-text-primary font-medium px-4 py-3">{row.age}</td>
                    <td className="font-body-sm text-body-sm text-text-secondary px-4 py-3">{row.eu}</td>
                    <td className="font-body-sm text-body-sm text-text-secondary px-4 py-3">{row.foot}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
  
        <section className="bg-surface-elevated border border-border-default rounded-2xl p-6 max-w-2xl">
          <h2 className="font-headline-md text-headline-md text-text-primary mb-3">How to measure</h2>
          <ul className="flex flex-col gap-2 font-body-sm text-body-sm text-text-secondary list-disc pl-5">
            <li>
              <span className="text-text-primary font-medium">Height:</span> Lay your child flat and measure
              from the top of the head to the heel.
            </li>
            <li>
              <span className="text-text-primary font-medium">Foot length:</span> Trace their foot on paper
              while standing, then measure the longest point, heel to toe.
            </li>
            <li>
              Between sizes? Choose the larger size, especially for growing newborns and toddlers.
            </li>
          </ul>
        </section>
      </main>
    );
  }