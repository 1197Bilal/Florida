import React, { useState, useEffect } from "react";
import { PRODUCTS } from "../data/products";
import { Sale } from "../types/pos";

export default function Index() {
  const [carrito, setCarrito] = useState<{ name: string, price: number, id: number, time: string }[]>([]);
  const [salesHistory, setSalesHistory] = useState<Sale[]>(() => {
    const saved = localStorage.getItem("florida_sales_history");
    return saved ? JSON.parse(saved) : [];
  });
  const [manualAmount, setManualAmount] = useState("");

  useEffect(() => {
    localStorage.setItem("florida_sales_history", JSON.stringify(salesHistory));
  }, [salesHistory]);

  const totalTicket = carrito.reduce((acc, item) => acc + item.price, 0);

  const agregar = (name: string, price: number) => {
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setCarrito([...carrito, { name, price, id: Date.now(), time }]);
  };

  const agregarManual = () => {
    const precio = parseFloat(manualAmount);
    if (!isNaN(precio) && precio > 0) {
      agregar("Importe Manual", precio);
      setManualAmount("");
    }
  };

  const pressNum = (num: string) => {
    if (num === "." && manualAmount.includes(".")) return;
    setManualAmount(manualAmount + num);
  };

  const eliminarUno = (id: number) => {
    setCarrito(carrito.filter(item => item.id !== id));
  };

  const cobrar = () => {
    if (carrito.length === 0) return;

    const now = new Date();
    const newSale: Sale = {
      id: Date.now(),
      timestamp: now.toISOString(),
      items: carrito.map(i => ({ name: i.name, price: i.price })),
      total: totalTicket
    };

    setSalesHistory([...salesHistory, newSale]);
    setCarrito([]);
    alert("Venta realizada con éxito ✅");
  };

  const descargarTXTParaFichero = (filename: string, text: string) => {
    const element = document.createElement("a");
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const realizarCierre = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaysSales = salesHistory.filter(s => s.timestamp.startsWith(today));
    const totalToday = todaysSales.reduce((acc, s) => acc + s.total, 0);

    let reportContent = `FLORIDA CAFÉ - CIERRE DE CAJA\n`;
    reportContent += `Fecha: ${today}\n`;
    reportContent += `------------------------------------------\n`;

    todaysSales.forEach((sale, index) => {
      const time = new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      reportContent += `Venta #${index + 1} - ${time}\n`;
      sale.items.forEach(item => {
        reportContent += `  - ${item.name}: ${item.price.toFixed(2)} MAD\n`;
      });
      reportContent += `  TOTAL: ${sale.total.toFixed(2)} MAD\n`;
      reportContent += `------------------------------------------\n`;
    });

    reportContent += `\nTOTAL DEL DÍA: ${totalToday.toFixed(2)} MAD\n`;

    descargarTXTParaFichero(`cierre_${today}.txt`, reportContent);
    alert(`Cierre realizado. Total: ${totalToday.toFixed(2)} MAD`);
  };

  const descargarReporteMensual = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const monthStr = `${year}-${month.toString().padStart(2, '0')}`;

    const monthlySales = salesHistory.filter(s => s.timestamp.startsWith(monthStr));
    const totalMonth = monthlySales.reduce((acc, s) => acc + s.total, 0);

    let reportContent = `FLORIDA CAFÉ - REPORTE MENSUAL\n`;
    reportContent += `Mes: ${monthStr}\n`;
    reportContent += `------------------------------------------\n`;

    // Agrupar por día
    const salesByDay: { [key: string]: number } = {};
    monthlySales.forEach(s => {
      const day = s.timestamp.split('T')[0];
      salesByDay[day] = (salesByDay[day] || 0) + s.total;
    });

    Object.keys(salesByDay).sort().forEach(day => {
      reportContent += `${day}: ${salesByDay[day].toFixed(2)} MAD\n`;
    });

    reportContent += `------------------------------------------\n`;
    reportContent += `TOTAL MENSUAL: ${totalMonth.toFixed(2)} MAD\n`;

    descargarTXTParaFichero(`reporte_mensual_${monthStr}.txt`, reportContent);
  };

  return (
    <div className="h-screen w-full bg-slate-200 flex flex-col font-sans overflow-hidden text-slate-900">
      <header className="bg-slate-800 text-white p-3 flex justify-between items-center shadow-md">
        <h1 className="font-black italic text-xl">FLORIDA CAFÉ 🌴</h1>
        <div className="flex gap-2">
          <button onClick={descargarReporteMensual} className="bg-indigo-600 px-4 py-1 rounded-lg font-bold text-xs shadow-lg">INFORME MENSUAL</button>
          <button onClick={realizarCierre} className="bg-red-600 px-4 py-1 rounded-lg font-bold text-xs shadow-lg">CIERRE DE CAJA</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Ticket Izquierda con Teclado Numérico */}
        <div className="w-1/3 bg-white border-r-2 border-slate-300 flex flex-col">
          <div className="bg-indigo-600 p-2 text-white text-[10px] font-bold flex justify-between uppercase">
            <span>Artículo</span>
            <span>Importe</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {carrito.map((item) => (
              <div key={item.id} className="flex justify-between p-3 border-b items-center animate-in fade-in slide-in-from-left-2 duration-200">
                <button onClick={() => eliminarUno(item.id)} className="text-red-500 font-bold mr-2 text-lg">✕</button>
                <div className="flex-1">
                  <div className="text-base font-bold">{item.name}</div>
                  <div className="text-[10px] text-slate-400 font-medium">{item.time}</div>
                </div>
                <span className="font-black text-indigo-700 text-lg">{item.price.toFixed(2)} MAD</span>
              </div>
            ))}
          </div>

          {/* TECLADO NUMÉRICO MANUAL */}
          <div className="bg-slate-100 p-2 border-t border-slate-300">
            <div className="bg-white p-2 mb-2 text-right text-2xl font-mono border-2 border-indigo-200 rounded-xl shadow-inner h-14 flex items-center justify-end">
              {manualAmount || "0.00"} <span className="ml-2 text-sm text-slate-400">MAD</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0, "."].map(n => (
                <button key={n} onClick={() => pressNum(n.toString())} className="bg-white py-3 rounded-xl shadow text-lg font-black active:scale-95 transition-transform active:bg-slate-200">{n}</button>
              ))}
              <button onClick={() => setManualAmount("")} className="bg-orange-100 py-3 rounded-xl shadow text-lg font-black text-orange-700 active:scale-95">C</button>
              <button onClick={agregarManual} className="col-span-4 bg-indigo-500 text-white py-3 rounded-xl font-black mt-1 shadow-lg hover:bg-indigo-600 active:scale-95 transition-all">AÑADIR IMPORTE MANUAL</button>
            </div>
          </div>

          <div className="bg-slate-900 p-4 text-white">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total</span>
              <span className="text-5xl font-black text-emerald-400">{totalTicket.toFixed(2)} <span className="text-xl">MAD</span></span>
            </div>
          </div>
        </div>

        {/* Productos Derecha */}
        <div className="w-2/3 p-4 bg-slate-100 overflow-y-auto grid grid-cols-2 lg:grid-cols-4 gap-4 content-start">
          {PRODUCTS.map((p) => (
            <button key={p.name} onClick={() => agregar(p.name, p.price)} className={`bg-white p-3 rounded-2xl shadow-md border-b-8 ${p.color} active:scale-95 transition-all group hover:bg-slate-50 relative overflow-hidden h-fit`}>
              <div className="h-32 w-full flex items-center justify-center mb-3 overflow-hidden rounded-xl bg-gray-100">
                <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={p.name} />
              </div>
              <div className="text-xs font-black uppercase text-slate-600 truncate mb-1">{p.name}</div>
              <div className="text-indigo-600 font-black text-xl">{p.price.toFixed(2)} <span className="text-[10px]">MAD</span></div>
            </button>
          ))}
        </div>
      </div>

      <footer className="bg-slate-800 p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.1)]">
        <button onClick={cobrar} className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-5 rounded-2xl text-3xl shadow-xl transition-all active:scale-95">FINALIZAR VENTA</button>
      </footer>
    </div>
  );
}
