import React, { useState, useEffect } from "react";
import { PRODUCTS } from "../data/products";
import { Sale } from "../types/pos";

export default function Index() {
  const [carrito, setCarrito] = useState<{ name: string, price: number, id: number, time: string }[]>([]);
  const [salesHistory, setSalesHistory] = useState<Sale[]>(() => {
    const saved = localStorage.getItem("florida_sales_history");
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualAmount, setManualAmount] = useState("");
  const [reportType, setReportType] = useState<"daily" | "monthly" | null>(null);

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

  const printReport = (type: "daily" | "monthly") => {
    setReportType(type);
    setTimeout(() => {
      window.print();
      setReportType(null);
    }, 100);
  };

  const salesAtSelectedDate = salesHistory.filter(s => s.timestamp.startsWith(selectedDate));
  const totalAtSelectedDate = salesAtSelectedDate.reduce((acc, s) => acc + s.total, 0);

  const getMonthlySales = () => {
    const month = selectedDate.substring(0, 7);
    return salesHistory.filter(s => s.timestamp.startsWith(month));
  };

  const totalMonthly = getMonthlySales().reduce((acc, s) => acc + s.total, 0);

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
      {/* PROFESSIONAL PRINT OVERLAY (Hidden on screen) */}
      {reportType && (
        <div className="fixed inset-0 bg-white z-[9999] p-8 print:block hidden text-slate-900 border-8 border-slate-100 h-full overflow-y-auto">
          <div className="flex justify-between items-start border-b-4 border-slate-800 pb-4 mb-6">
            <div>
              <h1 className="text-4xl font-black italic mb-1 uppercase tracking-tighter">FLORIDA CAFÉ 🌴</h1>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Informe oficial de ventas</p>
            </div>
            <div className="text-right">
              <p className="font-black text-xl uppercase">{reportType === 'daily' ? 'Cierre de Caja' : 'Resumen Mensual'}</p>
              <p className="text-slate-500 font-bold">{reportType === 'daily' ? selectedDate : selectedDate.substring(0, 7)}</p>
            </div>
          </div>

          {reportType === 'daily' ? (
            <div>
              <div className="mb-6 p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 border-b pb-2">Resumen de Productos</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                  {Object.entries(salesAtSelectedDate.reduce((acc: any, s) => {
                    s.items.forEach(item => {
                      acc[item.name] = (acc[item.name] || 0) + 1;
                    });
                    return acc;
                  }, {})).sort().map(([name, qty]: [string, any]) => (
                    <div key={name} className="flex justify-between text-sm border-b border-slate-100 pb-1">
                      <span className="font-bold text-slate-700">{name}</span>
                      <span className="font-black text-indigo-600">x{qty}</span>
                    </div>
                  ))}
                </div>
              </div>

              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 mt-8">Detalle Cronológico</h3>
              <table className="w-full text-left">
                <thead className="border-b-2 border-slate-300 uppercase text-[10px] font-black text-slate-400">
                  <tr>
                    <th className="py-2">Hora</th>
                    <th>Concepto</th>
                    <th className="text-right">Importe</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {salesAtSelectedDate.map((s, idx) => (
                    <React.Fragment key={s.id}>
                      <tr className="bg-slate-50 font-bold border-t border-slate-100">
                        <td className="py-2">{new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td>VENTA #{idx + 1}</td>
                        <td className="text-right font-black text-indigo-700">{s.total.toFixed(2)} MAD</td>
                      </tr>
                      {s.items.map((item, iidx) => (
                        <tr key={iidx} className="text-slate-500 text-[10px]">
                          <td />
                          <td className="pl-4 pb-1">- {item.name}</td>
                          <td className="text-right">{item.price.toFixed(2)} MAD</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
              <div className="mt-8 pt-4 border-t-4 border-slate-800 flex justify-between items-center">
                <span className="text-2xl font-black uppercase tracking-tighter">Total del día:</span>
                <span className="text-4xl font-black">{totalAtSelectedDate.toFixed(2)} MAD</span>
              </div>
            </div>
          ) : (
            <div>
              <table className="w-full text-left border-collapse">
                <thead className="border-b-2 border-slate-300 uppercase text-[10px] font-black text-slate-400">
                  <tr>
                    <th className="py-2 border-r pr-4">Fecha</th>
                    <th className="text-right">Total Día</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {Object.entries(getMonthlySales().reduce((acc: any, s) => {
                    const day = s.timestamp.split('T')[0];
                    acc[day] = (acc[day] || 0) + s.total;
                    return acc;
                  }, {})).sort().map(([day, total]: [string, any]) => (
                    <tr key={day} className="border-b border-slate-100">
                      <td className="py-2 font-bold border-r pr-4">{day}</td>
                      <td className="text-right font-black">{total.toFixed(2)} MAD</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-8 pt-4 border-t-4 border-slate-800 flex justify-between items-center">
                <span className="text-2xl font-black uppercase tracking-tighter">Total Mes:</span>
                <span className="text-4xl font-black">{totalMonthly.toFixed(2)} MAD</span>
              </div>
            </div>
          )}

          <div className="mt-12 text-[10px] text-slate-400 border-t pt-4 flex justify-between italic">
            <span>Florida Café POS - Software de gestión</span>
            <span>Generado el: {new Date().toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* HEADER (Screen Only) */}
      <header className="bg-slate-800 text-white p-3 flex justify-between items-center shadow-md print:hidden">
        <div className="flex items-center gap-4">
          <h1 className="font-black italic text-xl uppercase tracking-tighter">FLORIDA CAFÉ 🌴</h1>
          <div className="bg-slate-700 p-1 px-3 rounded-xl border border-slate-600 flex items-center gap-2 group">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">Historial:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm font-black focus:outline-none cursor-pointer uppercase tracking-tighter"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => printReport('monthly')} className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl font-black text-xs shadow-lg transition-all active:scale-95 uppercase tracking-tighter">INFORME PDF MES</button>
          <button onClick={() => printReport('daily')} className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-xl font-black text-xs shadow-lg transition-all active:scale-95 uppercase tracking-tighter">CIERRE PDF DÍA</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Ticket Izquierda con Teclado Numérico */}
        <div className="w-1/3 bg-white border-r-2 border-slate-300 flex flex-col">
          <div className="bg-slate-800 p-2 text-white text-[10px] font-bold flex justify-between uppercase tracking-widest">
            <span>Ticket Actual</span>
            <span className="text-emerald-400 italic font-black">Venta Abierta</span>
          </div>
          <div className="flex-1 overflow-y-auto bg-slate-50 shadow-inner">
            {carrito.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 p-10 text-center gap-4 group">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-500">☕</div>
                <p className="font-bold text-xs uppercase tracking-widest leading-relaxed">Carrito vacío<br />Selecciona un producto</p>
              </div>
            ) : (
              carrito.map((item) => (
                <div key={item.id} className="flex justify-between p-3 border-b border-slate-200 items-center animate-in fade-in slide-in-from-left-2 duration-200 hover:bg-white transition-colors">
                  <button onClick={() => eliminarUno(item.id)} className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl font-bold transition-all hover:bg-red-500 hover:text-white active:scale-90 shadow-sm">✕</button>
                  <div className="flex-1 px-4">
                    <div className="text-base font-black text-slate-800 uppercase tracking-tight leading-4">{item.name}</div>
                    <div className="flex items-center gap-1 text-[11px] text-indigo-500 font-black bg-indigo-50 w-fit px-2 py-0.5 rounded-full mt-1.5 shadow-sm">
                      <span className="opacity-70 text-[10px]">🕒</span> {item.time}
                    </div>
                  </div>
                  <span className="font-black text-indigo-700 text-xl tracking-tighter">{item.price.toFixed(2)} <span className="text-[10px]">MAD</span></span>
                </div>
              ))
            )}
          </div>

          <div className="bg-slate-200 p-3 border-t-2 border-slate-300 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
            <div className="bg-white p-2 mb-3 text-right text-3xl font-mono border-4 border-indigo-100 rounded-2xl shadow-inner h-16 flex items-center justify-end group">
              <span className="text-slate-300 group-hover:text-slate-400 transition-colors mr-auto text-[10px] font-black uppercase tracking-tighter ml-2">Manual:</span>
              <span className="font-black text-indigo-700">{manualAmount || "0.00"}</span>
              <span className="ml-2 text-xs text-slate-400 font-bold uppercase">MAD</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0, "."].map(n => (
                <button key={n} onClick={() => pressNum(n.toString())} className="bg-white py-4 rounded-xl shadow-md text-xl font-black active:scale-95 transition-all hover:bg-slate-50 border-b-4 border-slate-100">{n}</button>
              ))}
              <button onClick={() => setManualAmount("")} className="bg-white py-4 rounded-xl shadow-md text-xl font-black text-orange-600 active:scale-95 hover:bg-orange-50 transition-all border-b-4 border-orange-100 font-mono">C</button>
              <button onClick={agregarManual} className="col-span-4 bg-indigo-600 text-white py-4 rounded-2xl font-black mt-2 shadow-xl hover:bg-indigo-500 active:scale-95 transition-all text-xs uppercase tracking-widest border-b-[6px] border-indigo-800">AÑADIR IMPORTE LIBRE</button>
            </div>
          </div>

          <div className="bg-slate-900 p-4 text-white">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total</span>
              <span className="text-5xl font-black text-emerald-400">{totalTicket.toFixed(2)} <span className="text-xl">MAD</span></span>
            </div>
          </div>
        </div>

        <div className="w-2/3 p-4 bg-slate-300 overflow-y-auto grid grid-cols-2 lg:grid-cols-4 gap-4 content-start pb-20">
          {PRODUCTS.map((p) => (
            <button key={p.name} onClick={() => agregar(p.name, p.price)} className={`bg-white p-3 rounded-2xl shadow-lg border-b-[10px] ${p.color} active:scale-95 transition-all group hover:bg-slate-50 relative overflow-hidden h-fit flex flex-col`}>
              <div className="h-40 w-full flex items-center justify-center mb-4 overflow-hidden rounded-2xl bg-slate-100 shadow-inner">
                <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={p.name} />
              </div>
              <div className="text-xs font-black uppercase text-slate-800 tracking-tighter mb-1 mt-auto">{p.name}</div>
              <div className="text-indigo-600 font-black text-2xl tracking-tighter">{p.price.toFixed(2)} <span className="text-[10px]">MAD</span></div>
            </button>
          ))}
        </div>
      </div>

      <footer className="bg-slate-800 p-6 shadow-[0_-15px_40px_rgba(0,0,0,0.3)] print:hidden relative z-10">
        <button onClick={cobrar} className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-6 rounded-3xl text-4xl shadow-2xl transition-all active:scale-95 uppercase tracking-tighter border-b-[8px] border-emerald-700">Finalizar y Cobrar</button>
      </footer>
    </div>
  );
}
