import dynamic from "next/dynamic";
const Line = dynamic(() => import("react-chartjs-2").then(m => m.Line), { ssr: false });
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from "chart.js";
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

export function Sparkline({ points }: { points: { date: string; value: number }[] }) {
  const data = {
    labels: points.map(p => p.date),
    datasets: [{ label: "Sessions", data: points.map(p=>p.value) }]
  };
  const options = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { x: { display:false }, y: { display:false } }
  };
  return <Line data={data} options={options as any} />;
}
