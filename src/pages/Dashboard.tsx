import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { Sale, Expense } from "../types/pos";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { ArrowLeft, TrendingUp, ShoppingBag, CreditCard, Users, Wallet } from "lucide-react";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

export default function Dashboard() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: salesData, error: sError } = await supabase.from("sales").select("*").order("timestamp", { ascending: true });
            const { data: expensesData, error: eError } = await supabase.from("expenses").select("*");

            if (sError) console.error("Sales fetch error:", sError);
            if (eError) console.error("Expenses fetch error:", eError);

            if (salesData) setSales(salesData);
            if (expensesData) setExpenses(expensesData);
        } catch (err) {
            console.error("Fetch data exception:", err);
        } finally {
            setLoading(false);
        }
    };

    const totalSales = sales.reduce((acc, s) => acc + s.total, 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    const totalOrders = sales.length;
    const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0;
    const profit = totalSales - totalExpenses;

    // Chart Data: Monthly Sales
    const monthlyData = sales.reduce((acc: any, s) => {
        const month = new Date(s.timestamp).toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
        acc[month] = (acc[month] || 0) + s.total;
        return acc;
    }, {});

    const lineChartData = {
        labels: Object.keys(monthlyData),
        datasets: [
            {
                label: "Ventas (MAD)",
                data: Object.values(monthlyData),
                borderColor: "rgb(99, 102, 241)",
                backgroundColor: "rgba(99, 102, 241, 0.5)",
                tension: 0.3,
            },
        ],
    };

    // Chart Data: Top Products
    const productData = sales.reduce((acc: any, s) => {
        s.items.forEach((item: any) => {
            acc[item.name] = (acc[item.name] || 0) + 1;
        });
        return acc;
    }, {});

    const topProducts = Object.entries(productData)
        .sort((a: any, b: any) => b[1] - a[1])
        .slice(0, 5);

    const doughnutData = {
        labels: topProducts.map((p) => p[0]),
        datasets: [
            {
                data: topProducts.map((p) => p[1]),
                backgroundColor: [
                    "rgba(255, 99, 132, 0.8)",
                    "rgba(54, 162, 235, 0.8)",
                    "rgba(255, 206, 86, 0.8)",
                    "rgba(75, 192, 192, 0.8)",
                    "rgba(153, 102, 255, 0.8)",
                ],
            },
        ],
    };

    // Chart Data: Hourly Sales
    const hourlyData = sales.reduce((acc: any, s) => {
        const hour = new Date(s.timestamp).getHours();
        acc[hour] = (acc[hour] || 0) + s.total;
        return acc;
    }, {});

    const hourlyChartData = {
        labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
        datasets: [
            {
                label: "Ventas por Hora (MAD)",
                data: Array.from({ length: 24 }, (_, i) => hourlyData[i] || 0),
                backgroundColor: "rgba(99, 102, 241, 0.8)",
                borderRadius: 8,
            },
        ],
    };

    // Chart Data: Weekday Sales
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const weekdayData = sales.reduce((acc: any, s) => {
        const day = new Date(s.timestamp).getDay();
        acc[day] = (acc[day] || 0) + s.total;
        return acc;
    }, {});

    const weekdayChartData = {
        labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
        datasets: [
            {
                label: "Ventas por Día (MAD)",
                data: [1, 2, 3, 4, 5, 6, 0].map(d => weekdayData[d] || 0),
                backgroundColor: "rgba(45, 212, 191, 0.8)",
                borderRadius: 8,
            },
        ],
    };

    if (loading) {
        return (
            <div className="h-screen bg-slate-900 flex items-center justify-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 transition-all">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight uppercase">Florida Analitics</h1>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Sede: Tánger, Marruecos</p>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 p-2 rounded-2xl border border-white/5 flex items-center gap-4">
                        <button onClick={fetchData} className="px-4 py-2 bg-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-500 transition-all">Refrescar</button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Ventas Totales" value={`${totalSales.toFixed(2)} MAD`} icon={<TrendingUp className="text-emerald-400" />} color="border-l-emerald-500" />
                    <StatCard title="Total Pedidos" value={totalOrders.toString()} icon={<ShoppingBag className="text-blue-400" />} color="border-l-blue-500" />
                    <StatCard title="Ticket Medio" value={`${avgTicket.toFixed(2)} MAD`} icon={<CreditCard className="text-purple-400" />} color="border-l-purple-500" />
                    <StatCard title="Beneficio Neto" value={`${profit.toFixed(2)} MAD`} icon={<Wallet className="text-orange-400" />} color="border-l-orange-500" />
                </div>

                {/* Main Evolution Chart */}
                <div className="bg-slate-900/50 rounded-3xl p-6 border border-white/5 shadow-xl">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">📈 Evolución Histórica (Mensual)</h3>
                    <div className="h-72">
                        {Object.keys(monthlyData).length > 0 ? (
                            <Line data={lineChartData} options={{ maintainAspectRatio: false }} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-600 italic">No hay historial de ventas suficiente</div>
                        )}
                    </div>
                </div>

                {/* Detailed Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-slate-900/50 rounded-3xl p-6 border border-white/5 shadow-xl">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">🕒 Ventas por Hora</h3>
                        <div className="h-64">
                            {sales.length > 0 ? (
                                <Bar data={hourlyChartData} options={{ maintainAspectRatio: false }} />
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-600 italic">Sin datos horarios</div>
                            )}
                        </div>
                    </div>
                    <div className="bg-slate-900/50 rounded-3xl p-6 border border-white/5 shadow-xl">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">📅 Actividad por Semana</h3>
                        <div className="h-64">
                            {sales.length > 0 ? (
                                <Bar data={weekdayChartData} options={{ maintainAspectRatio: false }} />
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-600 italic">Sin datos semanales</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Products and Table Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="bg-slate-900/50 lg:col-span-1 rounded-3xl p-6 border border-white/5 shadow-xl">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">🌮 Top Productos</h3>
                        <div className="h-64">
                            {topProducts.length > 0 ? (
                                <Doughnut data={doughnutData} options={{ maintainAspectRatio: false }} />
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-600 italic">Sin datos de productos</div>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-900/50 lg:col-span-2 rounded-3xl p-8 border border-white/5 shadow-xl">
                        <h3 className="text-xl font-bold mb-8 uppercase tracking-tight">Últimas Transacciones</h3>
                        <div className="overflow-x-auto">
                            {sales.length > 0 ? (
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-slate-500 text-[10px] uppercase font-black border-b border-white/5">
                                            <th className="pb-4">Fecha/Hora</th>
                                            <th className="pb-4">Concepto</th>
                                            <th className="pb-4 text-right">Importe</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {sales.slice(-10).reverse().map((sale) => (
                                            <tr key={sale.id} className="hover:bg-white/5 transition-colors">
                                                <td className="py-4 text-sm font-bold">{new Date(sale.timestamp).toLocaleString()}</td>
                                                <td className="py-4 text-sm text-slate-400 italic">
                                                    {sale.items.map((i: any) => i.name).join(", ")}
                                                </td>
                                                <td className="py-4 text-right font-black text-emerald-400">{sale.total.toFixed(2)} MAD</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center py-10 text-slate-500 italic">No se han encontrado ventas registradas</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) {
    return (
        <div className={`bg-slate-900/50 rounded-3xl p-6 border border-white/5 border-l-4 ${color} shadow-lg hover:bg-slate-800/50 transition-all`}>
            <div className="flex justify-between items-start mb-4">
                <p className="text-slate-500 text-xs font-black uppercase tracking-widest">{title}</p>
                <div className="p-2 bg-slate-800 rounded-lg">{icon}</div>
            </div>
            <h3 className="text-3xl font-black tracking-tight">{value}</h3>
        </div>
    );
}
